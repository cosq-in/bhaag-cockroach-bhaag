export const GRAVITY = 24;
export const JUMP_V = 9;
export const FAST_FALL = 16;
export const SLIDE_TIME = 0.6;
export const STUMBLE_GRACE = 1.0;

export class Player {
  constructor() { this.reset(); }

  reset() {
    this.lane = 1;
    this.visualLane = 1;
    this.y = 0;
    this.vy = 0;
    this.support = 0;
    this.slideT = 0;
    this.graceT = 0;
  }

  get grounded() { return this.y <= this.support + 0.02 && this.vy <= 0; }
  get airborne() { return !this.grounded; }
  get sliding() { return this.slideT > 0; }

  moveLeft() { this.lane = Math.max(0, this.lane - 1); }
  moveRight() { this.lane = Math.min(2, this.lane + 1); }

  jump() {
    if (this.grounded) { this.vy = JUMP_V; this.slideT = 0; }
  }

  slide() {
    if (this.grounded) { if (this.slideT <= 0) this.slideT = SLIDE_TIME; }
    else { this.vy = -FAST_FALL; this.slideT = SLIDE_TIME; }
  }

  stumble() { this.graceT = STUMBLE_GRACE; }

  update(dt, support = 0) {
    this.support = support;
    this.slideT = Math.max(0, this.slideT - dt);
    this.graceT = Math.max(0, this.graceT - dt);
    this.vy -= GRAVITY * dt;
    this.y += this.vy * dt;
    if (this.y <= support && this.vy <= 0) { this.y = support; this.vy = 0; }
    this.visualLane += (this.lane - this.visualLane) * Math.min(1, dt * 14);
  }
}
