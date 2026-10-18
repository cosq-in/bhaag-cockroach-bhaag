// Character roster and the rotary-dial selector state (pure logic, no rendering).
export const ROSTER = [
  { id: 'cockroach', name: 'Cockroach', icon: '🪳' },
  { id: 'spiderman', name: 'Spider-Hero', icon: '🕷️' },
  { id: 'luffy', name: 'Straw Hat Kid', icon: '👒' },
];
const TAU = Math.PI * 2;
const STEP = TAU / ROSTER.length;

export function normalizeCharacter(id) {
  return ROSTER.some((c) => c.id === id) ? id : ROSTER[0].id;
}

export class Dial {
  constructor(id) {
    this.index = Math.max(0, ROSTER.findIndex((c) => c.id === normalizeCharacter(id)));
    this.target = -this.index * STEP;
    this.angle = this.target;
  }

  get character() { return ROSTER[this.index]; }

  // Turn the dial one slot (dir = +1 or -1), wrapping around.
  step(dir) {
    const n = ROSTER.length;
    this.index = (((this.index + dir) % n) + n) % n;
    this.target -= dir * STEP;
  }

  // Pick a slot by index, turning the shorter way round.
  select(i) {
    const n = ROSTER.length;
    const delta = ((((i - this.index + 1) % n) + n) % n) - 1;
    if (delta) this.step(delta);
  }

  update(dt) {
    this.angle += (this.target - this.angle) * Math.min(1, dt * 9);
  }
}

// Geometry shared by the HUD (drawing) and the tap hit-test.
export function dialLayout(w, h) {
  const r = Math.max(60, Math.min(w * 0.3, h * 0.17));
  return { cx: w / 2, cy: h - r - 28, r, holeR: r * 0.24, ringR: r * 0.66 };
}

export function holePos(layout, dial, i) {
  const a = -Math.PI / 2 + i * STEP + dial.angle;
  return { x: layout.cx + Math.cos(a) * layout.ringR, y: layout.cy + Math.sin(a) * layout.ringR };
}

// Index of the hole under (x, y), or -1.
export function holeAt(x, y, layout, dial) {
  for (let i = 0; i < ROSTER.length; i++) {
    const p = holePos(layout, dial, i);
    if (Math.hypot(x - p.x, y - p.y) <= layout.holeR * 1.15) return i;
  }
  return -1;
}
