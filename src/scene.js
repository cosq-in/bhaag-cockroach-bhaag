import * as THREE from 'three';
import { mat, canvasTex, makeHero, makeInspector } from './models.js';
import { WorldView, Scenery, RoadDressing, laneX } from './world-view.js';
import { kit } from './kit.js';

const fovFor = (aspect) => (aspect < 1 ? 78 : 62);

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  return renderer;
}

export class Stage3D {
  constructor(renderer) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.1, 220);
    this.camY = 5.2;
    this.camX = 0;
    this.stageId = null;

    this.hemi = new THREE.HemisphereLight('#fff0dd', '#332244', 1.0);
    this.sun = new THREE.DirectionalLight('#ffd9a0', 0.9);
    this.sun.position.set(-6, 12, 6);
    this.scene.add(this.hemi, this.sun);

    const laneTex = canvasTex(128, 128, (c, w, h) => {
      c.fillStyle = '#4a4545'; c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(255,255,255,0.8)';
      for (const x of [w / 3, (2 * w) / 3]) c.fillRect(x - 2, 6, 4, h * 0.45);
      c.fillStyle = '#f4d35e'; c.fillRect(0, 0, 5, h); c.fillRect(w - 5, 0, 5, h);
    });
    if (laneTex) { laneTex.wrapS = laneTex.wrapT = THREE.RepeatWrapping; laneTex.repeat.set(1, 24); }
    this.roadTex = laneTex;
    this.road = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 240),
      laneTex ? new THREE.MeshBasicMaterial({ map: laneTex }) : mat('#4a4545'));
    this.road.rotation.x = -Math.PI / 2;
    this.road.position.set(0, 0, -100);
    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 240), mat('#3a2f3d'));
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.set(0, -0.02, -100);
    this.scene.add(this.road, this.ground);

    this.gate = this.makeGate();
    this.scene.add(this.gate);

    this.hero = makeHero();
    this.inspector = makeInspector();
    this.shield = new THREE.Mesh(new THREE.SphereGeometry(1.1, 14, 10),
      new THREE.MeshBasicMaterial({ color: '#78dcff', transparent: true, opacity: 0.3 }));
    this.blob = new THREE.Mesh(new THREE.CircleGeometry(0.6, 16),
      new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.35 }));
    this.blob.rotation.x = -Math.PI / 2;
    this.scene.add(this.hero.group, this.inspector.group, this.shield, this.blob);

    this.world = new WorldView(this.scene);
    this.scenery = new Scenery(this.scene);
    this.dressing = new RoadDressing(this.scene);
    this.resize(1, 1);
  }

  // Swap the procedural cockroach for the rigged CC0-style model once it has loaded.
  useKitHero() {
    if (this.heroRoot || !kit.hero) return;
    const model = kit.hero.scene;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const k = 1.9 / size.y;
    model.scale.setScalar(k);
    const b2 = new THREE.Box3().setFromObject(model);
    model.position.set(-(b2.min.x + b2.max.x) / 2, -b2.min.y, -(b2.min.z + b2.max.z) / 2);
    model.rotation.y = Math.PI;
    this.heroRoot = new THREE.Group();
    this.heroRoot.add(model);
    this.scene.add(this.heroRoot);
    this.hero.group.visible = false;
    this.heroMixer = new THREE.AnimationMixer(model);
    const clip = kit.hero.animations.find((a) => a.name === 'run_loop') ?? kit.hero.animations[0];
    if (clip) this.heroMixer.clipAction(clip).play();
  }

  // Dress the CC0 Kenney mini character as a khaki-clad constable with cap and lathi.
  useKitCop() {
    if (this.copRoot || !kit.cop) return;
    const model = kit.cop.scene;
    const khaki = '#b59a5b';
    model.traverse((o) => {
      if (o.name === 'body-mesh') o.material = new THREE.MeshLambertMaterial({ color: khaki });
      if (o.name === 'head-mesh') { o.material = o.material.clone(); o.material.color.set('#e2aa7c'); }
      if (o.name === 'head') {
        const cap = new THREE.Group();
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.21, 0.12, 14), new THREE.MeshLambertMaterial({ color: khaki }));
        crown.position.set(0, 0.42, 0.02);
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.16), new THREE.MeshLambertMaterial({ color: '#3b2f1a' }));
        visor.position.set(0, 0.37, 0.27);
        cap.add(crown, visor);
        o.add(cap);
      }
      if (o.name === 'arm-right') {
        const holder = new THREE.Group();
        holder.position.set(0, -0.17, 0.03);
        holder.rotation.x = Math.PI / 2;
        const lathi = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.95, 8), new THREE.MeshLambertMaterial({ color: '#a8672a' }));
        lathi.position.y = 0.32;
        holder.add(lathi);
        o.add(holder);
      }
    });
    const box = new THREE.Box3().setFromObject(model);
    const k = 2.2 / (box.max.y - box.min.y);
    model.scale.setScalar(k);
    this.copRoot = new THREE.Group();
    this.copRoot.add(model);
    this.scene.add(this.copRoot);
    this.inspector.group.visible = false;
    this.copMixer = new THREE.AnimationMixer(model);
    const clip = (n) => kit.cop.animations.find((a) => a.name === n);
    this.copActions = {};
    for (const [key, name] of [['chase', 'sprint'], ['beat', 'attack-melee-right'], ['idle', 'idle']]) {
      if (clip(name)) this.copActions[key] = this.copMixer.clipAction(clip(name));
    }
    this.copPos = new THREE.Vector3(0, 0, 8);
    this.copState = null;
  }

  setCopAnim(state) {
    if (this.copState === state || !this.copActions[state]) return;
    const prev = this.copActions[this.copState];
    const next = this.copActions[state];
    next.reset().play();
    if (prev) next.crossFadeFrom(prev, 0.15, false);
    this.copState = state;
  }

  makeGate() {
    const g = new THREE.Group();
    const stone = mat('#c9a77a');
    const pillar = (x) => { const p = new THREE.Mesh(new THREE.BoxGeometry(5, 30, 5), stone); p.position.set(x, 15, 0); return p; };
    const top = new THREE.Mesh(new THREE.BoxGeometry(40, 8, 6), stone);
    top.position.set(0, 34, 0);
    g.add(pillar(-14), pillar(14), top);
    g.position.set(0, 0, -150);
    return g;
  }

  resize(w, h) {
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = fovFor(w / h);
    this.camera.updateProjectionMatrix();
  }

  applyStage(stage) {
    if (this.stageId === stage.id) return;
    this.stageId = stage.id;
    const pal = stage.palette;
    const fog = new THREE.Color(pal.sky[1]).lerp(new THREE.Color(pal.sky[0]), 0.35);
    this.scene.background = fog;
    this.scene.fog = new THREE.Fog(fog, 45, 150);
    this.ground.material = mat(pal.ground);
    this.sun.color.set(pal.sun);
    this.hemi.color.set(pal.sky[0]);
  }

  render(g, dt) {
    this.applyStage(g.stage);
    const p = g.player;
    const x = laneX(p.visualLane);

    this.useKitHero();
    const hn = this.heroRoot ?? this.hero.group;
    hn.position.set(x, p.y, 0);
    hn.rotation.z = (p.visualLane - p.lane) * 0.35;
    hn.rotation.x = p.vy > 0.5 ? -0.25 : p.vy < -0.5 ? 0.2 : 0;
    hn.visible = g.state === 'over' || !(p.graceT > 0 && Math.floor(g.t * 20) % 2);
    if (this.heroRoot) {
      if (g.state === 'over') {
        const hit = Math.abs(Math.sin(g.overT * (Math.PI / 0.55)));
        this.heroRoot.scale.set(1.15, 0.45 + 0.12 * hit, 1.15);
        hn.rotation.z = 0.5 + Math.sin(g.overT * 38) * 0.08 * hit;
        hn.position.y = 0;
        this.heroMixer.timeScale = 0.05;
      } else {
        this.heroRoot.scale.set(1, p.sliding ? 0.6 : 1, 1);
        this.heroMixer.timeScale = g.state === 'play' && p.grounded ? 1 : 0.3;
      }
      this.heroMixer.update(dt);
    } else {
      this.hero.update(g.t, { sliding: p.sliding, airborne: p.airborne });
    }
    this.shield.visible = g.powerups.shieldActive;
    this.shield.position.set(x, p.y + 0.6, 0);
    this.blob.position.set(x, p.support + 0.03, 0);
    this.blob.scale.setScalar(Math.max(0.4, 1 - (p.y - p.support) * 0.25));

    const gap = g.chaser.gap;
    this.useKitCop();
    const over = g.state === 'over';
    const cn = this.copRoot ?? this.inspector.group;
    cn.visible = over || (gap < 7.2 && g.state !== 'menu');
    const tx = over ? x + 1.35 : x;
    const tz = over ? -0.1 : gap * 1.05;
    if (this.copRoot) {
      this.copPos.x += (tx - this.copPos.x) * Math.min(1, dt * 8);
      this.copPos.z += (tz - this.copPos.z) * Math.min(1, dt * (over ? 7 : 12));
      this.copRoot.position.set(this.copPos.x, 0, this.copPos.z);
      this.copRoot.rotation.y = over ? -Math.PI / 2 : Math.PI;
      this.setCopAnim(over ? 'beat' : g.state === 'menu' ? 'idle' : 'chase');
      this.copMixer.timeScale = over ? 1.1 : 1 + (1 - gap / 8) * 0.4;
      this.copMixer.update(dt);
    } else {
      cn.position.set(tx, 0, tz);
      cn.rotation.y = over ? -Math.PI / 2 : 0;
      this.inspector.update(g.t);
    }

    this.world.sync(g.spawner.items, g.t);
    this.scenery.update(g.distance, g.stage);
    this.dressing.update(g.distance, g.t);
    if (this.roadTex) this.roadTex.offset.y = g.distance / 10;

    const k = Math.min(1, dt * 6);
    this.camX += (x * 0.65 - this.camX) * k;
    this.camY += ((5.2 + p.y * 0.55) - this.camY) * k;
    const shake = g.shake > 0 ? g.shake * 0.35 : 0;
    if (g.state === 'over') {
      this.overBlend = Math.min(1, (this.overBlend ?? 0) + dt * 1.6);
      const b = this.overBlend;
      this.camera.position.set(this.camX + (x + 0.7 - this.camX) * b, this.camY + (2.3 - this.camY) * b, 8 + (6.6 - 8) * b);
      this.camera.lookAt(x * 0.5 + (x + 0.7 - x * 0.5) * b, 1.4 + (1.0 - 1.4) * b, -12 + 12 * b);
    } else {
      this.overBlend = 0;
      this.camera.position.set(this.camX + (Math.random() - 0.5) * shake, this.camY + (Math.random() - 0.5) * shake, 8);
      this.camera.lookAt(x * 0.5, 1.4 + p.y * 0.45, -12);
    }
    const baseFov = fovFor(this.camera.aspect) + Math.min(10, Math.max(0, (g.speed - 30) / 4));
    if (Math.abs(this.camera.fov - baseFov) > 0.1) {
      this.camera.fov = baseFov;
      this.camera.updateProjectionMatrix();
    }
    this.renderer.render(this.scene, this.camera);
  }
}
