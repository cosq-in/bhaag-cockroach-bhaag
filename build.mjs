// Static build for hosts that cannot run serve.mjs (e.g. Vercel): writes dist/ with the same files the
// server allows, the stamped index.html, version.json and posthog-config.js (from the host's env vars).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT, BUILD, resolve, renderIndex, posthogConfigJs } from './serve.mjs';

export function build(outDir, env = process.env) {
  fs.rmSync(outDir, { recursive: true, force: true });
  const put = (rel, data) => {
    const dest = path.join(outDir, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, data);
  };
  const walk = (dir) => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((e) => (
    e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]));
  for (const rel of ['style.css', ...['src', 'vendor', 'assets'].flatMap(walk)]) {
    const hit = resolve(`/${rel}`);
    if (hit) put(rel, fs.readFileSync(hit.file));
  }
  put('index.html', renderIndex(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')));
  put('version.json', JSON.stringify({ version: BUILD }));
  put('posthog-config.js', posthogConfigJs(env));
  return BUILD;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = path.join(ROOT, 'dist');
  const missing = ['POSTHOG_PROJECT_TOKEN', 'POSTHOG_HOST'].filter((k) => !process.env[k]);
  if (missing.length) console.warn(`WARNING: ${missing.join(', ')} not set; analytics will be disabled in this build.`);
  console.log(`Built ${build(out)} -> ${out}`);
}
