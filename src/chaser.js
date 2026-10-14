export const MAX_GAP = 8;
export const CLOSE_GAP = 5;
const CLOSE_TO = 3;
const RECOVER = 0.25;

export class Chaser {
  constructor() { this.gap = MAX_GAP; }
  get close() { return this.gap <= CLOSE_GAP; }

  stumble() {
    if (this.close) return 'caught';
    this.gap = CLOSE_TO;
    return 'closing';
  }

  push(n) { this.gap = Math.min(MAX_GAP, this.gap + n); }
  update(dt) { this.push(RECOVER * dt); }
  reset() { this.gap = MAX_GAP; }
}
