// This file fetches the user's info like playlists
import { getRefreshToken  } from "../auth/spotifyAuth";

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
        await getRefreshToken();
        res = await call();
    } if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res;
}
// Every playlist will return an `id` which can be used to view the tracklist
export async function getUserPlaylists() {
    const res = await spotifyFetch("/me/playlists?limit=50");
    return (await res.json()).items;
}
// Returns pages of tracks. Contains an items array containing objects for each track in the page
// A track object will have the `item` field which holds ANOTHER object with info about the track
export async function getPlaylistItems(id: string) {
    const res = await spotifyFetch(`/playlists/${id}/items?limit=100`);
    return (await res.json()).items;
}
// ContextUri = Playlist Uri, 
export async function playPlaylistTrack(deviceId: string, contextUri: string, trackUri: string) {
    await spotifyFetch(`/me/player/play?device_id=${deviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contextUri: contextUri,
            offset: {"uri": trackUri},
        })
    })
}