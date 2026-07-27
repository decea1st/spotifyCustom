const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = "http://127.0.0.1:1420/callback";
const SCOPES = "user-read-private user-top-read";
// These are from Spotify's PKCE Auth documentation, slightly modified

// PKCE code verifer function. Outputs a random alpha-numerical string of length 64
const generateVerifier = () => {
   const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
   const values = crypto.getRandomValues(new Uint8Array(64));
   return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

// Uses SHA256 to Hash the code
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
