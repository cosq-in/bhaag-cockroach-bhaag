import * as THREE from 'three';

// Playable heroes built on the CC0 Kenney mini-character rig, costumed in code (like the cop).
const lam = (color) => new THREE.MeshLambertMaterial({ color });
const box = (w, h, d, color, x, y, z) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lam(color));
  m.position.set(x, y, z);
  return m;
};
const cyl = (rt, rb, h, color, x, y, z, seg = 12) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), lam(color));
  m.position.set(x, y, z);
  return m;
};

const COSTUMES = {
  spiderman(o) {
    if (o.name === 'body-mesh') o.material = lam('#d62828');
    if (o.name === 'head-mesh') o.material = lam('#d62828');
    if (o.name === 'head') {
      for (const s of [-1, 1]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), lam('#f5f5f5'));
        eye.scale.set(1.3, 0.8, 0.35);
        eye.position.set(s * 0.1, 0.03, 0.235);
        eye.rotation.z = -s * 0.35;
        o.add(eye);
      }
      o.add(box(0.02, 0.5, 0.02, '#3a0a0a', 0, 0.02, 0.245));
      o.add(box(0.5, 0.02, 0.02, '#3a0a0a', 0, 0.02, 0.245));
    }
    if (o.name === 'leg-left' || o.name === 'leg-right') o.add(cyl(0.085, 0.075, 0.28, '#1d3a8a', 0, -0.1, 0));
    if (o.name === 'torso') o.add(box(0.1, 0.12, 0.02, '#111111', 0, 0.12, 0.17));
  },
  luffy(o) {
    const skin = '#e2aa7c';
    if (o.name === 'body-mesh') o.material = lam('#c1121f');
    if (o.name === 'head-mesh') { o.material = o.material.clone(); o.material.color.set(skin); }
    if (o.name === 'head') {
      o.add(cyl(0.42, 0.42, 0.025, '#e9c46a', 0, 0.3, 0.02, 20));
      o.add(cyl(0.22, 0.25, 0.2, '#e9c46a', 0, 0.4, 0.02, 16));
      o.add(cyl(0.255, 0.255, 0.05, '#c1121f', 0, 0.33, 0.02, 16));
      o.add(box(0.1, 0.012, 0.01, '#2b1b0e', -0.1, -0.06, 0.24));
      o.add(box(0.012, 0.1, 0.01, '#2b1b0e', -0.1, -0.06, 0.241));
      o.add(box(0.14, 0.012, 0.01, '#2b1b0e', 0, -0.13, 0.235));
    }
    if (o.name === 'arm-left' || o.name === 'arm-right') o.add(cyl(0.075, 0.07, 0.3, skin, 0, -0.12, 0));
    if (o.name === 'leg-left' || o.name === 'leg-right') {
      o.add(cyl(0.09, 0.085, 0.22, '#1d4e89', 0, -0.07, 0));
      o.add(cyl(0.075, 0.075, 0.1, '#6b4423', 0, -0.26, 0.01));
    }
  },
};

// Returns { root, mixer } for a loaded mini-character glTF, or null when the id has no costume.
export function buildMiniHero(id, gltf) {
  const dress = COSTUMES[id];
  if (!dress || !gltf) return null;
  const model = gltf.scene;
  model.traverse(dress);
  const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
  model.scale.setScalar(1.75 / size.y);
  const b = new THREE.Box3().setFromObject(model);
  model.position.set(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2);
  model.rotation.y = Math.PI;
  const root = new THREE.Group();
  root.add(model);
  const mixer = new THREE.AnimationMixer(model);
  const find = (n) => gltf.animations.find((a) => a.name === n);
  return { root, mixer, actions: makeActions(mixer, find('sprint') ?? gltf.animations[0], find('emote-yes') ?? find('idle')) };
}

// Run and start-screen dance actions; setHeroMode() cross-fades between them.
export function makeActions(mixer, runClip, danceClip) {
  const run = runClip ? mixer.clipAction(runClip) : null;
  const dance = danceClip ? mixer.clipAction(danceClip) : null;
  return { run, dance, mode: null };
}

export function setHeroMode(hero, mode) {
  const a = hero.actions;
  if (!a || a.mode === mode) return;
  const next = (mode === 'dance' ? a.dance : a.run) ?? a.run ?? a.dance;
  const prev = a.mode === 'dance' ? a.dance : a.run;
  a.mode = mode;
  if (!next) return;
  next.reset().play();
  if (prev && prev !== next) next.crossFadeFrom(prev, 0.2, false);
}
