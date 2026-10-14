export const KINDS = ['meme', 'wifi', 'shield'];
const DURATION = { meme: 4, shield: 5 };
const WITNESS_GAIN = 25;

export class PowerUps {
  constructor(rng = Math.random) {
    this.rng = rng;
    this.reset();
  }

  reset() {
    this.meter = 0;
    this.banked = null;
    this.memeT = 0;
    this.shieldT = 0;
  }

  get memeActive() { return this.memeT > 0; }
  get shieldActive() { return this.shieldT > 0; }

  addWitness() {
    this.meter = Math.min(100, this.meter + WITNESS_GAIN);
    this.#bank();
  }

  #bank() {
    if (this.meter >= 100 && !this.banked) {
      this.banked = KINDS[Math.floor(this.rng() * KINDS.length)];
      this.meter = 0;
    }
  }

  use() {
    const kind = this.banked;
    if (kind === 'meme') this.memeT = DURATION.meme;
    else if (kind === 'shield') this.shieldT = DURATION.shield;
    else return null;
    this.banked = null;
    return kind;
  }

  consumeRevive() {
    if (this.banked !== 'wifi') return false;
    this.banked = null;
    return true;
  }

  update(dt) {
    this.memeT = Math.max(0, this.memeT - dt);
    this.shieldT = Math.max(0, this.shieldT - dt);
    this.#bank();
  }
}
