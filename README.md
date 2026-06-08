# buyerverse

Proposal-page builder: generate personalized Livestorm renewal microsites
from a template and serve them at `/page/<slug>`.

## Routes

| Route                      | Auth         | Description                      |
| -------------------------- | ------------ | -------------------------------- |
| `GET /`                    | —            | Builder UI (picker, schema-driven form, live preview) |
| `GET /page/<slug>`         | —            | Rendered proposal page (FR/EN)   |
| `GET /templates/<id>/<f>`  | —            | Template assets                  |
| `GET /api/templates`       | —            | List template manifests          |
| `POST /api/preview`        | Bearer token | Render `{template, values}` without storing — returns `{html, errors}` |
| `GET /api/pages`           | Bearer token | List pages                       |
| `POST /api/pages`          | Bearer token | Create/update `{ slug, template, values }` |
| `DELETE /api/pages/<slug>` | Bearer token | Delete a page                    |

## Configuration

| Env var        | Purpose                                                           |
| -------------- | ----------------------------------------------------------------- |
| `ADMIN_TOKEN`  | Shared secret for the builder/API (required to publish pages)     |
| `DATABASE_URL` | Postgres connection string; without it pages are stored in memory |
| `PORT`         | Injected by Render                                                |
| `NODE_ENV`     | Set to `production` to cache the template registry (otherwise it re-scans `templates/` per request) |

A `galileo` page is seeded on first boot, so the original proposal lives at
`/page/galileo`.

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

## Development

```sh
ADMIN_TOKEN=dev pnpm start   # in-memory store, http://localhost:3000
pnpm test                    # engine + server suite (node:test)
```

FR copy lives inline in `templates/galileo/index.html` (the source of
truth); the EN dictionary and FR number formatting live in
`templates/galileo/page.js`, fed by the server-injected `window.PAGE_CONFIG`.
