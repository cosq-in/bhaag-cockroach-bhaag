import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const ROOT = path.dirname(fileURLToPath(import.meta.url));
const TYPES = {
  html: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  glb: 'model/gltf-binary',
  png: 'image/png',
  webp: 'image/webp',
  mp3: 'audio/mpeg',
  ogg: 'audio/ogg',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
  jpg: 'image/jpeg',
  json: 'application/json',
};

// Build id: a deploy's commit if the host provides one, else a hash of the game files (computed at startup).
function computeBuild() {
  const env = process.env.BUILD_ID ?? process.env.RENDER_GIT_COMMIT ?? process.env.VERCEL_GIT_COMMIT_SHA
    ?? process.env.RAILWAY_GIT_COMMIT_SHA ?? process.env.SOURCE_VERSION;
  if (env) return env.slice(0, 12);
  const h = crypto.createHash('sha1');
  const add = (f) => { try { h.update(fs.readFileSync(path.join(ROOT, f))); } catch { /* optional file */ } };
  add('index.html'); add('style.css');
  for (const f of fs.readdirSync(path.join(ROOT, 'src')).sort()) add(`src/${f}`);
  add('assets/posters/manifest.json'); add('assets/sfx/manifest.json');
  const walk = (d) => { for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
    if (e.isDirectory()) walk(`${d}/${e.name}`); else h.update(`${d}/${e.name}:${fs.statSync(path.join(ROOT, d, e.name)).size}`); } };
  try { walk('assets'); } catch { /* none */ }
  return h.digest('hex').slice(0, 12);
}
export const BUILD = computeBuild();

// The public PostHog browser config as a script (served live, or written at build time for static hosts).
export function posthogConfigJs(env) {
  const config = JSON.stringify({
    projectToken: env.POSTHOG_PROJECT_TOKEN,
    host: env.POSTHOG_HOST,
    debug: env.NODE_ENV !== 'production',
  });
  return `window.POSTHOG_CONFIG = ${config};`;
}

// index.html with the build id stamped in and every module URL versioned through the import map.
export function renderIndex(html) {
  const imports = { three: `./vendor/three.module.js?v=${BUILD}`, 'three/addons/': './vendor/jsm/' };
  for (const f of fs.readdirSync(path.join(ROOT, 'src'))) {
    if (/^[a-z]+(?:-[a-z]+)*\.js$/.test(f)) imports[`./src/${f}`] = `./src/${f}?v=${BUILD}`;
  }
  return html
    .replace(/<script type="importmap">[\s\S]*?<\/script>/, `<script type="importmap">${JSON.stringify({ imports })}</script>`)
    .replaceAll('__BUILD__', BUILD);
}

// Maps a request path to a file on the allowlist, or null.
export function resolve(rawUrl) {
  const raw = rawUrl.split('?')[0].split('#')[0];
  if (/%2e|%2f|%5c|\\/i.test(raw) || raw.includes('..')) return null;
  let p;
  try { p = decodeURIComponent(raw); } catch { return null; }
  if (p.includes('\\') || p.includes('..') || p.includes('\0')) return null;
  if (p === '/' || p === '/index.html') return { file: path.join(ROOT, 'index.html'), type: TYPES.html };
  if (p === '/style.css') return { file: path.join(ROOT, 'style.css'), type: TYPES.css };
  const m = /^\/src\/([a-z]+(?:-[a-z]+)*\.js)$/.exec(p);
  if (m) return { file: path.join(ROOT, 'src', m[1]), type: TYPES.js };
  const v = /^\/vendor\/(three\.module\.js|jsm\/(?:loaders|utils)\/[A-Za-z]+\.js)$/.exec(p);
  if (v) return { file: path.join(ROOT, 'vendor', v[1]), type: TYPES.js };
  const a = /^\/assets\/models\/(car|city|hero|cop|spiderman|luffy)\/((?:[a-z]+(?:-[a-z]+)*\.glb)|Textures\/colormap\.png)$/.exec(p);
  if (a) return { file: path.join(ROOT, 'assets', 'models', a[1], a[2]), type: a[2].endsWith('.png') ? TYPES.png : TYPES.glb };
  const pz = /^\/assets\/posters\/(manifest\.json|[a-z0-9_-]+\.(?:webp|png|jpg))$/.exec(p);
  if (pz) return { file: path.join(ROOT, 'assets', 'posters', pz[1]), type: pz[1].endsWith('.json') ? TYPES.json : TYPES[pz[1].split('.').pop()] };
  const sx = /^\/assets\/sfx\/(manifest\.json|[a-z0-9_-]+\.(?:mp3|ogg|wav|m4a))$/.exec(p);
  if (sx) return { file: path.join(ROOT, 'assets', 'sfx', sx[1]), type: sx[1].endsWith('.json') ? TYPES.json : TYPES[sx[1].split('.').pop()] };
  return null;
}

export function createServer() {
  return http.createServer((req, res) => {
    const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
    const fail = (code) => { res.writeHead(code, { ...headers, 'Content-Type': 'text/plain' }); res.end(code === 405 ? 'Method Not Allowed' : 'Not Found'); };
    if (req.method !== 'GET' && req.method !== 'HEAD') return fail(405);
    if ((req.url ?? '').split('?')[0] === '/posthog-config.js') {
      const data = posthogConfigJs(process.env);
      res.writeHead(200, { ...headers, 'Content-Type': TYPES.js, 'Content-Length': Buffer.byteLength(data) });
      return res.end(req.method === 'HEAD' ? undefined : data);
    }
    if ((req.url ?? '').split('?')[0] === '/version.json') {
      const data = JSON.stringify({ version: BUILD });
      res.writeHead(200, { ...headers, 'Content-Type': TYPES.json, 'Content-Length': data.length });
      return res.end(req.method === 'HEAD' ? undefined : data);
    }
    const hit = resolve(req.url ?? '/');
    if (!hit) return fail(404);
    // A URL carrying this deploy's build id can never go stale, so it may be cached for good.
    const query = new URLSearchParams((req.url ?? '').split('?')[1] ?? '');
    const versioned = query.get('v') === BUILD && hit.type !== TYPES.html;
    fs.readFile(hit.file, (err, raw) => {
      if (err) return fail(404);
      const data = hit.type === TYPES.html ? Buffer.from(renderIndex(raw.toString('utf8'))) : raw;
      const cache = versioned ? { 'Cache-Control': 'public, max-age=31536000, immutable' } : {};
      res.writeHead(200, { ...headers, ...cache, 'Content-Type': hit.type, 'Content-Length': data.length });
      res.end(req.method === 'HEAD' ? undefined : data);
    });
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 8000;
  createServer().listen(port, '127.0.0.1', () => console.log(`Delhi Runner on http://127.0.0.1:${port}`));
}
