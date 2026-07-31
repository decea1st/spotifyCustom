use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// Keeps the window locked to the frame art's aspect ratio while it's being resized.
#[cfg(windows)]
mod aspect {
    use windows::Win32::Foundation::{HWND, LPARAM, LRESULT, RECT, WPARAM};
    use windows::Win32::UI::Shell::{DefSubclassProc, SetWindowSubclass};
    use windows::Win32::UI::WindowsAndMessaging::{
        WM_SIZING, WMSZ_BOTTOM, WMSZ_BOTTOMLEFT, WMSZ_BOTTOMRIGHT, WMSZ_LEFT, WMSZ_RIGHT, WMSZ_TOP,
        WMSZ_TOPLEFT, WMSZ_TOPRIGHT,
    };

    // Arbitrary id that names this subclass, so it could be removed later.
    const SUBCLASS_ID: usize = 1;

    // The frame art's proportions. A theme with a different mode changes these.
    const ASPECT_W: i32 = 876;
    const ASPECT_H: i32 = 1475;

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
        if msg == WM_SIZING {
            // lparam is the address of the size Windows intends to use.
            let rect = &mut *(lparam.0 as *mut RECT);
            let width = rect.right - rect.left;
            let height = rect.bottom - rect.top;

            match wparam.0 as u32 {
                // Side handles: keep the dimension being dragged, derive the other.
                // The top-left stays put, so the window grows down and right.
                WMSZ_LEFT | WMSZ_RIGHT => {
                    rect.bottom = rect.top + width * ASPECT_H / ASPECT_W;
                }
                WMSZ_TOP | WMSZ_BOTTOM => {
                    rect.right = rect.left + height * ASPECT_W / ASPECT_H;
                }
                // Corners: width wins, and we move the vertical edge that belongs
                // to the dragged corner so the opposite corner stays anchored.
                WMSZ_TOPLEFT | WMSZ_TOPRIGHT => {
                    rect.top = rect.bottom - width * ASPECT_H / ASPECT_W;
                }
                WMSZ_BOTTOMLEFT | WMSZ_BOTTOMRIGHT => {
                    rect.bottom = rect.top + width * ASPECT_H / ASPECT_W;
                }
                _ => {}
            }

            // We rewrote the rect, so Windows should use ours instead of its own.
            return LRESULT(1);
        }

        // Everything we didn't handle goes on to the original handler.
        DefSubclassProc(hwnd, msg, wparam, lparam)
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
