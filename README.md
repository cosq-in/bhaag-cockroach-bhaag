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

## Customising
- `assets/posters/manifest.json` - meme posters by role: `banner`, `road`, `standee`, `building`.
- `assets/sfx/manifest.json` - custom sound clips per game event (see `assets/sfx/README.md`).
- `src/stages.js` - stages, hazards, slogans (the slogans are tone placeholders).
- Dev flags: `?autostart`, `?skip=N`, `?over`, `?tut=chai`, `?resettut`.

## Safety notes
`serve.mjs` serves only the game files, so `.git`, docs and tests are never exposed. Do not replace it with a general static server when sharing publicly.

## Credits
See `assets/CREDITS.md`. Three.js is MIT (`vendor/THREE-LICENSE`). Kenney models are CC0. The humanoid cockroach is by Gandpop. The meme posters and sound clips were supplied by the project owner; their provenance and licences are unverified, so check them before any public release.
