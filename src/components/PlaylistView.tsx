import { useEffect, useState } from "react";
import { getPlaylistItems, playPlaylistTrack } from "../userdata/spotifyApi";
import { usePlayerContext } from "../player/PlayerContext";

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
  const { deviceId } = usePlayerContext();
  const [tracks, setTracks] = useState<any[]>([]);

  // Refetch whenever a different playlist is opened
  useEffect(() => {
    setTracks([]);
    getPlaylistItems(playlist.id).then(setTracks).catch(console.error);
  }, [playlist.id]);

  const play = (trackUri: string) => {
    if (!deviceId) return;
    playPlaylistTrack(deviceId, playlist.uri, trackUri).catch(console.error);
  };

  return (
    <div className="w-full p-6">
      <button
        onClick={onBack}
        className="cursor-pointer text-black text-sm mb-4 hover:text-zinc-500"
      >
        ← Back to playlists
      </button>

      <div className="flex gap-4 items-end mb-6">
        <img
          src={playlist.images?.[0]?.url}
          alt=""
          className="w-30 h-30 object-cover rounded-md bg-zinc-700"
        />
        <div>
          <h1 className="text-black text-3xl font-semibold">{playlist.name}</h1>
          <p className="text-zinc-700 text-sm mt-1">
            {playlist.items?.total ?? 0} tracks
          </p>
        </div>
      </div>

      <ol className="flex flex-col">
        {tracks.map((row, i) => (
          <li key={`${row.item?.id}-${i}`}>
            <button
              onClick={() => play(row.item.uri)}
              disabled={!deviceId || !row.item}
              className="group w-full flex items-center gap-3 px-3 py-2 rounded-md text-left cursor-pointer hover:bg-[#833434] transition-colors duration-150 disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <span className="text-zinc-500 text-sm w-6 text-right">{i + 1}</span>
              <img
                src={row.item?.album?.images?.[0]?.url}
                alt=""
                className="w-10 h-10 rounded bg-zinc-700"
              />
              <div className="min-w-0 flex-1">
                <p className="text-black group-hover:text-white transition-colors duration-150 text-sm truncate">
                  {row.item?.name ?? "Unavailable"}
                </p>
                <p className="text-zinc-700 group-hover:text-zinc-300 transition-colors duration-150 text-xs truncate">
                  {row.item?.artists?.map((a: any) => a.name).join(", ")}
                </p>
              </div>
              <span className="text-zinc-500 group-hover:text-zinc-300 transition-colors duration-150 text-xs">
                {row.item?.duration_ms ? formatDuration(row.item.duration_ms) : ""}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
