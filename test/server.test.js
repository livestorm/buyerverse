'use strict';
process.env.ADMIN_TOKEN = 'test-token';
delete process.env.DATABASE_URL; // force memory store

const test = require('node:test');
const assert = require('node:assert/strict');
const { start, server } = require('../server');

let base;
const AUTH = { Authorization: 'Bearer test-token' };
const JSON_HEADERS = { ...AUTH, 'Content-Type': 'application/json' };

function sampleValues(over = {}) {
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

test('GET /api/templates lists renewal with its field schema (no auth)', async () => {
  const res = await fetch(`${base}/api/templates`);
  assert.equal(res.status, 200);
  const { templates } = await res.json();
  const g = templates.find(t => t.id === 'renewal');
  assert.ok(g);
  assert.equal(g.nameField, 'prospect');
  assert.ok(g.fields.length >= 20);
});

test('POST /api/preview renders without storing; lenient errors reported', async () => {
  const res = await fetch(`${base}/api/preview`, {
    method: 'POST', headers: JSON_HEADERS,
    body: JSON.stringify({ template: 'renewal', values: sampleValues({ prospect: '', kpi_nps: 99 }) })
  });
  assert.equal(res.status, 200);
  const { html, errors } = await res.json();
  assert.match(html, /<title>Acme × Livestorm/); // prospect fell back to default
  assert.equal(errors.length, 2);
  // nothing stored
  const list = await (await fetch(`${base}/api/pages`, { headers: AUTH })).json();
  assert.deepEqual(list.pages.map(p => p.slug), []);
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
    body: JSON.stringify({ slug: 'acme', template: 'renewal', values: sampleValues(), status: 'published' })
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
    body: JSON.stringify({ slug: 'bad', template: 'renewal', values: sampleValues({ am_email: 'nope' }), status: 'published' })
  });
  assert.equal(bad.status, 400);
  assert.match((await bad.json()).error, /am_email/);
  const unknown = await fetch(`${base}/api/pages`, {
    method: 'POST', headers: JSON_HEADERS,
    body: JSON.stringify({ slug: 'bad', template: 'nope', values: {} })
  });
  assert.equal(unknown.status, 400);
});

test('template assets are served; traversal and manifest access are blocked', async () => {
  assert.equal((await fetch(`${base}/templates/renewal/styles.css`)).status, 200);
  assert.equal((await fetch(`${base}/templates/renewal/page.js`)).status, 200);
  assert.equal((await fetch(`${base}/templates/renewal/template.json`)).status, 404);
  assert.equal((await fetch(`${base}/templates/renewal/index.html`)).status, 404);
  assert.equal((await fetch(`${base}/templates/renewal/..%2Fserver.js`)).status, 404);
  assert.equal((await fetch(`${base}/templates/nope/styles.css`)).status, 404);
});

test('oversized request bodies get a clean 413, not a connection reset', async () => {
  const res = await fetch(`${base}/api/pages`, {
    method: 'POST', headers: JSON_HEADERS,
    body: JSON.stringify({ slug: 'big', template: 'renewal', values: { prospect: 'x'.repeat(150 * 1024) } })
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
  await fetch(`${base}/api/pages`, {
    method: 'POST', headers: JSON_HEADERS,
    body: JSON.stringify({ slug: 'cacheable', template: 'renewal', values: sampleValues(), status: 'published' })
  });
  const res = await fetch(`${base}/page/cacheable`);
  assert.equal(res.headers.get('cache-control'), 'public, max-age=300');
  await fetch(`${base}/api/pages/cacheable`, { method: 'DELETE', headers: AUTH });
});

/* ---------- login gate ---------- */

const COOKIE = { Cookie: 'bv_session=test-token' };

test('GET / without a session redirects to /login', async () => {
  const res = await fetch(`${base}/`, { redirect: 'manual' });
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/login');
});

test('GET /login serves the login form', async () => {
  const res = await fetch(`${base}/login`);
  assert.equal(res.status, 200);
  assert.match(await res.text(), /name="token"/);
});

test('POST /login with the correct token sets an HttpOnly cookie and redirects', async () => {
  const res = await fetch(`${base}/login`, {
    method: 'POST', redirect: 'manual',
    body: new URLSearchParams({ token: 'test-token' })
  });
  assert.equal(res.status, 303);
  assert.equal(res.headers.get('location'), '/');
  const cookie = res.headers.get('set-cookie');
  assert.match(cookie, /bv_session=test-token/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Strict/);
});

test('the session cookie is Secure behind HTTPS and plain on localhost', async () => {
  const https = await fetch(`${base}/login`, {
    method: 'POST', redirect: 'manual',
    headers: { 'x-forwarded-proto': 'https' },
    body: new URLSearchParams({ token: 'test-token' })
  });
  assert.match(https.headers.get('set-cookie'), /Secure/);
  const local = await fetch(`${base}/login`, {
    method: 'POST', redirect: 'manual',
    body: new URLSearchParams({ token: 'test-token' })
  });
  assert.doesNotMatch(local.headers.get('set-cookie'), /Secure/); // 127.0.0.1, no forwarded proto
});

test('POST /login with a wrong token is 401 and sets no cookie', async () => {
  const res = await fetch(`${base}/login`, {
    method: 'POST', redirect: 'manual',
    body: new URLSearchParams({ token: 'nope' })
  });
  assert.equal(res.status, 401);
  assert.equal(res.headers.get('set-cookie'), null);
  assert.match(await res.text(), /Invalid token/);
});

test('GET / with a valid session cookie serves the builder', async () => {
  const res = await fetch(`${base}/`, { headers: COOKIE });
  assert.equal(res.status, 200);
  assert.match(await res.text(), /class="workspace"/);
});

test('the API accepts the session cookie as well as the Bearer header', async () => {
  const viaCookie = await fetch(`${base}/api/pages`, { headers: COOKIE });
  assert.equal(viaCookie.status, 200);
  const viaBearer = await fetch(`${base}/api/pages`, { headers: AUTH });
  assert.equal(viaBearer.status, 200);
  const neither = await fetch(`${base}/api/pages`);
  assert.equal(neither.status, 401);
});

test('GET /logout clears the cookie and then / redirects again', async () => {
  const out = await fetch(`${base}/logout`, { redirect: 'manual' });
  assert.equal(out.status, 302);
  assert.equal(out.headers.get('location'), '/login');
  assert.match(out.headers.get('set-cookie'), /bv_session=;.*Max-Age=0/);
});

/* ---------- analytics + salesforce ---------- */

test('page views count visitors but not the logged-in admin', async () => {
  await fetch(`${base}/api/pages`, {
    method: 'POST', headers: JSON_HEADERS,
    body: JSON.stringify({ slug: 'viewed', template: 'renewal', values: sampleValues(), status: 'published' })
  });
  // visitor 1.1.1.1 visits twice from email (same unique visitor)
  await fetch(`${base}/page/viewed?utm_source=email`, { headers: { 'x-forwarded-for': '1.1.1.1' } });
  await fetch(`${base}/page/viewed?utm_source=email`, { headers: { 'x-forwarded-for': '1.1.1.1' } });
  // visitor 2.2.2.2 visits once from linkedin (second unique visitor)
  await fetch(`${base}/page/viewed?utm_source=linkedin`, { headers: { 'x-forwarded-for': '2.2.2.2' } });
  // admin visit via cookie — must not be counted
  await fetch(`${base}/page/viewed`, { headers: COOKIE });

  const { pages } = await (await fetch(`${base}/api/pages`, { headers: AUTH })).json();
  const row = pages.find(p => p.slug === 'viewed');
  assert.equal(Number(row.views), 3);   // total: 3 prospect views
  assert.equal(row.unique, 2);          // 2 distinct IP hashes
  assert.equal(row.last7, 3);           // all 3 within the last 7 days
  assert.deepEqual(row.sources, { email: 2, linkedin: 1 }); // UTM source breakdown
  assert.ok(row.last_viewed);
  await fetch(`${base}/api/pages/viewed`, { method: 'DELETE', headers: AUTH });
});

test('drafts save server-side, are not served, and go live on publish', async () => {
  // Save as draft (incomplete values allowed) — not live.
  const draft = await fetch(`${base}/api/pages`, {
    method: 'POST', headers: JSON_HEADERS,
    body: JSON.stringify({ slug: 'wip', template: 'renewal', values: sampleValues({ prospect: '' }), status: 'draft' })
  });
  assert.equal(draft.status, 200);
  assert.equal((await draft.json()).status, 'draft');
  assert.equal((await fetch(`${base}/page/wip`)).status, 404);          // draft not live
  const list = await (await fetch(`${base}/api/pages`, { headers: AUTH })).json();
  assert.equal(list.pages.find(p => p.slug === 'wip').status, 'draft'); // listed as draft

  // Publish it → now live.
  const pub = await fetch(`${base}/api/pages`, {
    method: 'POST', headers: JSON_HEADERS,
    body: JSON.stringify({ slug: 'wip', template: 'renewal', values: sampleValues(), status: 'published' })
  });
  assert.equal((await pub.json()).status, 'published');
  assert.equal((await fetch(`${base}/page/wip`)).status, 200);          // live now

  // Save as draft again → unpublished, back to 404.
  await fetch(`${base}/api/pages`, {
    method: 'POST', headers: JSON_HEADERS,
    body: JSON.stringify({ slug: 'wip', template: 'renewal', values: sampleValues(), status: 'draft' })
  });
  assert.equal((await fetch(`${base}/page/wip`)).status, 404);
  await fetch(`${base}/api/pages/wip`, { method: 'DELETE', headers: AUTH });
});

test('Salesforce route requires auth and reports when unconfigured', async () => {
  const noAuth = await fetch(`${base}/api/crm/salesforce/0011234567890ABCDE`);
  assert.equal(noAuth.status, 401);
  // SF_* env vars are not set in tests → graceful 503, not a crash
  const res = await fetch(`${base}/api/crm/salesforce/0011234567890ABCDE`, { headers: AUTH });
  assert.equal(res.status, 503);
  assert.match((await res.json()).error, /not configured/);
});
