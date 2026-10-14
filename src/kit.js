import * as THREE from 'three';

// Optional CC0 (Kenney) models. The game runs on procedural models until/unless these load.
const FILES = {
  car: ['van', 'police', 'firetruck', 'truck', 'delivery', 'taxi'],
  city: ['building-a', 'building-b', 'building-c', 'building-d', 'building-e',
    'building-skyscraper-a', 'building-skyscraper-b', 'building-skyscraper-c',
    'building-skyscraper-d', 'building-skyscraper-e'],
};

const models = new Map();
export const kit = { version: 0, has: (prefix) => [...models.keys()].some((k) => k.startsWith(prefix)) };
export const CITY = FILES.city.map((n) => `city/${n}`);

export async function loadKit() {
  try {
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
    const loader = new GLTFLoader();
    const jobs = [];
    for (const [dir, names] of Object.entries(FILES)) {
      for (const n of names) {
        jobs.push(loader.loadAsync(`assets/models/${dir}/${n}.glb`)
          .then((g) => { models.set(`${dir}/${n}`, g.scene); kit.version++; })
          .catch(() => {}));
      }
    }
    await Promise.all(jobs);
  } catch { /* procedural fallbacks stay in place */ }
}

// Clone of a loaded model scaled to `width` (or `height`), centred on x/z, sitting on y = 0.
export function cloneFit(name, { width, height }) {
  const src = models.get(name);
  if (!src) return null;
  const inner = src.clone(true);
  const box = new THREE.Box3().setFromObject(inner);
  const size = box.getSize(new THREE.Vector3());
  const k = width ? width / Math.max(size.x, size.z) : height / size.y;
  inner.scale.setScalar(k);
  const b2 = new THREE.Box3().setFromObject(inner);
  const c = b2.getCenter(new THREE.Vector3());
  inner.position.set(-c.x, -b2.min.y, -c.z);
  const wrap = new THREE.Group();
  wrap.add(inner);
  return wrap;
}
