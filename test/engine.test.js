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
