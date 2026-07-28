import "./App.css";
import clsx from "clsx";
import { handleSpotifyCallback, redirectToSpotifyLogin } from "./auth/spotifyAuth";
import { useEffect, useRef, useState } from "react";
import Header from "./components/Header";
import PlaylistView from "./components/PlaylistView";
import { getUserPlaylists } from "./userdata/spotifyApi";

function App() {
  const [loggedIn, setLoggedIn] = useState(() => !!localStorage.getItem('access_token'))
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null); // which playlist is selected. Null to view grid
  const ranOnce = useRef(false);
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
    <div className="flex flex-col bg-zinc-800 min-h-screen items-center">
      {loggedIn ? (
        <>
          <Header />
          {selected ? (
            <PlaylistView playlist={selected} onBack={() => setSelected(null)} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-6 w-full">
              {playlists.map((p) => (
                <button key={p.id} className="cursor-pointer text-left bg-zinc-900 rounded-lg p-3 hover:bg-zinc-700" onClick={() => setSelected(p)}>
                  <img src={p.images?.[0]?.url} alt="" className="w-full aspect-square object-cover rounded-md mb-2 bg-zinc-700" />
                  <p className="text-white text-sm font-medium truncate">{p.name}</p>
                  <p className="text-zinc-400 text-xs">{p.items?.total ?? 0} tracks</p>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <button onClick={() => redirectToSpotifyLogin()} className={clsx("cursor-pointer text-[24px] bg-green-400 rounded-xl px-5 py-2 mt-12", "hover:bg-green-500", "active:bg-green-700")}>
          Login with Spotify
        </button>
      )}
    </div>
  );
}

export default App;
