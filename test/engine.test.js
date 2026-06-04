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
