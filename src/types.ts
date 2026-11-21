// Shapes returned by the Spotify Web API (api.spotify.com).
// These are separate from the `Spotify` namespace, which types the Web Playback SDK.
// Built from a real /me/player response, so anything Spotify omits is marked optional.

export type ExternalUrls = {
    spotify: string;
};

export type Image = {
    url: string;
    height: number | null;
    width: number | null;
};

export type Artist = {
    id: string;
    name: string;
    uri: string;
    href: string;
    type: "artist";
    external_urls: ExternalUrls;
};

export type Album = {
    id: string;
    name: string;
    uri: string;
    href: string;
    type: "album";
    album_type: "album" | "single" | "compilation";
    artists: Artist[];
    images: Image[];
    release_date: string;
    release_date_precision: "year" | "month" | "day";
    total_tracks: number;
    external_urls: ExternalUrls;
};

export type Track = {
    id: string;
    name: string;
    uri: string;
    href: string;
    type: "track";
    album: Album;
    artists: Artist[];
    duration_ms: number;
    disc_number: number;
    track_number: number;
    explicit: boolean;
    is_local: boolean;
    preview_url: string | null;
    external_urls: ExternalUrls;
};

// GET /me/playlists. Only the fields this app reads are typed; add more from a
// real response as they're needed.
export type Playlist = {
    id: string;
    name: string;
    uri: string;
    images: Image[] | null; // null when the playlist has no cover yet
    items?: { href: string; total: number };
};

// One row of GET /playlists/{id}/items. `item` is null when the track has been
// pulled from Spotify, which is what the "Unavailable" row shows.
export type PlaylistItem = {
    added_at: string;
    item: Track | null;
};

export type Device = {
    // null when the device is inactive or restricted
    id: string | null;
    name: string;
    type:
        | "Computer"
        | "Smartphone"
        | "Speaker"
        | "TV"
        | "AVR"
        | "STB"
        | "AudioDongle"
        | "GameConsole"
        | "CastVideo"
        | "CastAudio"
        | "Automobile"
        | "Unknown";
    is_active: boolean;
    is_private_session: boolean;
    is_restricted: boolean;
    supports_volume: boolean;
    volume_percent: number | null;
};

export type PlaybackContext = {
    uri: string;
    href: string;
    type: "album" | "artist" | "playlist" | "show" | "collection";
    external_urls: ExternalUrls;
};

// Which controls the current device/context will refuse. Only the disallowed
// keys are present, so every field is optional.
export type PlaybackActions = {
    disallows: {
        resuming?: boolean;
        pausing?: boolean;
        skipping_next?: boolean;
        skipping_prev?: boolean;
        seeking?: boolean;
        toggling_shuffle?: boolean;
        toggling_repeat_context?: boolean;
        toggling_repeat_track?: boolean;
        transferring_playback?: boolean;
        interrupting_playback?: boolean;
    };
};

// GET /me/player. Returns 204 with no body when nothing is playing anywhere,
// so the fetch wrapper hands back `null` in that case.
export type RemotePlayback = {
    device: Device;
    is_playing: boolean;
    // epoch ms of this reading, not a position in the track
    timestamp: number;
    progress_ms: number | null;
    // null for podcast episodes and ads
    item: Track | null;
    currently_playing_type: "track" | "episode" | "ad" | "unknown";
    context: PlaybackContext | null;
    shuffle_state: boolean;
    smart_shuffle?: boolean;
    repeat_state: "off" | "track" | "context";
    actions: PlaybackActions;
};
