import { useEffect, useState } from "react";
import { getPlaylistItems } from "../userdata/spotifyApi";

const formatDuration = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const seconds = totalSeconds % 60;
  return `${Math.floor(totalSeconds / 60)}:${String(seconds).padStart(2, "0")}`;
};

type Props = {
  playlist: any;
  onBack: () => void;
};

export default function PlaylistView({ playlist, onBack }: Props) {
  const [tracks, setTracks] = useState<any[]>([]);

  // Refetch whenever a different playlist is opened
  useEffect(() => {
    setTracks([]);
    getPlaylistItems(playlist.id).then(setTracks).catch(console.error);
  }, [playlist.id]);

  return (
    <div className="w-full p-6">
      <button
        onClick={onBack}
        className="cursor-pointer text-zinc-400 text-sm mb-4 hover:text-white"
      >
        ← Back to playlists
      </button>

      <div className="flex gap-4 items-end mb-6">
        <img
          src={playlist.images?.[0]?.url}
          alt=""
          className="w-40 h-40 object-cover rounded-md bg-zinc-700"
        />
        <div>
          <h1 className="text-white text-3xl font-bold">{playlist.name}</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {playlist.items?.total ?? 0} tracks
          </p>
        </div>
      </div>

      <ol className="flex flex-col">
        {tracks.map((row, i) => (
          <li
            key={`${row.item?.id}-${i}`}
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-700"
          >
            <span className="text-zinc-500 text-sm w-6 text-right">{i + 1}</span>
            <img
              src={row.item?.album?.images?.[0]?.url}
              alt=""
              className="w-10 h-10 rounded bg-zinc-700"
            />
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm truncate">
                {row.item?.name ?? "Unavailable"}
              </p>
              <p className="text-zinc-400 text-xs truncate">
                {row.item?.artists?.map((a: any) => a.name).join(", ")}
              </p>
            </div>
            <span className="text-zinc-500 text-xs">
              {row.item?.duration_ms ? formatDuration(row.item.duration_ms) : ""}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
