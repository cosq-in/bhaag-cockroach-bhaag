export const ROOF = 2;

// Height of the walkable surface at (lane, z). Buses give a flat roof, ramps a slope.
export function heightAt(items, lane, z = 0) {
  let h = 0;
  for (const it of items) {
    if (it.dead || it.ghost || !it.len) continue;
    if (Math.abs(it.lane - lane) >= 0.5) continue;
    if (z < it.z || z > it.z + it.len) continue;
    const top = it.kind === 'ramp' ? (ROOF * (z - it.z)) / it.len : ROOF;
    if (top > h) h = top;
  }
  return h;
}
