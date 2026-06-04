'use strict';

/*
 * Template rendering and config validation. FR copy is rendered
 * server-side ({{TOKEN}} substitution into template.html); the EN
 * translation layer reads the same values client-side from the
 * injected window.PAGE_CONFIG.
 */

const fs = require('fs');
const path = require('path');

const TEMPLATE_PATH = path.join(__dirname, 'template.html');
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
const RESERVED_SLUGS = new Set(['api', 'page', 'pages', 'admin', 'builder']);

const nfFR = new Intl.NumberFormat('fr-FR');
const nfFR1 = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';
}

function priceRows(pricing) {
  return pricing.discounts.map(d =>
    pricing.initial.map(p => Math.round(p * (1 - d / 100)))
  );
}

/* ---------- validation ---------- */

function num(v, { int = false, min = 0, max = Infinity } = {}) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return int ? Math.round(n) : n;
}

function str(v, max) {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (!s || s.length > max) return null;
  return s;
}

function validSlug(slug) {
  return typeof slug === 'string' && SLUG_RE.test(slug) && !RESERVED_SLUGS.has(slug);
}

function triple(arr, opts) {
  if (!Array.isArray(arr) || arr.length !== 3) return null;
  const out = arr.map(v => num(v, opts));
  return out.includes(null) ? null : out;
}

/** Validate and normalize a raw config payload. Returns {config} or {error}. */
function validateConfig(raw) {
  if (!raw || typeof raw !== 'object') return { error: 'config must be an object' };

  const prospect = str(raw.prospect, 80);
  if (!prospect) return { error: 'prospect: required, max 80 chars' };

  const am = raw.am || {};
  const amName = str(am.name, 80);
  const amEmail = str(am.email, 120);
  if (!amName) return { error: 'am.name: required, max 80 chars' };
  if (!amEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(amEmail)) return { error: 'am.email: invalid email' };

  const k = raw.kpis || {};
  const kpis = {
    schools: num(k.schools, { int: true }),
    users: num(k.users, { int: true }),
    sessions: num(k.sessions, { int: true }),
    registrants: num(k.registrants, { int: true }),
    attendees: num(k.attendees, { int: true }),
    rate: num(k.rate, { max: 100 }),
    nps: num(k.nps, { max: 10 })
  };
  for (const [key, v] of Object.entries(kpis)) {
    if (v === null) return { error: `kpis.${key}: invalid number` };
  }

  const p = raw.pricing || {};
  const pricing = {
    currentAnnual: num(p.currentAnnual, { int: true }),
    volumes: triple(p.volumes, { int: true }),
    discounts: triple(p.discounts, { max: 99 }),
    initial: triple(p.initial, { int: true })
  };
  if (pricing.currentAnnual === null) return { error: 'pricing.currentAnnual: invalid number' };
  if (!pricing.volumes) return { error: 'pricing.volumes: expected 3 numbers' };
  if (!pricing.discounts) return { error: 'pricing.discounts: expected 3 numbers (0-99)' };
  if (!pricing.initial) return { error: 'pricing.initial: expected 3 numbers' };

  return { config: { prospect, am: { name: amName, email: amEmail }, kpis, pricing } };
}

/* ---------- rendering ---------- */

let templateCache = null;

function loadTemplate() {
  if (!templateCache || process.env.NODE_ENV !== 'production') {
    templateCache = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  }
  return templateCache;
}

function renderPage(config) {
  const { prospect, am, kpis, pricing } = config;
  const rows = priceRows(pricing);

  const pageConfig = {
    prospect,
    am: { name: am.name, email: am.email, initials: initials(am.name) },
    kpis,
    pricing: { ...pricing, rows }
  };

  const tokens = {
    PROSPECT: escapeHtml(prospect),
    AM_NAME: escapeHtml(am.name),
    AM_EMAIL: escapeHtml(am.email),
    AM_INITIALS: escapeHtml(initials(am.name)),

    SCHOOLS_RAW: kpis.schools,
    USERS_RAW: kpis.users,
    SESSIONS_RAW: kpis.sessions,
    REGISTRANTS_RAW: kpis.registrants,
    ATTENDEES_RAW: kpis.attendees,
    RATE_RAW: kpis.rate,
    NPS_RAW: kpis.nps,

    SCHOOLS_FR: nfFR.format(kpis.schools),
    USERS_FR: nfFR.format(kpis.users),
    SESSIONS_FR: nfFR.format(kpis.sessions),
    REGISTRANTS_FR: nfFR.format(kpis.registrants),
    ATTENDEES_FR: nfFR.format(kpis.attendees),
    RATE_FR: nfFR.format(kpis.rate) + ' %',
    NPS_FR: nfFR1.format(kpis.nps),

    CURRENT_K_FR: nfFR.format(Math.round(pricing.currentAnnual / 1000)) + ' K€',
    VOL1_FR: nfFR.format(pricing.volumes[0]),
    VOL2_FR: nfFR.format(pricing.volumes[1]),
    VOL3_FR: nfFR.format(pricing.volumes[2]),
    D1: nfFR.format(pricing.discounts[0]),
    D2: nfFR.format(pricing.discounts[1]),
    D3: nfFR.format(pricing.discounts[2]),
    P_INIT1_FR: nfFR.format(pricing.initial[0]) + ' €',
    P_INIT2_FR: nfFR.format(pricing.initial[1]) + ' €',
    P_INIT3_FR: nfFR.format(pricing.initial[2]) + ' €',
    P_R1C1_FR: nfFR.format(rows[0][0]) + ' €',
    P_R1C2_FR: nfFR.format(rows[0][1]) + ' €',
    P_R1C3_FR: nfFR.format(rows[0][2]) + ' €',
    P_R2C1_FR: nfFR.format(rows[1][0]) + ' €',
    P_R2C2_FR: nfFR.format(rows[1][1]) + ' €',
    P_R2C3_FR: nfFR.format(rows[1][2]) + ' €',
    P_R3C1_FR: nfFR.format(rows[2][0]) + ' €',
    P_R3C2_FR: nfFR.format(rows[2][1]) + ' €',
    P_R3C3_FR: nfFR.format(rows[2][2]) + ' €',

    // <-escaping keeps the JSON safe inside a <script> element.
    PAGE_CONFIG_JSON: JSON.stringify(pageConfig).replace(/</g, '\\u003c')
  };

  return loadTemplate().replace(/\{\{(\w+)\}\}/g, (m, key) =>
    Object.prototype.hasOwnProperty.call(tokens, key) ? String(tokens[key]) : m
  );
}

module.exports = { renderPage, validateConfig, validSlug, SLUG_RE };
