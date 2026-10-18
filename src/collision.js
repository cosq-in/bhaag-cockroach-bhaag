export const HIT_DEPTH = 1.2;
const CLEAR_Y = { low: 0.8, block: 1.9, gas: 1.0, crowd: 1.9 };

const sameLane = (a, b) => Math.abs(a - b) < 0.5;
const inDepth = (z) => Math.abs(z) < HIT_DEPTH;

// Point obstacles only. Buses and ramps are surfaces, handled via platforms.js.
export function hitsObstacle(player, item) {
  if (item.cat !== 'obstacle' || item.dead || item.len) return false;
  if (!inDepth(item.z) || !sameLane(player.lane, item.lane)) return false;
  if (item.kind === 'high') return !player.sliding && player.y < 1.9;
  return player.y < CLEAR_Y[item.kind];
}

export function collectsPickup(player, item) {
  return item.cat === 'pickup' && !item.dead && inDepth(item.z)
    && sameLane(player.lane, item.lane)
    && Math.abs(player.y + 0.9 - (item.y ?? 0.9)) < 1.0;
}
