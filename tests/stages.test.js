import test from 'node:test';
import assert from 'node:assert/strict';
import { STAGES, locate } from '../src/stages.js';

test('stage 1 at start, no boss', () => {
  const l = locate(0);
  assert.equal(l.stage.id, 1);
  assert.equal(l.boss, false);
});

test('boss window at end of stage 1, then stage 2', () => {
  assert.equal(locate(2000).boss, true);
  assert.equal(locate(2399).stage.id, 1);
  assert.equal(locate(2400).stage.id, 2);
});

test('stage 2 is endless and has its own boss window', () => {
  assert.equal(locate(1e6).stage.id, 2);
  assert.equal(locate(2400 + 1600).boss, true);
  assert.equal(locate(2400 + 600).boss, false);
});

test('every stage defines hazards for all obstacle kinds and slogans', () => {
  for (const s of STAGES) {
    for (const k of ['low', 'high', 'block', 'gas', 'crowd']) assert.ok(s.hazards[k].length > 0, `${s.name} ${k}`);
    assert.ok(s.slogans.length >= 3);
  }
});
