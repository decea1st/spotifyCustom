// This file fetches the user's info like playlists
import { refreshAccessToken  } from "../auth/spotifyAuth";
import type { Device, Playlist, PlaylistItem, RemotePlayback, Track } from "../types";

// Every spotify endpoint needs tthe same three things so this wrapper
// makes the calls easier by coding them in
async function spotifyFetch(path: string, init: RequestInit = {}) {
    const call = () => fetch(`https://api.spotify.com/v1${path}`, {
        ...init,
        headers: {
            ...init.headers,
            Authorization: `Bearer ${localStorage.getItem("access_token")}`
        }
    });

    let res = await call();
    // 401 means there is no access token, so attempt a refresh
    if (res.status === 401) {
        await refreshAccessToken();
        res = await call();
    } if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res;
}
// Every playlist will return an `id` which can be used to view the tracklist
export async function getUserPlaylists(): Promise<Playlist[]> {
    const res = await spotifyFetch("/me/playlists?limit=50");
    return (await res.json()).items;
}
// Returns pages of tracks. Contains an items array containing objects for each track in the page
// A track object will have the `item` field which holds ANOTHER object with info about the track
export async function getPlaylistItems(id: string): Promise<PlaylistItem[]> {
    const res = await spotifyFetch(`/playlists/${id}/items?limit=100`);
    return (await res.json()).items;
}
export async function searchTracks(q: string): Promise<Track[]> {
    const res = await spotifyFetch(`/search?q=${encodeURIComponent(q)}&type=track&limit=10`);
    return (await res.json()).tracks.items;
}
// Search results have no playlist to play within, so they go as a bare list of uris
export async function playTracks(deviceId: string, uris: string[]) {
    await spotifyFetch(`/me/player/play?device_id=${deviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uris })
    })
}
// ContextUri = Playlist Uri,
export async function playPlaylistTrack(deviceId: string, contextUri: string, trackUri: string) {
    await spotifyFetch(`/me/player/play?device_id=${deviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            context_uri: contextUri,
            offset: {"uri": trackUri},
        })
    })
}

export async function getActiveDevice(): Promise<RemotePlayback | null> {
    const res = await spotifyFetch(`/me/player`)
    if (res.status == 204) return null;
    return (await res.json());
}

// Only devices currently connected to Spotify are listed. A phone with the app
// closed won't show up even though the official app can wake it.
export async function getDevices(): Promise<Device[]> {
    const res = await spotifyFetch(`/me/player/devices`);
    return (await res.json()).devices;
}

// Leaving out `play` keeps the current state, so paused stays paused on the new device
export async function transferPlayback(deviceId: string) {
    await spotifyFetch(`/me/player`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_ids: [deviceId] })
    })
}