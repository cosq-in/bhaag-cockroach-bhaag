import test from 'node:test';
import assert from 'node:assert/strict';
import { fitSize, acceptable, MAX_SIDE } from '../src/poster-store.js';

test('fitSize shrinks the long side to the cap and never upscales', () => {
  assert.deepEqual(fitSize(2048, 1024), { w: MAX_SIDE, h: MAX_SIDE / 2 });
  assert.deepEqual(fitSize(100, 300), { w: 100, h: 300 });
  assert.deepEqual(fitSize(1, 4000), { w: 1, h: MAX_SIDE });
});

test('only raster images under the size cap are accepted (no SVG)', () => {
  assert.ok(acceptable({ type: 'image/png', size: 1000 }));
  assert.ok(!acceptable({ type: 'image/svg+xml', size: 1000 }));
  assert.ok(!acceptable({ type: 'text/html', size: 10 }));
  assert.ok(!acceptable({ type: 'image/jpeg', size: 11 * 1024 * 1024 }));
});
