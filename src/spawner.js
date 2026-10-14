export const Z_FAR = 120;
export const BUS_LEN = 12;
export const RAMP_LEN = 6;

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

export class Spawner {
  constructor(rng = Math.random) {
    this.rng = rng;
    this.reset();
  }

  reset() {
    this.items = [];
    this.cooldown = 0;
    this.lastOpen = undefined;
  }

  update(dt, speed, stage, difficulty, memeActive) {
    const dz = speed * dt;
    for (const it of this.items) {
      it.z -= dz;
      if (it.drift && !memeActive) {
        it.lane += it.drift * dt;
        if (it.lane < 0 || it.lane > 2) {
          it.drift = -it.drift;
          it.lane = Math.max(0, Math.min(2, it.lane));
        }
      }
    }
    this.items = this.items.filter((it) => it.z + (it.len ?? 0) > -6 && !it.dead);
    this.cooldown -= dz;
    if (this.cooldown <= 0) {
      const len = this.spawnPattern(stage, difficulty);
      const timeGap = Math.max(speed, 10) * Math.max(0.7, 1.3 - 0.6 * difficulty);
      this.cooldown = Math.max(timeGap, len + 6);
    }
  }

  #add(stage, cat, kind, lane, dz, extra = {}) {
    const label = cat === 'obstacle' ? pick(this.rng, stage.hazards[kind]) : kind;
    this.items.push({ cat, kind, label, lane, z: Z_FAR + dz, dead: false, ...extra });
  }

  #coins(stage, lane, n, startDz, ys) {
    for (let i = 0; i < n; i++) {
      const r = this.rng();
      const kind = i === 0 ? (r < 0.35 ? 'witness' : r < 0.45 ? 'chai' : 'petition') : 'petition';
      this.#add(stage, 'pickup', kind, lane, startDz + i * 3, ys ? { y: ys[i] } : {});
    }
  }

  #pickOpen() {
    const lanes = [0, 1, 2].filter((l) => this.lastOpen === undefined || Math.abs(l - this.lastOpen) <= 1);
    const open = pick(this.rng, lanes);
    this.lastOpen = open;
    return open;
  }

  // Returns the pattern length in world units.
  spawnPattern(stage, difficulty) {
    const lanes = [0, 1, 2];
    const r = this.rng();
    if (r >= 0.16 && r < 0.27) {
      for (const l of lanes) this.#add(stage, 'obstacle', 'low', l, 0);
      this.#coins(stage, 1, 3, 6);
      return 14;
    }
    if (r >= 0.27 && r < 0.38) {
      for (const l of lanes) this.#add(stage, 'obstacle', 'high', l, 0);
      this.#coins(stage, 1, 3, 6);
      return 14;
    }
    if (r >= 0.58 && r < 0.80) return this.#busRamp(stage);
    if (r >= 0.80 && r < 0.92) return this.#busOnly(stage);
    if (r >= 0.50 && r < 0.58 && difficulty > 0.2) {
      this.#add(stage, 'obstacle', 'gas', Math.floor(this.rng() * 3), 0,
        { drift: (this.rng() < 0.5 ? -1 : 1) * 1.5 });
      return 4;
    }
    if (r >= 0.92) {
      this.#coins(stage, this.#pickOpen(), 6, 0);
      return 18;
    }
    const open = this.#pickOpen();
    const others = lanes.filter((l) => l !== open);
    if (r < 0.16) {
      for (const l of others) this.#add(stage, 'obstacle', 'block', l, 0);
    } else {
      this.#add(stage, 'obstacle', 'block', others[0], 0);
      this.#add(stage, 'obstacle', this.rng() < 0.5 ? 'low' : 'high', others[1], 0);
    }
    this.#coins(stage, open, 4, 0);
    return 10;
  }

  #busRamp(stage) {
    const open = this.#pickOpen();
    const others = [0, 1, 2].filter((l) => l !== open);
    const busLane = pick(this.rng, others);
    const third = others.find((l) => l !== busLane);
    this.#add(stage, 'obstacle', 'ramp', busLane, 0, { len: RAMP_LEN });
    this.#add(stage, 'obstacle', 'bus', busLane, RAMP_LEN, { len: BUS_LEN });
    this.#coins(stage, busLane, 4, RAMP_LEN + 2, [2.9, 2.9, 2.9, 2.9]);
    if (this.rng() < 0.5) this.#add(stage, 'obstacle', 'low', third, RAMP_LEN);
    return RAMP_LEN + BUS_LEN;
  }

  #busOnly(stage) {
    const open = this.#pickOpen();
    const busLane = pick(this.rng, [0, 1, 2].filter((l) => l !== open));
    this.#add(stage, 'obstacle', 'bus', busLane, 0, { len: BUS_LEN });
    this.#coins(stage, open, 5, 0, [1.4, 2.4, 3.0, 2.4, 1.4]);
    return BUS_LEN + 2;
  }
}
