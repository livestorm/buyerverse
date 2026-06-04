/*
 * Buyerverse — proposal page builder.
 *
 *   GET    /                  builder UI
 *   GET    /page/<slug>       rendered proposal page (public)
 *   GET    /api/pages         list pages            (Bearer ADMIN_TOKEN)
 *   POST   /api/pages         create/update a page  (Bearer ADMIN_TOKEN)
 *   DELETE /api/pages/<slug>  delete a page         (Bearer ADMIN_TOKEN)
 *
 * Render runs `yarn start` and injects PORT.
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const store = require('./store');
const { renderPage, validateConfig, validSlug } = require('./render');
const { GALILEO } = require('./defaults');

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const BODY_LIMIT = 100 * 1024;

// Only these files are served statically; pages and the builder go
// through explicit routes.
const STATIC_FILES = {
  '/styles.css': 'text/css; charset=utf-8',
  '/app.js': 'text/javascript; charset=utf-8'
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
      if (size > BODY_LIMIT) { reject(Object.assign(new Error('payload too large'), { status: 413 })); req.destroy(); return; }
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

/* ---------- routes ---------- */

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const pathname = decodeURIComponent(url.pathname);

  // Builder UI
  if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
    return sendHTML(res, 200, fs.readFileSync(path.join(ROOT, 'builder.html'), 'utf8'), false);
  }

  // Static assets (whitelist)
  if (req.method === 'GET' && STATIC_FILES[pathname]) {
    const body = fs.readFileSync(path.join(ROOT, pathname));
    res.writeHead(200, { 'Content-Type': STATIC_FILES[pathname], 'Cache-Control': 'public, max-age=3600' });
    return res.end(body);
  }

  // Rendered proposal pages
  const pageMatch = /^\/page\/([^/]+)\/?$/.exec(pathname);
  if (req.method === 'GET' && pageMatch) {
    const slug = pageMatch[1];
    if (!validSlug(slug)) return sendHTML(res, 404, NOT_FOUND_PAGE, false);
    const row = await store.get(slug);
    if (!row) return sendHTML(res, 404, NOT_FOUND_PAGE, false);
    return sendHTML(res, 200, renderPage(row.config), true);
  }

  // API
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

    if (!validSlug(body.slug)) return sendJSON(res, 400, { error: 'slug: lowercase letters, digits and hyphens only' });
    const { config, error } = validateConfig(body.config);
    if (error) return sendJSON(res, 400, { error });

    await store.upsert(body.slug, config);
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

(async () => {
  await store.init();
  if (!(await store.get('galileo'))) {
    await store.upsert('galileo', GALILEO);
    console.log('seeded /page/galileo');
  }
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`buyerverse (${store.kind} store) listening on port ${PORT}`);
  });
})().catch(err => {
  console.error('failed to start:', err);
  process.exit(1);
});
