import test from 'node:test';
import assert from 'node:assert/strict';
import { keyIntent, swipeIntent, SwipeTracker } from '../src/input.js';

test('swipe fires once as soon as the threshold is crossed, not on release', () => {
  const t = new SwipeTracker(30);
  t.start(100, 100);
  assert.equal(t.move(110, 100), null);
  assert.equal(t.move(60, 102), 'left');
  assert.equal(t.move(0, 100), null);
  assert.equal(t.end(), null);
});

test('a touch without a swipe ends as a tap', () => {
  const t = new SwipeTracker(30);
  t.start(100, 100);
  t.move(105, 103);
  assert.equal(t.end(), 'tap');
  assert.equal(t.end(), null);
});

test('a new gesture can swipe again after the previous one', () => {
  const t = new SwipeTracker(30);
  t.start(0, 200); assert.equal(t.move(0, 150), 'jump'); t.end();
  t.start(0, 200); assert.equal(t.move(0, 250), 'slide');
});

test('keys map to intents', () => {
  assert.equal(keyIntent('ArrowLeft'), 'left');
  assert.equal(keyIntent('KeyD'), 'right');
  assert.equal(keyIntent('KeyW'), 'jump');
  assert.equal(keyIntent('ArrowDown'), 'slide');
  assert.equal(keyIntent('Space'), 'power');
  assert.equal(keyIntent('Enter'), 'start');
  assert.equal(keyIntent('KeyM'), 'mute');
  assert.equal(keyIntent('KeyQ'), null);
});

test('swipes use the dominant axis and a threshold', () => {
  assert.equal(swipeIntent(-60, 10), 'left');
  assert.equal(swipeIntent(60, -10), 'right');
  assert.equal(swipeIntent(5, -80), 'jump');
  assert.equal(swipeIntent(5, 80), 'slide');
  assert.equal(swipeIntent(10, 10), null);
});

test('a second finger does not disturb the first finger gesture', () => {
  const t = new SwipeTracker(30);
  t.start(100, 100, 1);
  t.start(300, 300, 2);
  assert.equal(t.move(0, 0, 2), null);
  assert.equal(t.end(2), null);
  assert.equal(t.move(60, 100, 1), 'left');
  assert.equal(t.end(1), null);
});

test('a tap by the first finger survives a second finger lifting', () => {
  const t = new SwipeTracker(30);
  t.start(100, 100, 1);
  t.start(200, 200, 2);
  t.end(2);
  assert.equal(t.end(1), 'tap');
});

test('the second finger can start a gesture after the first ends', () => {
  const t = new SwipeTracker(30);
  t.start(0, 0, 1);
  t.end(1);
  t.start(0, 200, 2);
  assert.equal(t.move(0, 150, 2), 'jump');
});
