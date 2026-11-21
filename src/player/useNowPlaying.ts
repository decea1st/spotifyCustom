import { useEffect, useState } from "react";
import { usePlayerContext } from "./PlayerContext";

// Merges the two sources of "what's playing" into one shape, so the UI doesn't
// have to ask which one applies. The SDK's `state` is set only while this app
// is the active device; otherwise the polled Web API reading is used.
export function useNowPlaying() {
    const { state, remote, remoteAt } = usePlayerContext();
    const local = !!state;

    const track = local ? state.track_window.current_track : remote?.item;
    const positionAt = local ? state.position : (remote?.progress_ms ?? 0);
    const anchorTime = local ? state.timestamp : remoteAt;
    const duration = local ? state.duration : (remote?.item?.duration_ms ?? 0);
    const playing = local ? !state.paused : !!remote?.is_playing;
    const deviceName = local ? "YouSpot" : remote?.device?.name;

    // Neither source pushes position updates while playing, so it's ticked
    // forward from the last reading.
    const [position, setPosition] = useState(0);
    useEffect(() => {
        setPosition(positionAt);
        if (!playing) return;

        const id = setInterval(() => {
            setPosition(positionAt + (Date.now() - anchorTime));
        }, 1000);
        return () => clearInterval(id);
    }, [positionAt, anchorTime, playing]);

    return {
        track,
        image: track?.album?.images?.[0]?.url,
        playing,
        position,
        duration,
        deviceName,
    };
}
