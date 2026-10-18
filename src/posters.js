import * as THREE from 'three';
import { canvasTex } from './models.js';

// Meme posters listed in assets/posters/manifest.json by role:
//   banner  - hung on a rope between two poles across the road
//   road    - printed flat on the road surface
//   standee - cut-out board standing in a lane as an obstacle
//   building - pasted on building facades
const roles = { banner: [], road: [], standee: [], building: [] };
export const posters = { roles, count: () => roles.banner.length + roles.road.length + roles.standee.length };

// Flat cartoon caricature (white beard, round glasses, saffron kurta) used when no poster files are supplied.
function drawStandIn(c, w, h, variant) {
  const bg = [['#ff9933', '#ffd9a0'], ['#2a6f97', '#a9d6e5'], ['#6a994e', '#d8f3dc']][variant % 3];
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, bg[0]); g.addColorStop(1, bg[1]);
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  const s = Math.min(w, h);
  const fx = w > h * 1.4 ? w * 0.28 : w / 2;
  const fy = h * 0.5;
  c.fillStyle = '#f4a259'; // kurta
  c.beginPath(); c.moveTo(fx - s * 0.42, h); c.quadraticCurveTo(fx - s * 0.3, fy + s * 0.2, fx, fy + s * 0.2);
  c.quadraticCurveTo(fx + s * 0.3, fy + s * 0.2, fx + s * 0.42, h); c.fill();
  c.fillStyle = '#e07a1f'; c.fillRect(fx - 3, fy + s * 0.2, 6, h);
  c.fillStyle = '#e0ac84'; // face
  c.beginPath(); c.ellipse(fx, fy, s * 0.2, s * 0.24, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#f5f5f5'; // hair and beard
  c.beginPath(); c.ellipse(fx, fy - s * 0.2, s * 0.21, s * 0.1, 0, Math.PI, Math.PI * 2); c.fill();
  c.beginPath(); c.moveTo(fx - s * 0.2, fy + s * 0.02); c.quadraticCurveTo(fx, fy + s * 0.46, fx + s * 0.2, fy + s * 0.02);
  c.quadraticCurveTo(fx, fy + s * 0.1, fx - s * 0.2, fy + s * 0.02); c.fill();
  c.strokeStyle = '#222'; c.lineWidth = Math.max(2, s * 0.012); // glasses
  for (const d of [-1, 1]) { c.beginPath(); c.arc(fx + d * s * 0.09, fy - s * 0.04, s * 0.055, 0, Math.PI * 2); c.stroke(); }
  c.beginPath(); c.moveTo(fx - s * 0.035, fy - s * 0.04); c.lineTo(fx + s * 0.035, fy - s * 0.04); c.stroke();
  c.fillStyle = '#222'; c.fillRect(fx - s * 0.1, fy + s * 0.08, s * 0.2, s * 0.012); // mouth line
  const slogans = ['RESIGN KAR YAAR', 'WAH WAH!', 'JAI HO (SATIRE)'];
  c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = s * 0.02;
  c.font = `${s * 0.1}px "Permanent Marker","Marker Felt",cursive`; c.textAlign = 'center';
  const tx = w > h * 1.4 ? w * 0.68 : w / 2;
  const ty = w > h * 1.4 ? h * 0.55 : h * 0.1;
  c.strokeText(slogans[variant % 3], tx, ty); c.fillText(slogans[variant % 3], tx, ty);
  c.strokeStyle = '#000'; c.lineWidth = s * 0.015; c.strokeRect(2, 2, w - 4, h - 4);
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

export async function loadPosters() {
  let listed = 0;
  try {
    const manifest = await (await fetch('assets/posters/manifest.json')).json();
    const loader = new THREE.TextureLoader();
    for (const [role, files] of Object.entries(manifest)) {
      if (!roles[role]) continue;
      for (const f of files) {
        listed++;
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
  if (!listed) standIns();
}

export function pickPoster(role, n) {
  const list = roles[role];
  return list.length ? list[Math.floor(n * list.length) % list.length] : null;
}
