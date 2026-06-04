# Template Selection + Live Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single hardcoded proposal template with a `templates/` directory of manifest-driven templates, and add a side-by-side live preview to the builder.

**Architecture:** A new generic engine (`engine.js`) scans `templates/<id>/` directories, validates configs against each template's `template.json` field schema, and does `{{token}}` substitution into the template's `index.html`. The server exposes `/api/templates`, `/api/preview` (lenient validation, nothing stored), and `/templates/<id>/<asset>`. The builder generates its form from the selected manifest and renders a debounced preview into an iframe. The existing Galileo page migrates to `templates/galileo/` with all derived values (price matrix, FR/EN number formatting) computed in its own `page.js`.

**Tech Stack:** Node 18+ (zero runtime deps beyond `pg`), `node:test` built-in test runner, vanilla JS in the browser.

**Spec:** `docs/superpowers/specs/2026-06-04-templates-preview-design.md`

**Spec amendment (decided during planning):** `POST /api/preview` returns JSON `{html, errors}` rather than raw HTML — the builder needs the lenient-validation errors alongside the rendered page for the status line. Task 6 updates the spec file accordingly.

**Conventions used throughout:**
- Run all commands from the repo root.
- Test runner: `node --test test/` (add as `yarn test` in Task 1).
- Engine API (fixed across all tasks — do not rename):
  `validateManifest(id, raw)`, `loadTemplates(dir?)`, `getTemplate(id)`, `listTemplates()`, `validateValues(manifest, raw, {lenient})`, `renderTemplate(template, values)`, `validSlug(slug)`.
- `renderTemplate` takes the **template object** (from `getTemplate`/`loadTemplates`), not an id.

---

### Task 1: Engine — manifest validation

**Files:**
- Create: `engine.js`
- Create: `test/engine.test.js`
- Modify: `package.json` (add test script)

- [ ] **Step 1: Add the test script to package.json**

In `package.json` `"scripts"`, add:

```json
"scripts": {
  "start": "node server.js",
  "test": "node --test test/"
}
```

- [ ] **Step 2: Write the failing tests**

Create `test/engine.test.js`:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateManifest } = require('../engine');

const FIELDS = [
  { id: 'prospect', label: 'Prospect', type: 'text', required: true, max: 80 },
  { id: 'kpi_nps', label: 'NPS', type: 'number', min: 0, max: 10, step: 0.1, default: 7.7 }
];

test('validateManifest accepts a valid manifest and normalizes it', () => {
  const m = validateManifest('demo', { name: 'Demo', description: 'A demo', nameField: 'prospect', fields: FIELDS });
  assert.equal(m.id, 'demo');
  assert.equal(m.name, 'Demo');
  assert.equal(m.nameField, 'prospect');
  assert.equal(m.fields.length, 2);
  assert.equal(m.fields[1].default, 7.7);
});

test('validateManifest rejects bad template ids', () => {
  assert.throws(() => validateManifest('Bad_Id', { name: 'x', fields: FIELDS }), /template id/);
});

test('validateManifest rejects missing or empty fields array', () => {
  assert.throws(() => validateManifest('demo', { name: 'x', fields: [] }), /fields/);
  assert.throws(() => validateManifest('demo', { name: 'x' }), /fields/);
});

test('validateManifest rejects bad field ids, dup ids, unknown types, missing labels', () => {
  const f = (over) => [{ id: 'ok', label: 'Ok', type: 'text', ...over }];
  assert.throws(() => validateManifest('demo', { name: 'x', fields: f({ id: 'Bad-Id' }) }), /field id/);
  assert.throws(() => validateManifest('demo', { name: 'x', fields: [...f({}), ...f({})] }), /duplicate/);
  assert.throws(() => validateManifest('demo', { name: 'x', fields: f({ type: 'color' }) }), /type/);
  assert.throws(() => validateManifest('demo', { name: 'x', fields: f({ label: '' }) }), /label/);
});

test('validateManifest rejects nameField not present in fields', () => {
  assert.throws(() => validateManifest('demo', { name: 'x', nameField: 'nope', fields: FIELDS }), /nameField/);
});

test('validateManifest rejects a default that violates the field constraints', () => {
  const fields = [{ id: 'n', label: 'N', type: 'number', min: 0, max: 10, default: 99 }];
  assert.throws(() => validateManifest('demo', { name: 'x', fields }), /default/);
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `yarn test`
Expected: FAIL — `Cannot find module '../engine'`

- [ ] **Step 4: Implement validateManifest in engine.js**

Create `engine.js`:

```js
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

module.exports = { validateManifest, validSlug, escapeHtml, checkValue, TEMPLATES_DIR };
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `yarn test`
Expected: PASS (6 tests)

- [ ] **Step 6: Commit**

```bash
git add package.json engine.js test/engine.test.js
git commit -m "feat: template manifest validation engine"
```

---

### Task 2: Engine — template registry (loadTemplates)

**Files:**
- Modify: `engine.js`
- Modify: `test/engine.test.js`
- Create: `test/fixtures/templates/minimal/template.json`
- Create: `test/fixtures/templates/minimal/index.html`

- [ ] **Step 1: Create the fixture template**

`test/fixtures/templates/minimal/template.json`:

```json
{
  "name": "Minimal",
  "description": "Fixture template",
  "nameField": "title",
  "fields": [
    { "id": "title", "label": "Title", "type": "text", "required": true, "max": 50, "default": "Hello" },
    { "id": "count", "label": "Count", "type": "number", "int": true, "min": 0, "default": 3 }
  ]
}
```

`test/fixtures/templates/minimal/index.html`:

```html
<!DOCTYPE html>
<html><head><title>{{title}}</title></head>
<body><h1>{{title}}</h1><p>{{count}} items</p><p>{{unknown_token}}</p>
<script>window.PAGE_CONFIG = {{PAGE_CONFIG_JSON}};</script>
</body></html>
```

- [ ] **Step 2: Write the failing tests**

Append to `test/engine.test.js`:

```js
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { loadTemplates } = require('../engine');

const FIXTURES = path.join(__dirname, 'fixtures', 'templates');

test('loadTemplates loads valid template directories', () => {
  const map = loadTemplates(FIXTURES);
  assert.ok(map.has('minimal'));
  const t = map.get('minimal');
  assert.equal(t.manifest.name, 'Minimal');
  assert.match(t.html, /\{\{title\}\}/);
  assert.equal(t.dir, path.join(FIXTURES, 'minimal'));
});

test('loadTemplates throws on a template missing index.html', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tpl-'));
  fs.mkdirSync(path.join(tmp, 'broken'));
  fs.writeFileSync(path.join(tmp, 'broken', 'template.json'),
    JSON.stringify({ name: 'B', fields: [{ id: 'a', label: 'A', type: 'text' }] }));
  assert.throws(() => loadTemplates(tmp), /index\.html/);
});

test('loadTemplates throws on malformed JSON', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tpl-'));
  fs.mkdirSync(path.join(tmp, 'bad'));
  fs.writeFileSync(path.join(tmp, 'bad', 'template.json'), '{ not json');
  fs.writeFileSync(path.join(tmp, 'bad', 'index.html'), '<html></html>');
  assert.throws(() => loadTemplates(tmp), /bad/);
});

test('loadTemplates throws when the directory has no templates', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tpl-'));
  assert.throws(() => loadTemplates(tmp), /no templates/);
});
```

- [ ] **Step 3: Run tests to verify the new ones fail**

Run: `yarn test`
Expected: FAIL — `loadTemplates is not a function`

- [ ] **Step 4: Implement loadTemplates + cached registry**

Add to `engine.js` (before `module.exports`), and extend the exports:

```js
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
```

Exports become:

```js
module.exports = {
  validateManifest, loadTemplates, getTemplate, listTemplates,
  validSlug, escapeHtml, checkValue, TEMPLATES_DIR
};
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `yarn test`
Expected: PASS (10 tests)

- [ ] **Step 6: Commit**

```bash
git add engine.js test/
git commit -m "feat: template registry with fail-fast loading"
```

---

### Task 3: Engine — config validation (strict + lenient)

**Files:**
- Modify: `engine.js`
- Modify: `test/engine.test.js`

- [ ] **Step 1: Write the failing tests**

Append to `test/engine.test.js`:

```js
const { validateValues } = require('../engine');

const MANIFEST = validateManifest('demo', {
  name: 'Demo',
  fields: [
    { id: 'title', label: 'Title', type: 'text', required: true, max: 10, default: 'Hi' },
    { id: 'mail', label: 'Mail', type: 'email', required: true },
    { id: 'count', label: 'Count', type: 'number', int: true, min: 0, max: 100, default: 5 },
    { id: 'note', label: 'Note', type: 'textarea' }
  ]
});

test('strict: valid input is normalized (trim, number coercion, int rounding)', () => {
  const { values, error } = validateValues(MANIFEST, { title: ' Yo ', mail: 'a@b.co', count: '7.6', note: '' });
  assert.equal(error, undefined);
  assert.deepEqual(values, { title: 'Yo', mail: 'a@b.co', count: 8, note: '' });
});

test('strict: missing required field is an error naming the field', () => {
  const { error } = validateValues(MANIFEST, { mail: 'a@b.co', count: 1 });
  assert.match(error, /^title:/);
});

test('strict: constraint violations are errors', () => {
  assert.match(validateValues(MANIFEST, { title: 'this is way too long', mail: 'a@b.co', count: 1 }).error, /max 10/);
  assert.match(validateValues(MANIFEST, { title: 'x', mail: 'nope', count: 1 }).error, /invalid email/);
  assert.match(validateValues(MANIFEST, { title: 'x', mail: 'a@b.co', count: 101 }).error, /maximum/);
});

test('strict: optional missing field falls back to default, then empty', () => {
  const { values } = validateValues(MANIFEST, { title: 'x', mail: 'a@b.co', note: 'n' });
  assert.equal(values.count, 5);   // default
  const m2 = validateManifest('d2', { name: 'D', fields: [{ id: 'n', label: 'N', type: 'number', min: 2 }] });
  assert.equal(validateValues(m2, {}).values.n, 2);  // no default -> min
});

test('lenient: never blocks — bad/missing values fall back, errors collected', () => {
  const { values, errors } = validateValues(MANIFEST, { title: '', mail: 'nope', count: 'NaN' }, { lenient: true });
  assert.deepEqual(values, { title: 'Hi', mail: '', count: 5, note: '' });
  assert.equal(errors.length, 3);
  assert.match(errors[0], /title/);
});

test('rejects non-object payloads', () => {
  assert.match(validateValues(MANIFEST, null).error, /object/);
  assert.match(validateValues(MANIFEST, 'hi').error, /object/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test`
Expected: FAIL — `validateValues is not a function`

- [ ] **Step 3: Implement validateValues**

Add to `engine.js`:

```js
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
```

Add `validateValues` to `module.exports`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn test`
Expected: PASS (16 tests)

- [ ] **Step 5: Commit**

```bash
git add engine.js test/engine.test.js
git commit -m "feat: strict and lenient config validation"
```

---

### Task 4: Engine — rendering

**Files:**
- Modify: `engine.js`
- Modify: `test/engine.test.js`

- [ ] **Step 1: Write the failing tests**

Append to `test/engine.test.js`:

```js
const { renderTemplate } = require('../engine');

test('renderTemplate substitutes escaped values and injects PAGE_CONFIG', () => {
  const t = loadTemplates(FIXTURES).get('minimal');
  const html = renderTemplate(t, { title: 'A <b>title</b>', count: 4 });
  assert.match(html, /<h1>A &lt;b&gt;title&lt;\/b&gt;<\/h1>/);
  assert.match(html, /<p>4 items<\/p>/);
  assert.match(html, /window\.PAGE_CONFIG = \{"template":"minimal","values":/);
  assert.doesNotMatch(html, /PAGE_CONFIG_JSON/);
});

test('renderTemplate leaves unknown tokens untouched and escapes JSON </script>', () => {
  const t = loadTemplates(FIXTURES).get('minimal');
  const html = renderTemplate(t, { title: '</script><script>alert(1)</script>', count: 0 });
  assert.match(html, /\{\{unknown_token\}\}/);          // author error stays visible
  assert.doesNotMatch(html, /<\/script><script>alert/); // JSON is <-escaped
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test`
Expected: FAIL — `renderTemplate is not a function`

- [ ] **Step 3: Implement renderTemplate**

Add to `engine.js`:

```js
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
```

Add `renderTemplate` to `module.exports`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn test`
Expected: PASS (18 tests)

- [ ] **Step 5: Commit**

```bash
git add engine.js test/engine.test.js
git commit -m "feat: template rendering with token substitution"
```

---

### Task 5: The galileo template directory

Migrates the existing page into `templates/galileo/`. The server still uses the old pipeline after this task (rewired in Task 6); the engine tests prove the new template renders.

**Files:**
- Create: `templates/galileo/template.json`
- Create: `templates/galileo/index.html` (from `template.html`)
- Create: `templates/galileo/page.js` (from `app.js`)
- Create: `templates/galileo/styles.css` (copy of `styles.css`)
- Modify: `test/engine.test.js`

- [ ] **Step 1: Write the manifest**

Create `templates/galileo/template.json` (defaults = today's seeded Galileo page):

```json
{
  "name": "Renewal proposal — education",
  "description": "Bilingual FR/EN renewal microsite (original Galileo layout)",
  "nameField": "prospect",
  "fields": [
    { "id": "prospect", "label": "Prospect name", "type": "text", "required": true, "max": 80, "group": "Prospect", "default": "Galileo" },
    { "id": "am_name", "label": "Name", "type": "text", "required": true, "max": 80, "group": "Account manager", "default": "Tiphaine Lemerle" },
    { "id": "am_email", "label": "Email", "type": "email", "required": true, "group": "Account manager", "default": "tiphaine.lemerle@livestorm.co" },
    { "id": "kpi_schools", "label": "Schools", "type": "number", "int": true, "min": 0, "group": "2025 key figures", "default": 34 },
    { "id": "kpi_users", "label": "Users", "type": "number", "int": true, "min": 0, "group": "2025 key figures", "default": 589 },
    { "id": "kpi_sessions", "label": "Sessions", "type": "number", "int": true, "min": 0, "group": "2025 key figures", "default": 1210 },
    { "id": "kpi_registrants", "label": "Registrants", "type": "number", "int": true, "min": 0, "group": "2025 key figures", "default": 39351 },
    { "id": "kpi_attendees", "label": "Attendees", "type": "number", "int": true, "min": 0, "group": "2025 key figures", "default": 22263 },
    { "id": "kpi_rate", "label": "Attendance rate (%)", "type": "number", "min": 0, "max": 100, "group": "2025 key figures", "default": 57 },
    { "id": "kpi_nps", "label": "NPS (0–10)", "type": "number", "min": 0, "max": 10, "step": 0.1, "group": "2025 key figures", "default": 7.7 },
    { "id": "price_current", "label": "Current contract (€ / yr)", "type": "number", "int": true, "min": 0, "group": "Pricing", "default": 120000 },
    { "id": "vol_1", "label": "Volume A (attendees)", "type": "number", "int": true, "min": 0, "group": "Pricing", "default": 25000 },
    { "id": "vol_2", "label": "Volume B (attendees)", "type": "number", "int": true, "min": 0, "group": "Pricing", "default": 40000 },
    { "id": "vol_3", "label": "Volume C (attendees)", "type": "number", "int": true, "min": 0, "group": "Pricing", "default": 60000 },
    { "id": "price_1", "label": "Initial price A (€)", "type": "number", "int": true, "min": 0, "group": "Pricing", "default": 120000 },
    { "id": "price_2", "label": "Initial price B (€)", "type": "number", "int": true, "min": 0, "group": "Pricing", "default": 143000 },
    { "id": "price_3", "label": "Initial price C (€)", "type": "number", "int": true, "min": 0, "group": "Pricing", "default": 163000 },
    { "id": "discount_1", "label": "Discount 1 yr (%)", "type": "number", "int": true, "min": 0, "max": 99, "group": "Pricing", "default": 20 },
    { "id": "discount_2", "label": "Discount 2 yrs (%)", "type": "number", "int": true, "min": 0, "max": 99, "group": "Pricing", "default": 30 },
    { "id": "discount_3", "label": "Discount 3 yrs (%)", "type": "number", "int": true, "min": 0, "max": 99, "group": "Pricing", "default": 40 }
  ]
}
```

- [ ] **Step 2: Migrate index.html**

```bash
git mv template.html templates/galileo/index.html
cp styles.css templates/galileo/styles.css
```

Then apply these exact replacements in `templates/galileo/index.html`:

| Old token | New content | Notes |
|---|---|---|
| `{{PROSPECT}}` | `{{prospect}}` | 8 occurrences (title, meta, brand, hero ×2, res.k2, pil.p2note, offer.ovLede, footer.note) |
| `{{AM_NAME}}` | `{{am_name}}` | |
| `{{AM_EMAIL}}` | `{{am_email}}` | 4 occurrences (mailto href ×2, link text) |
| `{{AM_INITIALS}}` | *(see below)* | avatar span gets `data-am-initials` |
| `{{SCHOOLS_RAW}}` / `{{SCHOOLS_FR}}` | `{{kpi_schools}}` | both raw and FR-formatted spots take the raw token |
| `{{USERS_RAW}}` / `{{USERS_FR}}` | `{{kpi_users}}` | |
| `{{SESSIONS_RAW}}` / `{{SESSIONS_FR}}` | `{{kpi_sessions}}` | |
| `{{REGISTRANTS_RAW}}` / `{{REGISTRANTS_FR}}` | `{{kpi_registrants}}` | |
| `{{ATTENDEES_RAW}}` / `{{ATTENDEES_FR}}` | `{{kpi_attendees}}` | |
| `{{RATE_RAW}}` | `{{kpi_rate}}` | |
| `{{RATE_FR}}` | `{{kpi_rate}} %` | the FR token embedded the suffix |
| `{{NPS_RAW}}` / `{{NPS_FR}}` | `{{kpi_nps}}` | |
| `{{CURRENT_K_FR}}` | `{{price_current}} €` | FR dict reformats to "120 K€" on load |
| `{{VOL1_FR}}` `{{VOL2_FR}}` `{{VOL3_FR}}` | `{{vol_1}}` `{{vol_2}}` `{{vol_3}}` | |
| `{{D1}}` `{{D2}}` `{{D3}}` | `{{discount_1}}` `{{discount_2}}` `{{discount_3}}` | |
| `{{P_INIT1_FR}}` etc. | `{{price_1}} €` `{{price_2}} €` `{{price_3}} €` | |
| `{{P_R1C1_FR}}` … `{{P_R3C3_FR}}` (9 cells) | `—` | derived; `page.js` fills via the FR/EN dicts |

The avatar line (CTA section) changes from:

```html
<span class="avatar avatar-lg" aria-hidden="true">{{AM_INITIALS}}</span>
```

to:

```html
<span class="avatar avatar-lg" aria-hidden="true" data-am-initials></span>
```

Asset references change:
- `<link rel="stylesheet" href="/styles.css">` → `href="/templates/galileo/styles.css"`
- `<script src="/app.js"></script>` → `<script src="/templates/galileo/page.js"></script>`

`{{PAGE_CONFIG_JSON}}` stays as-is. Verify zero stale tokens remain:

```bash
grep -o '{{[A-Z][A-Z_0-9]*}}' templates/galileo/index.html
```

Expected output: only `{{PAGE_CONFIG_JSON}}`.

- [ ] **Step 3: Migrate page.js**

```bash
git mv app.js templates/galileo/page.js
```

In `templates/galileo/page.js`, replace the entire "Page config" block (the `var CFG = window.PAGE_CONFIG || {...}` statement) with an adapter that rebuilds the same `CFG` shape from the new flat values (so the EN dictionary below it stays untouched):

```js
  /* ---------- Page config adapter ----------
     The server injects { template, values: <flat field values> }.
     Rebuild the structured CFG the dictionaries below consume; derived
     values (price rows, initials) are computed here, not on the server. */
  var FALLBACK = {
    prospect: 'Galileo', am_name: 'Tiphaine Lemerle', am_email: 'tiphaine.lemerle@livestorm.co',
    kpi_schools: 34, kpi_users: 589, kpi_sessions: 1210, kpi_registrants: 39351,
    kpi_attendees: 22263, kpi_rate: 57, kpi_nps: 7.7,
    price_current: 120000, vol_1: 25000, vol_2: 40000, vol_3: 60000,
    price_1: 120000, price_2: 143000, price_3: 163000,
    discount_1: 20, discount_2: 30, discount_3: 40
  };
  var V = (window.PAGE_CONFIG && window.PAGE_CONFIG.values) || FALLBACK;

  function initials(name) {
    var parts = String(name).trim().split(/\s+/).slice(0, 2);
    return parts.map(function (w) { return w[0] ? w[0].toUpperCase() : ''; }).join('') || '?';
  }

  var discounts = [V.discount_1, V.discount_2, V.discount_3];
  var initial = [V.price_1, V.price_2, V.price_3];
  var CFG = {
    prospect: V.prospect,
    am: { name: V.am_name, email: V.am_email, initials: initials(V.am_name) },
    kpis: { schools: V.kpi_schools, users: V.kpi_users, sessions: V.kpi_sessions,
            registrants: V.kpi_registrants, attendees: V.kpi_attendees,
            rate: V.kpi_rate, nps: V.kpi_nps },
    pricing: {
      currentAnnual: V.price_current,
      volumes: [V.vol_1, V.vol_2, V.vol_3],
      discounts: discounts,
      initial: initial,
      rows: discounts.map(function (d) {
        return initial.map(function (p) { return Math.round(p * (1 - d / 100)); });
      })
    }
  };
```

Immediately after the existing `var EN = { ... };` dictionary, add the FR value dictionary and apply it before the i18n engine snapshots `frSource` (insert this block *above* the `/* ---------- i18n engine ---------- */` comment):

```js
  /* ---------- FR value dictionary ----------
     The server substitutes raw values into the FR copy; these keys
     restore French number formatting. Applied once at load, BEFORE the
     i18n engine snapshots frSource, so FR/EN switching keeps working. */
  var nfFR = new Intl.NumberFormat('fr-FR');
  var nfFR1 = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  function fr(n) { return nfFR.format(n); }
  function frEur(n) { return fr(n) + ' € <em>/ an</em>'; }

  var FR_VALUES = {
    'hero.chip1': '<strong>' + fr(CFG.kpis.attendees) + '</strong> participants en 2025',
    'hero.chip2': '<strong>' + fr(CFG.kpis.schools) + '</strong> écoles accompagnées',
    'hero.chip3': 'NPS <strong>' + nfFR1.format(CFG.kpis.nps) + '</strong>',
    'offer.beforeTag': 'Contrat actuel — ' + fr(Math.round(PR.currentAnnual / 1000)) + ' K€ / an',
    'offer.col1': fr(PR.volumes[0]) + ' participants',
    'offer.col2': fr(PR.volumes[1]) + ' participants',
    'offer.col3': fr(PR.volumes[2]) + ' participants',
    'offer.p11': frEur(PR.initial[0]), 'offer.p12': frEur(PR.initial[1]), 'offer.p13': frEur(PR.initial[2]),
    'offer.p21': frEur(PR.rows[0][0]), 'offer.p22': frEur(PR.rows[0][1]), 'offer.p23': frEur(PR.rows[0][2]),
    'offer.p31': frEur(PR.rows[1][0]), 'offer.p32': frEur(PR.rows[1][1]), 'offer.p33': frEur(PR.rows[1][2]),
    'offer.p41': frEur(PR.rows[2][0]), 'offer.p42': frEur(PR.rows[2][1]), 'offer.p43': frEur(PR.rows[2][2])
  };
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    var key = el.getAttribute('data-i18n');
    if (FR_VALUES[key] !== undefined) el.innerHTML = FR_VALUES[key];
  });

  var amInitialsEl = document.querySelector('[data-am-initials]');
  if (amInitialsEl) amInitialsEl.textContent = CFG.am.initials;
```

(`P` and `PR` are already defined right below the old CFG block — keep those lines.)

- [ ] **Step 4: Add the engine test for the real template**

Append to `test/engine.test.js`:

```js
test('the galileo template loads and renders its defaults with no stale tokens', () => {
  const map = loadTemplates(path.join(__dirname, '..', 'templates'));
  const t = map.get('galileo');
  assert.ok(t, 'templates/galileo must exist');
  const defaults = {};
  for (const f of t.manifest.fields) defaults[f.id] = f.default;
  const { values, error } = require('../engine').validateValues(t.manifest, defaults);
  assert.equal(error, undefined);
  const html = renderTemplate(t, values);
  const stale = html.match(/\{\{\w+\}\}/g);
  assert.equal(stale, null, `unreplaced tokens: ${stale}`);
  assert.match(html, /<title>Galileo × Livestorm/);
  assert.match(html, /\/templates\/galileo\/page\.js/);
});
```

- [ ] **Step 5: Run tests**

Run: `yarn test`
Expected: PASS (19 tests). If stale tokens are reported, fix the missed spots in `index.html` per the Step 2 table.

- [ ] **Step 6: Commit**

```bash
git add templates/ test/engine.test.js
git rm --cached template.html app.js 2>/dev/null || true
git commit -m "feat: migrate Galileo page into templates/galileo"
```

---

### Task 6: Server — template routes, preview, boot migration

**Files:**
- Modify: `server.js` (rewrite routes + boot, export for tests)
- Delete: `render.js`, `defaults.js`
- Create: `test/server.test.js`
- Modify: `docs/superpowers/specs/2026-06-04-templates-preview-design.md` (preview returns JSON envelope)

- [ ] **Step 1: Write the failing HTTP tests**

Create `test/server.test.js`:

```js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test`
Expected: FAIL — `start is not a function` (server.js doesn't export yet)

- [ ] **Step 3: Rewrite server.js**

Replace `server.js` entirely with:

```js
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
 * Render runs `yarn start` and injects PORT.
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
      await store.upsert(row.slug, legacyToGalileo(row.config));
      console.log(`converted legacy page /page/${row.slug} to template galileo`);
    }
  }
}

/* ---------- routes ---------- */

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const pathname = decodeURIComponent(url.pathname);

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
```

Then delete the superseded modules:

```bash
git rm render.js defaults.js
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn test`
Expected: PASS (27 tests)

- [ ] **Step 5: Update the spec's preview contract**

In `docs/superpowers/specs/2026-06-04-templates-preview-design.md`, change the `POST /api/preview` row of the routes table to:

```
| `POST /api/preview` | Bearer | `{template, values}` → lenient-validate, return JSON `{html, errors}`. Nothing stored. Unknown template → 400 JSON. |
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: template-driven server with preview endpoint"
```

---

### Task 7: Builder UI — picker, schema-driven form, live preview

**Files:**
- Modify: `builder.html` (full rewrite of body + script; keep `<head>` fonts/styles approach)

- [ ] **Step 1: Rewrite builder.html**

Keep the existing `<head>` (fonts, `/styles.css` link, `<meta name="robots" content="noindex">`). Replace the inline `<style>` block additions and the whole `<body>` as follows.

Replace the `.builder-grid` rule and add preview styles in the inline `<style>`:

```css
.builder-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: 28px; align-items: start; }
.preview-pane { position: sticky; top: 76px; }
.preview-frame {
  width: 100%; height: calc(100vh - 170px); min-height: 480px;
  border: 1px solid var(--line); border-radius: 14px; background: #fff;
}
.preview-empty {
  display: grid; place-items: center; height: calc(100vh - 170px); min-height: 480px;
  border: 1px dashed var(--line); border-radius: 14px; color: var(--muted); font-size: .95rem;
  text-align: center; padding: 24px;
}
.preview-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.preview-bar .status { margin: 0; flex: 1; }
.tpl-row { display: flex; gap: 12px; align-items: end; flex-wrap: wrap; margin-bottom: 24px; }
.tpl-row .field { flex: 1; min-width: 260px; margin-bottom: 0; }
.tpl-row select {
  font: inherit; font-size: .95rem; color: var(--ink);
  padding: 10px 14px; border: 1px solid var(--line); border-radius: 10px; background: #fbfcfe;
}
.tpl-desc { font-size: .82rem; color: var(--muted); }
```

(Keep all other existing styles: `.field`, `.panel`, `.page-row`, `.mini-btn`, etc. Delete the now-unused `.matrix` rules.)

New `<body>` structure (header unchanged):

```html
<body>
  <header class="site-header">
    <div class="container header-inner">
      <a class="brand" href="/" aria-label="Buyerverse">
        <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="brand-name">Livestorm</span>
        <span class="brand-x">·</span>
        <span class="brand-partner">Buyerverse</span>
      </a>
    </div>
  </header>

  <main class="builder-main">
    <div class="container">
      <div class="builder-head">
        <div>
          <p class="kicker">Page builder</p>
          <h1>Generate a proposal page</h1>
        </div>
      </div>

      <div class="tpl-row">
        <div class="field">
          <label for="f-template">Template</label>
          <select id="f-template"></select>
          <span class="tpl-desc" id="tpl-desc"></span>
        </div>
        <div class="field">
          <label for="f-slug">Slug</label>
          <input id="f-slug" type="text" maxlength="64" pattern="[a-z0-9][a-z0-9-]*" placeholder="acme-corp" required>
          <span class="hint">Page will live at <code>/page/&lt;slug&gt;</code></span>
        </div>
      </div>

      <div class="builder-grid">
        <div>
          <div id="form"></div>

          <section class="card panel">
            <h2><span class="step">✓</span> Publish</h2>
            <div class="token-row">
              <div class="field">
                <label for="f-token">Admin token</label>
                <input id="f-token" type="password" autocomplete="off" placeholder="ADMIN_TOKEN">
              </div>
              <button class="btn btn-primary btn-lg" id="submit" type="button">Publish page</button>
            </div>
            <p class="status" id="status" role="status"></p>
          </section>

          <section class="card panel">
            <h2>Existing pages</h2>
            <div class="pages-list" id="pages"><p class="empty">Enter the admin token to load pages.</p></div>
            <p style="margin-top:16px"><button class="mini-btn" id="refresh" type="button">↻ Refresh list</button></p>
          </section>
        </div>

        <aside class="preview-pane">
          <div class="preview-bar">
            <p class="status" id="preview-status"></p>
          </div>
          <div class="preview-empty" id="preview-empty">Enter the admin token below to activate the live preview.</div>
          <iframe class="preview-frame" id="preview" title="Page preview" hidden></iframe>
        </aside>
      </div>
    </div>
  </main>

  <script>
  (function () {
    'use strict';

    var $ = function (id) { return document.getElementById(id); };
    var templates = [];          // manifests from /api/templates
    var current = null;          // selected manifest
    var slugTouched = false;     // stop auto-slug once the user edits it
    var previewTimer = null;

    function token() { return $('f-token').value.trim(); }

    function api(method, path, body) {
      return fetch(path, {
        method: method,
        headers: Object.assign(
          { 'Authorization': 'Bearer ' + token() },
          body ? { 'Content-Type': 'application/json' } : {}
        ),
        body: body ? JSON.stringify(body) : undefined
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok) throw new Error(data.error || ('HTTP ' + res.status));
          return data;
        });
      });
    }

    function setStatus(el, msg, ok) {
      el.className = 'status ' + (ok ? 'ok' : 'err');
      el.innerHTML = msg;
    }

    function escapeText(s) {
      var d = document.createElement('div');
      d.textContent = String(s == null ? '' : s);
      return d.innerHTML;
    }

    function slugify(s) {
      return s.toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 64);
    }

    /* ---------- schema-driven form ---------- */

    function buildForm(manifest, values) {
      current = manifest;
      $('tpl-desc').textContent = manifest.description || '';
      var groups = [];
      var byGroup = {};
      manifest.fields.forEach(function (f) {
        var g = f.group || 'Details';
        if (!byGroup[g]) { byGroup[g] = []; groups.push(g); }
        byGroup[g].push(f);
      });

      var root = $('form');
      root.innerHTML = '';
      groups.forEach(function (g, gi) {
        var section = document.createElement('section');
        section.className = 'card panel';
        var h = document.createElement('h2');
        h.innerHTML = '<span class="step">' + (gi + 1) + '</span> ' + escapeText(g);
        section.appendChild(h);
        var grid = document.createElement('div');
        grid.className = byGroup[g].length > 4 ? 'grid-3' : 'grid-2';
        byGroup[g].forEach(function (f) {
          var wrap = document.createElement('div');
          wrap.className = 'field';
          var label = document.createElement('label');
          label.setAttribute('for', 'f-' + f.id);
          label.textContent = f.label;
          wrap.appendChild(label);
          var input = f.type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
          input.id = 'f-' + f.id;
          input.dataset.field = f.id;
          if (f.type !== 'textarea') input.type = f.type === 'number' ? 'number' : f.type;
          if (f.type === 'number') {
            if (f.min !== undefined) input.min = f.min;
            if (f.max !== undefined) input.max = f.max;
            input.step = f.step !== undefined ? f.step : (f.int ? 1 : 'any');
          } else if (f.max !== undefined) {
            input.maxLength = f.max;
          }
          if (f.required) input.required = true;
          if (f.placeholder) input.placeholder = f.placeholder;
          var v = values && values[f.id] !== undefined ? values[f.id] : f.default;
          if (v !== undefined) input.value = v;
          input.addEventListener('input', onFieldInput);
          wrap.appendChild(input);
          if (f.hint) {
            var hint = document.createElement('span');
            hint.className = 'hint';
            hint.textContent = f.hint;
            wrap.appendChild(hint);
          }
          grid.appendChild(wrap);
        });
        section.appendChild(grid);
        root.appendChild(section);
      });
      schedulePreview();
    }

    function readValues() {
      var values = {};
      document.querySelectorAll('[data-field]').forEach(function (input) {
        values[input.dataset.field] = input.value;
      });
      return values;
    }

    function onFieldInput(e) {
      if (current && current.nameField && e.target.dataset.field === current.nameField && !slugTouched) {
        $('f-slug').value = slugify(e.target.value);
      }
      schedulePreview();
    }

    /* ---------- live preview ---------- */

    function schedulePreview() {
      clearTimeout(previewTimer);
      previewTimer = setTimeout(renderPreview, 400);
    }

    function renderPreview() {
      if (!current) return;
      if (!token()) {
        $('preview').hidden = true;
        $('preview-empty').hidden = false;
        return;
      }
      api('POST', '/api/preview', { template: current.id, values: readValues() })
        .then(function (data) {
          $('preview-empty').hidden = true;
          $('preview').hidden = false;
          $('preview').srcdoc = data.html;
          if (data.errors.length) {
            setStatus($('preview-status'), data.errors.length + ' field' + (data.errors.length > 1 ? 's' : '') +
              ' using fallback: ' + escapeText(data.errors.join(' · ')), false);
          } else {
            setStatus($('preview-status'), 'Preview up to date', true);
          }
        })
        .catch(function (e) {
          setStatus($('preview-status'), 'Preview failed: ' + escapeText(e.message), false);
        });
    }

    /* ---------- templates ---------- */

    function loadTemplateList() {
      return fetch('/api/templates')
        .then(function (res) { return res.json(); })
        .then(function (data) {
          templates = data.templates;
          var sel = $('f-template');
          sel.innerHTML = '';
          templates.forEach(function (t) {
            var opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.name;
            sel.appendChild(opt);
          });
          if (templates.length) buildForm(templates[0]);
        });
    }

    function findTemplate(id) {
      return templates.filter(function (t) { return t.id === id; })[0] || null;
    }

    $('f-template').addEventListener('change', function () {
      var t = findTemplate(this.value);
      if (t) { slugTouched = false; buildForm(t); }
    });

    /* ---------- pages list ---------- */

    function loadPages() {
      if (!token()) { $('pages').innerHTML = '<p class="empty">Enter the admin token to load pages.</p>'; return; }
      api('GET', '/api/pages').then(function (data) {
        if (!data.pages.length) { $('pages').innerHTML = '<p class="empty">No pages yet.</p>'; return; }
        $('pages').innerHTML = '';
        data.pages.forEach(function (p) {
          var t = findTemplate(p.config.template);
          var name = (t && t.nameField && p.config.values) ? p.config.values[t.nameField] : '';
          var row = document.createElement('div');
          row.className = 'page-row';
          var date = p.updated_at ? new Date(p.updated_at).toLocaleString() : '';
          row.innerHTML =
            '<span class="slug">/page/' + p.slug + '</span>' +
            '<span class="meta">' + escapeText(name || p.slug) + (t ? ' · ' + escapeText(t.name) : '') + (date ? ' · ' + date : '') + '</span>' +
            '<span class="ops">' +
              '<a class="mini-btn" href="/page/' + p.slug + '" target="_blank" rel="noopener">View</a>' +
              '<button class="mini-btn" data-edit type="button">Edit</button>' +
              '<button class="mini-btn danger" data-del type="button">Delete</button>' +
            '</span>';
          row.querySelector('[data-edit]').addEventListener('click', function () {
            if (!t) { setStatus($('status'), 'Template "' + escapeText(p.config.template) + '" no longer exists.', false); return; }
            $('f-template').value = t.id;
            slugTouched = true;
            $('f-slug').value = p.slug;
            buildForm(t, p.config.values);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          });
          row.querySelector('[data-del]').addEventListener('click', function () {
            if (!confirm('Delete /page/' + p.slug + '?')) return;
            api('DELETE', '/api/pages/' + p.slug)
              .then(loadPages)
              .catch(function (e) { setStatus($('status'), escapeText(e.message), false); });
          });
          $('pages').appendChild(row);
        });
      }).catch(function (e) {
        $('pages').innerHTML = '<p class="empty">' + escapeText(e.message) + '</p>';
      });
    }

    /* ---------- publish ---------- */

    $('submit').addEventListener('click', function () {
      var slug = $('f-slug').value.trim();
      if (!current) return;
      if (!token()) return setStatus($('status'), 'Admin token required.', false);
      if (!/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(slug)) {
        return setStatus($('status'), 'Invalid slug (lowercase letters, digits, hyphens).', false);
      }
      setStatus($('status'), 'Publishing…', true);
      api('POST', '/api/pages', { slug: slug, template: current.id, values: readValues() })
        .then(function (data) {
          setStatus($('status'), 'Published → <a href="' + data.url + '" target="_blank" rel="noopener">' + data.url + '</a>', true);
          loadPages();
        })
        .catch(function (e) { setStatus($('status'), escapeText(e.message), false); });
    });

    /* ---------- wiring ---------- */

    $('f-slug').addEventListener('input', function () { slugTouched = true; });
    $('refresh').addEventListener('click', loadPages);
    $('f-token').value = localStorage.getItem('buyerverse-token') || '';
    $('f-token').addEventListener('change', function () {
      localStorage.setItem('buyerverse-token', token());
      loadPages();
      schedulePreview();
    });

    loadTemplateList().then(function () {
      if (token()) loadPages();
    });
  })();
  </script>
</body>
```

- [ ] **Step 2: Run the test suite (regression)**

Run: `yarn test`
Expected: PASS — the builder is not covered by automated tests, but the suite guards the server contract it relies on.

- [ ] **Step 3: Manual verification**

Run: `ADMIN_TOKEN=dev yarn start` and open `http://localhost:3000`:

1. Template dropdown shows "Renewal proposal — education"; form is grouped Prospect / Account manager / 2025 key figures / Pricing, prefilled with Galileo defaults.
2. Without a token: preview pane shows the "enter admin token" placeholder.
3. Enter token `dev` (then blur the field): preview renders the Galileo page in the iframe.
4. Change "Prospect name" to `Acme`: slug auto-updates to `acme`; after ~0.5 s the preview hero shows Acme.
5. Clear a required field: preview still renders (fallback) and the status line lists the field.
6. Publish as `acme`; open `/page/acme` in a tab; verify FR + EN toggle, count-ups, and the price matrix (computed client-side) all work.
7. Edit `acme` from the pages list → values load back; Delete works.

- [ ] **Step 4: Commit**

```bash
git add builder.html
git commit -m "feat: template picker and live preview in the builder"
```

---

### Task 8: Final verification, docs, ship

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Full local smoke (spec testing list)**

```bash
yarn test
ADMIN_TOKEN=dev node server.js &
sleep 1
curl -s localhost:3000/api/templates | grep -o '"id":"galileo"'
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/templates/galileo/template.json   # 404
curl -s -o /dev/null -w '%{http_code}\n' "localhost:3000/templates/galileo/..%2Fserver.js" # 404
curl -s localhost:3000/page/galileo | grep -c '{{'                                         # 0
kill %1
```

Expected: tests pass; `"id":"galileo"`; `404`; `404`; `0`.

- [ ] **Step 2: Visual check against production**

Open `http://localhost:3000/page/galileo` and `https://buyerverse.onrender.com/page/galileo` side by side. Compare FR and EN: hero chips, KPI count-ups, growth chart, pricing table (initial + 9 revised prices), overage grid, AM card initials. They must match. Known acceptable difference: with JS disabled, FR numbers show unformatted and revised-price cells show "—".

- [ ] **Step 3: Update README**

Replace the "Customizable fields (v1)" section of `README.md` with:

```markdown
## Templates

Templates live in `templates/<id>/` — self-contained directories with:

- `template.json` — name, description, `nameField`, and the field schema
  (types: `text`, `email`, `textarea`, `number`) that drives the builder
  form and server validation
- `index.html` — the page; `{{field_id}}` tokens are server-substituted,
  `{{PAGE_CONFIG_JSON}}` injects `window.PAGE_CONFIG = {template, values}`
- any other assets (CSS/JS/images, flat — no subdirectories), served at
  `/templates/<id>/<file>`

Derived values (computed prices, locale formatting, FR/EN i18n) are the
template's own JS's job, fed by `PAGE_CONFIG`. A malformed manifest fails
the boot — and therefore the deploy. Stored pages reference their template
by id: `{ "template": "galileo", "values": { ... } }`.
```

And update the routes table to include:

```markdown
| `GET /api/templates`       | —            | List template manifests          |
| `POST /api/preview`        | Bearer token | Render `{template, values}` without storing — returns `{html, errors}` |
| `GET /templates/<id>/<f>`  | —            | Template assets                  |
```

Also update the Development section's last paragraph to:

```markdown
FR copy lives inline in `templates/galileo/index.html` (the source of
truth); the EN dictionary and FR number formatting live in
`templates/galileo/page.js`, fed by the server-injected `window.PAGE_CONFIG`.
Run `yarn test` for the engine + server suite.
```

- [ ] **Step 4: Commit and push**

```bash
git add README.md docs/
git commit -m "docs: template directory format and new routes"
git push origin main
```

- [ ] **Step 5: Verify the Render deploy**

After auto-deploy completes (`https://api.render.com/v1/services/srv-d8gjuknlk1mc73eviu10/deploys?limit=1` with `Authorization: Bearer $(cat ~/.render_api_key)` → status `live`):

```bash
curl -s https://buyerverse.onrender.com/api/templates | grep -o '"id":"galileo"'
curl -s https://buyerverse.onrender.com/page/galileo | grep -o '<title>[^<]*</title>'
```

Expected: `"id":"galileo"` and `<title>Galileo × Livestorm — Renouvellement 2026</title>` (the seeded page was converted from its legacy shape on boot). Then a manual pass over the live builder: select template, live preview, publish + delete a test page.

---

## Self-Review (completed during planning)

**Spec coverage:** template directory format → Tasks 1–5; manifest-driven validation strict/lenient → Task 3; generic rendering → Task 4; Galileo migration with client-side derived values → Task 5; all routes incl. assets whitelist + traversal protection → Task 6; legacy conversion + manifest-defaults seeding → Task 6; schema-driven form + picker + debounced srcdoc preview + lenient status + edit flow → Task 7; spec's six-point test list → Tasks 5–6 automated, Task 7–8 manual; visual-parity acceptance → Task 8.

**Known deviation from spec (documented in header):** preview returns `{html, errors}` JSON, not raw HTML — updated in the spec in Task 6 Step 5.

**Type consistency:** engine API names match across all tasks (`validateManifest/loadTemplates/getTemplate/listTemplates/validateValues/renderTemplate/validSlug`); `renderTemplate(template, values)` takes the object everywhere; stored page shape `{template, values}` consistent across server, tests, builder (`p.config.template`, `p.config.values`).
