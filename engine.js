'use strict';

/*
 * Generic template engine: manifest validation, template registry,
 * config validation and {{token}} rendering. No per-template knowledge —
 * templates are self-contained directories under templates/.
 */

const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, 'templates');
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
const FIELD_ID_RE = /^[a-z][a-z0-9_]*$/;
const FIELD_TYPES = new Set(['text', 'email', 'textarea', 'number']);
const RESERVED_SLUGS = new Set(['api', 'page', 'pages', 'admin', 'builder', 'templates']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validSlug(slug) {
  return typeof slug === 'string' && SLUG_RE.test(slug) && !RESERVED_SLUGS.has(slug);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Default max string length when a text/textarea field does not set one. */
const TEXT_MAX = { text: 1000, textarea: 5000, email: 120 };

/** Validate one value against a field definition. Returns {value} or {error}. */
function checkValue(field, raw) {
  if (field.type === 'number') {
    const n = Number(raw);
    if (typeof raw === 'boolean' || raw === '' || raw === null || !Number.isFinite(n)) {
      return { error: `${field.id}: expected a number` };
    }
    const v = field.int ? Math.round(n) : n;
    if (field.min !== undefined && v < field.min) return { error: `${field.id}: minimum is ${field.min}` };
    if (field.max !== undefined && v > field.max) return { error: `${field.id}: maximum is ${field.max}` };
    return { value: v };
  }
  if (typeof raw !== 'string') return { error: `${field.id}: expected a string` };
  const s = raw.trim();
  const max = field.max !== undefined ? field.max : TEXT_MAX[field.type];
  if (s.length > max) return { error: `${field.id}: max ${max} characters` };
  if (field.required && !s) return { error: `${field.id}: required` };
  if (field.type === 'email' && s && !EMAIL_RE.test(s)) return { error: `${field.id}: invalid email` };
  return { value: s };
}

function fail(msg) { throw new Error(msg); }

/** Validate and normalize a raw template.json. Throws with a precise message. */
function validateManifest(id, raw) {
  if (!validSlug(id)) fail(`template id "${id}": lowercase letters, digits and hyphens only`);
  if (!raw || typeof raw !== 'object') fail(`${id}/template.json: must be a JSON object`);
  if (typeof raw.name !== 'string' || !raw.name.trim()) fail(`${id}/template.json: "name" is required`);
  if (!Array.isArray(raw.fields) || raw.fields.length === 0) fail(`${id}/template.json: "fields" must be a non-empty array`);

  const seen = new Set();
  const fields = raw.fields.map((f) => {
    if (!f || typeof f !== 'object') fail(`${id}: each field must be an object`);
    if (typeof f.id !== 'string' || !FIELD_ID_RE.test(f.id)) fail(`${id}: invalid field id "${f.id}"`);
    if (seen.has(f.id)) fail(`${id}: duplicate field id "${f.id}"`);
    seen.add(f.id);
    if (!FIELD_TYPES.has(f.type)) fail(`${id}.${f.id}: unknown type "${f.type}"`);
    if (typeof f.label !== 'string' || !f.label.trim()) fail(`${id}.${f.id}: "label" is required`);
    for (const k of ['min', 'max', 'step']) {
      if (f[k] !== undefined && typeof f[k] !== 'number') fail(`${id}.${f.id}: "${k}" must be a number`);
    }
    const field = {
      id: f.id, label: f.label.trim(), type: f.type,
      required: !!f.required, int: !!f.int,
      min: f.min, max: f.max, step: f.step,
      placeholder: f.placeholder, hint: f.hint, group: f.group,
      default: f.default
    };
    if (field.default !== undefined) {
      const r = checkValue(field, field.default);
      if (r.error) fail(`${id}.${f.id}: invalid default — ${r.error}`);
      field.default = r.value;
    }
    return field;
  });

  if (raw.nameField !== undefined && !seen.has(raw.nameField)) {
    fail(`${id}: nameField "${raw.nameField}" does not match any field id`);
  }

  return {
    id,
    name: raw.name.trim(),
    description: typeof raw.description === 'string' ? raw.description.trim() : '',
    nameField: raw.nameField,
    fields
  };
}

/** Fallback when a field has no usable value and no default. */
function emptyValue(field) {
  if (field.type !== 'number') return '';
  return typeof field.min === 'number' ? field.min : 0;
}

/**
 * Validate a raw values payload against a manifest.
 * Strict (publish): returns {values} or {error} on the first problem.
 * Lenient (preview): always returns {values, errors} — bad/missing values
 * fall back to the field default (then emptyValue) so a preview always renders.
 */
function validateValues(manifest, raw, { lenient = false } = {}) {
  if (!raw || typeof raw !== 'object') {
    if (!lenient) return { error: 'values: must be an object' };
    raw = {};
  }
  const values = {};
  const errors = [];
  for (const field of manifest.fields) {
    const fallback = field.default !== undefined ? field.default : emptyValue(field);
    const v = raw[field.id];
    const missing = v === undefined || v === null || v === '';
    if (missing) {
      if (field.required) {
        if (!lenient) return { error: `${field.id}: required` };
        errors.push(`${field.id}: required`);
      }
      values[field.id] = fallback;
      continue;
    }
    const r = checkValue(field, v);
    if (r.error) {
      if (!lenient) return { error: r.error };
      errors.push(r.error);
      values[field.id] = fallback;
    } else {
      values[field.id] = r.value;
    }
  }
  return lenient ? { values, errors } : { values };
}

/**
 * Scan a templates directory. Returns Map<id, {manifest, html, dir}>.
 * Throws on any malformed template — callers fail fast at boot.
 */
function loadTemplates(dir = TEMPLATES_DIR) {
  const map = new Map();
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { /* fallthrough to empty */ }
  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    const id = ent.name;
    const tdir = path.join(dir, id);
    const manifestPath = path.join(tdir, 'template.json');
    const htmlPath = path.join(tdir, 'index.html');
    if (!fs.existsSync(manifestPath)) continue; // not a template dir
    let raw;
    try { raw = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); }
    catch (e) { fail(`${id}/template.json: invalid JSON — ${e.message}`); }
    if (!fs.existsSync(htmlPath)) fail(`${id}: missing index.html`);
    map.set(id, {
      manifest: validateManifest(id, raw),
      html: fs.readFileSync(htmlPath, 'utf8'),
      dir: tdir
    });
  }
  if (map.size === 0) fail(`no templates found in ${dir}`);
  return map;
}

let registryCache = null;

/** Cached registry of ./templates — re-scanned per call outside production. */
function registry() {
  if (!registryCache || process.env.NODE_ENV !== 'production') {
    registryCache = loadTemplates();
  }
  return registryCache;
}

function getTemplate(id) {
  return registry().get(id) || null;
}

function listTemplates() {
  return Array.from(registry().values()).map(t => t.manifest);
}

/**
 * Render a template object (from getTemplate/loadTemplates) with validated
 * values. {{field_id}} -> escaped value; {{PAGE_CONFIG_JSON}} -> config JSON.
 * Unknown tokens are left as-is so template-authoring mistakes stay visible.
 */
function renderTemplate(template, values) {
  const tokens = { PAGE_CONFIG_JSON: JSON.stringify({ template: template.manifest.id, values }).replace(/</g, '\\u003c') };
  for (const field of template.manifest.fields) {
    tokens[field.id] = escapeHtml(values[field.id]);
  }
  return template.html.replace(/\{\{([A-Za-z_]\w*)\}\}/g, (m, key) =>
    Object.prototype.hasOwnProperty.call(tokens, key) ? String(tokens[key]) : m
  );
}

module.exports = {
  validateManifest, loadTemplates, getTemplate, listTemplates,
  validateValues, renderTemplate, validSlug, escapeHtml, checkValue, TEMPLATES_DIR
};
