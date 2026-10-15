import * as THREE from 'three';
import { cloneFit } from './kit.js';
import { makeRickshaw } from './delhi.js';

const mats = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!mats.has(key)) mats.set(key, new THREE.MeshLambertMaterial({ color, ...opts }));
  return mats.get(key);
}

// Canvas-drawn texture; null in Node (no document) so factories stay testable headless.
export function canvasTex(w, h, draw) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const texMat = (tex, color = '#ffffff') => (tex ? new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }) : mat(color));
const box = (w, h, d, m, x = 0, y = 0, z = 0) => {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.position.set(x, y, z);
  return o;
};

export function makeHero() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 14, 10), mat('#a0561f'));
  body.scale.set(1, 0.6, 1.5); body.position.y = 0.45;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), mat('#6e3812'));
  head.position.set(0, 0.5, -0.55);
  g.add(body, head);
  for (const s of [-1, 1]) {
    const a = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.7), mat('#4a230a'));
    a.position.set(0.12 * s, 0.85, -0.85); a.rotation.set(-0.9, 0, 0.35 * s);
    g.add(a);
  }
  const legs = [];
  for (const s of [-1, 1]) {
    for (const z of [-0.3, 0, 0.3]) {
      const pivot = new THREE.Group();
      pivot.position.set(0.32 * s, 0.4, z);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.5), mat('#4a230a'));
      leg.position.set(0.22 * s, -0.12, 0); leg.rotation.z = (Math.PI / 2.6) * s;
      pivot.add(leg); g.add(pivot);
      legs.push({ pivot, phase: (z + 1) * 2 + (s > 0 ? Math.PI : 0) });
    }
  }
  const cape = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.5), mat('#e74c3c', { side: THREE.DoubleSide }));
  cape.position.set(0, 0.85, 0.3); cape.rotation.x = -0.95;
  g.add(cape);
  g.scale.setScalar(1.5);
  return {
    group: g,
    update(t, { sliding, airborne }) {
      for (const l of legs) l.pivot.rotation.x = airborne ? 0.5 : Math.sin(t * 22 + l.phase) * 0.9;
      cape.rotation.x = -0.95 + Math.sin(t * 14) * 0.2;
      g.scale.y = sliding ? 0.8 : 1.5;
    },
  };
}

export function makeInspector() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.7, 4, 8), mat('#a89968'));
  body.position.y = 0.95;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), mat('#d9a47a'));
  head.position.y = 1.7;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.27, 0.16, 10), mat('#2f4f6f'));
  cap.position.y = 1.92;
  const lathi = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.1, 0.09), mat('#6b3d1a'));
  const arm = new THREE.Group();
  arm.position.set(0.4, 1.3, 0);
  lathi.position.y = 0.5;
  arm.add(lathi);
  const legL = box(0.2, 0.7, 0.22, mat('#3b4a5e'), -0.14, 0.35, 0);
  const legR = box(0.2, 0.7, 0.22, mat('#3b4a5e'), 0.14, 0.35, 0);
  g.add(body, head, cap, arm, legL, legR);
  g.scale.setScalar(1.2);
  return {
    group: g,
    update(t) {
      g.position.y = Math.abs(Math.sin(t * 12)) * 0.18;
      arm.rotation.x = -1.2 + Math.sin(t * 12) * 0.5;
      legL.rotation.x = Math.sin(t * 12) * 0.7;
      legR.rotation.x = -Math.sin(t * 12) * 0.7;
    },
  };
}

function wedge(len, height, width) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0); shape.lineTo(len, 0); shape.lineTo(len, height); shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false });
  geo.rotateY(Math.PI / 2);
  geo.translate(-width / 2, 0, 0);
  return geo;
}

// Origin of long items is the near end (z = item.z); they extend toward -z in the scene.
export function makeBus(label, len) {
  const g = new THREE.Group();
  const metro = label === 'metro';
  const bodyC = metro ? '#d8453d' : '#2e9e5b';
  g.add(box(2.5, 2.0, len, mat(bodyC), 0, 1, -len / 2));
  g.add(box(2.52, 0.28, len + 0.02, mat('#f4f1e8'), 0, 0.55, -len / 2));
  g.add(box(2.52, 0.62, len - 1.4, mat('#27384d'), 0, 1.45, -len / 2));
  g.add(box(2.4, 0.08, len, mat('#c9c9c9'), 0, 2.02, -len / 2));
  return g;
}
export function makeRamp(len) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(wedge(len, 2, 2.4), mat('#8a8f98')));
  const stripe = new THREE.Mesh(wedge(len, 2, 0.35), mat('#f4d35e'));
  stripe.position.set(0, 0.02, 0);
  g.add(stripe);
  return g;
}

export function makeObstacle(it) {
  const g = new THREE.Group();
  const { kind, label } = it;
  if (label === 'auto') return makeRickshaw();
  if (kind === 'block' && label !== 'SIR form') {
    const name = label === 'water cannon' ? 'car/firetruck' : Math.random() < 0.65 ? 'car/police' : 'car/van';
    const m = cloneFit(name, { width: 2.3 });
    if (m) { m.rotation.y = Math.PI; return m; }
  }
  if (kind === 'low') {
    if (label === 'rubble') {
      for (let i = 0; i < 6; i++) {
        const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3 + (i % 3) * 0.08), mat('#77736b'));
        r.position.set(-0.7 + i * 0.28, 0.25 + (i % 2) * 0.15, (i % 3) * 0.1);
        g.add(r);
      }
    } else if (label === 'metro gate') {
      g.add(box(2.0, 0.9, 0.2, mat('#e0b020'), 0, 0.45, 0));
    } else {
      const tex = canvasTex(64, 32, (c, w, h) => {
        for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#fff' : '#d33'; c.fillRect(i * 8, 0, 8, h); }
      });
      g.add(box(2.0, 0.8, 0.45, texMat(tex, '#d33'), 0, 0.5, 0));
      g.add(box(0.12, 0.5, 0.12, mat('#444'), -0.8, 0.25, 0), box(0.12, 0.5, 0.12, mat('#444'), 0.8, 0.25, 0));
    }
  } else if (kind === 'high') {
    const tex = canvasTex(256, 64, (c, w, h) => {
      c.fillStyle = '#c0392b'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#fff'; c.font = '34px "Permanent Marker", Marker Felt, cursive';
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ORDER ORDER', w / 2, h / 2 + 2);
    });
    g.add(box(2.3, 0.75, 0.06, texMat(tex, '#c0392b'), 0, 1.9, 0));
    g.add(box(0.1, 2.3, 0.1, mat('#5b4636'), -1.15, 1.15, 0), box(0.1, 2.3, 0.1, mat('#5b4636'), 1.15, 1.15, 0));
  } else if (kind === 'gas') {
    const s = new THREE.Mesh(new THREE.SphereGeometry(1.0, 12, 10),
      new THREE.MeshLambertMaterial({ color: '#b9c4a8', transparent: true, opacity: 0.6 }));
    s.position.y = 0.9;
    g.add(s);
  } else if (label === 'water cannon') {
    g.add(box(2.1, 1.5, 4, mat('#b03a2e'), 0, 0.95, 0));
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.4), mat('#8a8f98'));
    c.rotation.x = Math.PI / 2.4; c.position.set(0, 2.0, -0.4);
    g.add(c);
  } else if (label === 'SIR form') {
    const tex = canvasTex(128, 128, (c, w, h) => {
      c.fillStyle = '#f7f3e8'; c.fillRect(0, 0, w, h); c.fillStyle = '#222';
      c.font = '30px "Permanent Marker", Marker Felt, cursive'; c.textAlign = 'center';
      c.fillText('SIR', w / 2, 40); c.fillText('FORM', w / 2, 76);
      for (let i = 0; i < 3; i++) c.fillRect(20, 92 + i * 10, w - 40, 3);
    });
    g.add(box(2.2, 2.3, 0.3, texMat(tex, '#f7f3e8'), 0, 1.15, 0));
  } else {
    g.add(box(2.0, 1.4, 3.2, mat('#eef1f4'), 0, 0.9, 0));
    g.add(box(2.0, 0.9, 1.1, mat('#2f6fb0'), 0, 0.75, -1.5));
    g.add(box(1.6, 0.35, 0.05, mat('#27384d'), 0, 1.15, -2.05));
  }
  return g;
}

export function makePickup(kind) {
  const g = new THREE.Group();
  if (kind === 'witness') {
    g.add(box(0.38, 0.65, 0.07, mat('#1c2530')));
    g.add(box(0.3, 0.52, 0.075, new THREE.MeshBasicMaterial({ color: '#4fc3f7' })));
  } else if (kind === 'chai') {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.36, 10), mat('#a0522d'));
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.04, 10), mat('#f1e3c8'));
    top.position.y = 0.19;
    g.add(cup, top);
  } else {
    const scroll = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.5, 10), mat('#f6ecd0'));
    scroll.rotation.z = Math.PI / 2;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.08, 10), mat('#e74c3c'));
    band.rotation.z = Math.PI / 2;
    g.add(scroll, band);
  }
  return g;
}
