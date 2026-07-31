import "./App.css";
import clsx from "clsx";
import { handleSpotifyCallback, redirectToSpotifyLogin } from "./auth/spotifyAuth";
import { useEffect, useRef, useState } from "react";
import PlaylistView from "./components/PlaylistView";
import { getUserPlaylists } from "./userdata/spotifyApi";
import Controls from "./components/Controls";
import SearchBar from "./components/SearchBar";

function App() {
  const ranOnce = useRef(false);
  const [loggedIn, setLoggedIn] = useState(() => !!localStorage.getItem('access_token'))
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null); // which playlist is selected. Null to view grid
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
      <div className="absolute top-[26.15%] right-[8.8%] bottom-[9%] left-[8.8%] rounded-[8px] overflow-hidden">
        <div className="flex flex-col h-full bg-[#e8dbdb]">
          {loggedIn ? (
            <>
              <div className="flex-1 overflow-y-auto flex flex-col items-center w-full">
                {selected ? (
                  <PlaylistView playlist={selected} onBack={() => setSelected(null)} />
                ) : (
                  <>
                    <SearchBar className="w-full max-w-[700px] p-3 px-3" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-3 pb-3 w-full">
                      {playlists.map((p) => (
                        <button key={p.id} className="cursor-pointer bg-[#ed844a]/80 text-left rounded-lg p-3 hover:bg-[#ed844a] transition-colors duration-150" onClick={() => setSelected(p)}>
                          <img src={p.images?.[0]?.url} alt="" className="w-full aspect-square object-cover rounded-md mb-2 bg-zinc-700" />
                          <p className="text-gray-800 text-sm font-medium truncate">{p.name}</p>
                          <p className="text-zinc-700 text-xs">{p.items?.total ?? 0} tracks</p>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <Controls />
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
