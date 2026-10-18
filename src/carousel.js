// Character roster and the swipe-carousel selector state (pure logic, no rendering).
export const ROSTER = [
  { id: 'cockroach', name: 'Cockroach', icon: '🪳' },
  { id: 'spiderman', name: 'Spider-Hero', icon: '🕷️' },
  { id: 'luffy', name: 'Straw Hat Kid', icon: '👒' },
];

export function normalizeCharacter(id) {
  return ROSTER.some((c) => c.id === id) ? id : ROSTER[0].id;
}

const wrapDelta = (d) => {
  const n = ROSTER.length;
  return ((((d + n / 2) % n) + n) % n) - n / 2;
};

export class Carousel {
  constructor(id) {
    this.index = Math.max(0, ROSTER.findIndex((c) => c.id === normalizeCharacter(id)));
    this.pos = this.index; // animated position, chases `index` the short way round
  }

  get character() { return ROSTER[this.index]; }

  // Signed distance still to travel (how far the view lags behind the selection).
  get lag() { return wrapDelta(this.pos - this.index); }

  step(dir) {
    const n = ROSTER.length;
    this.index = (((this.index + dir) % n) + n) % n;
  }

  select(i) {
    this.index = ((i % ROSTER.length) + ROSTER.length) % ROSTER.length;
  }

  update(dt) {
    const lag = this.lag;
    this.pos = this.index + lag * (1 - Math.min(1, dt * 10));
  }
}

// Card strip geometry shared by the HUD (drawing) and the tap hit-test.
export function carouselLayout(w, h) {
  const cw = Math.max(80, Math.min(w * 0.3, 130));
  const ch = cw * 1.05;
  return { cw, ch, gap: cw * 1.12, cx: w / 2, cy: h - ch / 2 - 30 };
}

// Screen x and scale for card i given the animated position.
export function cardPlace(layout, car, i) {
  const rel = wrapDelta(i - car.pos);
  return { x: layout.cx + rel * layout.gap, scale: 1 - Math.min(1, Math.abs(rel)) * 0.28, rel };
}

// Index of the card under (x, y), or -1.
export function cardAt(x, y, layout, car) {
  for (let i = 0; i < ROSTER.length; i++) {
    const p = cardPlace(layout, car, i);
    const hw = (layout.cw * p.scale) / 2;
    const hh = (layout.ch * p.scale) / 2;
    if (Math.abs(x - p.x) <= hw && Math.abs(y - layout.cy) <= hh) return i;
  }
  return -1;
}
