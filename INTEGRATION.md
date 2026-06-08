# Buyerverse builder — Livestorm design-system restyle

Drop these into the repo root and commit. The change restyles the **builder chrome**
(`builder.html`) onto the Livestorm design system (Object Sans typography + DS color
tokens). All existing markup and JS is untouched — only fonts + CSS custom-property
values change.

## Files in this bundle

```
builder.html                      → repo root (overwrites existing)
fonts/object-sans/regular.woff2   → new  (Object Sans 400)
fonts/object-sans/medium.woff2    → new  (Object Sans 500)
fonts/object-sans/bold.woff2      → new  (Object Sans 600)
assets/                           → OPTIONAL — real Livestorm logo SVGs, not yet
                                     wired in (the topbar still uses the "B" mark).
```

Place them as:

```
buyerverse/
  builder.html
  fonts/object-sans/{regular,medium,bold}.woff2
```

## Required server change (1 edit)

`server.js` serves builder static files from an **explicit whitelist**, so the new
font paths must be added or they'll 404. Add three entries to `STATIC_FILES`:

```js
const STATIC_FILES = {
  '/styles.css': 'text/css; charset=utf-8',
  '/qr.js': 'text/javascript; charset=utf-8',
  '/fonts/object-sans/regular.woff2': 'font/woff2',
  '/fonts/object-sans/medium.woff2': 'font/woff2',
  '/fonts/object-sans/bold.woff2': 'font/woff2'
};
```

No other server change is needed — the existing `STATIC_FILES` handler already does
`fs.readFileSync(path.join(ROOT, pathname))` and sets the mapped content-type, so
`/fonts/object-sans/*.woff2` resolves to `./fonts/object-sans/*.woff2` at the repo root.

## What changed inside builder.html

1. Removed the Google Fonts `<link>` (Bricolage Grotesque + Instrument Sans).
2. Added `@font-face` for Object Sans 400/500/600 → `/fonts/object-sans/*.woff2`.
3. Added a `body.app { … }` block that overrides the renewal-template tokens
   (defined in `styles.css`) with DS values, **chrome only** — the preview iframe is
   a separate document and keeps its own styles:

   | token         | old        | new (DS)                         |
   |---------------|------------|----------------------------------|
   | `--font-*`    | Bricolage/Instrument | Object Sans            |
   | `--ink`       | `#0f1f3d`  | `#12262B` winter-green-900       |
   | `--ink-soft`  | `#243757`  | `#3F4950` grey-blue-800          |
   | `--muted`     | `#5b6b88`  | `#5D6D79` grey-blue-600          |
   | `--blue`      | `#2563eb`  | `#0B42C3` livestorm-blue-700     |
   | `--blue-deep` | `#1d4ed8`  | `#05299E` livestorm-blue-800     |
   | `--blue-pale` | `#eef3fb`  | `#F0F4FF` livestorm-blue-100     |
   | `--blue-mist` | `#e3ecfa`  | `#DCE6FE` livestorm-blue-200     |
   | `--line`      | `#dfe6f2`  | `#EAEEF1` grey-blue-200          |
   | `--mint-deep` | `#2f7d4f`  | `#0C7C59` spring-green-800       |
   | `--red`       | `#e5484d`  | `#BE3A37` live-red-600           |
   | `--gold`      | `#f5b73d`  | `#FFC91A` sandstorm-yellow-600   |

## Not included (separate follow-up)

- The **prospect-facing proposal page** (`styles.css` + `templates/renewal/`) still uses
  Bricolage / royal blue. Restyling that onto the DS is a separate change.
- A richer builder redesign (completion meter, browser-frame preview, refined stepper)
  exists as a React prototype — ask if you want it ported into this server-rendered file.
