/*
 * Buyerverse — proposal page builder.
 *
 *   GET    /                          builder UI (redirects to /login without a session)
 *   GET    /login                     login page (admin token → session cookie)
 *   POST   /login                     validate token, set bv_session cookie
 *   GET    /logout                    clear the session cookie
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
const salesforce = require('./salesforce');

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const BODY_LIMIT = 100 * 1024;

// Builder-owned static files; template assets go through /templates/<id>/.
const STATIC_FILES = {
  '/styles.css': 'text/css; charset=utf-8',
  '/qr.js': 'text/javascript; charset=utf-8'
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

/** First IP from x-forwarded-for, or empty string. */
function firstForwardedIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
}

/** One-way hash of the visitor's IP (privacy-preserving analytics). */
function visitorHash(req) {
  const ip = firstForwardedIp(req) || req.socket.remoteAddress || '';
  return crypto.createHash('sha256')
    .update(ip + '|' + (process.env.ADMIN_TOKEN || 'salt'))
    .digest('hex')
    .slice(0, 16);
}

/** Sanitized UTM attribution params from a page-view request URL. */
function utmParams(url) {
  const pick = (k) => (url.searchParams.get(k) || '').trim().slice(0, 80);
  return { source: pick('utm_source'), medium: pick('utm_medium'), campaign: pick('utm_campaign') };
}

function sendJSON(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}

function sendHTML(res, status, html, cacheable, extraHeaders) {
  res.writeHead(status, Object.assign({
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': cacheable ? 'public, max-age=300' : 'no-cache'
  }, extraHeaders));
  res.end(html);
}

// Auth pages must not be framable (clickjacking of the login form).
const NO_FRAME = { 'X-Frame-Options': 'DENY' };

const SESSION_COOKIE = 'bv_session';

/** Timing-safe compare of a candidate string against ADMIN_TOKEN. */
function tokenMatches(candidate) {
  if (!ADMIN_TOKEN || typeof candidate !== 'string') return false;
  const a = crypto.createHash('sha256').update(candidate).digest();
  const b = crypto.createHash('sha256').update(ADMIN_TOKEN).digest();
  return crypto.timingSafeEqual(a, b);
}

function parseCookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    if (k) out[k] = part.slice(i + 1).trim();
  }
  return out;
}

/** The session token carried by the bv_session cookie, or null. */
function sessionToken(req) {
  const raw = parseCookies(req)[SESSION_COOKIE];
  if (raw === undefined) return null;
  try { return decodeURIComponent(raw); } catch (e) { return null; }
}

/** Authenticated by either a Bearer header (scripts/API) or the session cookie (browser). */
function authed(req) {
  const m = /^Bearer\s+(.+)$/.exec(req.headers.authorization || '');
  if (m && tokenMatches(m[1])) return true;
  const cookieTok = sessionToken(req);
  return cookieTok !== null && tokenMatches(cookieTok);
}

/**
 * Whether the cookie should carry Secure. Fails CLOSED: Secure is set unless
 * we positively know the request is plaintext localhost dev. Render's proxy
 * sets x-forwarded-proto (first value = real scheme); if it's ever absent we
 * still default to Secure so the token-bearing cookie never leaks over http.
 */
function isSecureContext(req) {
  const proto = (req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  if (proto) return proto === 'https';
  const host = (req.headers.host || '').split(':')[0];
  return !(host === 'localhost' || host === '127.0.0.1' || host === '[::1]');
}

/** Set-Cookie value for the session cookie; clear=true expires it immediately. */
function sessionCookie(req, value, clear) {
  const attrs = [`${SESSION_COOKIE}=${value}`, 'HttpOnly', 'SameSite=Strict', 'Path=/'];
  if (isSecureContext(req)) attrs.push('Secure');
  if (clear) attrs.push('Max-Age=0');
  return attrs.join('; ');
}

/* ---------- login rate limiting ---------- */

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX = 10;
const loginAttempts = new Map(); // ip -> { count, resetAt }

/** Fixed-window limiter on login attempts, keyed by first-hop client IP. */
function loginRateLimited(req) {
  if (loginAttempts.size > 10000) loginAttempts.clear(); // crude unbounded-growth guard
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  let rec = loginAttempts.get(ip);
  if (!rec || now > rec.resetAt) { rec = { count: 0, resetAt: now + LOGIN_WINDOW_MS }; loginAttempts.set(ip, rec); }
  rec.count++;
  return rec.count > LOGIN_MAX;
}

function redirect(res, location, status) {
  res.writeHead(status || 302, { Location: location });
  res.end();
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

function readRaw(req) {
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
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function readBody(req) {
  return readRaw(req).then(raw => {
    try { return JSON.parse(raw || '{}'); }
    catch (e) { throw Object.assign(new Error('invalid JSON body'), { status: 400 }); }
  });
}

/** Login page with an optional error banner injected at the {{ERROR}} marker. */
function renderLogin(message) {
  const html = fs.readFileSync(path.join(ROOT, 'login.html'), 'utf8');
  const banner = message ? `<p class="login-error" role="alert">${engine.escapeHtml(message)}</p>` : '';
  return html.replace('{{ERROR}}', banner);
}

const NOT_FOUND_PAGE = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Page not found</title>
<style>body{font-family:system-ui,sans-serif;background:#0f1f3d;color:#fff;display:grid;place-items:center;min-height:100vh;margin:0}
main{text-align:center}h1{font-size:3rem;margin:0 0 8px}p{color:#9db8f5}</style></head>
<body><main><h1>404</h1><p>This proposal page does not exist.</p></main></body></html>`;

/* ---------- routes ---------- */

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); }
  catch (e) { return sendHTML(res, 404, NOT_FOUND_PAGE, false); } // malformed escape — client error, not ours

  // Login
  if (pathname === '/login' && req.method === 'GET') {
    if (!ADMIN_TOKEN) return sendHTML(res, 200, renderLogin('This server has no ADMIN_TOKEN configured.'), false, NO_FRAME);
    if (authed(req)) return redirect(res, '/');
    return sendHTML(res, 200, renderLogin(''), false, NO_FRAME);
  }
  if (pathname === '/login' && req.method === 'POST') {
    if (!ADMIN_TOKEN) return sendHTML(res, 503, renderLogin('This server has no ADMIN_TOKEN configured.'), false, NO_FRAME);
    if (loginRateLimited(req)) return sendHTML(res, 429, renderLogin('Too many attempts. Wait a few minutes and try again.'), false, NO_FRAME);
    let raw;
    try { raw = await readRaw(req); }
    catch (e) { return sendHTML(res, e.status || 400, renderLogin('Could not read the request.'), false, NO_FRAME); }
    const token = new URLSearchParams(raw).get('token') || '';
    if (!tokenMatches(token)) return sendHTML(res, 401, renderLogin('Invalid token. Try again.'), false, NO_FRAME);
    res.writeHead(303, { 'Set-Cookie': sessionCookie(req, encodeURIComponent(token), false), Location: '/' });
    return res.end();
  }
  if (pathname === '/logout') {
    res.writeHead(302, { 'Set-Cookie': sessionCookie(req, '', true), Location: '/login' });
    return res.end();
  }

  // Builder UI (gated — the only page behind auth; proposal pages stay public)
  if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
    if (!authed(req)) return redirect(res, '/login');
    return sendHTML(res, 200, fs.readFileSync(path.join(ROOT, 'builder.html'), 'utf8'), false, NO_FRAME);
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
    // Count prospect visits only — don't inflate analytics with the AM's own previews.
    if (!authed(req)) store.recordView(slug, visitorHash(req), utmParams(url)).catch(() => {});
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
    const s = await store.stats();
    return sendJSON(res, 200, {
      pages: pages.map(p => ({
        ...p,
        unique: (s[p.slug] && s[p.slug].unique) || 0,
        last7: (s[p.slug] && s[p.slug].last7) || 0,
        sources: (s[p.slug] && s[p.slug].sources) || {}
      }))
    });
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

  // Salesforce autofill — paste an Account/Contact ID to prefill prospect + AM
  const sfMatch = /^\/api\/crm\/salesforce\/([^/]+)$/.exec(pathname);
  if (sfMatch && req.method === 'GET') {
    if (!requireAuth(req, res)) return;
    try {
      const { values } = await salesforce.lookup(sfMatch[1]);
      return sendJSON(res, 200, { values });
    } catch (e) {
      return sendJSON(res, e.status || 502, { error: e.message });
    }
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

module.exports = { server, start };
