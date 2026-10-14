import * as THREE from 'three';
import { mat, canvasTex, makeBus, makeRamp, makeObstacle, makePickup } from './models.js';

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

// Buildings and hand-lettered placards scrolling past on both sides of the road.
export class Scenery {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.slots = [];
    this.cards = new Map();
    for (const side of [-1, 1]) {
      for (let i = 0; i < 9; i++) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat('#4a2b45'));
        const p = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.7), new THREE.MeshBasicMaterial({ color: '#d9b382', side: THREE.DoubleSide }));
        p.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
        this.group.add(b, p);
        this.slots.push({ side, i, b, p, slot: null });
      }
    }
    this.stageId = null;
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

  update(distance, stage) {
    const base = Math.floor(distance / SLOT);
    const off = distance % SLOT;
    const color = new THREE.Color(stage.palette.building).offsetHSL(0, 0, 0.13);
    for (const s of this.slots) {
      const slot = base + s.i;
      const z = -(s.i * SLOT - off) - 6;
      const h0 = hash(slot * 2 + (s.side > 0 ? 1 : 0));
      const height = 6 + h0 * 14;
      s.b.scale.set(6 + h0 * 3, height, 12);
      s.b.position.set(s.side * (8.2 + h0 * 1.5), height / 2, z);
      s.b.material = mat(`#${color.clone().offsetHSL(0, 0, h0 * 0.08 - 0.04).getHexString()}`);
      const show = hash(slot * 7 + s.side) < 0.55;
      s.p.visible = show;
      if (show) {
        s.p.position.set(s.side * 4.4, 1.7, z + 3);
        if (s.slot !== slot) {
          s.slot = slot;
          s.p.material = this.card(stage.slogans[(slot + (s.side > 0 ? 2 : 0)) % stage.slogans.length], slot % 2 === 0);
        }
      }
    }
  }
}
