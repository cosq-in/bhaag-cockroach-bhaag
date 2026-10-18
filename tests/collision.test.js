import test from 'node:test';
import assert from 'node:assert/strict';
import { Player } from '../src/player.js';
import { hitsObstacle, collectsPickup } from '../src/collision.js';

const ob = (kind, lane = 1, z = 0) => ({ cat: 'obstacle', kind, lane, z, dead: false });
const pk = (lane = 1, z = 0, y) => ({ cat: 'pickup', kind: 'petition', lane, z, dead: false, y });

test('point obstacles hit in same lane and depth only', () => {
  const p = new Player();
  assert.ok(hitsObstacle(p, ob('block')));
  assert.ok(!hitsObstacle(p, ob('block', 0)));
  assert.ok(!hitsObstacle(p, ob('block', 1, 5)));
});

test('low is cleared by height, high by sliding, block needs a roof', () => {
  const p = new Player();
  p.y = 1; p.vy = 1;
  assert.ok(!hitsObstacle(p, ob('low')));
  assert.ok(hitsObstacle(p, ob('high')));
  assert.ok(hitsObstacle(p, ob('block')));
  p.y = 2;
  assert.ok(!hitsObstacle(p, ob('block')));
  const s = new Player();
  s.slide();
  assert.ok(!hitsObstacle(s, ob('high')));
  assert.ok(hitsObstacle(s, ob('low')));
});

test('drifting gas and dead items', () => {
  const p = new Player();
  assert.ok(hitsObstacle(p, ob('gas', 1.4)));
  assert.ok(!hitsObstacle(p, ob('gas', 1.6)));
  const dead = ob('block'); dead.dead = true;
  assert.ok(!hitsObstacle(p, dead));
});

test('buses and ramps are surfaces, never point hits', () => {
  assert.ok(!hitsObstacle(new Player(), { ...ob('bus'), len: 12 }));
});

test('pickups are collected by height too', () => {
  const p = new Player();
  assert.ok(collectsPickup(p, pk()));
  assert.ok(!collectsPickup(p, pk(1, 0, 2.9)));
  p.y = 2;
  assert.ok(collectsPickup(p, pk(1, 0, 2.9)));
  assert.ok(!collectsPickup(p, ob('block')));
});

test('a stampede walker blocks its lane but can be vaulted from a bus roof', () => {
  const p = new Player();
  assert.ok(hitsObstacle(p, { cat: 'obstacle', kind: 'crowd', lane: 1, z: 0, dead: false }));
  p.y = 2.9;
  assert.ok(!hitsObstacle(p, { cat: 'obstacle', kind: 'crowd', lane: 1, z: 0, dead: false }));
});
