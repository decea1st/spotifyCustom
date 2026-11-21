import { useState, type CSSProperties } from "react";
import { usePlayerContext } from "../player/PlayerContext";
import { useNowPlaying } from "../player/useNowPlaying";
import { useNav, useView } from "../nav/useNav";
import IconButton from "./IconButton";

export default function Controls() {
    const { state, remote, togglePlay, prev, next, seek, setVolume } = usePlayerContext();
    const { track, image, playing, position, duration, deviceName } = useNowPlaying();
    const view = useView();
    const go = useNav((s) => s.go);
    const back = useNav((s) => s.back);
    const [volume, setVol] = useState(0.3);
    const disabled = !state && !remote; // no session here or on any other device

    // Where the seek bar is held while dragging, null otherwise. The seek is only sent on
    // release, so dragging across a song is one request instead of one per pixel.
    const [dragPosition, setDragPosition] = useState<number | null>(null);
    const shownPosition = dragPosition ?? position;
    const commitSeek = () => {
        if (dragPosition === null) return;
        seek(dragPosition);
        setDragPosition(null);
    };

    // the device label toggles the Devices screen, like the button in Spotify's own bar
    const toggleDevices = () => (view.name === "devices" ? back() : go({ name: "devices" }));

    return (
        <div className="@container relative w-full h-[70px] shrink-0 bg-bar flex items-center justify-center">
            <input
                type="range"
                min={0}
                max={duration}
                value={shownPosition}
                onChange={(e) => setDragPosition(Number(e.target.value))}
                // captured so the release still lands here if the pointer has left the 3px bar
                onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
                onPointerUp={commitSeek}
                onKeyUp={commitSeek} // arrow keys
                style={{ "--pct": duration ? (shownPosition / duration) * 100 : 0 } as CSSProperties}
                className="seek absolute -top-0.5 left-0 w-full"
            />
            <div className="track-info absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-3 max-w-[30%]">
                {image && <img src={image} alt="" className="w-11 h-11 rounded object-cover shrink-0" />}
                <div className="flex flex-col min-w-0">
                    {track?.name && <p className="text-on-card text-[13.5px] font-medium truncate">{track.name}</p>}
                    {track?.artists && track.artists.length > 0 && (
                        <p className="text-on-card-muted text-[13px] truncate">
                            {track.artists.map((a) => a.name).join(", ")}
                        </p>
                    )}
                </div>
            </div>

            <div className="transport flex items-center justify-center gap-3 w-[40%] max-w-[600px]">
                <IconButton label="Previous" onClick={prev} disabled={disabled}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path d="M6 5h2v14H6zM20 5v14L9 12z" />
                    </svg>
                </IconButton>

                <button
                    onClick={togglePlay}
                    disabled={disabled}
                    aria-label={playing ? "Pause" : "Play"}
                    className="cursor-pointer w-9 h-9 rounded-full bg-play text-play-icon flex items-center justify-center transition duration-150 hover:bg-play-hover hover:scale-105 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-play disabled:hover:scale-100"
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

                <IconButton label="Next" onClick={next} disabled={disabled}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path d="M16 5h2v14h-2zM4 5v14l11-7z" />
                    </svg>
                </IconButton>
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
                        onClick={toggleDevices}
                        className="device-name w-full text-right text-on-card-muted text-[13px] truncate cursor-pointer transition-colors duration-150 hover:text-on-card"
                    >
                        Playing on {deviceName}
                    </button>
                )}
            </div>
        </div>
    );
}
