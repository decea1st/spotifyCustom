const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
// These are from Spotify's PKCE Auth documentation, slightly modified

// PKCE code verifer function. Outputs a random alpha-numerical string of length 64
const generateCodeVerifier = () => {
   const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
   const values = crypto.getRandomValues(new Uint8Array(64));
   return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

// Uses SHA256 to Hash the code
const sha256 = async (plain: string) => {
   const encoded = new TextEncoder().encode(plain); // string to array of bytes
   const hashed = await crypto.subtle.digest("SHA-256", encoded); // now array of hashed bytes, looks abt the same
   const tempString = String.fromCharCode(...new Uint8Array(hashed)); // string with possibly strange artifacts
   const base64 = btoa(tempString)
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
   return base64;
};
