const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = "http://127.0.0.1:1420/callback";
const SCOPES = [
   "streaming",
   "user-read-email",
   "user-read-private",
   "user-top-read",
   "playlist-read-private",
   "user-modify-playback-state",
   "user-read-playback-state",
].join(" ");

// These are from Spotify's PKCE Auth documentation, modified to my needs and preferences

/**
* PKCE code verifer function. Outputs a random alpha-numerical string of length 64
*/
const generateVerifier = () => {
   const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
   const values = crypto.getRandomValues(new Uint8Array(64));
   return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

/**
* Uses SHA256 to hash the input. Meant to hash the verifier.
*/
const hashVerifier = async (plain: string) => {
   const encoded = new TextEncoder().encode(plain); // string to array of bytes
   const hashed = await crypto.subtle.digest("SHA-256", encoded); // now array of hashed bytes, looks abt the same
   const tempString = String.fromCharCode(...new Uint8Array(hashed)); // string with possibly strange artifacts
   const base64 = btoa(tempString)
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
   return base64;
};

export async function redirectToSpotifyLogin() {
   const verifier = generateVerifier();
   const challenge = await hashVerifier(verifier);
   const authURL = new URL("https://accounts.spotify.com/authorize") // First part of the URL

   sessionStorage.setItem("spotify_code_verifier", verifier);
   // From Spotify docs, information they need from client app, later becomes query string for the authorize URL
   const params = {
      client_id: CLIENT_ID,
      response_type: "code",
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      code_challenge_method: "S256",
      code_challenge: challenge,
   };
   // URL is a class, URL.search is one of the parts of a full URL. Build that part from `params`
   authURL.search = new URLSearchParams(params).toString();
   // With the full URL built, navigate client to the URL string
   window.location.href = authURL.toString();
}

/**
 * After Spotify redirects the client back to the app, this parses the URL for the `code`
 * and reads the verifier back out of session storage, then trades the two for tokens.
 * 
 * On success the access and refresh tokens are written to localStorage and the verifier
 * is discarded.
 *
 * @returns `null` when the URL has no `code` — i.e. an ordinary page load, not a callback.
 * @throws If the verifier is missing from session storage, or Spotify rejects the exchange.
 */
export async function handleSpotifyCallback() {
   // The code is the "window.location.search" part of the URL
   const code = new URLSearchParams(window.location.search).get("code");

   if (!code) return null;

   const verifier = sessionStorage.getItem("spotify_code_verifier");
   if (!verifier) throw new Error("Missing code verifier, try logging in again.");

   const url = "https://accounts.spotify.com/api/token"
   const payload = new URLSearchParams({
         client_id: CLIENT_ID,
         grant_type: 'authorization_code',
         code,
         redirect_uri: REDIRECT_URI,
         code_verifier: verifier,
      })
   const options = {
      method: 'POST',
      headers: {
         'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload,
   }

   const response = await fetch(url, options);
   const body = await response.json(); // parses response json into a JS object
   if (!response.ok) throw new Error(body.error_description ?? body.error)

   sessionStorage.removeItem("spotify_code_verifier");
   localStorage.setItem('access_token', body.access_token);
   localStorage.setItem('refresh_token', body.refresh_token);
   localStorage.setItem('expires_at', String(Date.now() + body.expires_in * 1000));
}
// Access tokens expire every hour and refreshTokens request for a new one
export async function refreshAccessToken() {
   const refreshToken = localStorage.getItem('refresh_token');
   
   if (!refreshToken) return null;
   
   const url = "https://accounts.spotify.com/api/token";
   const payload = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
   });
   const options = {
      method: 'POST',
      headers: {
         'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: payload,
   };
   const response = await fetch(url, options);
   const body = await response.json();

   if (body.error === 'invalid_grant') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('expires_at');
      window.location.href = '/';
      return;
   }

   if (!response.ok) throw new Error(`Token refresh failed: ${body.error}`);

   localStorage.setItem('access_token', body.access_token);
   localStorage.setItem('expires_at', String(Date.now() + body.expires_in * 1000));

   if (body.refresh_token) localStorage.setItem('refresh_token', body.refresh_token);
}

export async function checkStaleToken() {
   const expiresAt = Number(localStorage.getItem('expires_at'));
   if (Date.now() > expiresAt - 60_000) await refreshAccessToken();
   return localStorage.getItem('access_token');
}