import test from 'node:test';
import assert from 'node:assert/strict';
import { Player } from '../src/player.js';

const run = (p, secs, support = 0) => { for (let i = 0; i < secs * 60; i++) p.update(1 / 60, support); };

test('lane moves clamp to 0..2', () => {
  const p = new Player();
  p.moveLeft(); p.moveLeft(); p.moveLeft();
  assert.equal(p.lane, 0);
  p.moveRight(); p.moveRight(); p.moveRight();
  assert.equal(p.lane, 2);
});

test('jump is an arc that peaks near 1.7 and lands', () => {
  const p = new Player();
  p.jump();
  let peak = 0;
  for (let i = 0; i < 90; i++) { p.update(1 / 60, 0); peak = Math.max(peak, p.y); }
  assert.ok(peak > 1.5 && peak < 1.9, `peak ${peak}`);
  assert.ok(p.grounded && p.y === 0);
});

test('cannot double jump in mid-air', () => {
  const p = new Player();
  p.jump(); run(p, 0.2);
  const vy = p.vy;
  p.jump();
  assert.equal(p.vy, vy);
});

test('standing on a roof stays grounded; walking off the end falls', () => {
  const p = new Player();
  p.update(1 / 60, 2);
  assert.equal(p.y, 2);
  run(p, 0.1, 2);
  assert.ok(p.grounded && p.y === 2);
  run(p, 0.1, 0);
  assert.ok(p.y < 2);
  run(p, 1, 0);
  assert.equal(p.y, 0);
});

test('slide in the air fast-falls then slides on landing', () => {
  const p = new Player();
  p.jump(); run(p, 0.2);
  p.slide();
  assert.ok(p.vy < 0 && p.sliding);
  run(p, 0.3);
  assert.ok(p.grounded);
});

test('slide expires; stumble grace decays; visual lane eases', () => {
  const p = new Player();
  p.slide(); assert.ok(p.sliding);
  run(p, 1); assert.ok(!p.sliding);
  p.stumble(); assert.ok(p.graceT > 0);
  run(p, 2); assert.equal(p.graceT, 0);
  p.moveRight(); p.update(1 / 60, 0);
  assert.ok(p.visualLane > 1 && p.visualLane < 2);
});
