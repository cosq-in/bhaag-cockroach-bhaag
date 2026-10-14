import test from 'node:test';
import assert from 'node:assert/strict';
import { PowerUps } from '../src/powerups.js';

const fill = (p) => { for (let i = 0; i < 4; i++) p.addWitness(); };

test('four witness tokens bank a power-up and reset the meter', () => {
  const p = new PowerUps(() => 0);
  fill(p);
  assert.equal(p.banked, 'meme');
  assert.equal(p.meter, 0);
});

test('meme drop activates then expires', () => {
  const p = new PowerUps(() => 0);
  fill(p);
  assert.equal(p.use(), 'meme');
  assert.ok(p.memeActive && p.banked === null);
  p.update(4.1);
  assert.ok(!p.memeActive);
});

test('shield activates then expires', () => {
  const p = new PowerUps(() => 0.9);
  fill(p);
  assert.equal(p.banked, 'shield');
  assert.equal(p.use(), 'shield');
  assert.ok(p.shieldActive);
  p.update(5.1);
  assert.ok(!p.shieldActive);
});

test('wifi is passive: use does nothing, revive consumes it', () => {
  const p = new PowerUps(() => 0.5);
  fill(p);
  assert.equal(p.banked, 'wifi');
  assert.equal(p.use(), null);
  assert.equal(p.banked, 'wifi');
  assert.ok(p.consumeRevive());
  assert.equal(p.banked, null);
  assert.ok(!p.consumeRevive());
});

test('meter waits full while a power-up is banked', () => {
  const p = new PowerUps(() => 0);
  fill(p);
  fill(p);
  assert.equal(p.meter, 100);
  p.use();
  p.update(0.01);
  assert.ok(p.banked);
});
