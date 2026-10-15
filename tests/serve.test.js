import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../serve.mjs';

async function withServer(fn) {
  const server = createServer();
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  try { await fn(server, `http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise((r) => server.close(r)); }
}

const rawGet = (port, path) => new Promise((resolve, reject) => {
  import('node:http').then(({ default: http }) => {
    http.get({ host: '127.0.0.1', port, path }, (res) => { res.resume(); resolve(res.statusCode); }).on('error', reject);
  });
});

test('serves allowlisted files with correct types', async () => {
  await withServer(async (server, base) => {
    for (const [p, type] of [['/', 'text/html; charset=utf-8'], ['/index.html', 'text/html; charset=utf-8'],
      ['/style.css', 'text/css'], ['/src/main.js', 'text/javascript']]) {
      const res = await fetch(base + p);
      assert.equal(res.status, 200, p);
      assert.ok(res.headers.get('content-type').startsWith(type), p);
      assert.equal(res.headers.get('cache-control'), 'no-store');
      assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
      await res.arrayBuffer();
    }
  });
});

test('everything else is 404', async () => {
  await withServer(async (server) => {
    const port = server.address().port;
    for (const p of ['/.git/HEAD', '/package.json', '/serve.mjs',
      '/docs/superpowers/specs/2026-10-14-delhi-runner-design.md', '/tests/camera.test.js',
      '/src/../package.json', '/src/%2e%2e/package.json', '/src/', '/src', '/docs/',
      '/.superpowers/sdd/progress.md', '/src/..%2fpackage.json', '/src/nope.js', '/src/a\\b.js']) {
      assert.equal(await rawGet(port, p), 404, p);
    }
  });
});

test('non-GET is rejected and binds to loopback', async () => {
  await withServer(async (server, base) => {
    const res = await fetch(base + '/', { method: 'POST', body: 'x' });
    assert.ok([404, 405].includes(res.status));
    assert.equal(server.address().address, '127.0.0.1');
  });
});

test('posthog-config.js exposes only the three public config fields', async () => {
  const server = createServer();
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/posthog-config.js`);
  const body = await res.text();
  server.close();
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /javascript/);
  const cfg = JSON.parse(body.replace(/^window\.POSTHOG_CONFIG = /, '').replace(/;$/, ''));
  assert.deepEqual(Object.keys(cfg).sort().filter((k) => !['debug', 'host', 'projectToken'].includes(k)), []);
});
