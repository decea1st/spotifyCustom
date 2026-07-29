# Notes on the Web Playback SDK

Conceptually, what has to happen before my app can play audio, and why the code ends up shaped the way it is.

---

## The problem I'm actually solving

Everything I've built so far talks to a remote control API. `/me/player/play` does not play music. It sends an instruction: *play this, on that device*. It assumes a speaker already exists somewhere on the user's account, like their phone, the desktop app, or a Sonos.

I don't have one. So the question isn't "how do I play a track", it's **"how do I become a speaker?"**

That's what the Web Playback SDK is for. It turns my app into a Spotify Connect device, a new entry in the user's device list that happens to be a browser window. Once that exists, my existing play call finally has somewhere to point.

---

## Why I can't just play the audio myself

The obvious approach would be to ask Spotify for the audio file and hand it to an `<audio>` element. Spotify will never give me that. The catalogue is licensed, and the labels' condition is that the audio stays encrypted end to end. It gets decrypted inside the browser's DRM module, at the last possible moment, by code that Spotify controls.

Which means the playback engine cannot be a package I install. If it lived in my `node_modules`, I'd be free to pin an old version, patch it, or pull it apart. It has to be fetched from Spotify's own servers, every session, so they can update or revoke it at will.

This is the same shape as the constraint I already met in OAuth. I couldn't collect the user's password myself and trade it for a token, because only Spotify can authenticate a Spotify user, so I had to hand control to their page and get it back afterward. Here, only Spotify can decrypt Spotify audio, so I have to hand a piece of my page to their code.

> Both times, the awkwardness in my code is the shape of a trust boundary I'm not allowed to cross.

---

## The handshake

So I have to pull down a foreign script at runtime and wait for it to be ready. That script has no idea my application exists. There's no import connecting us. It can't call my function, because it's never heard of my function.

So the two of us meet at an agreed-upon address.

Spotify's script is written to look up one specific, publicly documented name in the global environment when it finishes loading, and call whatever it finds there. My job is to leave something at that address beforehand. The script loads, looks up the name, finds my code, and hands control over.

### The name, and what `window` actually is

The name is `onSpotifyWebPlaybackSDKReady`, and it lives on `window`.

`window` is the browser's global object. Every global I've ever used is a property on it: `document`, `localStorage`, `crypto`, `fetch`, `location`. Writing `localStorage.setItem(...)` and `window.localStorage.setItem(...)` are the same thing, because a bare name falls back to a lookup on `window`. So "the global environment" isn't an abstraction, it's a real object I can open devtools and inspect.

I can't just write `function onSpotifyWebPlaybackSDKReady() {}` and expect it to be found. In an old fashioned `<script>` tag that would have worked, and that's the era this convention comes from. But my file is an **ES module**, since it has `import` and `export` at the top, and modules deliberately keep top level declarations private to the file. That was the whole point of them. So the assignment to `window` has to be written out explicitly. In a module nothing becomes global by accident, which means making something global is something I have to do on purpose.

There are really two globals involved, pointing in opposite directions:

- I write `window.onSpotifyWebPlaybackSDKReady`, and Spotify's script reads it.
- Spotify's script writes `window.Spotify`, and I read it.

That second one is the loaded engine, including the `Player` constructor. It doesn't exist until their code has run, which is exactly why I can't construct a player anywhere except inside the callback.

### Where TypeScript fits in

`Window` with a capital W is the **type**. `window` is the **object**. Same convention as `player` being my variable and `Spotify.Player` being its type.

The types package I installed declares both properties:

```ts
interface Window {
    onSpotifyWebPlaybackSDKReady(): void;
    Spotify: typeof Spotify;
}
```

This adds nothing at runtime. A `.d.ts` file is erased at build time and describes shapes only. TypeScript merges interfaces that share a name, so this appends two entries to the `Window` description TypeScript already had built in.

Without it, assigning to `window.onSpotifyWebPlaybackSDKReady` is a type error, even though the browser would have been perfectly happy to run it. The interface says what TypeScript will let me reference, not what is allowed to exist. At runtime JavaScript will let me put anything I want on `window`.

---

This is inversion of control, "don't call us, we'll call you". It's the thing that makes this feel unlike the rest of my React code, where I call a function and get a value back.

Two things follow from it, and both are worth predicting before I hit them:

**Order matters, in a way that isn't obvious.** The message has to be at the address before the script arrives, or the script looks, finds nothing, and gives up silently. There's no retry and no error. It's the same reason my redirect URI has to be registered in the Spotify dashboard before the login flow ever runs. I can't set up the return path after I've already left.

**Only one thing can occupy that address.** It's a single global name, not a list of subscribers. Whoever writes to it last wins.

---

## What I'm describing when I create the device

Once control comes back to me, I describe the speaker I want to bring into existence: what it's called in the user's device list, how loud it starts, and how it gets credentials.

That last one deserves attention, because it's the second place inversion of control shows up.

I do not hand the player a token. I hand it *a way of obtaining* a token, a function it can call whenever it needs one.

The reason is a mismatch in lifespans. My access token is good for an hour. A user might leave music playing for four. If I handed over a token, the device would go deaf at the one hour mark with no way to recover. By handing over a procedure instead, the player can come back and ask again, indefinitely.

I've already written the thing it will call. This is where my refresh logic finally earns its keep.

---

## Why it reports back through events

Describing the device doesn't create it. Creating it means a network handshake with Spotify, which takes time, and can fail in genuinely different ways: the token was rejected, the account isn't Premium, the browser can't do DRM at all. Those want different responses from my app, so they can't collapse into one generic failure.

And the handshake succeeding isn't the end. Once my device is live, things keep happening that my code didn't initiate. The user pauses from their phone. A track ends and the next begins. Playback migrates to another device entirely. My app is no longer the only thing driving.

None of that fits "call a function, get an answer". So the model is: **declare in advance what I care about, start the thing, and let information arrive on its own schedule, repeatedly, forever.**

This is the sharpest break from everything I've written so far. `getUserPlaylists` is a question with an answer. The player is a long-lived object that talks back, unprompted, for as long as it's alive.

---

## The thing I'm actually here for

Out of all of it, the payoff is a single string.

When the connection succeeds, Spotify's servers register my browser as a device and assign it an id. That id is the address of the speaker I just built, and it's exactly what's missing from my play function's first parameter.

One subtlety: existing and being selected are different states. My device appearing in the list makes it **available**, not **active**. Nothing is routed to it until something says so, which is what passing the id on the play call does. It doesn't just say "play this", it says "play this, **here**".

---

## And I'll owe a teardown

I will have registered something on a remote system. Spotify's servers now believe a device exists, and they'll go on believing it until told otherwise.

So there's a matching obligation on the way out. Anything I connect, I disconnect. It's the same discipline as a file handle or a socket: acquiring a resource creates a debt, and the debt is owed to a system that can't see whether I'm still alive.

In development this bites immediately rather than eventually, because React deliberately mounts my components twice to expose exactly this class of bug. If I skip the teardown I'll get two devices, two ids, and confusing results. I've met this before. It's the same reason my auth code needed a guard against running the exchange twice.

---

## The whole thing in one line

Become a device, accept that the engine has to come from them, meet at an agreed name, hand over a way to get tokens rather than a token itself, subscribe instead of asking, keep the id, and hand it back when done.