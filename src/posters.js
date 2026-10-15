import * as THREE from 'three';

// Meme posters listed in assets/posters/manifest.json by role:
//   banner  - hung on a rope between two poles across the road
//   road    - printed flat on the road surface
//   standee - cut-out board standing in a lane as an obstacle
//   building - pasted on building facades
const roles = { banner: [], road: [], standee: [], building: [] };
export const posters = { roles, count: () => roles.banner.length + roles.road.length + roles.standee.length };

export async function loadPosters() {
  try {
    const manifest = await (await fetch('assets/posters/manifest.json')).json();
    const loader = new THREE.TextureLoader();
    for (const [role, files] of Object.entries(manifest)) {
      if (!roles[role]) continue;
      for (const f of files) {
        loader.load(`assets/posters/${f}`, (t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = 4;
          const aspect = t.image.width / t.image.height;
          roles[role].push({
            aspect,
            mat: new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, transparent: true, alphaTest: 0.05 }),
          });
        }, undefined, () => {});
      }
    }
  } catch { /* no posters */ }
}

export function pickPoster(role, n) {
  const list = roles[role];
  return list.length ? list[Math.floor(n * list.length) % list.length] : null;
}
