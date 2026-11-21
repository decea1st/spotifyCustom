import { useEffect, useState, type CSSProperties } from "react";
import { getActiveDevice } from "../userdata/spotifyApi";
import { usePlayerContext } from "../player/PlayerContext";
import type { RemotePlayback } from "../types";

export default function Controls({ onOpenDevices }: { onOpenDevices: () => void }) {
    const { state, deviceId, togglePlay, prev, next, setVolume } = usePlayerContext();
    const disabled = !deviceId
    const [trackPosition, setTrackPosition] = useState(0);
    const [remote, setRemote] = useState<RemotePlayback | null>(null);
    const [remoteAt, setRemoteAt] = useState(0);
    const [volume, setVol] = useState(0.3);
    const local = !!state; // is music playing here or remote device?

    const track = local ? state.track_window.current_track : remote?.item;
    const image = track?.album?.images?.[0]?.url;
    const name = track?.name;
    const artists = track?.artists;
    const deviceName = local ? "YouSpot" : remote?.device?.name;
    const positionAt = local ? state.position  : remote?.progress_ms ?? 0;
    const anchorTime = local ? state.timestamp : remoteAt;
    const duration   = local ? state.duration  : remote?.item?.duration_ms ?? 0;
    const playing    = local ? !state.paused   : !!remote?.is_playing;

    // get other active device info
    useEffect(() => {
        if (state) return; // playback happening here, return
        const check = () =>
            getActiveDevice().then((r) => {
                setRemote(r);
                setRemoteAt(Date.now());
            }).catch(console.error);
        check();
        const id = setInterval(check, 2500);
        return () => clearInterval(id);
    }, [state])

    useEffect(() => {
        setTrackPosition(positionAt);
        if (!playing) return;

        const id = setInterval(() => {
            setTrackPosition(positionAt + (Date.now() - anchorTime));
        }, 1000);
        return () => clearInterval(id);
    }, [positionAt, anchorTime, playing]);
    
    return (
        <div className="@container relative w-full h-[70px] shrink-0 bg-[var(--bar)] flex items-center justify-center">
            <input
                type="range"
                min={0}
                max={duration}
                value={trackPosition}
                readOnly
                style={{ "--pct": duration ? (trackPosition / duration) * 100 : 0 } as CSSProperties}
                className="seek absolute -top-0.5 left-0 w-full"
            />
            <div className="track-info absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-3 max-w-[30%]">
                {image && (
                    <img
                        src={image}
                        alt=""
                        className="w-11 h-11 rounded object-cover shrink-0"
                    />
                )}
                <div className="flex flex-col min-w-0">
                    {name && <p className="text-[var(--text-on-card)] text-[13.5px] font-medium truncate">{name}</p>}
                    {artists && artists.length > 0 && (
                        <p className="text-[var(--text-on-card-muted)] text-[13px] truncate">
                            {artists.map((a) => a.name).join(", ")}
                        </p>
                    )}
                </div>
            </div>

            <div className="transport flex items-center justify-center gap-3 w-[40%] max-w-[600px]">
                <button
                    onClick={prev}
                    disabled={disabled}
                    className="cursor-pointer text-[var(--text-on-card-muted)] transition duration-150 hover:text-[var(--text-on-card)] disabled:cursor-default disabled:opacity-40 disabled:hover:text-[var(--text-on-card-muted)]"
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path d="M6 5h2v14H6zM20 5v14L9 12z" />
                    </svg>
                </button>

                <button
                    onClick={togglePlay}
                    disabled={disabled}
                    className="cursor-pointer w-9 h-9 rounded-full bg-[var(--play-bg)] text-[var(--play-icon)] flex items-center justify-center transition duration-150 hover:bg-[var(--play-bg-hover)] hover:scale-105 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-[var(--play-bg)] disabled:hover:scale-100"
                >
                    {playing ? (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path d="M8 5h3v14H8zM13 5h3v14h-3z" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    )}
                </button>

                <button
                    onClick={next}
                    disabled={disabled}
                    className="cursor-pointer text-[var(--text-on-card-muted)] transition duration-150 hover:text-[var(--text-on-card)] disabled:cursor-default disabled:opacity-40 disabled:hover:text-[var(--text-on-card-muted)]"
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path d="M16 5h2v14h-2zM4 5v14l11-7z" />
                    </svg>
                </button>
            </div>

            <div className="volume-group absolute right-4 top-3/5 -translate-y-1/2 flex flex-col items-end gap-1.5 max-w-[25%]">
                <input
                    type="range"
                    min={0}
                    max={1}
                    value={volume}
                    onChange={(e) => {
                        const v = Number(e.target.value);
                        setVol(v);
                        setVolume(v);
                    }}
                    step={0.01}
                    style={{ "--pct": volume * 100 } as CSSProperties}
                    className="volume w-24"
                />
                {deviceName && (
                    <button
                        onClick={onOpenDevices}
                        className="device-name w-full text-right text-[var(--text-on-card-muted)] text-[13px] truncate cursor-pointer transition-colors duration-150 hover:text-[var(--text-on-card)]"
                    >
                        Playing on {deviceName}
                    </button>
                )}
            </div>
        </div>
    );
}
