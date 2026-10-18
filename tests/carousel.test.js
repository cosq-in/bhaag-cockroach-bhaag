import test from 'node:test';
import assert from 'node:assert/strict';
import { Carousel, ROSTER, normalizeCharacter, carouselLayout, cardAt, cardPlace } from '../src/carousel.js';

test('unknown saved ids fall back to the cockroach', () => {
  assert.equal(normalizeCharacter('batman'), 'cockroach');
  assert.equal(normalizeCharacter('luffy'), 'luffy');
  assert.equal(new Carousel('nope').character.id, 'cockroach');
});

test('step wraps around both ways', () => {
  const c = new Carousel('cockroach');
  c.step(-1);
  assert.equal(c.character.id, ROSTER[ROSTER.length - 1].id);
  c.step(1);
  assert.equal(c.character.id, 'cockroach');
});

test('wrapping from the last card to the first travels one slot, not a full lap', () => {
  const c = new Carousel('luffy');
  c.step(1);
  assert.equal(c.character.id, 'cockroach');
  assert.ok(Math.abs(c.lag) <= 1.0001);
  for (let i = 0; i < 120; i++) c.update(1 / 60);
  assert.ok(Math.abs(c.lag) < 1e-3);
});

test('settled selection is centred and hit-testable', () => {
  const c = new Carousel('spiderman');
  const lay = carouselLayout(400, 700);
  const p = cardPlace(lay, c, 1);
  assert.equal(p.x, lay.cx);
  assert.equal(cardAt(p.x, lay.cy, lay, c), 1);
  assert.equal(cardAt(5, 5, lay, c), -1);
  const left = cardPlace(lay, c, 0);
  assert.ok(left.x < lay.cx);
  assert.equal(cardAt(left.x, lay.cy, lay, c), 0);
});
