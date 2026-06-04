# Design: Template selection + live preview for the page builder

**Date:** 2026-06-04
**Status:** Approved
**Approach:** Manifest-driven templates + generic server substitution (Approach A)

## Problem

The builder supports exactly one page layout: `template.html`, with its field
schema hardcoded in three places (the `builder.html` form, `render.js`
validation/token generation, and the `app.js` EN dictionary). We want:

1. A `templates/` directory of self-contained templates (HTML + CSS + JS),
   each defining **its own form fields**, authored/edited with Claude Design.
2. A **side-by-side live preview** in the builder that re-renders as you type,
   before a page is published.

## Non-goals

- User-uploaded templates (templates are repo code, deployed via git).
- Per-template server-side render code (templates ship no Node code).
- Device-size toggles or full-page preview tabs (side-by-side pane only).
- Shared/core fields across templates (each template owns its schema fully).

## Template format

A template is a directory under `templates/<id>/`; the directory name is the
template id (same character rules as page slugs).

```
templates/galileo/
  template.json   ← manifest (display info + field schema)
  index.html      ← the page, with {{token}} placeholders
  styles.css      ← template-owned assets (any name/count)
  page.js
```

### Manifest (`template.json`)

```json
{
  "name": "Renewal proposal — education",
  "description": "Bilingual FR/EN renewal microsite (original Galileo layout)",
  "nameField": "prospect",
  "fields": [
    { "id": "prospect", "label": "Prospect name", "type": "text",
      "required": true, "max": 80, "group": "Prospect" },
    { "id": "am_email", "label": "AM email", "type": "email",
      "required": true, "group": "Account manager" },
    { "id": "kpi_nps", "label": "NPS (0–10)", "type": "number",
      "min": 0, "max": 10, "step": 0.1, "group": "2025 key figures",
      "default": 7.7 }
  ]
}
```

- **Field types (v1):** `text`, `email`, `number`, `textarea`.
- **Per-field options:** `required`, `min`/`max` (string length for
  text/textarea, numeric bounds for number), `int`, `step`, `placeholder`,
  `hint`, `default`, `group` (form section heading).
- Field ids must match `^[a-z][a-z0-9_]*$` — they double as template tokens.
- `nameField`: id of the field shown in the builder's page list (falls back
  to the page slug).
- `default` values double as form prefill; the Galileo manifest's defaults
  reproduce today's seeded page.

### Page contract (`index.html`)

- `{{field_id}}` → the HTML-escaped field value.
- `{{PAGE_CONFIG_JSON}}` → `window.PAGE_CONFIG = { template: "<id>",
  values: { ...flat field values } }` (JSON `<`-escaped as today).
- All **derived** values — computed price matrix, locale number formatting,
  FR/EN i18n — are computed by the template's own JS from `PAGE_CONFIG`.
  (This is the pattern the current EN dictionary already uses.)
- Asset URLs are absolute: `/templates/<id>/<file>`.

## Storage

No schema change. `pages.config` JSONB becomes:

```json
{ "template": "galileo", "values": { "prospect": "Galileo", ... } }
```

On boot, a one-time converter rewrites legacy-shaped rows (the current
`{prospect, am, kpis, pricing}` structure) into the new shape. The seed
creates the `galileo` page from the Galileo manifest's defaults; `defaults.js`
is deleted.

## Server

`render.js` becomes a generic engine with no per-template knowledge:

- **Boot:** scan `templates/*/template.json`; validate every manifest
  (id format, known types, well-formed constraints). A malformed manifest
  **fails the boot** — bad templates fail the deploy and Render keeps the
  previous version live. In dev (`NODE_ENV !== 'production'`), templates
  re-scan per request so edits appear on refresh.
- **`validate(manifest, values, {lenient})`** — generic, by field
  type/constraints. Strict mode returns `{error: "field_id: reason"}` on the
  first problem. Lenient mode (preview) substitutes the field's `default`
  for missing/invalid fields (no default: `""` for text/textarea/email,
  the field's `min` or `0` for number) and collects errors without blocking
  the render.
- **`render(templateId, values)`** — token substitution (HTML-escaped) +
  `PAGE_CONFIG_JSON` injection.

### Routes

| Route | Auth | Behavior |
|---|---|---|
| `GET /api/templates` | — | List manifests `[{id, name, description, nameField, fields}]`. |
| `POST /api/preview` | Bearer | `{template, values}` → lenient-validate, return JSON `{html, errors}`. Nothing stored. Unknown template → 400 JSON. |
| `GET /templates/<id>/<file>` | — | Template assets. Extension whitelist: `css js png jpg svg webp woff2 ico`. Path-traversal blocked. `template.json` and `index.html` are not served. |
| `POST /api/pages` | Bearer | Now `{slug, template, values}`; strict validation; 400 if template unknown or values invalid. |
| `GET /page/<slug>` | — | Render via the page's stored template; template since deleted from repo → 404 page. |
| `GET /api/pages` | Bearer | Unchanged (page list now derives display name via `nameField`). |
| `DELETE /api/pages/<slug>` | Bearer | Unchanged. |

## Builder UI

- **Layout:** template picker on top; below it a two-column split — schema-
  generated form (left), sticky preview iframe (right). Existing-pages list
  moves below the form. Stacks on narrow screens.
- **Picker:** populated from `GET /api/templates` (name + description).
  Selecting a template regenerates the form: fields grouped under their
  `group` headings (numbered-step cards as today), prefilled with `default`s.
- **Slug** stays page-level, auto-slugified from the `nameField` value.
- **Live preview:** any form change → debounced (~400 ms)
  `POST /api/preview` → `iframe.srcdoc` (same origin, so `/templates/...`
  asset URLs resolve). Until a token is entered the pane shows
  "Enter the admin token to preview".
- **Lenient preview:** mid-typing invalid/empty fields fall back to defaults
  so the preview always renders; real validation errors still show in the
  status line. Strict validation gates only **publish**.
- **Edit flow:** "Edit" switches the picker to the page's template and loads
  its values.

## Galileo migration

- `template.html` → `templates/galileo/index.html`; `app.js` →
  `templates/galileo/page.js`; the page stylesheet → `templates/galileo/styles.css`.
  The builder keeps its own copy of the base stylesheet at `/styles.css`.
- FR formatting + price-matrix math currently in `render.js` move into
  `page.js` — FR becomes a second dictionary alongside the existing EN one,
  both fed by `PAGE_CONFIG`.
- Tokens in `index.html` change from derived names (`{{SCHOOLS_FR}}`) to flat
  field ids (`{{kpi_schools}}`) — formatted display is template-JS territory.
- Acceptance: `/page/galileo` must be **visually identical** to the currently
  deployed version in both FR and EN.

## Error handling

- Malformed manifest → boot failure (fails the deploy; old version stays live).
- Unknown template: at page render → 404 page; at publish/preview → 400 JSON.
- Preview render exception → 500 JSON; builder keeps showing the previous
  preview and surfaces the error in the status line.

## Testing

Extend the existing smoke-test pattern (boot with memory store, curl):

1. `GET /api/templates` lists `galileo` with its full field schema.
2. `POST /api/preview` returns HTML with values substituted, zero unreplaced
   `{{...}}` tokens, and the lenient fallback applied for a missing field.
3. Publish → render → delete round-trip with `{slug, template, values}`.
4. Legacy-config row is converted on boot and still renders.
5. `GET /templates/galileo/../server.js` (traversal) and
   `GET /templates/galileo/template.json` are rejected.
6. Manual visual check: `/page/galileo` FR + EN identical to production.
