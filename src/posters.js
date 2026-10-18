import { asset } from './asset.js';
import * as THREE from 'three';
import { canvasTex } from './models.js';
import { loadUploadedPosters } from './poster-store.js';

// Meme posters listed in assets/posters/manifest.json by role:
//   banner  - hung on a rope between two poles across the road
//   road    - printed flat on the road surface
//   standee - cut-out board standing in a lane as an obstacle
//   building - pasted on building facades
const roles = { banner: [], road: [], standee: [], building: [] };
export const posters = { roles, count: () => roles.banner.length + roles.road.length + roles.standee.length };

// Generic, faceless slogan posters used until the player adds their own (see poster-store.js).
const STAND_IN = [
  { bg: ['#ff9933', '#ffd9a0'], icon: '✊', text: 'RESIGN KAR YAAR' },
  { bg: ['#2a6f97', '#a9d6e5'], icon: '📣', text: 'SAWAAL POOCHO' },
  { bg: ['#6a994e', '#d8f3dc'], icon: '🪳', text: 'JAI HO!' },
];

function drawStandIn(c, w, h, variant) {
  const { bg, icon, text } = STAND_IN[variant % STAND_IN.length];
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, bg[0]); g.addColorStop(1, bg[1]);
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  const s = Math.min(w, h);
  const wide = w > h * 1.4;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = `${s * 0.45}px sans-serif`;
  c.fillStyle = '#000';
  c.fillText(icon, wide ? w * 0.22 : w / 2, wide ? h / 2 : h * 0.4);
  c.font = `${s * 0.11}px "Permanent Marker","Marker Felt",cursive`;
  c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = s * 0.025;
  const tx = wide ? w * 0.64 : w / 2;
  const ty = wide ? h / 2 : h * 0.82;
  c.strokeText(text, tx, ty, wide ? w * 0.6 : w * 0.9);
  c.fillText(text, tx, ty, wide ? w * 0.6 : w * 0.9);
  c.strokeStyle = '#000'; c.lineWidth = s * 0.02; c.strokeRect(2, 2, w - 4, h - 4);
}

function standIns() {
  const shapes = { banner: [512, 256], road: [256, 256], standee: [256, 340], building: [256, 340] };
  for (const [role, [pw, ph]] of Object.entries(shapes)) {
    for (let v = 0; v < 3; v++) {
      const t = canvasTex(pw, ph, (c, w, h) => drawStandIn(c, w, h, v));
      if (t) roles[role].push({ aspect: pw / ph, mat: new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, transparent: true, alphaTest: 0.05 }) });
    }
  }
}

// Posters the player picked on this device replace everything else, in every role.
async function loadUploaded() {
  const blobs = await loadUploadedPosters();
  if (!blobs.length) return 0;
  const loader = new THREE.TextureLoader();
  for (const blob of blobs) {
    const url = URL.createObjectURL(blob);
    loader.load(url, (t) => {
      URL.revokeObjectURL(url);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      const entry = {
        aspect: t.image.width / t.image.height,
        mat: new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, transparent: true, alphaTest: 0.05 }),
      };
      for (const role of Object.keys(roles)) roles[role].push(entry);
    }, undefined, () => URL.revokeObjectURL(url));
  }
  return blobs.length;
}

export async function loadPosters() {
  if (await loadUploaded()) return;
  let listed = 0;
  try {
    const manifest = await (await fetch(asset('assets/posters/manifest.json'))).json();
    const loader = new THREE.TextureLoader();
    for (const [role, files] of Object.entries(manifest)) {
      if (!roles[role]) continue;
      for (const f of files) {
        listed++;
        loader.load(asset(`assets/posters/${f}`), (t) => {
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
  if (!listed) standIns();
}

export function pickPoster(role, n) {
  const list = roles[role];
  return list.length ? list[Math.floor(n * list.length) % list.length] : null;
}
