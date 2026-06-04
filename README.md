# buyerverse

Proposal-page builder: generate personalized Livestorm renewal microsites
from a template and serve them at `/page/<slug>`.

## Routes

| Route                      | Auth         | Description                      |
| -------------------------- | ------------ | -------------------------------- |
| `GET /`                    | —            | Builder UI                       |
| `GET /page/<slug>`         | —            | Rendered proposal page (FR/EN)   |
| `GET /api/pages`           | Bearer token | List pages                       |
| `POST /api/pages`          | Bearer token | Create/update `{ slug, config }` |
| `DELETE /api/pages/<slug>` | Bearer token | Delete a page                    |

## Configuration

| Env var        | Purpose                                                           |
| -------------- | ----------------------------------------------------------------- |
| `ADMIN_TOKEN`  | Shared secret for the builder/API (required to publish pages)     |
| `DATABASE_URL` | Postgres connection string; without it pages are stored in memory |
| `PORT`         | Injected by Render                                                |

A `galileo` page is seeded on first boot, so the original proposal lives at
`/page/galileo`.

## Customizable fields (v1)

Prospect name, account manager (name/email), 2025 KPIs (schools, users,
sessions, registrants, attendees, attendance rate, NPS) and the pricing
table (current contract, 3 volumes, 3 discount tiers, 3 initial prices —
revised prices are computed). Everything else — growth chart, top-schools
chart, use cases, testimonial — still carries the Galileo template content.

## Development

```sh
ADMIN_TOKEN=dev yarn start   # in-memory store, http://localhost:3000
```

FR copy lives inline in `template.html` (the source of truth); the EN
translation dictionary lives in `app.js` and reads dynamic values from the
server-injected `window.PAGE_CONFIG`.
