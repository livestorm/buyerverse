/*
 * Buyerverse — proposal page builder.
 *
 *   GET    /                          builder UI
 *   GET    /page/<slug>               rendered proposal page (public)
 *   GET    /templates/<id>/<asset>    template assets (public)
 *   GET    /api/templates             list template manifests (public)
 *   POST   /api/preview               render without storing (Bearer ADMIN_TOKEN)
 *   GET    /api/pages                 list pages            (Bearer ADMIN_TOKEN)
 *   POST   /api/pages                 create/update a page  (Bearer ADMIN_TOKEN)
 *   DELETE /api/pages/<slug>          delete a page         (Bearer ADMIN_TOKEN)
 *
 * Render runs `pnpm start` and injects PORT.
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const store = require('./store');
const engine = require('./engine');

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const BODY_LIMIT = 100 * 1024;

// Builder-owned static files; template assets go through /templates/<id>/.
const STATIC_FILES = {
  '/styles.css': 'text/css; charset=utf-8'
};

const ASSET_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon'
};

/* ---------- helpers ---------- */

function sendJSON(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}

function sendHTML(res, status, html, cacheable) {
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': cacheable ? 'public, max-age=300' : 'no-cache'
  });
  res.end(html);
}

function authed(req) {
  if (!ADMIN_TOKEN) return false;
  const m = /^Bearer\s+(.+)$/.exec(req.headers.authorization || '');
  if (!m) return false;
  const a = crypto.createHash('sha256').update(m[1]).digest();
  const b = crypto.createHash('sha256').update(ADMIN_TOKEN).digest();
  return crypto.timingSafeEqual(a, b);
}

function requireAuth(req, res) {
  if (!ADMIN_TOKEN) {
    sendJSON(res, 503, { error: 'ADMIN_TOKEN is not configured on the server' });
    return false;
  }
  if (!authed(req)) {
    sendJSON(res, 401, { error: 'Invalid or missing admin token' });
    return false;
  }
  return true;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', c => {
      size += c.length;
      if (size > BODY_LIMIT) {
        reject(Object.assign(new Error('payload too large'), { status: 413 }));
        // Stop buffering but keep the socket alive: discard the rest of the
        // body so the 413 response can actually reach the client.
        req.removeAllListeners('data');
        req.removeAllListeners('end');
        req.resume();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch (e) { reject(Object.assign(new Error('invalid JSON body'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}

const NOT_FOUND_PAGE = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Page not found</title>
<style>body{font-family:system-ui,sans-serif;background:#0f1f3d;color:#fff;display:grid;place-items:center;min-height:100vh;margin:0}
main{text-align:center}h1{font-size:3rem;margin:0 0 8px}p{color:#9db8f5}</style></head>
<body><main><h1>404</h1><p>This proposal page does not exist.</p></main></body></html>`;

/* ---------- legacy conversion ---------- */

/** Convert a pre-templates config row ({prospect, am, kpis, pricing}) to the galileo template shape. */
function legacyToGalileo(c) {
  return {
    template: 'galileo',
    values: {
      prospect: c.prospect, am_name: c.am.name, am_email: c.am.email,
      kpi_schools: c.kpis.schools, kpi_users: c.kpis.users, kpi_sessions: c.kpis.sessions,
      kpi_registrants: c.kpis.registrants, kpi_attendees: c.kpis.attendees,
      kpi_rate: c.kpis.rate, kpi_nps: c.kpis.nps,
      price_current: c.pricing.currentAnnual,
      vol_1: c.pricing.volumes[0], vol_2: c.pricing.volumes[1], vol_3: c.pricing.volumes[2],
      discount_1: c.pricing.discounts[0], discount_2: c.pricing.discounts[1], discount_3: c.pricing.discounts[2],
      price_1: c.pricing.initial[0], price_2: c.pricing.initial[1], price_3: c.pricing.initial[2]
    }
  };
}

async function convertLegacyPages() {
  for (const row of await store.list()) {
    if (!row.config.template && row.config.prospect) {
      try {
        await store.upsert(row.slug, legacyToGalileo(row.config));
        console.log(`converted legacy page /page/${row.slug} to template galileo`);
      } catch (e) {
        // A partial legacy row must not take the whole service down.
        console.error(`skipping legacy page /page/${row.slug}: ${e.message}`);
      }
    }
  }
}

/* ---------- routes ---------- */

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); }
  catch (e) { return sendHTML(res, 404, NOT_FOUND_PAGE, false); } // malformed escape — client error, not ours

  // Builder UI
  if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
    return sendHTML(res, 200, fs.readFileSync(path.join(ROOT, 'builder.html'), 'utf8'), false);
  }

  // Builder static assets (whitelist)
  if (req.method === 'GET' && STATIC_FILES[pathname]) {
    const body = fs.readFileSync(path.join(ROOT, pathname));
    res.writeHead(200, { 'Content-Type': STATIC_FILES[pathname], 'Cache-Control': 'public, max-age=3600' });
    return res.end(body);
  }

  // Template assets — single flat segment, extension whitelist, no manifest/index
  const assetMatch = /^\/templates\/([^/]+)\/([^/]+)$/.exec(pathname);
  if (req.method === 'GET' && assetMatch) {
    const [, id, file] = assetMatch;
    const t = engine.getTemplate(id);
    const ext = path.extname(file).toLowerCase();
    if (!t || !ASSET_TYPES[ext] || file === 'template.json' || file === 'index.html') {
      return sendJSON(res, 404, { error: 'not found' });
    }
    const full = path.join(t.dir, file);
    if (!full.startsWith(t.dir + path.sep) || !fs.existsSync(full)) {
      return sendJSON(res, 404, { error: 'not found' });
    }
    res.writeHead(200, { 'Content-Type': ASSET_TYPES[ext], 'Cache-Control': 'public, max-age=3600' });
    return res.end(fs.readFileSync(full));
  }

  // Rendered proposal pages
  const pageMatch = /^\/page\/([^/]+)\/?$/.exec(pathname);
  if (req.method === 'GET' && pageMatch) {
    const slug = pageMatch[1];
    if (!engine.validSlug(slug)) return sendHTML(res, 404, NOT_FOUND_PAGE, false);
    const row = await store.get(slug);
    if (!row) return sendHTML(res, 404, NOT_FOUND_PAGE, false);
    const t = engine.getTemplate(row.config.template);
    if (!t) return sendHTML(res, 404, NOT_FOUND_PAGE, false); // template removed from repo
    return sendHTML(res, 200, engine.renderTemplate(t, row.config.values), true);
  }

  // API
  if (pathname === '/api/templates' && req.method === 'GET') {
    return sendJSON(res, 200, { templates: engine.listTemplates() });
  }

  if (pathname === '/api/preview' && req.method === 'POST') {
    if (!requireAuth(req, res)) return;
    let body;
    try { body = await readBody(req); }
    catch (e) { return sendJSON(res, e.status || 400, { error: e.message }); }
    const t = engine.getTemplate(body.template);
    if (!t) return sendJSON(res, 400, { error: 'unknown template' });
    const { values, errors } = engine.validateValues(t.manifest, body.values, { lenient: true });
    return sendJSON(res, 200, { html: engine.renderTemplate(t, values), errors });
  }

  if (pathname === '/api/pages' && req.method === 'GET') {
    if (!requireAuth(req, res)) return;
    const pages = await store.list();
    return sendJSON(res, 200, { pages });
  }

  if (pathname === '/api/pages' && req.method === 'POST') {
    if (!requireAuth(req, res)) return;
    let body;
    try { body = await readBody(req); }
    catch (e) { return sendJSON(res, e.status || 400, { error: e.message }); }

    if (!engine.validSlug(body.slug)) return sendJSON(res, 400, { error: 'slug: lowercase letters, digits and hyphens only' });
    const t = engine.getTemplate(body.template);
    if (!t) return sendJSON(res, 400, { error: 'unknown template' });
    const { values, error } = engine.validateValues(t.manifest, body.values);
    if (error) return sendJSON(res, 400, { error });

    await store.upsert(body.slug, { template: t.manifest.id, values });
    return sendJSON(res, 200, { ok: true, slug: body.slug, url: '/page/' + body.slug });
  }

  const apiMatch = /^\/api\/pages\/([^/]+)$/.exec(pathname);
  if (apiMatch && req.method === 'DELETE') {
    if (!requireAuth(req, res)) return;
    const removed = await store.remove(apiMatch[1]);
    return sendJSON(res, removed ? 200 : 404, removed ? { ok: true } : { error: 'page not found' });
  }

  if (pathname.startsWith('/api/')) return sendJSON(res, 404, { error: 'not found' });
  sendHTML(res, 404, NOT_FOUND_PAGE, false);
}

const server = http.createServer((req, res) => {
  handle(req, res).catch(err => {
    console.error('unhandled error:', err);
    if (!res.headersSent) sendJSON(res, 500, { error: 'internal error' });
    else res.end();
  });
});

/* ---------- boot ---------- */

async function start(port = PORT) {
  engine.loadTemplates(); // fail fast on malformed templates
  await store.init();
  await convertLegacyPages();
  if (!(await store.get('galileo'))) {
    const g = engine.getTemplate('galileo');
    if (g) {
      const { values } = engine.validateValues(g.manifest, {}, { lenient: true }); // defaults
      await store.upsert('galileo', { template: 'galileo', values });
      console.log('seeded /page/galileo');
    }
  }
  return new Promise((resolve, reject) => {
    server.listen(port, '0.0.0.0', () => {
      const actual = server.address().port;
      console.log(`buyerverse (${store.kind} store, ${engine.listTemplates().length} templates) listening on port ${actual}`);
      resolve(actual);
    });
    server.on('error', reject);
  });
}

if (require.main === module) {
  start().catch(err => {
    console.error('failed to start:', err);
    process.exit(1);
  });
}

module.exports = { server, start, legacyToGalileo };
