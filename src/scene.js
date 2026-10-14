import * as THREE from 'three';
import { mat, canvasTex, makeHero, makeInspector } from './models.js';
import { WorldView, Scenery, laneX } from './world-view.js';

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
      c.fillStyle = '#4b4150'; c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(255,255,255,0.8)';
      for (const x of [w / 3, (2 * w) / 3]) c.fillRect(x - 2, 6, 4, h * 0.45);
      c.fillStyle = '#f4d35e'; c.fillRect(0, 0, 5, h); c.fillRect(w - 5, 0, 5, h);
    });
    if (laneTex) { laneTex.wrapS = laneTex.wrapT = THREE.RepeatWrapping; laneTex.repeat.set(1, 24); }
    this.roadTex = laneTex;
    this.road = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 240),
      laneTex ? new THREE.MeshBasicMaterial({ map: laneTex }) : mat('#4b4150'));
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
    this.resize(1, 1);
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

    this.hero.group.position.set(x, p.y, 0);
    this.hero.group.rotation.z = (p.visualLane - p.lane) * 0.35;
    this.hero.group.rotation.x = p.vy > 0.5 ? -0.25 : p.vy < -0.5 ? 0.2 : 0;
    this.hero.group.visible = !(p.graceT > 0 && Math.floor(g.t * 20) % 2);
    this.hero.update(g.t, { sliding: p.sliding, airborne: p.airborne });
    this.shield.visible = g.powerups.shieldActive;
    this.shield.position.set(x, p.y + 0.6, 0);
    this.blob.position.set(x, p.support + 0.03, 0);
    this.blob.scale.setScalar(Math.max(0.4, 1 - (p.y - p.support) * 0.25));

    const gap = g.chaser.gap;
    this.inspector.group.visible = gap < 7.2 && g.state !== 'menu';
    this.inspector.group.position.set(x, 0, gap * 1.05);
    this.inspector.update(g.t);

    this.world.sync(g.spawner.items, g.t);
    this.scenery.update(g.distance, g.stage);
    if (this.roadTex) this.roadTex.offset.y = g.distance / 10;

    const k = Math.min(1, dt * 6);
    this.camX += (x * 0.65 - this.camX) * k;
    this.camY += ((5.2 + p.y * 0.55) - this.camY) * k;
    const shake = g.shake > 0 ? g.shake * 0.35 : 0;
    this.camera.position.set(this.camX + (Math.random() - 0.5) * shake, this.camY + (Math.random() - 0.5) * shake, 8);
    this.camera.lookAt(x * 0.5, 1.4 + p.y * 0.45, -12);
    const baseFov = fovFor(this.camera.aspect) + Math.min(10, Math.max(0, (g.speed - 30) / 4));
    if (Math.abs(this.camera.fov - baseFov) > 0.1) {
      this.camera.fov = baseFov;
      this.camera.updateProjectionMatrix();
    }
    this.renderer.render(this.scene, this.camera);
  }
}
