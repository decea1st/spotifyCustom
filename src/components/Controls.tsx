import { useEffect, useState } from "react";
import { getActiveDevice } from "../userdata/spotifyApi";
import { usePlayerContext } from "../player/PlayerContext";
import type { RemotePlayback } from "../types";

export default function Controls() {
    const { state, deviceId, togglePlay, prev, next, setVolume } = usePlayerContext();
    const disabled = !deviceId
    const [trackPosition, setTrackPosition] = useState(0);
    const [remote, setRemote] = useState<RemotePlayback | null>(null);
    const [remoteAt, setRemoteAt] = useState(0);
    const local = !!state; // is music playing here or remote device?

    const track = local ? state.track_window.current_track : remote?.item;
    const image = track?.album?.images?.[0]?.url;
    const name = track?.name;
    const artists = track?.artists;
    const paused = local ? state?.paused : !remote?.is_playing;
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
        <div className="relative w-full h-[70px] shrink-0 bg-zinc-900 border-t border-zinc-700 flex items-center justify-center gap-6">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-3 max-w-[30%]">
                {image && (
                    <img
                        src={image}
                        alt=""
                        className="w-14 h-14 rounded object-cover shrink-0"
                    />
                )}
                <div className="flex flex-col min-w-0">
                    {name && <p className="text-white text-[13.5px] font-medium truncate">{name}</p>}
                    {artists && artists.length > 0 && (
                        <p className="text-zinc-400 text-[13px] truncate">
                            {artists.map((a) => a.name).join(", ")}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex flex-col items-center gap-1.5 w-[40%] max-w-[600px]">
                <div className="flex items-center gap-6">
                    <button
                        onClick={prev}
                        disabled={disabled}
                        className="cursor-pointer text-white disabled:cursor-default disabled:opacity-40"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path d="M6 5h2v14H6zM20 5v14L9 12z" />
                        </svg>
                    </button>

                    <button
                        onClick={togglePlay}
                        disabled={disabled}
                        className="cursor-pointer w-10 h-10 rounded-full bg-zinc-700 text-white flex items-center justify-center hover:bg-zinc-600 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-zinc-700"
                    >
                        {paused ? (
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path d="M8 5h3v14H8zM13 5h3v14h-3z" />
                            </svg>
                        )}
                    </button>

                    <button
                        onClick={next}
                        disabled={disabled}
                        className="cursor-pointer text-white disabled:cursor-default disabled:opacity-40"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path d="M16 5h2v14h-2zM4 5v14l11-7z" />
                        </svg>
                    </button>
                </div>

                <input
                    type="range"
                    min={0}
                    max={duration}
                    value={trackPosition}
                    className="w-full h-1 bg-zinc-700 rounded-full"
                />
            </div>

            <div className="absolute right-4 top-3/5 -translate-y-1/2 flex flex-col items-end gap-1.5 max-w-[25%]">
                <input
                    type="range"
                    min={0}
                    max={1}
                    defaultValue={0.5}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    step={0.01}
                    className="w-24 h-1 bg-zinc-700 rounded-full"
                />
                {deviceName && (
                    <p className="w-full text-right text-zinc-500 text-[13px] truncate">
                        Playing on {deviceName}
                    </p>
                )}
            </div>
        </div>
    );
}
