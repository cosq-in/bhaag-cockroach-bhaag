import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { build } from '../build.mjs';

test('static build contains the game, stamped html and PostHog config, and nothing private', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'bcb-'));
  const v = build(out, { POSTHOG_PROJECT_TOKEN: 'phc_test', POSTHOG_HOST: 'https://eu.i.posthog.com', NODE_ENV: 'production' });
  const read = (f) => fs.readFileSync(path.join(out, f), 'utf8');
  assert.ok(read('index.html').includes(`src/main.js?v=${v}`));
  assert.equal(JSON.parse(read('version.json')).version, v);
  assert.match(read('posthog-config.js'), /"projectToken":"phc_test".*"debug":false/);
  for (const f of ['style.css', 'src/main.js', 'vendor/three.module.js', 'assets/models/cop/cop.glb']) assert.ok(fs.existsSync(path.join(out, f)), f);
  for (const f of ['.env', 'serve.mjs', 'package.json', 'tests', 'docs', '.git']) assert.ok(!fs.existsSync(path.join(out, f)), f);
  fs.rmSync(out, { recursive: true, force: true });
});
