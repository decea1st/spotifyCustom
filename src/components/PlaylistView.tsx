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
        className="cursor-pointer text-[var(--text)] text-sm mb-4 hover:text-[var(--text-faint)]"
      >
        ← Back to playlists
      </button>

      <div className="flex gap-4 items-end mb-6">
        <img
          src={playlist.images?.[0]?.url}
          alt=""
          className="w-30 h-30 object-cover rounded-md bg-[var(--art-on-panel)]"
        />
        <div>
          <h1 className="text-[var(--text)] text-[28px] leading-tight font-semibold">{playlist.name}</h1>
          <p className="text-[var(--text-muted)] text-md mt-1">
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
              className="group w-full flex items-center gap-3 px-3 py-2 rounded-md text-left cursor-pointer hover:bg-[var(--card)] transition-colors duration-150 disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <span className="text-[var(--text-faint)] group-hover:text-[var(--text-on-card-muted)] transition-colors duration-150 text-sm w-6 text-right">{i + 1}</span>
              <img
                src={row.item?.album?.images?.[0]?.url}
                alt=""
                className="w-11 h-11 rounded bg-[var(--art-on-panel)]"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[var(--text)] group-hover:text-[var(--text-on-card)] transition-colors duration-150 text-[18px] truncate">
                  {row.item?.name ?? "Unavailable"}
                </p>
                <p className="text-[var(--text-muted)] group-hover:text-[var(--text-on-card-muted)] text-[16px] font-bold truncate transition-colors duration-150">
                  {row.item?.artists?.map((a: any) => a.name).join(", ")}
                </p>
              </div>
              <span className="text-[var(--text-faint)] group-hover:text-[var(--text-on-card-muted)] transition-colors duration-150 text-xs">
                {row.item?.duration_ms ? formatDuration(row.item.duration_ms) : ""}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
