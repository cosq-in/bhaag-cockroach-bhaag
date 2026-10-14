import test from 'node:test';
import assert from 'node:assert/strict';
import { Spawner, Z_FAR } from '../src/spawner.js';
import { STAGES } from '../src/stages.js';
import { mulberry32 } from './rng.js';

const stage = STAGES[0];

test('first update spawns a pattern at the horizon', () => {
  const s = new Spawner(mulberry32(1));
  s.update(1 / 60, 30, stage, 0, false);
  assert.ok(s.items.length > 0);
  assert.ok(s.items.every((it) => it.z <= Z_FAR + 20 && it.z > Z_FAR - 1));
});

test('items approach and are culled once fully behind', () => {
  const s = new Spawner(mulberry32(2));
  for (let i = 0; i < 60 * 40; i++) s.update(1 / 60, 30, stage, 0, false);
  assert.ok(s.items.every((it) => it.z + (it.len ?? 0) > -6));
});

test('every pattern leaves a free lane or is a uniform jump/slide row', () => {
  for (let seed = 1; seed <= 60; seed++) {
    const s = new Spawner(mulberry32(seed));
    let prevOpen;
    for (let n = 0; n < 20; n++) {
      const before = s.items.length;
      s.spawnPattern(stage, n / 19);
      const obs = s.items.slice(before).filter((it) => it.cat === 'obstacle' && it.kind !== 'gas');
      const busy = new Set(obs.filter((o) => o.kind !== 'low' || obs.some((x) => x.kind === 'bus' || x.kind === 'block'))
        .map((o) => Math.round(o.lane)));
      const uniform = obs.length === 3 && ['low', 'high'].some((k) => obs.every((o) => o.kind === k));
      assert.ok(uniform || busy.size < 3, `seed ${seed} n ${n}: all lanes busy`);
      if (s.lastOpen !== undefined && prevOpen !== undefined) {
        assert.ok(Math.abs(s.lastOpen - prevOpen) <= 1, 'open lane jumped more than one lane');
      }
      prevOpen = s.lastOpen;
    }
  }
});

test('the open lane of a bus pattern is free of surfaces and obstacles', () => {
  for (let seed = 1; seed <= 80; seed++) {
    const s = new Spawner(mulberry32(seed));
    for (let n = 0; n < 15; n++) {
      const before = s.items.length;
      s.spawnPattern(stage, 0.5);
      const fresh = s.items.slice(before);
      if (!fresh.some((it) => it.kind === 'bus')) continue;
      const open = s.lastOpen;
      assert.ok(!fresh.some((it) => it.cat === 'obstacle' && Math.round(it.lane) === open), `seed ${seed}`);
    }
  }
});

test('bus patterns include ramps in front of roofs, with matching lanes', () => {
  let ramps = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const s = new Spawner(mulberry32(seed));
    for (let n = 0; n < 15; n++) {
      const before = s.items.length;
      s.spawnPattern(stage, 0.5);
      const r = s.items.slice(before).find((it) => it.kind === 'ramp');
      if (!r) continue;
      ramps++;
      const b = s.items.slice(before).find((it) => it.kind === 'bus');
      assert.equal(b.lane, r.lane);
      assert.equal(b.z, r.z + r.len);
    }
  }
  assert.ok(ramps > 0);
});

test('row gap is time based and never overlaps the previous pattern', () => {
  const s = new Spawner(mulberry32(5));
  s.update(1 / 60, 70, stage, 1, false);
  assert.ok(s.cooldown >= 70 * 0.7 - 1e-9);
});

test('gas drifts across lanes unless meme drop is active', () => {
  const s = new Spawner(() => 0.95);
  s.items.push({ cat: 'obstacle', kind: 'gas', label: 'tear gas', lane: 1, z: 50, dead: false, drift: 1.5 });
  s.cooldown = 1e9;
  s.update(0.1, 0, stage, 0, true);
  assert.equal(s.items[0].lane, 1);
  s.update(0.1, 0, stage, 0, false);
  assert.ok(s.items[0].lane > 1);
});
