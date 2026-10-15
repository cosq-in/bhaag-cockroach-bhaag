import { Player } from './player.js';
import { Chaser } from './chaser.js';
import { PowerUps } from './powerups.js';
import { Spawner } from './spawner.js';
import { locate } from './stages.js';
import { hitsObstacle, collectsPickup } from './collision.js';
import { heightAt } from './platforms.js';

export const BASE_SPEED = 30;
export const MAX_SPEED = 70;

const TUTORIAL = {
  chai: { title: 'CHAI BOOST!', lines: ['Sip chai, sprint faster. A proper chaiwala moment, straight out of the media cycle.', 'It also pushes the inspector back.'] },
  witness: { title: 'WITNESS TOKEN', lines: ['Phones out! Collect 4 to bank a power-up.', 'Tap the screen (or Space) to use it.'] },
  'power-meme': { title: 'MEME DROP', lines: ['It goes viral: the world slows and tear gas freezes for 4 seconds.', 'Tap to use it.'] },
  'power-wifi': { title: 'WIFI REVIVE', lines: ['Passive. Saves you once from detention.', 'No tap needed.'] },
  'power-shield': { title: 'CROWD SURGE', lines: ['The crowd carries you: 5 seconds of smashing through anything.', 'Tap to use it.'] },
  ramp: { title: 'RAMP!', lines: ['Run up onto the bus roof and keep going.', 'Coins up top. Jump to leave.'] },
};
const TUTORIAL_SECONDS = 3;
const TUTORIAL_SLOWMO = 0.12;

export function createGame(rng = Math.random, hi = 0, seen = []) {
  return {
    rng,
    state: 'menu',
    player: new Player(),
    chaser: new Chaser(),
    powerups: new PowerUps(rng),
    spawner: new Spawner(rng),
    distance: 0, speed: BASE_SPEED, slow: 1, boostT: 0,
    score: 0, combo: 0, mult: 1, hi, touch: false,
    popups: [], events: [], tut: { seen: new Set(seen), card: null }, lastBanked: null,
    stage: locate(0).stage, boss: false, overT: 0, t: 0, shake: 0,
  };
}

function popup(g, text) { g.popups.push({ text, t: 2.2 }); }
function emit(g, name) { g.events.push(name); }

// Shows a first-time tutorial card (the world drops into slow motion while it is up).
export function showTutorial(g, key, force = false) {
  const t = TUTORIAL[key];
  if (!t || g.tut.card || (!force && g.tut.seen.has(key))) return;
  g.tut.seen.add(key);
  g.tut.card = { key, title: t.title, lines: t.lines, t: TUTORIAL_SECONDS, total: TUTORIAL_SECONDS };
  emit(g, 'tutorial');
}

export function startRun(g) {
  g.player.reset(); g.chaser.reset(); g.powerups.reset(); g.spawner.reset();
  Object.assign(g, {
    state: 'play', distance: 0, speed: BASE_SPEED, slow: 1, boostT: 0,
    score: 0, combo: 0, mult: 1, popups: [], boss: false, overT: 0, shake: 0,
  });
  g.tut.card = null;
  g.lastBanked = null;
  g.stage = locate(0).stage;
  popup(g, `Stage ${g.stage.id}: ${g.stage.name}`);
}

function onStumble(g) {
  emit(g, 'stumble');
  g.shake = 0.4;
  g.combo = 0;
  g.mult = 1;
  g.slow = 0.6;
  g.player.stumble();
  if (g.chaser.stumble() === 'caught') {
    if (g.powerups.consumeRevive()) {
      g.chaser.reset();
      emit(g, 'revive');
      popup(g, 'WiFi revive! Back in the crowd');
    } else {
      g.state = 'over';
      g.overT = 0;
      g.hi = Math.max(g.hi, Math.floor(g.score));
      emit(g, 'caught');
    }
  }
}

// A bump the player takes unless a shield or the grace period covers it.
function bump(g) {
  if (g.powerups.shieldActive || g.player.graceT > 0) return;
  onStumble(g);
}

function changeLane(g, dir) {
  const p = g.player;
  const next = Math.max(0, Math.min(2, p.lane + dir));
  if (next === p.lane) return;
  if (heightAt(g.spawner.items, next, 0) > p.y + 0.6) { bump(g); return; } // side bump
  p.lane = next;
}

export function applyIntent(g, intent) {
  if (g.state !== 'play') {
    const wantsStart = intent === 'start' || intent === 'tap' || intent === 'power';
    if (wantsStart && (g.state === 'menu' || g.overT > 0.8)) startRun(g);
    return;
  }
  switch (intent) {
    case 'left': changeLane(g, -1); break;
    case 'right': changeLane(g, 1); break;
    case 'jump': g.player.jump(); break;
    case 'slide': g.player.slide(); break;
    case 'power':
    case 'tap': {
      const used = g.powerups.use();
      if (used) {
        emit(g, 'power');
        popup(g, used === 'meme' ? 'MEME DROP!' : 'CROWD SURGE!');
      }
      break;
    }
    default: break;
  }
}

function onPickup(g, it) {
  emit(g, 'pickup');
  g.combo += 1;
  g.mult = 1 + Math.min(4, Math.floor(g.combo / 10));
  g.chaser.push(0.5);
  if (it.kind === 'chai' || it.kind === 'witness') showTutorial(g, it.kind);
  if (it.kind === 'petition') g.score += 10 * g.mult;
  if (it.kind === 'witness') {
    g.score += 25 * g.mult;
    g.powerups.addWitness();
    popup(g, g.stage.slogans[Math.floor(g.rng() * g.stage.slogans.length)]);
  }
  if (it.kind === 'chai') {
    g.score += 25 * g.mult;
    g.boostT = 2;
    g.chaser.push(1);
    popup(g, 'Chai boost!');
  }
}

export function step(g, dt) {
  g.t += dt;
  g.shake = Math.max(0, g.shake - dt);
  g.popups = g.popups.map((p) => ({ ...p, t: p.t - dt })).filter((p) => p.t > 0);
  if (g.state === 'over') { g.overT += dt; return; }
  if (g.state !== 'play') return;

  const loc = locate(g.distance);
  if (loc.stage.id !== g.stage.id) {
    g.stage = loc.stage;
    popup(g, `Stage ${loc.stage.id}: ${loc.stage.name}`);
  }
  if (loc.boss && !g.boss) popup(g, `BOSS: ${loc.stage.boss}`);
  g.boss = loc.boss;

  if (g.tut.card) {
    g.tut.card.t -= dt;
    if (g.tut.card.t <= 0) g.tut.card = null;
    else dt *= TUTORIAL_SLOWMO;
  }

  const difficulty = Math.min(1, g.distance / 4000 + (loc.boss ? 0.3 : 0));
  g.speed = Math.min(MAX_SPEED, BASE_SPEED + g.distance * 0.012);
  g.slow = Math.min(1, g.slow + 0.4 * dt);
  g.boostT = Math.max(0, g.boostT - dt);
  const meme = g.powerups.memeActive;
  const worldSpeed = g.speed * g.slow * (meme ? 0.6 : 1) * (g.boostT > 0 ? 1.25 : 1);

  g.distance += worldSpeed * dt;
  g.score += worldSpeed * dt * 0.1;
  g.powerups.update(dt);
  if (g.powerups.banked && g.powerups.banked !== g.lastBanked) showTutorial(g, `power-${g.powerups.banked}`);
  g.lastBanked = g.powerups.banked;
  g.chaser.update(dt);
  if (meme) g.chaser.push(2 * dt);
  g.spawner.update(dt, worldSpeed, loc.stage, difficulty, meme);

  const p = g.player;
  const items = g.spawner.items;
  if (items.some((it) => it.kind === 'ramp' && it.z > 2 && it.z < 26)) showTutorial(g, 'ramp');
  let support = heightAt(items, p.lane, 0);
  if (support > p.support + 0.6 && p.y < support - 0.4) {
    // The front face of a bus reached the player: bump, then pass through it.
    const bus = items.find((it) => it.kind === 'bus' && !it.ghost && !it.dead
      && Math.abs(it.lane - p.lane) < 0.5 && it.z <= 0 && it.z + it.len >= 0);
    if (bus) bus.ghost = true;
    bump(g);
    if (g.state === 'over') return;
    support = heightAt(items, p.lane, 0);
  }
  p.update(dt, support);

  for (const it of items) {
    if (collectsPickup(p, it)) {
      it.dead = true;
      onPickup(g, it);
    } else if (g.powerups.shieldActive && hitsObstacle(p, it)) {
      it.dead = true;
      g.score += 5;
    } else if (p.graceT <= 0 && hitsObstacle(p, it)) {
      it.dead = true;
      onStumble(g);
      if (g.state === 'over') return;
    }
  }
}
