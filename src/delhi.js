import * as THREE from 'three';
import { mat, canvasTex } from './models.js';

// Procedural Delhi / Jantar Mantar set dressing. Origin sits on the ground.
const RED = '#b8502a';
const RED2 = '#cf6a3d';
const WHITE = '#f1e8d4';
const dbl = (c) => mat(c, { side: THREE.DoubleSide });
const box = (w, h, d, m, x = 0, y = 0, z = 0) => {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.position.set(x, y, z);
  return o;
};
const cyl = (rt, rb, h, m, x = 0, y = 0, z = 0, seg = 10) => {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  o.position.set(x, y, z);
  return o;
};
const texPlane = (w, h, tex, fallback) => new THREE.Mesh(new THREE.PlaneGeometry(w, h),
  tex ? new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }) : mat(fallback, { side: THREE.DoubleSide }));

export function makeWall(len) {
  const g = new THREE.Group();
  g.add(box(0.6, 1.1, len, mat(RED), 0, 0.55, 0));
  g.add(box(0.72, 0.16, len, mat(WHITE), 0, 1.18, 0));
  for (let z = -len / 2 + 1; z < len / 2; z += 2) g.add(box(0.5, 0.35, 0.6, mat(WHITE), 0, 1.45, z));
  return g;
}

export function makeTree(pick) {
  const g = new THREE.Group();
  g.add(cyl(0.22, 0.32, 2.6, mat('#5b3a22'), 0, 1.3, 0, 7));
  const colors = ['#2f7d32', '#3f8f3a', '#e0561d'];
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(1.2 + (i % 2) * 0.3, 8, 6), mat(colors[Math.floor(pick(i) * colors.length)]));
    s.position.set((pick(i + 9) - 0.5) * 1.6, 3.3 + (i % 2) * 0.7, (pick(i + 5) - 0.5) * 1.4);
    g.add(s);
  }
  return g;
}

export function makeLamp() {
  const g = new THREE.Group();
  g.add(cyl(0.07, 0.1, 4.6, mat('#2d2d33'), 0, 2.3, 0, 6));
  g.add(box(0.9, 0.08, 0.08, mat('#2d2d33'), -0.4, 4.6, 0));
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd27a' }));
  bulb.position.set(-0.8, 4.5, 0);
  g.add(bulb);
  return g;
}

export function makeSign() {
  const g = new THREE.Group();
  const tex = canvasTex(256, 96, (c, w, h) => {
    c.fillStyle = '#1c4fa0'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#fff'; c.lineWidth = 5; c.strokeRect(5, 5, w - 10, h - 10);
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = 'bold 34px sans-serif'; c.fillText('SANSAD MARG', w / 2, 34);
    c.font = 'bold 22px sans-serif'; c.fillText('JANTAR MANTAR  →', w / 2, 68);
  });
  g.add(texPlane(2.6, 1.0, tex, '#1c4fa0')).children[0].position.y = 3.0;
  g.add(cyl(0.06, 0.06, 3.0, mat('#555'), -1.1, 1.5, 0, 6), cyl(0.06, 0.06, 3.0, mat('#555'), 1.1, 1.5, 0, 6));
  return g;
}

export function makeTent() {
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-1.7, 0); shape.lineTo(1.7, 0); shape.lineTo(0, 2.0); shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 3.4, bevelEnabled: false });
  geo.translate(0, 0, -1.7);
  g.add(new THREE.Mesh(geo, mat('#2a6fdb')));
  g.add(box(0.12, 1.0, 3.5, mat(WHITE), 0, 1.1, 0).rotateZ(0.0));
  return g;
}

export function makeChai() {
  const g = new THREE.Group();
  g.add(box(2.2, 1.1, 1.4, mat(RED2), 0, 0.55, 0));
  g.add(box(2.4, 0.12, 1.8, mat('#f4d35e'), 0, 2.1, 0));
  for (const x of [-1.1, 1.1]) g.add(cyl(0.05, 0.05, 2.1, mat('#444'), x, 1.05, 0.7, 6));
  const tex = canvasTex(128, 48, (c, w, h) => {
    c.fillStyle = '#f7f3e8'; c.fillRect(0, 0, w, h); c.fillStyle = '#b8302a';
    c.font = 'bold 34px "Permanent Marker", Marker Felt, cursive'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('CHAI', w / 2, h / 2 + 2);
  });
  const s = texPlane(1.6, 0.6, tex, WHITE);
  s.position.set(0, 1.6, 0.75);
  g.add(s);
  return g;
}

export function makeSamrat() {
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(0, 0); shape.lineTo(14, 0); shape.lineTo(14, 12); shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 1.8, bevelEnabled: false });
  geo.translate(-7, 0, -0.9);
  g.add(new THREE.Mesh(geo, mat(RED)));
  const ang = Math.atan2(12, 14);
  for (let i = 0; i < 14; i++) {
    const s = box(1.1, 0.14, 1.9, mat(WHITE), -7 + i + 0.5, (12 * (i + 0.5)) / 14 + 0.08, 0);
    s.rotation.z = ang;
    g.add(s);
  }
  const q = new THREE.Shape();
  q.moveTo(0, 0); q.lineTo(7, 0); q.absarc(0, 0, 7, 0, Math.PI / 2, false); q.lineTo(0, 0);
  for (const z of [-1.9, 1.5]) {
    const qg = new THREE.ExtrudeGeometry(q, { depth: 0.8, bevelEnabled: false });
    const m = new THREE.Mesh(qg, mat(RED2));
    m.position.set(-4, 0, z);
    g.add(m);
  }
  g.add(box(14.4, 0.4, 2.2, mat(WHITE), 0, 0.2, 0));
  return g;
}

export function makeJaiPrakash() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 1.6, 24, 1, true), dbl(RED)));
  g.children[0].position.y = 0.8;
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(4.4, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), dbl(RED2));
  bowl.position.y = 1.5;
  g.add(bowl);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(4.6, 0.12, 6, 28), mat(WHITE));
  rim.rotation.x = Math.PI / 2; rim.position.y = 1.62;
  g.add(rim);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    g.add(box(0.9, 0.3, 1.4, mat(WHITE), Math.cos(a) * 5.2, 0.15, Math.sin(a) * 5.2));
  }
  return g;
}

export function makeRamYantra() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 5, 24, 1, true), dbl(RED)));
  g.children[0].position.y = 2.5;
  g.add(cyl(0.5, 0.5, 5, mat(WHITE), 0, 2.5, 0, 10));
  for (let i = 0; i < 8; i++) {
    const w = box(3.0, 3.2, 0.22, mat(i % 2 ? RED2 : WHITE), 0, 1.6, 0);
    w.position.set(Math.cos((i * Math.PI) / 4) * 2.0, 1.6, Math.sin((i * Math.PI) / 4) * 2.0);
    w.rotation.y = -(i * Math.PI) / 4;
    g.add(w);
  }
  g.add(new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.12, 6, 28), mat(WHITE)));
  g.children[g.children.length - 1].rotation.x = Math.PI / 2;
  g.children[g.children.length - 1].position.y = 5;
  return g;
}

export function makeRickshaw() {
  const g = new THREE.Group();
  g.add(box(1.3, 0.8, 2.0, mat('#2e8b4a'), 0, 0.7, 0));
  g.add(box(0.8, 0.7, 0.7, mat('#2e8b4a'), 0, 0.6, 1.25));
  g.add(box(1.4, 0.12, 1.8, mat('#f2c230'), 0, 1.75, -0.1));
  for (const x of [-0.62, 0.62]) {
    g.add(cyl(0.04, 0.04, 1.0, mat('#333'), x, 1.25, -0.9, 6), cyl(0.04, 0.04, 1.0, mat('#333'), x, 1.25, 0.6, 6));
  }
  g.add(box(1.2, 0.5, 0.05, mat('#9ad0e0'), 0, 1.35, 0.62));
  for (const [x, z] of [[-0.7, -0.7], [0.7, -0.7], [0, 1.35]]) {
    const w = cyl(0.3, 0.3, 0.18, mat('#1b1b1f'), x, 0.3, z, 12);
    w.rotation.z = Math.PI / 2;
    g.add(w);
  }
  g.scale.setScalar(1.25);
  return g;
}
