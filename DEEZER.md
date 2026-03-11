# DEEZER.md — Deezer Internals Reference

Reference guide for extension developers. This document describes the exploitable internal APIs of the Deezer desktop/web client.

> **⚠️ Disclaimer**: These are internal, undocumented APIs. They can change without notice on any Deezer deployment.

---

## Architecture

The Deezer client is an Electron app embedding a SPA bundled with **Webpack 4** (identified by the `webpackJsonpDeezer` global). The app exposes a global `dzPlayer` object which serves as the main entry point for interacting with the player.

### Key globals

| Global | Description |
|---|---|
| `dzPlayer` | Main player object — controls, state, queue, metadata |
| `webpackJsonpDeezer` | Webpack JSONP array — access to internal modules |
| `Mousetrap` | Keyboard shortcut library (already loaded) |
| `Strophe` | XMPP client (real-time notifications) |
| `analytics` | Segment.io instance |

---

## dzPlayer

`dzPlayer` is a persistent global object exposing nearly all player functionality. It is the recommended entry point for extensions — it is stable across deployments unlike Webpack modules.

### Player state

```js
dzPlayer.isPlaying()    // bool
dzPlayer.isPaused()     // bool
dzPlayer.isLoading()    // bool
dzPlayer.isMuted()      // bool
dzPlayer.isShuffle()    // bool
dzPlayer.isFetching()   // bool
dzPlayer.isLimited()    // bool — limited account (30s preview)
dzPlayer.getRepeat()    // repeat mode
```

### Current track info

```js
dzPlayer.getSongId()        // Track ID
dzPlayer.getSongTitle()     // Title
dzPlayer.getArtistName()    // Artist
dzPlayer.getAlbumTitle()    // Album
dzPlayer.getCover()         // Cover art URL
dzPlayer.getDuration()      // Total duration (seconds)
dzPlayer.getPosition()      // Current position (seconds)
dzPlayer.getExactPosition() // Precise position
dzPlayer.getRemainingTime() // Remaining time
dzPlayer.getMediaType()     // Media type (track, episode, etc.)
dzPlayer.getMediaId()       // Media ID
```

### Controls

Playback controls are exposed via `dzPlayer.control`:

```js
dzPlayer.control  // Object containing play, pause, next, prev, seek, volume, etc.
```

> **Note**: Inspect `Object.keys(dzPlayer.control)` for the exact list of available methods — they may vary across versions.

Direct methods on `dzPlayer`:

```js
dzPlayer.play()                    // Play
dzPlayer.loadTracks(params)        // Load tracks
dzPlayer.playTrackAtIndex(index)   // Play a track by index in the tracklist
dzPlayer.setIndexSong(index)       // Set current index
```

### Queue / Tracklist

```js
dzPlayer.getTrackList()          // Current tracklist
dzPlayer.setTrackList(tracks)    // Replace the tracklist
dzPlayer.getTrackListType()      // Context type (playlist, album, flow, etc.)
dzPlayer.getTrackListIndex()     // Current index in the tracklist
dzPlayer.getTrackListDuration()  // Total tracklist duration
dzPlayer.getNbSongs()            // Number of tracks
dzPlayer.getNbSongsTotal()       // Total number
dzPlayer.isLastSong()            // Is last track?

// Navigation
dzPlayer.getCurrentSong()  // Current track
dzPlayer.getNextSong()     // Next track
dzPlayer.getPrevSong()     // Previous track

// Manipulation
dzPlayer.enqueueTracks(tracks)    // Append to the end of the queue
dzPlayer.addNextTracks(tracks)    // Insert right after the current track
dzPlayer.removeTracks(indices)    // Remove tracks by index
dzPlayer.replaceTracks(tracks)    // Replace tracks
dzPlayer.orderTracks(order)       // Reorder
```

### Volume

```js
dzPlayer.getVolume()   // Current volume
dzPlayer.isMuted()     // Muted?
```

### Context

```js
dzPlayer.getContext()                          // Current playback context
dzPlayer.getContextByIndex(index)              // Context by index
dzPlayer.getContextByIndexFromOriginal(index)  // Context from original list
dzPlayer.getPlayerType()                       // Current player type
dzPlayer.getPlayerTypeId()                     // Player type ID
dzPlayer.getRadioType()                        // Radio type (if applicable)
dzPlayer.getRadioId()                          // Radio ID
```

### Lyrics

```js
dzPlayer.getLyrics()          // Get lyrics
dzPlayer.getLyricsMetadata()  // Lyrics metadata
dzPlayer.hasLyrics()          // Track has lyrics?
dzPlayer.hasLoadedLyrics()    // Lyrics loaded?
dzPlayer.hasSyncLyrics()      // Synchronized lyrics?
```

### Events

`dzPlayer` uses an observable event system. Check for the presence of:

```js
dzPlayer.on          // Listen to an event
dzPlayer.off         // Remove a listener
dzPlayer.bind        // Possible alias for on
dzPlayer.unbind      // Possible alias for off
dzPlayer.trigger     // Manually dispatch an event
dzPlayer.subscribe   // Possible alternative
```

> **TODO**: List available event names. To discover them, intercept `trigger`:
> ```js
> const _trigger = dzPlayer.trigger.bind(dzPlayer);
> dzPlayer.trigger = function(event, ...args) {
>   console.log('[dzPlayer event]', event, args);
>   return _trigger(event, ...args);
> };
> ```

### Observable properties

These properties change in real time during playback:

```js
dzPlayer.playing          // bool
dzPlayer.paused           // bool
dzPlayer.loading          // bool
dzPlayer.muted            // bool
dzPlayer.shuffle          // bool
dzPlayer.repeat           // mode
dzPlayer.volume           // number
dzPlayer.position         // number (seconds)
dzPlayer.lastPosition     // number
dzPlayer.duration         // number
dzPlayer.songId           // string
dzPlayer.cover            // string (URL)
dzPlayer.pourcentLoaded   // number (0-100, buffer progress)
dzPlayer.numSong          // current index
dzPlayer.nbSongs          // track count
dzPlayer.nextSongInfo     // next track info
dzPlayer.playerLoaded     // bool
dzPlayer.context          // context object
```

---

## Webpack Modules

For advanced features (API calls, store, routing, etc.), you need to access internal Webpack modules.

### Extracting modules

```js
const modules = {};
webpackJsonpDeezer.push([
  ['__probe__'],
  {},
  (require) => {
    for (const id of Object.keys(require.m)) {
      try { modules[id] = require(id); } catch (e) {}
    }
  }
]);
```

> **Important**: Module IDs (`7E8A`, `qJB7`, etc.) are **generated at build time** and change on every deployment. Never hardcode an ID — always identify modules by their content.

### Finding modules by source signature

```js
function findModule(predicate) {
  for (const [id, fn] of Object.entries(require.m)) {
    if (predicate(fn.toString())) {
      return modules[id] || require(id);
    }
  }
  return null;
}

// Examples
const playerModule = findModule(src =>
  src.includes('isPlaying') && src.includes('getCurrentSong')
);
const apiModule = findModule(src =>
  src.includes('/ajax/') || src.includes('api.deezer')
);
```

### Finding modules by exports

```js
function findModuleByExports(predicate) {
  return Object.entries(modules).find(([id, m]) => {
    if (!m || typeof m !== 'object') return false;
    return predicate(m);
  })?.[1] || null;
}

// Example: find a module that exports "Codec"
const rendererModule = findModuleByExports(m =>
  m.Codec && m.RendererEvents
);
```

### Identified modules

| Signature | Type | Content |
|---|---|---|
| `CONTEXT_PAGE_*` | Constants | Page/navigation context identifiers |
| `Codec`, `Container`, `RendererEvents` | Renderer | Audio renderer — supported codecs, low-level playback events |
| `Track` (empty export `{}`) | Model | Track class/constructor — inspect prototype |
| `Facade`, `Alias`, `Group`, `Identify` | Analytics | Segment.io — tracking (can be ignored) |
| i18n keys (`%s MP3`, `Lecture`, etc.) | Translations | UI strings (FR → EN mappings) |

### RendererEvents

Low-level audio engine events (Renderer module):

```
AUTOPLAY_CHANGED        BUFFERED_RANGE_CHANGED   BUFFERING_COMPLETE_CHANGED
CAN_PLAY                CAN_PLAY_THROUGH         DURATION_CHANGED
ELEMENT_CHANGED         ENDED                    ENDED_CHANGED
ERROR                   LOADED                   LOADING
METADATA_CHANGED        MUTED_CHANGED            PAUSED_CHANGED
PLAYBACK_RATE_CHANGED   SEEKED                   SEEKING
TIME_CHANGED            VOLUME_CHANGED
```

### Navigation contexts

Constants identifying the active page. Useful for adapting extension behavior per page:

```
album_page              playlist_page            track_page
artist_discography      search                   profile_page
show_page               episode_page             mixes_page
smart_tracklist_page    sidebar                  dynamic_page
```

---

## CSS Injection

```js
function injectCSS(id, css) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('style');
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = css;
  return el;
}

// Example
injectCSS('my-ext-style', `
  .page-sidebar { background: #1a1a2e; }
`);
```

---

## UI Injection

To inject elements into the interface, use a `MutationObserver` to wait for the target container to exist:

```js
function waitForElement(selector, callback) {
  const el = document.querySelector(selector);
  if (el) return callback(el);

  const observer = new MutationObserver(() => {
    const el = document.querySelector(selector);
    if (el) {
      observer.disconnect();
      callback(el);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// Example: add a button in the topbar
waitForElement('.topbar-action-bar', (topbar) => {
  const btn = document.createElement('button');
  btn.textContent = 'My Extension';
  btn.onclick = () => console.log('clicked');
  topbar.appendChild(btn);
});
```

---

## Intercepting API Calls

Deezer makes its calls via `fetch` (or potentially `XMLHttpRequest`). You can intercept them:

```js
const _fetch = window.fetch;
window.fetch = async function(url, options) {
  const response = await _fetch.apply(this, arguments);

  // Example: intercept track API responses
  if (typeof url === 'string' && url.includes('/ajax/')) {
    const clone = response.clone();
    clone.json().then(data => {
      console.log('[API]', url, data);
    }).catch(() => {});
  }

  return response;
};
```

---

## Best Practices for Extensions

1. **Never modify Deezer object prototypes directly** — use monkey-patching with a saved reference to the original method.
2. **Always save original references** so you can restore state if the extension is disabled.
3. **Identify modules by content, not by ID** — IDs change on every build.
4. **Prefer `dzPlayer` over Webpack modules** when possible — it's more stable.
5. **Namespacing** — prefix your CSS classes, IDs, and globals to avoid collisions between extensions.
6. **Cleanup** — every extension must be able to clean up after itself (remove listeners, DOM elements, styles).

```js
// Recommended extension pattern
class MyExtension {
  constructor() {
    this._cleanups = [];
  }

  enable() {
    // Add a listener
    const handler = () => { /* ... */ };
    dzPlayer.on('someEvent', handler);
    this._cleanups.push(() => dzPlayer.off('someEvent', handler));

    // Inject CSS
    const style = injectCSS('my-ext', '...');
    this._cleanups.push(() => style.remove());
  }

  disable() {
    this._cleanups.forEach(fn => fn());
    this._cleanups = [];
  }
}
```

---

## Resources

- **RendererEvents**: All low-level audio events live in the module exporting `Codec`, `Container`, and `RendererEvents`.
- **i18n**: The translations module contains all UI strings — useful for targeting elements by text content.
- **Segment.io**: The analytics module exports `Track`, `Identify`, `Page` — can be intercepted to monitor tracking events.