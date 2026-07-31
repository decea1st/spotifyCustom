import { useEffect, useState } from "react";
import { searchTracks, playTracks } from "../userdata/spotifyApi";
import { usePlayerContext } from "../player/PlayerContext";

export default function SearchResults({ query }: { query: string }) {
    const { deviceId } = usePlayerContext();
    const [tracks, setTracks] = useState<any[]>([]);

    useEffect(() => {
        if (!query.trim()) {
            setTracks([]);
            return;
        }
        // wait for typing to stop so one search isn't one request per keystroke
        const id = setTimeout(() => {
            searchTracks(query).then(setTracks).catch(console.error);
        }, 300);
        return () => clearTimeout(id);
    }, [query]);

    const play = (uri: string) => {
        if (!deviceId) return;
        playTracks(deviceId, [uri]).catch(console.error);
    };

    if (tracks.length === 0) return null;

    return (
        <ol className="absolute left-0 right-0 top-full mt-2 z-10 flex flex-col p-2 max-h-[60vh] overflow-y-auto rounded-xl bg-[var(--card)] shadow-xl shadow-black/50">
            {tracks.map((t) => (
                <li key={t.id}>
                    <button
                        onClick={() => play(t.uri)}
                        disabled={!deviceId}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left cursor-pointer hover:bg-[var(--overlay-hover)] transition-colors duration-150 disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                        <img
                            src={t.album?.images?.[0]?.url}
                            alt=""
                            className="w-10 h-10 rounded bg-[var(--art-on-card)]"
                        />
                        <div className="min-w-0 flex-1">
                            <p className="text-[var(--text-on-card)] text-sm truncate">{t.name}</p>
                            <p className="text-[var(--text-on-card-muted)] text-xs truncate">
                                {t.artists?.map((a: any) => a.name).join(", ")}
                            </p>
                        </div>
                    </button>
                </li>
            ))}
        </ol>
    );
}
