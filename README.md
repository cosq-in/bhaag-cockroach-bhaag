# Bhaag Cockroach Bhaag

*"Resign kar yaar."* A mobile-first 3D endless runner (satire) set on a Jantar Mantar street. You are a cockroach running from a lathi-wielding constable: ride ramps onto bus roofs, grab chai and witness tokens, bank power-ups, and try not to get detained. Fan satire, not affiliated with any movement, party or person.

## Run it
```
npm start        # http://127.0.0.1:8000  (allowlist-only, loopback-only server)
npm test         # unit tests for all game logic and the server allowlist
```
Open it on a phone through a tunnel (for example `ngrok http 127.0.0.1:8000`).

## Controls
Swipe left/right to change lane, up to jump, down to slide, tap to use a banked power-up. Keyboard: arrows or WASD, Space, M to mute.

## Characters
Pick on the start screen with the swipe carousel (swipe, arrow keys, or tap a card): Cockroach, Spider-Hero, Straw Hat Kid. The choice is remembered.

## Customising
- Posters: on the start screen, "Add your posters" lets each player pick images from their own device. They are downscaled and kept in the browser (IndexedDB), never uploaded, and replace the built-in generic slogan posters everywhere. "Reset posters" removes them. `assets/posters/manifest.json` can still list bundled posters by role (`banner`, `road`, `standee`, `building`); it ships empty.
- `assets/sfx/manifest.json` - custom sound clips per game event (see `assets/sfx/README.md`).
- `src/stages.js` - stages, hazards, slogans (the slogans are tone placeholders).
- Dev flags: `?autostart`, `?stampede`, `?skip=N`, `?over`, `?tut=chai`, `?resettut`.

## Analytics (PostHog, optional)
Anonymous play events (run started/ended, chai, witness, power-ups, WiFi revive) are sent to PostHog when `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` are set. Copy `.env.example` to `.env` and fill them in; `npm start` loads it (needs Node 22.9+). Without them nothing is sent. Autocapture, session replay and Do-Not-Track-ignoring are disabled. Only the public project token is used; never put a personal API key (`phx_...`) in this repo.

## Safety notes
`serve.mjs` serves only the game files, so `.git`, docs and tests are never exposed. Do not replace it with a general static server when sharing publicly.

## Credits
See `assets/CREDITS.md`. Three.js is MIT (`vendor/THREE-LICENSE`). Kenney models are CC0. The humanoid cockroach is by Gandpop. Posters and sounds are generated in code; no real-person likeness or voice is used.
