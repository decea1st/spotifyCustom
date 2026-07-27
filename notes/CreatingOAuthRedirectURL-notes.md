# Creating the OAuth Redirect URL

How to create a URL to navigate the client to, so they can carry the hashed verifier along with everything else Spotify needs.

---

## 1. Create the partial URL

Store an instance of the `URL()` class in a variable:

```ts
const authURL = new URL("https://accounts.spotify.com/authorize");
```

This part is self-explanatory.

---

## 2. Build the query parameters

After that, from Spotify's docs, check the sample for requesting user authorization. This is the code that asks the user to authorize my app to have access to the user's account within a given scope.

The **RELEVANT** code in their docs is as follows:

```ts
const SCOPES = "user-read-private user-top-read";

const params = {
   client_id: CLIENT_ID,
   response_type: "code",
   redirect_uri: REDIRECT_URI,
   scope: SCOPES,
   code_challenge_method: "S256",
   code_challenge: challenge,
};

authURL.search = new URLSearchParams(params).toString();

window.location.href = authURL.toString();
```

`params` just creates an object with all the information for the query that the URL needs to contain.

- **`client_id`** — given to me after registering my app in my Spotify developer dashboard.
- **`redirect_uri`** — one I chose myself and registered in the dashboard. Spotify only redirects to URIs on that registered list, and the value sent here has to match a registered one exactly.
- **`scope`** — copied from the sample, but it's pretty obvious what it's requesting the user for.
- **`code_challenge`** + **`code_challenge_method`** — the hashed code, along with the hashing method used to produce it.

---

## 3. Convert the object into the query string

This object needs to be converted to a URL because the information is transmitted through the URL. This is the **"search"** portion of the URL, so we use the `.search` property of the `URL` class — we do `authURL.search` and assign it the string produced by a different class.

The `URLSearchParams` class actually takes an object, goes through the key-value pairs, then converts them into 2-value arrays, so the object ends up becoming a nested array with each pair being an array inside a larger array.

The `.toString()` **method** on that class turns all those arrays into a valid search portion of the URL. The general pattern is:

- inside each pair, the key and value are joined with **`=`**
- the resulting strings are joined together with **`&`**

This is the output that `authURL.search` is assigned to.

---

## 4. Navigate

Now we have all the portions of our URL built. We get the whole URL back as a string using `authURL.toString()`, and `window.location.href` starts the navigation automatically on the client's device.

So they're just directly sent to the auth page with the hashed code in hand, delivered to Spotify, which then files the code against that instance of the login attempt.
