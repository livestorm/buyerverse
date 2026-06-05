'use strict';
process.env.ADMIN_TOKEN = 'test-token';
delete process.env.DATABASE_URL; // force memory store

const test = require('node:test');
const assert = require('node:assert/strict');
const { start, server } = require('../server');

let base;
const AUTH = { Authorization: 'Bearer test-token' };
const JSON_HEADERS = { ...AUTH, 'Content-Type': 'application/json' };

function galileoValues(over = {}) {
  return {
    prospect: 'Acme', am_name: 'Jane Doe', am_email: 'jane@livestorm.co',
    kpi_schools: 10, kpi_users: 100, kpi_sessions: 50, kpi_registrants: 2000,
    kpi_attendees: 1200, kpi_rate: 60, kpi_nps: 8.2,
    price_current: 50000, vol_1: 10000, vol_2: 20000, vol_3: 30000,
    price_1: 50000, price_2: 70000, price_3: 90000,
    discount_1: 10, discount_2: 20, discount_3: 30, ...over
  };
}

test.before(async () => {
  const port = await start(0);
  base = `http://127.0.0.1:${port}`;
});
test.after(() => server.close());

test('GET /api/templates lists galileo with its field schema (no auth)', async () => {
  const res = await fetch(`${base}/api/templates`);
  assert.equal(res.status, 200);
  const { templates } = await res.json();
  const g = templates.find(t => t.id === 'galileo');
  assert.ok(g);
  assert.equal(g.nameField, 'prospect');
  assert.ok(g.fields.length >= 20);
});

test('POST /api/preview renders without storing; lenient errors reported', async () => {
  const res = await fetch(`${base}/api/preview`, {
    method: 'POST', headers: JSON_HEADERS,
    body: JSON.stringify({ template: 'galileo', values: galileoValues({ prospect: '', kpi_nps: 99 }) })
  });
  assert.equal(res.status, 200);
  const { html, errors } = await res.json();
  assert.match(html, /<title>Galileo × Livestorm/); // prospect fell back to default
  assert.equal(errors.length, 2);
  // nothing stored
  const list = await (await fetch(`${base}/api/pages`, { headers: AUTH })).json();
  assert.deepEqual(list.pages.map(p => p.slug), ['galileo']);
});

test('POST /api/preview requires auth and a known template', async () => {
  const noAuth = await fetch(`${base}/api/preview`, { method: 'POST', body: '{}' });
  assert.equal(noAuth.status, 401);
  const bad = await fetch(`${base}/api/preview`, {
    method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ template: 'nope', values: {} })
  });
  assert.equal(bad.status, 400);
});

test('publish -> render -> delete round-trip with the new payload', async () => {
  const post = await fetch(`${base}/api/pages`, {
    method: 'POST', headers: JSON_HEADERS,
    body: JSON.stringify({ slug: 'acme', template: 'galileo', values: galileoValues() })
  });
  assert.equal(post.status, 200);
  const page = await fetch(`${base}/page/acme`);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /<title>Acme × Livestorm/);
  const del = await fetch(`${base}/api/pages/acme`, { method: 'DELETE', headers: AUTH });
  assert.equal(del.status, 200);
  assert.equal((await fetch(`${base}/page/acme`)).status, 404);
});

test('POST /api/pages strict-validates and rejects unknown templates', async () => {
  const bad = await fetch(`${base}/api/pages`, {
    method: 'POST', headers: JSON_HEADERS,
    body: JSON.stringify({ slug: 'bad', template: 'galileo', values: galileoValues({ am_email: 'nope' }) })
  });
  assert.equal(bad.status, 400);
  assert.match((await bad.json()).error, /am_email/);
  const unknown = await fetch(`${base}/api/pages`, {
    method: 'POST', headers: JSON_HEADERS,
    body: JSON.stringify({ slug: 'bad', template: 'nope', values: {} })
  });
  assert.equal(unknown.status, 400);
});

test('seeded galileo page was created from manifest defaults', async () => {
  const res = await fetch(`${base}/page/galileo`);
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /"kpi_attendees":22263/);
});

test('legacy-shaped rows are converted on boot', async () => {
  // boot conversion already ran; simulate by checking the converter directly
  const { legacyToGalileo } = require('../server');
  const v = legacyToGalileo({
    prospect: 'Old', am: { name: 'A B', email: 'a@b.co' },
    kpis: { schools: 1, users: 2, sessions: 3, registrants: 4, attendees: 5, rate: 6, nps: 7 },
    pricing: { currentAnnual: 8, volumes: [9, 10, 11], discounts: [12, 13, 14], initial: [15, 16, 17] }
  });
  assert.equal(v.template, 'galileo');
  assert.equal(v.values.kpi_attendees, 5);
  assert.equal(v.values.discount_3, 14);
  assert.equal(v.values.price_2, 16);
});

test('template assets are served; traversal and manifest access are blocked', async () => {
  assert.equal((await fetch(`${base}/templates/galileo/styles.css`)).status, 200);
  assert.equal((await fetch(`${base}/templates/galileo/page.js`)).status, 200);
  assert.equal((await fetch(`${base}/templates/galileo/template.json`)).status, 404);
  assert.equal((await fetch(`${base}/templates/galileo/index.html`)).status, 404);
  assert.equal((await fetch(`${base}/templates/galileo/..%2Fserver.js`)).status, 404);
  assert.equal((await fetch(`${base}/templates/nope/styles.css`)).status, 404);
});

test('oversized request bodies get a clean 413, not a connection reset', async () => {
  const res = await fetch(`${base}/api/pages`, {
    method: 'POST', headers: JSON_HEADERS,
    body: JSON.stringify({ slug: 'big', template: 'galileo', values: { prospect: 'x'.repeat(150 * 1024) } })
  });
  assert.equal(res.status, 413);
  assert.match((await res.json()).error, /too large/);
});

test('malformed percent-encoding in the path is a 404, not a 500', async () => {
  // fetch normalises/rejects raw %zz, so drive it with node:http directly
  const http = require('node:http');
  const status = await new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: new URL(base).port, path: '/page/%zz' }, res => {
      res.resume();
      resolve(res.statusCode);
    });
    req.on('error', reject);
    req.end();
  });
  assert.equal(status, 404);
});

test('rendered pages are cacheable for five minutes', async () => {
  const res = await fetch(`${base}/page/galileo`);
  assert.equal(res.headers.get('cache-control'), 'public, max-age=300');
});
