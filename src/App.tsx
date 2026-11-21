import "./App.css";
import clsx from "clsx";
import { handleSpotifyCallback, redirectToSpotifyLogin } from "./auth/spotifyAuth";
import { useEffect, useRef, useState } from "react";
import PlaylistView from "./components/PlaylistView";
import { getUserPlaylists } from "./userdata/spotifyApi";
import Controls from "./components/Controls";
import SearchBar from "./components/SearchBar";
import DeviceView from "./components/DeviceView";

function App() {
  const ranOnce = useRef(false);
  const [loggedIn, setLoggedIn] = useState(() => !!localStorage.getItem('access_token'))
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null); // which playlist is selected. Null to view grid
  // sits on top of the grid/playlist rather than replacing `selected`, so Back returns to wherever you were
  const [showDevices, setShowDevices] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  // written straight to the DOM node instead of through state — this fires on every
  // scroll frame, and a setState here would re-render the whole grid each time
  const handleScroll = () => {
    const el = scroller.current;
    if (!el) return;
    el.style.setProperty("--fade-h", `${Math.min(el.scrollTop, 24)}px`);
  };

  // After login, client is redirected back to app with a code in the URL
  // This block runs on mount every time to check if a code is present in the URL
  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    if (!new URLSearchParams(window.location.search).has("code")) return;

    handleSpotifyCallback()
      .then(() => {
        window.history.replaceState({}, "", "/")
        setLoggedIn(!!localStorage.getItem('access_token'))
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    getUserPlaylists().then(setPlaylists).catch(console.error);
  }, [loggedIn]);

  return (
    // the window itself is aspect-locked in Rust, so the frame just fills it
    <div data-tauri-drag-region className="fixed inset-0 overflow-hidden">
      {/* content sits under the frame, inset to the PNG's cutout */}
      <div className="absolute top-[26%] left-[7.25%] right-[7.3%] bottom-[7.8%] rounded-[8px] overflow-hidden">
        <div className="flex flex-col h-full bg-[var(--panel)]">
          {loggedIn ? (
            <>
              {/* outside the scroller so the results dropdown isn't clipped by it */}
              {!selected && !showDevices && (
                <div className="w-full shrink-0 flex justify-center">
                  <SearchBar className="w-full max-w-[700px] p-3 px-3" />
                </div>
              )}
              <div
                ref={scroller}
                onScroll={handleScroll}
                className="scroll-fade flex-1 overflow-y-auto flex flex-col items-center w-full"
              >
                {showDevices ? (
                  <DeviceView onBack={() => setShowDevices(false)} />
                ) : selected ? (
                  <PlaylistView playlist={selected} onBack={() => setSelected(null)} />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-3 pb-3 w-full">
                    {playlists.map((p) => (
                      <button key={p.id} className="group cursor-pointer bg-[var(--card)] text-left rounded-lg p-3 hover:opacity-90 transition-opacity duration-150" onClick={() => setSelected(p)}>
                        <img src={p.images?.[0]?.url} alt="" className="w-full aspect-square object-cover rounded-md mb-2 bg-[var(--art-on-card)] group-hover:opacity-90 transition-opacity duration-150" />
                        <p className="text-[var(--text-on-card)] text-lg font-medium truncate">{p.name}</p>
                        <p className="text-[var(--text-on-card-muted)] text-sm">{p.items?.total ?? 0} tracks</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Controls onOpenDevices={() => setShowDevices(true)} />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center">
              <button onClick={() => redirectToSpotifyLogin()} className={clsx("cursor-pointer text-[24px] bg-green-400 rounded-xl px-5 py-2 mt-12", "hover:bg-green-500", "active:bg-green-700")}>
                Login with Spotify
              </button>
            </div>
          )}
        </div>
      </div>

      {/* frame goes above the content and lets clicks through to it */}
      <img src="/TestFrame.png" alt="" className="absolute inset-0 w-full h-full pointer-events-none select-none" />
    </div>
  );
}

export default App;
