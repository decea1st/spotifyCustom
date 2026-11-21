use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// Keeps the window locked to the frame art's aspect ratio, and above a minimum size.
#[cfg(windows)]
mod aspect {
    use windows::Win32::Foundation::{HWND, LPARAM, LRESULT, RECT, WPARAM};
    use windows::Win32::UI::HiDpi::GetDpiForWindow;
    use windows::Win32::UI::Shell::{DefSubclassProc, SetWindowSubclass};
    use windows::Win32::UI::WindowsAndMessaging::{
        IsIconic, SWP_NOSIZE, WINDOWPOS, WMSZ_BOTTOM, WMSZ_BOTTOMLEFT, WMSZ_BOTTOMRIGHT, WMSZ_LEFT,
        WMSZ_RIGHT, WMSZ_TOP, WMSZ_TOPLEFT, WMSZ_TOPRIGHT, WM_SIZING, WM_WINDOWPOSCHANGING,
    };

    // Arbitrary id that names this subclass, so it could be removed later.
    const SUBCLASS_ID: usize = 1;

    // The frame art's proportions. A theme with a different mode changes these.
    const ASPECT_W: i32 = 876;
    const ASPECT_H: i32 = 1475;

    // Smallest window width, in logical pixels (as at 100% scaling). Measured from the
    // frame at its smallest usable size: cat-ear tip to lowest petal is 288 x 485.
    // The height always follows from the aspect, so only the width needs a minimum.
    const MIN_W: i32 = 288;

    // Rounded to the nearest pixel rather than truncated, so the frame is never more
    // than half a pixel off its true proportions.
    fn height_for(width: i32) -> i32 {
        (width * ASPECT_H + ASPECT_W / 2) / ASPECT_W
    }

    fn width_for(height: i32) -> i32 {
        (height * ASPECT_W + ASPECT_H / 2) / ASPECT_H
    }

    // The width w whose (w, height_for(w)) is nearest to (width, height), i.e. the
    // proposed size projected onto the aspect line. Minimising
    // (w - width)² + (w·H/W - height)² gives w = W·(width·W + height·H) / (W² + H²).
    // i64 because the numerator passes i32's limit at ordinary window sizes.
    fn closest_on_aspect(width: i32, height: i32) -> i32 {
        let (aw, ah) = (ASPECT_W as i64, ASPECT_H as i64);
        let num = aw * (width as i64 * aw + height as i64 * ah);
        let den = aw * aw + ah * ah;
        ((num + den / 2) / den) as i32
    }

    // Win32 sizes are physical pixels, so MIN_W is scaled by this window's DPI:
    // 288 at 100% scaling, 432 at 150%. Same size on screen either way.
    fn min_width(hwnd: HWND) -> i32 {
        let dpi = match unsafe { GetDpiForWindow(hwnd) } {
            0 => 96, // 0 means the call failed; assume 100%
            dpi => dpi as i32,
        };
        (MIN_W * dpi + 48) / 96
    }

    pub fn install(hwnd: HWND) {
        let _ = unsafe { SetWindowSubclass(hwnd, Some(subclass_proc), SUBCLASS_ID, 0) };
    }

    // Windows calls this for every message the window receives. The signature is
    // fixed by Win32 and must match exactly.
    unsafe extern "system" fn subclass_proc(
        hwnd: HWND,
        msg: u32,
        wparam: WPARAM,
        lparam: LPARAM,
        _id: usize,
        _data: usize,
    ) -> LRESULT {
        match msg {
            // A drag on an edge or corner. lparam is the address of the rect Windows
            // intends to use, so rewriting it changes what Windows applies.
            WM_SIZING => {
                let rect = &mut *(lparam.0 as *mut RECT);
                if constrain_drag(hwnd, wparam.0 as u32, rect) {
                    return LRESULT(1); // TRUE: use our rect instead of its own
                }
            }
            // Every size change, including the ones WM_SIZING never sees. Not returned
            // early: the default handling still needs this message after we adjust it.
            WM_WINDOWPOSCHANGING => {
                let pos = &mut *(lparam.0 as *mut WINDOWPOS);
                constrain_any(hwnd, pos);
            }
            _ => {}
        }

        // Everything goes on to the original handler unless returned above.
        DefSubclassProc(hwnd, msg, wparam, lparam)
    }

    // Knows which edge is being dragged, so the opposite side can stay anchored.
    // Returns false for an edge code it doesn't recognise, leaving the rect alone.
    fn constrain_drag(hwnd: HWND, edge: u32, rect: &mut RECT) -> bool {
        let width = rect.right - rect.left;
        let height = rect.bottom - rect.top;

        let (mut w, mut h) = match edge {
            // Side handles: the dragged dimension follows the pointer, the other is derived.
            WMSZ_LEFT | WMSZ_RIGHT => (width, height_for(width)),
            WMSZ_TOP | WMSZ_BOTTOM => (width_for(height), height),
            // Corners: the cursor is rarely exactly on the aspect line, so use the size on
            // the line closest to it. That depends only on where the cursor is, so a
            // still cursor always gives the same size, and it follows drags in any direction.
            WMSZ_TOPLEFT | WMSZ_TOPRIGHT | WMSZ_BOTTOMLEFT | WMSZ_BOTTOMRIGHT => {
                let w = closest_on_aspect(width, height);
                (w, height_for(w))
            }
            _ => return false,
        };

        let min_w = min_width(hwnd);
        if w < min_w {
            w = min_w;
            h = height_for(min_w);
        }

        // Move only the edges on the dragged side. Side drags have no vertical (or
        // horizontal) edge of their own, so those grow down and to the right.
        let moves_left = matches!(edge, WMSZ_LEFT | WMSZ_TOPLEFT | WMSZ_BOTTOMLEFT);
        let moves_top = matches!(edge, WMSZ_TOP | WMSZ_TOPLEFT | WMSZ_TOPRIGHT);
        if moves_left {
            rect.left = rect.right - w;
        } else {
            rect.right = rect.left + w;
        }
        if moves_top {
            rect.top = rect.bottom - h;
        } else {
            rect.bottom = rect.top + h;
        }
        true
    }

    // Snapping, moving to a monitor with different scaling, resizes from code. There's
    // no dragged edge to go by here, so the width is kept and the height derived.
    fn constrain_any(hwnd: HWND, pos: &mut WINDOWPOS) {
        // Only moving, not resizing. Or minimizing, which shrinks the window to a
        // taskbar stub on purpose and mustn't be "fixed".
        if pos.flags.0 & SWP_NOSIZE.0 != 0 || unsafe { IsIconic(hwnd) }.as_bool() {
            return;
        }

        let min_w = min_width(hwnd);
        if pos.cx < min_w {
            pos.cx = min_w;
            pos.cy = height_for(min_w);
            return;
        }

        // Drags arrive here too, after WM_SIZING already shaped them. A top/bottom drag
        // derives the width from the height, which can land a pixel off height_for()
        // from rounding. Leave those be, or the edge under the pointer would twitch.
        let expected = height_for(pos.cx);
        if (pos.cy - expected).abs() > 1 {
            pos.cy = expected;
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .setup(|app| {
            #[cfg(windows)]
            {
                let window = app.get_webview_window("main").unwrap();
                aspect::install(window.hwnd().unwrap());
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
