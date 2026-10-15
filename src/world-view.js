import * as THREE from 'three';
import { mat, canvasTex, makeBus, makeRamp, makeObstacle, makePickup } from './models.js';
import { kit, CITY, cloneFit } from './kit.js';
import { makeWall, makeTree, makeLamp, makeSign, makeTent, makeChai, makeSamrat, makeJaiPrakash, makeRamYantra } from './delhi.js';

export const LANE_W = 2;
export const laneX = (lane) => (lane - 1) * LANE_W;

function build(it) {
  if (it.kind === 'bus') return makeBus(it.label, it.len);
  if (it.kind === 'ramp') return makeRamp(it.len);
  if (it.cat === 'pickup') return makePickup(it.kind);
  return makeObstacle(it);
}

// Maps game items to pooled meshes. Read-only with respect to game state.
export class WorldView {
  constructor(scene) {
    this.scene = scene;
    this.live = new Map();
    this.pool = new Map();
  }

  sync(items, t) {
    const seen = new Set();
    for (const it of items) {
      if (it.dead) continue;
      let m = this.live.get(it);
      if (!m) {
        const key = `${it.cat}:${it.kind}:${it.label}`;
        m = this.pool.get(key)?.pop() ?? build(it);
        m.userData.key = key;
        this.live.set(it, m);
        this.scene.add(m);
      }
      seen.add(it);
      m.position.set(laneX(it.lane), 0, -it.z);
      m.visible = true;
      if (it.cat === 'pickup') {
        m.position.y = (it.y ?? 0.9) + Math.sin(t * 5 + it.z) * 0.08;
        m.rotation.y = t * 3;
      } else if (it.kind === 'gas') {
        m.scale.setScalar(1 + Math.sin(t * 4 + it.z) * 0.08);
      } else if (it.ghost) {
        m.visible = Math.floor(t * 16) % 2 === 0;
      }
    }
    for (const [it, m] of this.live) {
      if (seen.has(it)) continue;
      this.live.delete(it);
      this.scene.remove(m);
      const list = this.pool.get(m.userData.key) ?? [];
      list.push(m);
      this.pool.set(m.userData.key, list);
    }
  }
}

const SLOT = 18;
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const INSTRUMENTS = [makeSamrat, makeJaiPrakash, makeRamYantra];

// Jantar Mantar street scene scrolling past: boundary walls, trees, lamps, tents, chai stalls,
// observatory instruments and buildings, plus hand-lettered placards on the wall.
export class Scenery {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.slots = [];
    this.cards = new Map();
    this.protos = new Map();
    for (const side of [-1, 1]) {
      for (let i = 0; i < 9; i++) {
        const wall = makeWall(SLOT);
        const b = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat('#b8714a'));
        const p = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.7), new THREE.MeshBasicMaterial({ color: '#d9b382', side: THREE.DoubleSide }));
        p.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
        const prop = new THREE.Group();
        const bld = new THREE.Group();
        this.group.add(wall, b, p, prop, bld);
        this.slots.push({ side, i, wall, b, p, prop, bld, slot: null, propSlot: null, bldSlot: null, ver: -1 });
      }
    }
  }

  proto(name, make) {
    if (!this.protos.has(name)) this.protos.set(name, make());
    return this.protos.get(name).clone(true);
  }

  card(text, dark) {
    const key = `${text}|${dark}`;
    if (!this.cards.has(key)) {
      const tex = canvasTex(256, 168, (c, w, h) => {
        c.fillStyle = dark ? '#f5f1e6' : '#d9b382'; c.fillRect(0, 0, w, h);
        c.strokeStyle = '#5b4636'; c.lineWidth = 6; c.strokeRect(3, 3, w - 6, h - 6);
        c.fillStyle = '#222'; c.font = '28px "Permanent Marker", Marker Felt, cursive';
        c.textAlign = 'center'; c.textBaseline = 'top';
        let line = ''; let y = 18; const words = text.split(' ');
        for (const word of words) {
          const next = line ? `${line} ${word}` : word;
          if (line && c.measureText(next).width > w - 30) { c.fillText(line, w / 2, y); y += 34; line = word; } else line = next;
        }
        c.fillText(line, w / 2, y);
      });
      this.cards.set(key, tex ? new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }) : mat('#d9b382'));
    }
    return this.cards.get(key);
  }

  buildProp(s, slot) {
    s.prop.clear();
    const r = hash(slot * 5 + s.side);
    const face = s.side < 0 ? 0 : Math.PI;
    let o = null; let x = 5.8;
    if (r < 0.35) { o = makeTree((k) => hash(slot * 13 + k + s.side)); x = 6.4; }
    else if (r < 0.5) { o = this.proto('lamp', makeLamp); o.rotation.y = face; x = 4.2; }
    else if (r < 0.62) { o = this.proto('sign', makeSign); x = 4.4; }
    else if (r < 0.74) { o = this.proto('tent', makeTent); x = 7.2; }
    else if (r < 0.84) { o = this.proto('chai', makeChai); x = 6.2; }
    if (o) { o.position.set(0, 0, 0); s.prop.add(o); }
    s.propX = x;
  }

  buildBuilding(s, slot, h0) {
    s.bld.clear();
    s.bldKind = 'none';
    if (hash(slot * 3 + s.side) < 0.3) {
      const k = Math.floor(hash(slot * 11 + s.side) * INSTRUMENTS.length);
      const make = INSTRUMENTS[k];
      const o = this.proto(`inst${k}`, make);
      if (k === 0) o.rotation.y = Math.PI / 2;
      s.bld.add(o);
      s.bldKind = 'inst';
      return;
    }
    if (kit.has('city/')) {
      const m = cloneFit(CITY[Math.floor(hash(slot * 3 + s.side + 7) * CITY.length)], { width: 6 + h0 * 3 });
      if (m) { s.bld.add(m); s.bldKind = 'kit'; }
    }
  }

  update(distance, stage) {
    const base = Math.floor(distance / SLOT);
    const off = distance % SLOT;
    for (const s of this.slots) {
      const slot = base + s.i;
      const z = -(s.i * SLOT - off) - 6;
      const h0 = hash(slot * 2 + (s.side > 0 ? 1 : 0));

      s.wall.position.set(s.side * 5.0, 0, z);

      if (s.propSlot !== slot) { s.propSlot = slot; this.buildProp(s, slot); }
      s.prop.position.set(s.side * (s.propX ?? 6), 0, z - 4);

      if (s.bldSlot !== slot || s.ver !== kit.version) {
        s.bldSlot = slot; s.ver = kit.version;
        this.buildBuilding(s, slot, h0);
      }
      const inst = s.bldKind === 'inst';
      s.bld.position.set(s.side * (inst ? 15 : 9.5 + h0 * 1.5), 0, z);
      s.bld.rotation.y = inst ? 0 : (s.side < 0 ? Math.PI / 2 : -Math.PI / 2);
      s.b.visible = s.bldKind === 'none';
      if (s.b.visible) {
        const height = 6 + h0 * 10;
        s.b.scale.set(6 + h0 * 3, height, 12);
        s.b.position.set(s.side * (9.5 + h0 * 1.5), height / 2, z);
        s.b.material = mat(stage.palette.building);
      }

      const show = hash(slot * 7 + s.side) < 0.55;
      s.p.visible = show;
      if (show) {
        s.p.position.set(s.side * 4.4, 1.9, z + 3);
        if (s.slot !== slot) {
          s.slot = slot;
          s.p.material = this.card(stage.slogans[(slot + (s.side > 0 ? 2 : 0)) % stage.slogans.length], slot % 2 === 0);
        }
      }
    }
  }
}
