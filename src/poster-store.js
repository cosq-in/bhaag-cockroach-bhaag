// Player-supplied posters: images picked on the device, downscaled, and kept in IndexedDB.
// Nothing here is ever uploaded anywhere.
export const MAX_POSTERS = 12;
export const MAX_SIDE = 512;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

const DB = 'bhaagPosters';
const STORE = 'posters';

// Largest size that fits in max x max, keeping the aspect ratio (never upscales).
export function fitSize(w, h, max = MAX_SIDE) {
  const k = Math.min(1, max / Math.max(w, h));
  return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)) };
}

// New picks are added to the saved ones; past the cap the oldest are dropped.
export function mergePosters(existing, added, max = MAX_POSTERS) {
  return [...existing, ...added].slice(-max);
}

// Raster images only; SVG is excluded on purpose.
export function acceptable(file) {
  return /^image\/(png|jpeg|webp|gif|avif)$/.test(file.type) && file.size <= MAX_FILE_BYTES;
}

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { autoIncrement: true });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const done = (tx) => new Promise((resolve, reject) => {
  tx.oncomplete = () => resolve();
  tx.onerror = tx.onabort = () => reject(tx.error);
});

export async function loadUploadedPosters() {
  try {
    const db = await open();
    const req = db.transaction(STORE).objectStore(STORE).getAll();
    return await new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result ?? []);
      req.onerror = () => resolve([]);
    });
  } catch { return []; }
}

export async function clearUploadedPosters() {
  try {
    const db = await open();
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    await done(tx);
  } catch { /* storage unavailable */ }
}

// Decode, downscale and re-encode each picked file (this also drops any metadata), then store the blobs.
export async function saveUploadedPosters(files) {
  const blobs = [];
  for (const file of [...files].filter(acceptable).slice(0, MAX_POSTERS)) {
    try {
      const bmp = await createImageBitmap(file);
      const { w, h } = fitSize(bmp.width, bmp.height);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(bmp, 0, 0, w, h);
      bmp.close?.();
      blobs.push(await new Promise((res) => c.toBlob(res, 'image/webp', 0.85)));
    } catch { /* skip an undecodable file */ }
  }
  const good = blobs.filter(Boolean);
  if (!good.length) return 0;
  const db = await open();
  const tx = db.transaction(STORE, 'readwrite');
  const st = tx.objectStore(STORE);
  const all = st.getAll();
  all.onsuccess = () => {
    st.clear();
    mergePosters(all.result ?? [], good).forEach((b) => st.add(b));
  };
  await done(tx);
  return good.length;
}
