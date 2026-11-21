import { useCallback, useEffect, useRef, useState } from "react";
import { checkStaleToken } from "../auth/spotifyAuth";
import {
    getActiveDevice,
    pausePlayback,
    resumePlayback,
    seekPlayback,
    skipNext,
    skipPrevious,
} from "../userdata/spotifyApi";
import type { RemotePlayback } from "../types";

// All my code so far talks to a remote control API. "/me/player/play" is simply sending an instruction
// saying "play this track on this device." I need to use the Spotify Web Playback SDK to give this app
// a deviceId and become a Spotify Connect device so the tracks can directly play through the app.

// Spotify has a script that looks for a specificly named function in the global and calls it
// "window.onSpotifyWebPlaybackSDKReady()" makes the function global. That's what "window" does.
export function usePlayer() {
    //useRef so other files can control it (play, pause, etc)
    const player = useRef<Spotify.Player | null>(null);
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [state, setState] = useState<Spotify.PlaybackState | null>(null);
    // Volume always stays local: it only changes this app's output, and works before anything plays.
    // The other controls are below, since they also need `remote`.
    const setVolume = (v: number) => player.current?.setVolume(v ** volumeCurve);
    const volumeCurve = 3.4;

    // Playback on another device. The SDK only reports what plays in this app,
    // so anything elsewhere has to be polled from the Web API.
    const [remote, setRemote] = useState<RemotePlayback | null>(null);
    const [remoteAt, setRemoteAt] = useState(0); // when `remote` was fetched, to tick progress from

    const refreshRemote = useCallback(() => {
        // this provider is mounted before login too, and every call would 401
        if (!localStorage.getItem("access_token")) return;
        getActiveDevice()
            .then((r) => {
                setRemote(r);
                setRemoteAt(Date.now());
            })
            .catch(console.error);
    }, []);

    // Spotify takes a moment to reflect a command; an instant re-check often gets the old state
    const recheckSoon = () => setTimeout(refreshRemote, 500);

    const togglePlay = () => {
        if (state) return player.current?.togglePlay(); // playing here: the SDK handles it
        if (!remote) return; // no session on any device: nothing to toggle

        const wasPlaying = remote.is_playing;

        // 1. Tell Spotify
        if (wasPlaying) {
            pausePlayback().catch(console.error).finally(recheckSoon);
        } else {
            resumePlayback().catch(console.error).finally(recheckSoon);
        }

        // 2. Update our own copy so the icon flips now instead of on the next poll.
        // Progress is re-anchored to now so pausing doesn't snap the seek bar back.
        const now = Date.now();
        const progress = (remote.progress_ms ?? 0) + (wasPlaying ? now - remoteAt : 0);
        setRemote({ ...remote, is_playing: !wasPlaying, progress_ms: progress });
        setRemoteAt(now);
    };

    const next = () => {
        if (state) return player.current?.nextTrack();
        skipNext().catch(console.error).finally(recheckSoon);
    };

    const prev = () => {
        if (state) return player.current?.previousTrack();
        skipPrevious().catch(console.error).finally(recheckSoon);
    };

    const seek = (ms: number) => {
        if (state) return player.current?.seek(ms);
        if (!remote) return;

        seekPlayback(ms).catch(console.error).finally(recheckSoon);

        // Move our own copy too, so the bar stays where it was dropped instead of
        // jumping back to the old position until the next poll
        setRemote({ ...remote, progress_ms: ms });
        setRemoteAt(Date.now());
    };

    useEffect(() => {
        if (state) return; // playback is happening here, the SDK covers it
        refreshRemote();
        const id = setInterval(refreshRemote, 2500);
        return () => clearInterval(id);
    }, [state, refreshRemote]);

    useEffect(() => {
        // define the global first
        window.onSpotifyWebPlaybackSDKReady = () => {
            // Instance of the Player class
            player.current = new Spotify.Player({
                name: "YouSpot",
                volume: 0.3 ** volumeCurve,
                // Their cb function receives the token and registers this app as a device in their servers
                getOAuthToken: async (cb) => {
                    await checkStaleToken();
                    const token = localStorage.getItem("access_token");
                    if (!token) {
                        console.error("getOAuthToken: no access_token in localStorage");
                        return;
                    }
                    cb(token);
                },
            });

            // After token is supplied and it's valid, the class internally updates an object to write the device_id
            player.current.addListener("ready", ({ device_id }) => {
                setDeviceId(device_id);
                console.log("The Web Playback SDK is ready to play music!");
                console.log("Device ID", device_id);
            });
            player.current.addListener("not_ready", ({ device_id }) => {
                console.log("Device ID has gone offline", device_id);
            });
            player.current.addListener("player_state_changed", (s) => {
                setState(s);
            });
            player.current.connect();
        };

        if (!document.getElementById("spotify-sdk")) {
            const script = document.createElement("script");
            script.id = "spotify-sdk";
            script.src = "https://sdk.scdn.co/spotify-player.js";
            document.body.appendChild(script);
        }

        return () => {
            player.current?.disconnect();
            player.current = null;
        };
    }, []);

    return { deviceId, state, remote, remoteAt, refreshRemote, togglePlay, seek, next, prev, setVolume };
}
