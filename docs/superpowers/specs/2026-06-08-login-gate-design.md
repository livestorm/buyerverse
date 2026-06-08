# Design: Login gate + session for the builder

**Date:** 2026-06-08
**Status:** Approved

## Problem

The builder at `GET /` is served to anyone; the admin token is entered inline
in the publish panel and kept in `localStorage`, sent as a Bearer header. We
want to gate the builder behind a login that asks only for the admin token and
holds it in a session. Same change cleans up a layout bug: the generated
`grid-3`/`grid-4` columns overflow the (now narrower) form column into the
preview pane, and the "enter your admin token" preview placeholder overlaps the
form.

## Auth model

Stateless — no session store (fits the zero-dependency architecture). The
session cookie value IS the admin token; it is compared the same timing-safe
way as the Bearer header.

- `authed(req)` accepts **either** a valid `Authorization: Bearer <token>`
  header **or** a valid `bv_session` cookie. Both timing-safe-compared against
  `ADMIN_TOKEN`. Bearer is retained so curl/scripts/REST keep working.
- Cookie attributes: `HttpOnly` (not readable by page JS), `SameSite=Strict`
  (won't ride cross-site requests → CSRF protection for the cookie-authed
  POST/DELETE), `Path=/`, and `Secure` **only** when the request arrived over
  HTTPS (detected via `x-forwarded-proto === 'https'`, since Render terminates
  TLS at its proxy) so plain-HTTP localhost dev still works.
- Lifetime: **session cookie** (no `Max-Age`/`Expires`) — cleared when the
  browser closes.

## Routes

| Route | Behavior |
|---|---|
| `GET /login` | Serve `login.html` (centered card: token field + submit). If already authed → 302 `/`. |
| `POST /login` | Native form post (`token` field). Timing-safe check. Match → set cookie + 303 `/`. Mismatch → re-serve login with an error banner, 401. No `ADMIN_TOKEN` configured → login page shows a 503-style "server has no admin token" message. |
| `GET /` (and `/index.html`) | No valid cookie → 302 `/login`; else serve `builder.html`. |
| `GET /logout` | Clear the cookie (`Max-Age=0`) → 302 `/login`. |
| `GET /page/<slug>` | Unchanged — **public** (customer-facing). |
| `GET /templates/<id>/<asset>` | Unchanged — **public**. |
| `GET /api/templates` | Unchanged — public metadata. |
| `POST /api/preview`, `GET/POST /api/pages`, `DELETE /api/pages/<slug>` | Unchanged contract; now satisfiable by the cookie as well as Bearer. |

## Builder changes (`builder.html`)

- Remove the inline **Admin token** field and all `localStorage`
  token logic. `fetch` calls drop the `Authorization` header (same-origin
  cookie is sent automatically).
- Preview + pages list load immediately on open (the page only renders when
  authed). Remove the token-gated empty state and its "enter your admin token"
  branch in `renderPreview`; the preview iframe is the default.
- Add a small **Log out** link in the header (→ `/logout`).
- The Publish panel becomes just the button + status line.

## Overlap fix

Generated grids change from `repeat(N, 1fr)` to `repeat(N, minmax(0, 1fr))`
(`.grid-2`, `.grid-3`, `.grid-4`) so columns shrink below the number inputs'
content width instead of overflowing the card into the preview pane.

## Testing (`test/server.test.js`)

1. `GET /` with no cookie → 302 to `/login`.
2. `GET /login` → 200, contains a token input.
3. `POST /login` correct token → `Set-Cookie: bv_session=…; HttpOnly`, 303 to `/`.
4. `POST /login` wrong token → 401, no `Set-Cookie`.
5. `GET /` with a valid `bv_session` cookie → 200 (builder HTML).
6. API reachable via cookie (`GET /api/pages` with `Cookie`) **and** still via Bearer; neither → 401.
7. `GET /logout` → cookie cleared (`Max-Age=0`), and a follow-up `GET /` redirects.

Existing 31 tests stay green (their Bearer-header auth is unchanged).

## Out of scope

Multiple users / per-user accounts, password reset, rate-limiting login
attempts (single shared token; brute-force is mitigated by token entropy).
