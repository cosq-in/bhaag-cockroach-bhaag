import test from 'node:test';
import assert from 'node:assert/strict';
import { Dial, ROSTER, normalizeCharacter, dialLayout, holeAt, holePos } from '../src/dial.js';

test('unknown saved ids fall back to the cockroach', () => {
  assert.equal(normalizeCharacter('batman'), 'cockroach');
  assert.equal(normalizeCharacter('luffy'), 'luffy');
  assert.equal(new Dial('nope').character.id, 'cockroach');
});

test('step wraps around both ways', () => {
  const d = new Dial('cockroach');
  d.step(-1);
  assert.equal(d.character.id, ROSTER[ROSTER.length - 1].id);
  d.step(1);
  assert.equal(d.character.id, 'cockroach');
});

test('select takes the shorter way and the dial settles', () => {
  const d = new Dial('cockroach');
  d.select(2);
  assert.equal(d.character.id, 'luffy');
  assert.ok(d.target > d.angle - 1e-9 || d.target < 0);
  for (let i = 0; i < 200; i++) d.update(1 / 60);
  assert.ok(Math.abs(d.angle - d.target) < 1e-3);
});

test('selected hole rests at the top and is hit-testable', () => {
  const d = new Dial('spiderman');
  for (let i = 0; i < 200; i++) d.update(1 / 60);
  const lay = dialLayout(400, 700);
  const p = holePos(lay, d, 1);
  assert.ok(Math.abs(p.x - lay.cx) < 1e-3 && p.y < lay.cy);
  assert.equal(holeAt(p.x, p.y, lay, d), 1);
  assert.equal(holeAt(lay.cx, lay.cy, lay, d), -1);
});
