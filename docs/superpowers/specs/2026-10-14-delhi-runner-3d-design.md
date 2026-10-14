# Delhi Runner 3D: Design

A 3D, mobile-first endless runner in the style of Subway Surfers (chase camera, low-poly models, run-on-top-of-vehicles), themed as light satire of the 2026 Cockroach Janta Party Jantar Mantar protests. It is a new sibling of the shipped 2D game (`../delhi-runner`), which stays untouched.

## Background
Same as the 2D design (`../delhi-runner/docs/superpowers/specs/2026-10-14-delhi-runner-design.md`): Stage 1 "Paper Leak" (NEET protest), Stage 2 "Voter Roll" (Election Commission protest), a cockroach hero reclaiming the insult, a lathi-wielding inspector chasing, Hinglish placard humour. Slogans stay tone placeholders and make no factual claims about named people.

## Constraints
- **No Subway Surfers assets** (characters, models, music, name) — they are copyrighted. Same style and gameplay, all original or CC0.
- **No real faces or likenesses.** The inspector is a generic low-poly stand-in.
- **Mobile first:** portrait phone primary (390x844), 60 fps target on mid-range phones, DPR capped at 2, no zoom/scroll/pull-to-refresh, swipe on touchmove, tap = start/power-up, haptics, pause while hidden, audio unlock on first input (resume suspended context).
- No build step. Three.js and `GLTFLoader` vendored locally at a pinned version (no CDN).
- **Hosting safety (lesson from the 2D game):** the server is allowlist-only and loopback-only. It serves `index.html`, `style.css`, `src/<name>.js`, `vendor/*.js`, and `assets/` files with an extension allowlist (`.glb .png .jpg .json`). Never `.git`, `docs/`, `tests/`, `.superpowers/`, `package.json`, or `serve.mjs`.
- Model licences must be CC0 (or equivalent attribution-free), checked at download and recorded in `assets/CREDITS.md`. Downloaded files are untrusted: inspect before use, never run anything from them.

## Gameplay
Coordinates: lane = x (three lanes, 2 units apart), depth = z (player at 0, horizon far, items approach toward negative z), height = y (ground 0).

Carried over unchanged: controls (swipe/tap, keys), the inspector's two-stumble rule, grace period, WiFi revive, meme drop, crowd-surge shield, witness meter, two stages with boss windows, score/combo, speed ramp, difficulty = min(1, distance/4000 + 0.3 in boss).

New obstacles and pickups (items have a depth length):
- **Bus / metro coach:** long solid block (~12 units), roof at height 2, runnable on top. Hitting its front face from the ground is a stumble.
- **Ramp:** ~6-unit slope carrying the player to roof height, usually in front of a bus.
- **Existing hazards:** low barricades (jump), overhead banners (slide), drifting tear gas, shorter vans / water cannons as solid blocks.
- **Coin arcs** (petitions) over obstacles; witness and chai pickups on roofs as a reward.

Vertical physics: jump is a real gravity arc. Landing on a roof makes the player grounded at roof height (can jump/slide there). When the roof ends the player falls (small drops are safe). Lane switching on a roof is allowed only if the target lane has a roof or ramp at that depth, otherwise the player drops to the ground in that lane. Switching into the side of a bus from the ground is a **side bump**: slide back to the previous lane and take a stumble.

Spawner fairness: every row has a reachable path; rows containing roofs always offer a ramp or a ground lane; open lane moves at most one lane between rows; row gaps are time-based (carried over from the 2D fixes).

## Rendering and assets
- Three.js world canvas; the existing 2D HUD/overlays (score, bars, popups, menu, game over, wrapped text, minimum font sizes) reused on a transparent canvas on top (`hud.js`, extracted from the 2D `render.js`).
- **Chase camera** ~5 units behind and ~4 above, looking slightly ahead; eases sideways to the lane and up onto roofs; FOV widens with speed; short shake on stumble.
- **Environment:** CC0 low-poly packs (Kenney city/vehicle kits are first candidates; Quaternius as alternative) as `.glb`: buses, vans, buildings, barricades, road, props.
- **Hero cockroach (procedural):** ellipsoid body, animated six-leg run cycle, antennae, scrappy red cape; jump, slide and stumble poses. **Inspector (procedural):** generic low-poly cop with cap and lathi at the bottom edge of the screen.
- **Delhi flavour:** hand-lettered placard textures (canvas) with stage slogans on walls and fences; procedural India Gate-style arch on the horizon; stage 2 lockdown look (shuttered gates, empty streets).
- Dusk look: hemisphere + directional light, fog, gradient sky dome; per-stage palette. No real-time shadows (blob shadows only).
- Performance: pooled/instanced meshes, small draw-call budget, DPR cap 2.
- Fallbacks: a model that fails to load is replaced by a palette-coloured box (game stays playable); no WebGL shows a plain message.

## Architecture
```
delhi-runner-3d/
├── index.html, style.css, package.json
├── serve.mjs             allowlist-only, loopback-only server
├── vendor/               three.module.js + GLTFLoader.js (pinned)
├── assets/               models/*.glb, textures, CREDITS.md
└── src/
    ├── platforms.js      heightAt(items, lane, z): roofs, ramps, ground (pure)
    ├── collision.js      resolves stumble | side-bump | landing | pickup (pure)
    ├── player.js         gravity jump, slide, roof lane-switch rules (pure)
    ├── chaser.js, powerups.js, stages.js, input.js   (carried over from 2D)
    ├── spawner.js        adds bus/ramp/coin-arc patterns, keeps fairness (pure)
    ├── game.js           state + fixed 60 Hz tick, emits events (pure)
    ├── scene.js          renderer, chase-cam rig, lights, fog, sky
    ├── models.js         GLB loading + procedural hero/inspector (+ fallbacks)
    ├── world-view.js     maps game items to pooled meshes; read-only
    ├── hud.js            2D overlay on a transparent canvas
    ├── audio.js          (carried over)
    └── main.js           loop, input, haptics, visibility handling
```
Data flow: `game.js` tick updates logic state; `world-view.js` and the camera rig read it to place meshes and never mutate it; `hud.js` draws on top. `game.events` is drained by `main.js` into audio and vibration.

## Testing
- Plain Node unit tests (`node --test`) for all pure logic: `heightAt`, landing, side bump, roof lane-switch rules, spawner reachability with buses/ramps, plus the carried-over suites.
- Headless smoke test of `world-view.js` using primitive meshes (Three.js can build scenes in Node without WebGL).
- Server test: allowlist returns 200 for game files and 404 for `.git`, docs, tests, `package.json`, traversal attempts.
- Manual phone play-test for feel, frame rate and models.

## Out of scope (v1)
Rails/grinding, mystery boxes, jetpack/hoverboard, real-time shadows, online leaderboards, anything using SYBO/Kiloo assets, real-person likenesses.
