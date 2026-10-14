import { createGame, applyIntent, step } from './game.js';
import { createRenderer, Stage3D } from './scene.js';
import { drawHud } from './hud.js';
import { attachInput } from './input.js';
import { initAudio, sfx, toggleMute, setPaused } from './audio.js';

const HI_KEY = 'delhiRunner3dHi';
const STEP = 1 / 60;

function loadHi() { try { return Number(localStorage.getItem(HI_KEY)) || 0; } catch { return 0; } }
function saveHi(v) { try { localStorage.setItem(HI_KEY, String(v)); } catch { /* storage unavailable */ } }

const worldCanvas = document.getElementById('world');
const hudCanvas = document.getElementById('hud');
const hud = hudCanvas.getContext('2d');

let stage3d;
try {
  stage3d = new Stage3D(createRenderer(worldCanvas));
} catch {
  const msg = document.getElementById('msg');
  msg.textContent = 'This game needs WebGL. Please try a recent phone browser.';
  msg.hidden = false;
  throw new Error('WebGL unavailable');
}

let w = 0;
let h = 0;
function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  w = window.innerWidth;
  h = window.innerHeight;
  stage3d.resize(w, h);
  hudCanvas.width = w * dpr;
  hudCanvas.height = h * dpr;
  hud.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 150));
resize();

const game = createGame(Math.random, loadHi());

attachInput(worldCanvas, (intent) => {
  initAudio();
  if (intent === 'touch') { game.touch = true; return; }
  if (intent === 'mute') { toggleMute(); return; }
  applyIntent(game, intent);
});

const VIBRATE = { stumble: 40, caught: [60, 40, 120], revive: 30, power: 20 };
function buzz(name) {
  try { if (VIBRATE[name]) navigator.vibrate?.(VIBRATE[name]); } catch { /* unsupported */ }
}
function drainEvents() {
  for (const name of game.events) {
    sfx(name);
    buzz(name);
    if (name === 'caught') saveHi(game.hi);
  }
  game.events.length = 0;
}

let last = performance.now();
let acc = 0;
function persistHi() {
  if (game.state === 'play' || game.state === 'over') saveHi(Math.max(game.hi, Math.floor(game.score)));
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { setPaused(true); persistHi(); } else { setPaused(false); last = performance.now(); }
});
window.addEventListener('pagehide', persistHi);

function frame(now) {
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
  last = now;
  if (!document.hidden) acc += dt;
  while (acc >= STEP) { step(game, STEP); acc -= STEP; }
  drainEvents();
  stage3d.render(game, dt);
  drawHud(hud, w, h, game);
  requestAnimationFrame(frame);
}

let started = false;
function startLoop() {
  if (started) return;
  started = true;
  last = performance.now();
  requestAnimationFrame(frame);
}
const fontLoad = (document.fonts?.load('20px "Permanent Marker"') ?? Promise.resolve()).catch(() => {});
Promise.race([fontLoad, new Promise((r) => setTimeout(r, 1500))]).then(startLoop);

// Dev hook: ?autostart skips the menu (used for automated screenshots).
const qs = new URLSearchParams(location.search);
if (qs.has('autostart')) {
  applyIntent(game, 'start');
  for (let i = 0, n = Number(qs.get('skip')) * 60 || 0; i < n; i++) step(game, STEP);
}
