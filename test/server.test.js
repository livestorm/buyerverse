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
  const { url } = await post.json();          // /page/acme/<token>
  assert.match(url, /^\/page\/acme\/[A-Za-z0-9_-]{16,}$/);
  const page = await fetch(`${base}${url}`);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /<title>Acme × Livestorm/);
  assert.equal((await fetch(`${base}/page/acme`)).status, 404);      // bare slug is no longer accessible
  const del = await fetch(`${base}/api/pages/acme`, { method: 'DELETE', headers: AUTH });
  assert.equal(del.status, 200);
  assert.equal((await fetch(`${base}${url}`)).status, 404);
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

test('rendered pages are cacheable, noindex, and no-referrer', async () => {
  const post = await fetch(`${base}/api/pages`, {
    method: 'POST', headers: JSON_HEADERS,
    body: JSON.stringify({ slug: 'cacheable', template: 'renewal', values: sampleValues(), status: 'published' })
  });
  const { url } = await post.json();
  const res = await fetch(`${base}${url}`);
  assert.equal(res.headers.get('cache-control'), 'public, max-age=300');
  assert.match(res.headers.get('x-robots-tag') || '', /noindex/);          // keep proposals out of search
  assert.equal(res.headers.get('referrer-policy'), 'no-referrer');         // don't leak the capability URL
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
  const post = await fetch(`${base}/api/pages`, {
    method: 'POST', headers: JSON_HEADERS,
    body: JSON.stringify({ slug: 'viewed', template: 'renewal', values: sampleValues(), status: 'published' })
  });
  const pageUrl = `${base}${(await post.json()).url}`; // /page/viewed/<token>
  // visitor 1.1.1.1 visits twice from email (same unique visitor)
  await fetch(`${pageUrl}?utm_source=email`, { headers: { 'x-forwarded-for': '1.1.1.1' } });
  await fetch(`${pageUrl}?utm_source=email`, { headers: { 'x-forwarded-for': '1.1.1.1' } });
  // visitor 2.2.2.2 visits once from linkedin (second unique visitor)
  await fetch(`${pageUrl}?utm_source=linkedin`, { headers: { 'x-forwarded-for': '2.2.2.2' } });
  // admin visit via cookie — must not be counted
  await fetch(pageUrl, { headers: COOKIE });

  const { pages } = await (await fetch(`${base}/api/pages`, { headers: AUTH })).json();
  const row = pages.find(p => p.slug === 'viewed');
  assert.equal(Number(row.views), 3);   // total: 3 prospect views
  assert.equal(row.unique, 2);          // 2 distinct IP hashes
  assert.equal(row.last7, 3);           // all 3 within the last 7 days
  assert.deepEqual(row.sources, { email: 2, linkedin: 1 }); // UTM source breakdown
  assert.ok(row.last_viewed);
  await fetch(`${base}/api/pages/viewed`, { method: 'DELETE', headers: AUTH });
});

test('engagement beacon: /api/track records sections + dwell/depth and surfaces in analytics', async () => {
  const post = await fetch(`${base}/api/pages`, {
    method: 'POST', headers: JSON_HEADERS,
    body: JSON.stringify({ slug: 'eng', template: 'renewal', values: sampleValues(), status: 'published' })
  });
  // The public page carries the engagement beacon with its slug baked in.
  const html = await (await fetch(`${base}${(await post.json()).url}`)).text();
  assert.match(html, /navigator\.sendBeacon\('\/api\/track'/);
  assert.match(html, /var slug="eng"/);

  const trackHeaders = (ip) => ({ 'Content-Type': 'application/json', 'x-forwarded-for': ip });
  // visitor A reaches two sections; visitor B reaches one
  const t1 = await fetch(`${base}/api/track`, { method: 'POST', headers: trackHeaders('3.3.3.3'), body: JSON.stringify({ slug: 'eng', sections: ['partenariat', 'offre'], dwell: 42, depth: 80 }) });
  assert.equal(t1.status, 204);
  await fetch(`${base}/api/track`, { method: 'POST', headers: trackHeaders('4.4.4.4'), body: JSON.stringify({ slug: 'eng', sections: ['partenariat'], dwell: 20, depth: 50 }) });
  // the admin's own beacon (session cookie) must not count
  await fetch(`${base}/api/track`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...COOKIE }, body: JSON.stringify({ slug: 'eng', sections: ['contact'], dwell: 999, depth: 100 }) });

  const { pages } = await (await fetch(`${base}/api/pages`, { headers: AUTH })).json();
  const row = pages.find(p => p.slug === 'eng');
  assert.equal(row.sections.partenariat, 2);     // both prospect visitors
  assert.equal(row.sections.offre, 1);           // visitor A only
  assert.equal(row.sections.contact, undefined); // admin not recorded
  assert.equal(row.dwell, 31);                   // avg of per-visitor max dwell (42, 20)
  assert.equal(row.depth, 65);                   // avg of per-visitor max depth (80, 50)
  await fetch(`${base}/api/pages/eng`, { method: 'DELETE', headers: AUTH });
});

test('/api/track is a clean 204 no-op for drafts and unknown slugs', async () => {
  await fetch(`${base}/api/pages`, {
    method: 'POST', headers: JSON_HEADERS,
    body: JSON.stringify({ slug: 'eng-draft', template: 'renewal', values: sampleValues({ prospect: '' }), status: 'draft' })
  });
  const draft = await fetch(`${base}/api/track`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '5.5.5.5' }, body: JSON.stringify({ slug: 'eng-draft', sections: ['offre'], dwell: 10, depth: 30 }) });
  assert.equal(draft.status, 204);
  const unknown = await fetch(`${base}/api/track`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '5.5.5.5' }, body: JSON.stringify({ slug: 'does-not-exist', sections: ['offre'], dwell: 10, depth: 30 }) });
  assert.equal(unknown.status, 204);
  // nothing recorded for the draft
  const { pages } = await (await fetch(`${base}/api/pages`, { headers: AUTH })).json();
  const row = pages.find(p => p.slug === 'eng-draft');
  assert.deepEqual(row.sections, {});
  assert.equal(row.dwell, 0);
  await fetch(`${base}/api/pages/eng-draft`, { method: 'DELETE', headers: AUTH });
});

test('drafts save server-side, are not served, and go live on publish', async () => {
  // Save as draft (incomplete values allowed) — not live.
  const draft = await fetch(`${base}/api/pages`, {
    method: 'POST', headers: JSON_HEADERS,
    body: JSON.stringify({ slug: 'wip', template: 'renewal', values: sampleValues({ prospect: '' }), status: 'draft' })
  });
  assert.equal(draft.status, 200);
  const draftJson = await draft.json();
  assert.equal(draftJson.status, 'draft');
  assert.equal((await fetch(`${base}${draftJson.url}`)).status, 404); // draft not live (even with the token)
  const list = await (await fetch(`${base}/api/pages`, { headers: AUTH })).json();
  assert.equal(list.pages.find(p => p.slug === 'wip').status, 'draft'); // listed as draft

  // Publish it → now live. The capability token is preserved across the change.
  const pub = await fetch(`${base}/api/pages`, {
    method: 'POST', headers: JSON_HEADERS,
    body: JSON.stringify({ slug: 'wip', template: 'renewal', values: sampleValues(), status: 'published' })
  });
  const pubJson = await pub.json();
  assert.equal(pubJson.status, 'published');
  assert.equal(pubJson.url, draftJson.url);                            // stable token
  assert.equal((await fetch(`${base}${pubJson.url}`)).status, 200);    // live now

  // Save as draft again → unpublished, back to 404.
  await fetch(`${base}/api/pages`, {
    method: 'POST', headers: JSON_HEADERS,
    body: JSON.stringify({ slug: 'wip', template: 'renewal', values: sampleValues(), status: 'draft' })
  });
  assert.equal((await fetch(`${base}${pubJson.url}`)).status, 404);
  await fetch(`${base}/api/pages/wip`, { method: 'DELETE', headers: AUTH });
});

test('proposal pages require the capability token in the URL', async () => {
  const post = await fetch(`${base}/api/pages`, {
    method: 'POST', headers: JSON_HEADERS,
    body: JSON.stringify({ slug: 'secret', template: 'renewal', values: sampleValues(), status: 'published' })
  });
  const { url } = await post.json();
  const token = url.split('/').pop();
  assert.ok(token.length >= 16, 'token has real entropy');
  assert.equal((await fetch(`${base}${url}`)).status, 200);                                    // right token
  assert.equal((await fetch(`${base}/page/secret`)).status, 404);                              // no token
  assert.equal((await fetch(`${base}/page/secret/totally-wrong-token-1234`)).status, 404);     // wrong token
  await fetch(`${base}/api/pages/secret`, { method: 'DELETE', headers: AUTH });
});

test('rotating a token disables the old link and mints a working new one', async () => {
  const post = await fetch(`${base}/api/pages`, {
    method: 'POST', headers: JSON_HEADERS,
    body: JSON.stringify({ slug: 'rot', template: 'renewal', values: sampleValues(), status: 'published' })
  });
  const url1 = (await post.json()).url;
  assert.equal((await fetch(`${base}${url1}`)).status, 200);

  const rot = await fetch(`${base}/api/pages/rot/rotate`, { method: 'POST', headers: AUTH });
  assert.equal(rot.status, 200);
  const url2 = (await rot.json()).url;
  assert.notEqual(url2, url1);                                  // fresh token
  assert.equal((await fetch(`${base}${url2}`)).status, 200);    // new link works
  assert.equal((await fetch(`${base}${url1}`)).status, 404);    // old link is dead

  assert.equal((await fetch(`${base}/api/pages/rot/rotate`, { method: 'POST' })).status, 401);          // needs auth
  assert.equal((await fetch(`${base}/api/pages/ghost/rotate`, { method: 'POST', headers: AUTH })).status, 404); // unknown slug
  await fetch(`${base}/api/pages/rot`, { method: 'DELETE', headers: AUTH });
});

test('repeated bad page guesses are rate-limited', async () => {
  const headers = { 'x-forwarded-for': '9.9.9.9' };
  let blocked = false;
  for (let i = 0; i < 40 && !blocked; i++) {
    const r = await fetch(`${base}/page/guess-${i}/wrongtokenwrongtoken`, { headers });
    if (r.status === 429) blocked = true;
  }
  assert.ok(blocked, 'expected a 429 once an IP exceeds the miss budget');
});

test('outreach variants: stored + normalized, rendered per utm_content, tracked by touch', async () => {
  const post = await fetch(`${base}/api/pages`, {
    method: 'POST', headers: JSON_HEADERS,
    body: JSON.stringify({
      slug: 'var', template: 'renewal', status: 'published', values: sampleValues(),
      variants: [
        { id: 'email1', channel: 'email', step: 1, label: 'cold', overrides: { 'hero.title': 'Cold open', 'nope.key': 'dropped' } },
        { channel: 'linkedin', step: 2 } // id derived, no overrides
      ]
    })
  });
  const { url } = await post.json();

  // stored + normalized: bad override key dropped, second id derived from channel+step
  const list = await (await fetch(`${base}/api/pages`, { headers: AUTH })).json();
  const vs = list.pages.find(p => p.slug === 'var').config.variants;
  assert.equal(vs.length, 2);
  assert.equal(vs[0].overrides['hero.title'], 'Cold open');
  assert.equal(vs[0].overrides['nope.key'], undefined); // not a declared touchField
  assert.equal(vs[1].id, 'li2');

  // the rendered page carries the per-touch overrides for page.js to apply
  const html = await (await fetch(`${base}${url}`)).text();
  assert.match(html, /variantOverrides/);
  assert.match(html, /Cold open/);

  // a view tagged with utm_content is attributed to that touch
  await fetch(`${base}${url}?utm_source=email&utm_content=email1`, { headers: { 'x-forwarded-for': '7.7.7.7' } });
  const list2 = await (await fetch(`${base}/api/pages`, { headers: AUTH })).json();
  assert.equal(list2.pages.find(p => p.slug === 'var').touches.email1, 1);
  await fetch(`${base}/api/pages/var`, { method: 'DELETE', headers: AUTH });
});

test('lemlist push route: requires auth, a published proposal, and reports when unconfigured', async () => {
  assert.equal((await fetch(`${base}/api/crm/lemlist`, { method: 'POST' })).status, 401); // no auth
  // unknown proposal → 404
  const unknown = await fetch(`${base}/api/crm/lemlist`, {
    method: 'POST', headers: JSON_HEADERS,
    body: JSON.stringify({ slug: 'ghost', campaignId: 'c1', email: 'a@b.co' })
  });
  assert.equal(unknown.status, 404);
  // a real published proposal, but LEMLIST_API_KEY isn't set in tests → graceful 503
  await fetch(`${base}/api/pages`, {
    method: 'POST', headers: JSON_HEADERS,
    body: JSON.stringify({ slug: 'llp', template: 'renewal', values: sampleValues(), status: 'published' })
  });
  const res = await fetch(`${base}/api/crm/lemlist`, {
    method: 'POST', headers: JSON_HEADERS,
    body: JSON.stringify({ slug: 'llp', campaignId: 'c1', email: 'jane@acme.com' })
  });
  assert.equal(res.status, 503);
  assert.match((await res.json()).error, /not configured/);
  await fetch(`${base}/api/pages/llp`, { method: 'DELETE', headers: AUTH });
});

test('Salesforce route requires auth and reports when unconfigured', async () => {
  const noAuth = await fetch(`${base}/api/crm/salesforce/0011234567890ABCDE`);
  assert.equal(noAuth.status, 401);
  // SF_* env vars are not set in tests → graceful 503, not a crash
  const res = await fetch(`${base}/api/crm/salesforce/0011234567890ABCDE`, { headers: AUTH });
  assert.equal(res.status, 503);
  assert.match((await res.json()).error, /not configured/);
});
