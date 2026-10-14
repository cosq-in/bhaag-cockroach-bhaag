import test from 'node:test';
import assert from 'node:assert/strict';
import { Chaser, MAX_GAP } from '../src/chaser.js';

test('starts at max gap and not close', () => {
  const c = new Chaser();
  assert.equal(c.gap, MAX_GAP);
  assert.ok(!c.close);
});

test('first stumble closes in, second while close catches', () => {
  const c = new Chaser();
  assert.equal(c.stumble(), 'closing');
  assert.ok(c.close);
  assert.equal(c.stumble(), 'caught');
});

test('clean running recovers the gap, so a later stumble is a first one again', () => {
  const c = new Chaser();
  c.stumble();
  for (let i = 0; i < 60 * 10; i++) c.update(1 / 60);
  assert.ok(!c.close);
  assert.equal(c.stumble(), 'closing');
});

test('push is capped at max gap', () => {
  const c = new Chaser();
  c.push(100);
  assert.equal(c.gap, MAX_GAP);
});
