# Authoring templates

This directory holds the proposal-page templates for Buyerverse. Each template
is a self-contained directory the server discovers at boot. This file tells you
(Claude Design) how to create or update one so it passes validation and renders
correctly. Read it fully before editing — a malformed template **fails the boot,
and therefore the deploy** (Render keeps the previous version live).

The engine is `../engine.js`; routing/asset rules are in `../server.js`. The
working reference template is `galileo/`.

## What a template is

A directory `templates/<id>/` containing:

```
templates/<id>/
  template.json   ← manifest: display info + the form field schema
  index.html      ← the page, with {{token}} placeholders
  <assets…>       ← styles.css, page.js, images (flat — NO subdirectories)
```

- `<id>` is the directory name. It must match `^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$`
  (lowercase letters, digits, hyphens) and must not be one of the reserved ids:
  `api page pages admin builder templates`.
- The builder auto-generates its form from `template.json`. The server only
  substitutes raw values into `index.html` — it computes **nothing**. All
  derived/formatted output is the template's own JS's job (see below).
- A stored page is `{ "template": "<id>", "values": { <field_id>: <value>, … } }`.

## `template.json` (the manifest)

```jsonc
{
  "name": "Renewal proposal — education",          // required, non-empty
  "description": "Bilingual FR/EN renewal microsite", // optional
  "nameField": "prospect",                          // optional, must be a field id
  "fields": [ /* non-empty array, see below */ ]
}
```

- **`name`** — shown in the template picker. Required.
- **`description`** — shown under the picker. Optional.
- **`nameField`** — the field whose value labels the page in the "Existing pages"
  list and seeds the auto-slug as the user types. Must equal one of the field ids.

### Fields

Each entry in `fields`:

| Key | Type | Notes |
|-----|------|-------|
| `id` | string | **Required, unique.** Must match `^[a-z][a-z0-9_]*$` (lowercase, starts with a letter, words separated by `_`). This id is the `{{token}}` you use in `index.html`. |
| `type` | string | **Required.** One of `text`, `email`, `textarea`, `number`. |
| `label` | string | **Required, non-empty.** The form label. |
| `group` | string | Form section heading. Fields with the same `group` render together as a card, in declaration order. Defaults to `"Details"`. |
| `required` | boolean | Enforced on **publish** (not on preview). Default `false`. |
| `default` | (matches type) | Pre-fills the form and is the fallback in preview. **Strongly recommended** — without it the form starts blank and the preview shows empty values. Must itself satisfy the field's constraints or the manifest is rejected. |
| `min` / `max` | number | For `number`: value bounds. For `text`/`email`/`textarea`: `max` is the **character length** cap. |
| `int` | boolean | `number` only — values are rounded to integers. |
| `step` | number | `number` only — the input's step attribute. |
| `placeholder` | string | Input placeholder. |
| `hint` | string | Small helper text under the input. |

Default string-length caps when `max` is omitted: `text` 1000, `textarea` 5000,
`email` 120. `email` values must look like an email.

## `index.html` (the page)

- **`{{field_id}}`** is replaced with that field's value, **HTML-escaped**
  (`& < > " '`). The value is **raw** — a `number` field substitutes the bare
  number (e.g. `22263`), a string substitutes the trimmed, escaped text. Tokens
  may appear in text or in double-quoted attributes; both are safe because values
  are escaped.
- **`{{PAGE_CONFIG_JSON}}`** must appear exactly once, inside a script tag:
  ```html
  <script>window.PAGE_CONFIG = {{PAGE_CONFIG_JSON}};</script>
  ```
  It injects `{ template: "<id>", values: { …all fields… } }`. Use this in your
  client JS for anything the server can't do (formatting, computed values, i18n).
- Tokens that don't match a field id (or `PAGE_CONFIG_JSON`) are **left in place
  verbatim** — so a typo like `{{prospct}}` will visibly render as `{{prospct}}`.
  After editing, grep for stray `{{…}}` (see Validate).
- Reference assets by **absolute path**: `/templates/<id>/styles.css`,
  `/templates/<id>/page.js`. Relative paths will not resolve.

## Client-side JS (derived values, formatting, i18n)

The server substitutes raw values only. Everything else lives in your template's
JS, fed by `window.PAGE_CONFIG.values`. See `galileo/page.js` for the pattern:
it rebuilds a structured config, computes the discount price matrix, formats
numbers per locale, and runs the FR/EN dictionary — all client-side.

**Security gotcha:** field values are untrusted user input. They are auto-escaped
inside `{{…}}`, but if your JS interpolates a string value into `innerHTML`, you
must escape it yourself. `galileo/page.js` escapes `prospect` before using it in
its English dictionary for this reason. Prefer `textContent` over `innerHTML` for
raw values.

## Hard constraints (these will break things)

- **Assets are a single flat segment** — `/templates/<id>/<file>`. No
  subdirectories; `/templates/<id>/img/logo.png` will 404.
- **Asset extension allowlist:** `.css .js .png .jpg .jpeg .svg .webp .woff2 .ico`.
  Anything else 404s.
- `template.json` and `index.html` are never served as assets.
- A manifest that violates any rule above throws at boot → the deploy fails.

## Workflow

**Create a template**
1. `mkdir templates/<id>` and add `template.json`, `index.html`, and assets.
2. Run it: `ADMIN_TOKEN=dev pnpm start` → open http://localhost:3000 (log in with
   `dev`). In dev the registry re-scans every request, so edits appear on refresh.
   The new template shows up in the picker automatically.
3. Pick it, fill the form, watch the live preview, click **Open ↗** to view full size.

**Update a template** — edit the files in place. Adding/removing/renaming a field
in `template.json` changes the form and the available `{{tokens}}`; update
`index.html` to match. Renaming a field id orphans any pages already stored with
the old id (their value silently drops to the default), so prefer additive changes.

**Validate before committing**
```sh
pnpm test                                   # engine + server suite
node -e "require('./engine').loadTemplates()"   # throws on a bad manifest
```
And confirm no stray tokens render:
```sh
node -e "const e=require('./engine');const t=e.getTemplate('<id>');const v={};t.manifest.fields.forEach(f=>v[f.id]=f.default);const h=e.renderTemplate(t,e.validateValues(t.manifest,v).values);console.log(h.match(/\{\{\w+\}\}/g)||'no stray tokens')"
```
Pushing to `main` triggers a Render deploy; a malformed template fails that build
while the live site keeps serving the previous version.

## Minimal skeleton

`templates/example/template.json`
```json
{
  "name": "Example",
  "description": "A starter template",
  "nameField": "company",
  "fields": [
    { "id": "company", "label": "Company", "type": "text", "required": true, "max": 80, "group": "Basics", "default": "Acme" },
    { "id": "headcount", "label": "Headcount", "type": "number", "int": true, "min": 0, "group": "Basics", "default": 100 }
  ]
}
```

`templates/example/index.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{{company}}</title>
  <link rel="stylesheet" href="/templates/example/styles.css">
</head>
<body>
  <h1>{{company}}</h1>
  <p>Team of {{headcount}}.</p>
  <script>window.PAGE_CONFIG = {{PAGE_CONFIG_JSON}};</script>
  <script src="/templates/example/page.js"></script>
</body>
</html>
```

## Checklist before you ship

- [ ] `id` (directory name) is lowercase/hyphen and not reserved.
- [ ] Every field: valid `id` (`^[a-z][a-z0-9_]*$`), known `type`, non-empty `label`.
- [ ] `nameField` (if set) matches a field id.
- [ ] Every field has a sensible `default`; defaults satisfy their constraints.
- [ ] Every `{{token}}` in `index.html` is a real field id or `PAGE_CONFIG_JSON`.
- [ ] `{{PAGE_CONFIG_JSON}}` is present once, inside a `<script>`.
- [ ] Assets use absolute `/templates/<id>/…` paths, are flat, and use allowed extensions.
- [ ] Client JS escapes any string value it puts into `innerHTML`.
- [ ] `pnpm test` passes and no stray `{{…}}` tokens render.
