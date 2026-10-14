import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, startRun, applyIntent, step } from '../src/game.js';
import { MAX_GAP } from '../src/chaser.js';
import { mulberry32 } from './rng.js';

const STEP = 1 / 60;
const run = (g, s) => { for (let i = 0; i < s * 60; i++) step(g, STEP); };
const ob = (kind, lane = 1, z = 0) => ({ cat: 'obstacle', kind, label: kind, lane, z, dead: false });
const bus = (lane, z, len = 12) => ({ ...ob('bus', lane, z), len });
const ramp = (lane, z, len = 6) => ({ ...ob('ramp', lane, z), len });

function started() {
  const g = createGame(mulberry32(7));
  startRun(g);
  g.spawner.cooldown = 1e9;
  return g;
}

test('menu waits for start; play advances distance and score', () => {
  const g = createGame(mulberry32(1));
  step(g, STEP);
  assert.equal(g.distance, 0);
  applyIntent(g, 'start');
  assert.equal(g.state, 'play');
  run(g, 2);
  assert.ok(g.distance > 30 && g.score > 0);
});

test('an idle player is eventually detained, restart needs a delay', () => {
  const g = createGame(mulberry32(7));
  startRun(g);
  for (let i = 0; i < 180 * 60 && g.state === 'play'; i++) step(g, STEP);
  assert.equal(g.state, 'over');
  assert.ok(g.events.includes('caught'));
  applyIntent(g, 'start');
  assert.equal(g.state, 'over');
  run(g, 1);
  applyIntent(g, 'start');
  assert.equal(g.state, 'play');
});

test('a block hit stumbles; a second one while close ends the run', () => {
  const g = started();
  g.spawner.items.push(ob('block'));
  step(g, STEP);
  assert.ok(g.chaser.close && g.player.graceT > 0 && g.shake > 0);
  const h = started();
  h.chaser.gap = 4;
  h.spawner.items.push(ob('block'));
  step(h, STEP);
  assert.equal(h.state, 'over');
});

test('wifi revive and shield protect', () => {
  const g = started();
  g.chaser.gap = 4;
  g.powerups.banked = 'wifi';
  g.spawner.items.push(ob('block'));
  step(g, STEP);
  assert.equal(g.state, 'play');
  assert.ok(g.chaser.gap >= MAX_GAP - 0.1 && g.events.includes('revive'));
  const s = started();
  s.powerups.shieldT = 5;
  s.spawner.items.push(ob('block'));
  step(s, STEP);
  assert.ok(!s.chaser.close);
});

test('jumping clears a low obstacle', () => {
  const g = started();
  applyIntent(g, 'jump');
  run(g, 0.2);
  g.spawner.items.push(ob('low', 1, 0));
  step(g, STEP);
  assert.ok(!g.chaser.close);
});

test('riding a ramp up onto a bus roof, then falling off the end', () => {
  const g = started();
  g.spawner.items.push(ramp(1, 2), bus(1, 8));
  run(g, 0.7);
  assert.ok(g.player.y > 1.5, `y ${g.player.y}`);
  assert.ok(!g.chaser.close);
  run(g, 1.5);
  assert.equal(g.player.y, 0);
  assert.equal(g.state, 'play');
});

test('hitting a bus front from the ground stumbles once and passes through', () => {
  const g = started();
  g.spawner.items.push(bus(1, 0.4));
  run(g, 0.2);
  assert.ok(g.chaser.close);
  assert.ok(g.spawner.items.some((it) => it.kind === 'bus' && it.ghost));
});

test('switching lanes into the side of a bus is a side bump', () => {
  const g = started();
  g.spawner.items.push(bus(2, -3));
  applyIntent(g, 'right');
  assert.equal(g.player.lane, 1);
  assert.ok(g.chaser.close);
});

test('from a roof you can step sideways onto another roof or drop to the ground', () => {
  const g = started();
  g.spawner.items.push(ramp(1, 2), bus(1, 8, 60), bus(2, 8, 60));
  run(g, 0.8);
  assert.ok(g.player.y >= 1.9, `y ${g.player.y}`);
  applyIntent(g, 'right');
  assert.equal(g.player.lane, 2);
  applyIntent(g, 'left'); applyIntent(g, 'left');
  assert.equal(g.player.lane, 0);
});

test('roof pickups are collected from the roof; power intent works; stage changes', () => {
  const g = started();
  g.spawner.items.push(ramp(1, 2), bus(1, 8, 60));
  g.spawner.items.push({ cat: 'pickup', kind: 'witness', label: 'witness', lane: 1, z: 40, y: 2.9, dead: false });
  run(g, 2);
  assert.ok(g.combo >= 1 && g.powerups.meter > 0);
  g.powerups.banked = 'meme';
  applyIntent(g, 'power');
  assert.ok(g.powerups.memeActive);
  g.distance = 2500;
  step(g, STEP);
  assert.equal(g.stage.id, 2);
});
