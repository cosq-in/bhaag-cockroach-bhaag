import test from 'node:test';
import assert from 'node:assert/strict';
import { heightAt, ROOF } from '../src/platforms.js';

const bus = (lane, z, len = 12) => ({ kind: 'bus', lane, z, len });
const ramp = (lane, z, len = 6) => ({ kind: 'ramp', lane, z, len });

test('ground is 0 with nothing there', () => {
  assert.equal(heightAt([], 1, 0), 0);
});

test('bus gives a flat roof across its length, only in its lane', () => {
  const items = [bus(1, -3)];
  assert.equal(heightAt(items, 1, 0), ROOF);
  assert.equal(heightAt(items, 1, 8.9), ROOF);
  assert.equal(heightAt(items, 1, 9.1), 0);
  assert.equal(heightAt(items, 0, 0), 0);
});

test('ramp slopes from 0 to roof height', () => {
  const items = [ramp(1, 0)];
  assert.equal(heightAt(items, 1, 0), 0);
  assert.ok(Math.abs(heightAt(items, 1, 3) - ROOF / 2) < 1e-9);
  assert.ok(Math.abs(heightAt(items, 1, 6) - ROOF) < 1e-9);
});

test('ghost and dead items are not solid', () => {
  assert.equal(heightAt([{ ...bus(1, -1), ghost: true }], 1, 0), 0);
  assert.equal(heightAt([{ ...bus(1, -1), dead: true }], 1, 0), 0);
});

test('point obstacles (no len) are ignored', () => {
  assert.equal(heightAt([{ kind: 'low', lane: 1, z: 0 }], 1, 0), 0);
});
