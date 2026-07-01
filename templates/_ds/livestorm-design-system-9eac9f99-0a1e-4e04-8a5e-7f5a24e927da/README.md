# Livestorm Marketing Design System

A unified design system for **Livestorm** — the all‑in‑one video engagement platform used by teams to run webinars, virtual events, product demos, onboarding sessions, and on‑demand video experiences.

This folder contains the tokens, fonts, assets, copy conventions, and UI‑kit recreations needed to design or prototype Livestorm‑branded marketing surfaces (website, landing pages, campaign assets, decks).

---

## Sources

Materials used to build this system (not assumed accessible to the reader — kept here for provenance):

| Source | Location | Notes |
|---|---|---|
| UI components Nuxt layer | Local mounted folder `livestorm-ui-components/` | Tailwind config, Vue components, icon font, Object Sans woff2 files. Used as source of truth for tokens and component styles. |
| Brand fonts | `uploads/{regular,medium,bold}.woff2` → copied to `fonts/object-sans/` | Object Sans @ 400 / 500 / 600 |

> No Figma file, no decks, no marketing screenshots were provided. Visuals and copy patterns below are inferred from the codebase (component styles, class names, Tailwind tokens, icon names) and from Livestorm's public product category (webinars, virtual events, on‑demand video). Flag anything here that contradicts your reference material — see "Caveats" at the bottom.

---

## Index

```
Livestorm Design System/
├── README.md                 ← you are here
├── SKILL.md                  ← Agent Skill manifest (Claude Code compatible)
├── colors_and_type.css       ← CSS variables for color, type, radii, shadows, spacing, motion
├── fonts/
│   ├── object-sans/          ← regular.woff2, medium.woff2, bold.woff2
│   └── icon/icon.woff2       ← Livestorm's custom icon font (100+ glyphs, PUA-encoded)
├── assets/
│   └── icon-glyph-map.json   ← icon name → codepoint lookup for the icon font
├── preview/                  ← Small HTML cards populating the Design System tab
│   ├── type-scale.html
│   ├── type-headings.html
│   ├── weights.html
│   ├── palette-brand.html
│   ├── palette-neutrals.html
│   ├── palette-accents.html
│   ├── palette-semantic.html
│   ├── radii.html
│   ├── shadows.html
│   ├── spacing.html
│   ├── buttons.html
│   ├── inputs.html
│   ├── tags.html
│   ├── icons.html
│   ├── modal.html
│   └── logo.html
└── ui_kits/
    └── marketing/            ← Marketing website recreation (hero, nav, pricing, footer)
        ├── README.md
        ├── index.html
        └── *.jsx
```

---

## Brand snapshot

Livestorm is a browser‑based video engagement platform. The product surfaces fall into three rough buckets:

1. **Marketing website** — livestorm.co: hero modules, pricing, customer logos, blog, resource library.
2. **Product app** — event setup, registration pages, room (live session), on‑demand library, analytics.
3. **Room experience** — the in‑call UI: video grid, controls (mic, camera, screenshare, record), polls, Q&A, reactions, chat.

The icon font's glyph list confirms all three: `room-camera`, `room-mic`, `room-record`, `screensharing`, `reactions`, `poll`, `registration-page`, `on-demand`, `event-management`, `restreaming`, `ai`, `onestream`, `customer-success`, `product-demo`, etc.

---

## Content fundamentals

Livestorm's voice is **clear, warm, and practical** — it's a B2B SaaS brand that sells trust and ease. The codebase doesn't ship marketing copy, but the component API and icon taxonomy reveal the style:

- **Person:** Second‑person singular ("you"). Customer‑facing. No first‑person plural for product capabilities ("we built this"); use active product voice ("Record sessions automatically").
- **Casing:** Sentence case everywhere in UI — headings, buttons, menu items. Exception: `<label>` elements are **ALL CAPS** with 0.02em tracking (see `label.vue`). Tag pills are title case. Product/feature names are capitalized (Live, On‑Demand, Event management, Registration page).
- **Punctuation:** Periods on full sentences only. No periods on CTAs, tags, single‑phrase labels. Em dashes are fine — they match the voice.
- **Contractions:** Yes. ("You'll", "It's", "Don't".) Formal contractions keep B2B copy from reading stiff.
- **Numbers:** Numerals over words ("5 sessions" not "five sessions"). Percentages with `%` symbol. Time in short form ("30 min", "2 h").
- **Emoji:** **Not used** in the product chrome. No emoji glyphs found in the icon set or component labels. Treat the icon font as the only inline glyph system. If a product area surfaces emoji (e.g. reactions in a live room), they are user‑generated, never designer‑placed.
- **Emphasis inside headings:** `<strong>` inside `<h1>` or `<h2>` paints **Livestorm Blue** (not bold weight — still 400). This is the single loudest visual flourish in long‑form typography. Use it to call out **one** phrase per heading, never multiple.
- **Imperative + benefit:** Button / CTA pattern is verb + object, short: "Book a demo", "Watch the replay", "Start free trial", "See pricing". Button inner copy is `font-medium` (500), `leading-none`.
- **Technical terms:** Keep casing consistent with the product — "on‑demand" hyphenated lowercase, "Livestream" one word capital L, "webinar" lowercase.

**Sample copy** (tonally on‑brand, paraphrased from what the codebase implies):

> **Run webinars your audience actually shows up for.** Branded registration, live polls, replays, and analytics in one browser tab.
>
> [Book a demo]   [Start free trial]

> UPCOMING · **Product demo — Livestorm 101**
> Tuesday, May 6 · 11:00 AM CET · 45 min

---

## Visual foundations

### Type

- **One family, always:** Object Sans — a geometric sans with 400 (regular), 500 (medium), 600 (bold). No secondary/display face. No serif. No mono.
- **Body size is 18px (`1.125rem` → `text-origin`)**, not 16px. This is intentional — Livestorm runs larger type than most SaaS.
- **Line height is `28px` (`leading-7`) for body**. Headings use fixed px line heights (not ratios): 56 / 64 / 80 for h1, 32 / 40 / 64 for h2, etc.
- **Headings are light** (h1 / h2 are 400 weight at desktop, 500 at mobile). The weight contrast comes from `<strong>` children recoloring to blue rather than bolding.
- **Labels are UPPERCASE** small (14px, tracked). Used for form fields and eyebrows over headings.

### Color

- **Primary:** Livestorm Blue 700 `#0B42C3` (CTAs on **light surfaces**, links, brand strong). Hover is 800. The 100 shade `#F0F4FF` is the go‑to subtle blue wash.
- **Ink:** Winter Green 900 `#12262B` — a blue‑black, not true black. Winter Green 700 `#477580` is the **CTA color on dark surfaces only** (dark hero, testimonial band, footer). **Never use Winter Green as a CTA on white.** If the surface is light, CTA = Livestorm Blue.
- **Neutrals:** Grey Blue scale for borders, muted text, disabled states, secondary buttons. 600 is the default muted body copy color.
- **Accents (used sparingly, one per context):** Sandstorm Yellow (warm highlight), Sirocco (warm orange), Sunburst Red (attention), Live Red (on‑air / destructive), Spring Green (success), Blizzard (cool accent).
- **Palette logic:** 9 named color families, each with 100→900 scales. No gradients in the default palette. No neon. Everything is slightly cool, slightly desaturated.

### Backgrounds

- **Default is white.** `body` is `bg-white`. Full‑bleed imagery is not the primary mode — flat surfaces dominate.
- **Dark mode** exists (`body.dark`) with `#091316` as root bg — a near‑black with a green cast. Surfaces step up in Winter Green.
- Subtle section backgrounds use Grey Blue 100 `#F6F8F9` or Livestorm Blue 100 `#F0F4FF`.
- **No hand‑drawn illustrations, no textures, no repeating patterns** in the codebase. Imagery — when present — would be product screenshots or photography (not found in this drop; flag if you have it).

### Radii

From `tailwind.config.js`:
- `xs` = 8px — tags
- default `rounded` = **12px** — buttons, inputs, cards, most UI
- `xl` / `2xl` = 16px
- `3xl` = 24px — XL inputs (e.g. newsletter hero)
- `4xl` = **32px** — modals, hero cards, large containers
- `full` — avatars, pills

Default radius of 12px is the most distinctive call. It's softer than typical Tailwind (which defaults to 4px).

### Shadows

Three parallel 6‑step elevation scales, all very subtle (3–7% alpha):
- **`light-1` → `light-6`** — neutral black shadow, for light surfaces
- **`dark-1` → `dark-6`** — slightly heavier (10% alpha)
- **`blue-1` → `blue-6`** — blue‑tinted shadow `rgba(11,34,93,0.04)` for marketing cards on white

All shadows are **layered** (multiple offsets stacked) — not single drop shadows. Avoid single `0 4px 8px black/20` shadows; they look off‑brand.

### Motion

- **Easing:** `ease-out` (`cubic-bezier(0,0,0.2,1)`). No bounce. No overshoot.
- **Duration:** 300ms on almost everything (`transition duration-300 ease-out` is the copy‑paste). Button hover: 300ms. Input focus: 300ms.
- **Notable micromotion:** The modal close button rotates 90° on hover (500ms). The primary button's `arrow-right` icon slides 8px right on hover. Both are small, single‑property, purposeful.

### Hover & press

- **Primary buttons:** darken one step (700 → 800). No scale. No shadow change.
- **Secondary buttons:** `grey-blue-200` → `grey-blue-300`.
- **Text buttons:** no bg change; icon slides on hover.
- **Inputs:** border shifts `grey-blue-300` → `grey-blue-600` on hover, → `livestorm-blue-700` on focus.
- **Disabled:** `opacity-40` + `cursor-not-allowed`. Very specific — don't substitute a fade to gray.
- **Press / active:** not defined separately in the codebase — rely on hover + focus outline.
- **Focus ring:** 2px outline, `-outline-offset-4` on buttons (inside the shape). Not a halo — it sits inset.

### Borders

- Inputs and selects: **1px solid Grey Blue 300**. Rounded 12px.
- Error state: 1px solid Live Red 600.
- Cards / surfaces: usually borderless — elevation comes from shadow, not a stroke.

### Cards

- Rounded 12px (default) to 32px (hero / modal).
- No border by default — use `shadow-light-2` or `shadow-blue-3`.
- Padding defaults to `p-8` (32px) on mobile, `p-12` (48px) on desktop for modals.

### Transparency & blur

- Dark mode scrim: `bg-white/10`.
- Light mode scrim: `bg-black/10`.
- Dark input: `backdrop-blur-md` with 40% surface. Used only in dark mode.
- No frosted‑glass navigation in the found codebase — if you add one, use `bg-white/80` + `backdrop-blur-md`.

### Layout

- Max content width **1328px** (`max-w-[1328px]`). Container padding: 16px mobile, 24px ≥md, 24px ≥xl.
- Breakpoints: sm 640 · md 768 · lg 1024 · **xl 1328** · xxl 1441 · xxxl 1920.
- 12‑column grid implied; the `Container` component supports `start/end` offsets in multiples of 110px at xl.

---

## Iconography

- **Single source: a custom icon font ("Icon Font")** shipped in `fonts/icon/icon.woff2`. Referenced as `font-family: 'Icon Font'` in component CSS.
- **100 glyphs**, PUA‑encoded starting at **U+E900**. Each icon name maps to a codepoint by its position in the `icons` array inside `icon.vue`. The mapping is captured in `assets/icon-glyph-map.json`.
- **Usage:** `<i class="icon icon-<name>" data-unicode="<char>"/>`. The `::before` pseudo renders the glyph from `data-unicode`.
- **Weights:** 400 / 500 / 600 all supported by the font file (`font-weight: 400 500 600`).
- **Themes:** `.icon.light` → Winter Green 900, `.icon.dark` → white.
- **No SVG icons, no PNG icons, no emoji** in the system. If you need a glyph that isn't in the font, flag it — don't hand‑roll an SVG.
- **Icon taxonomy reveals the product surface area:** action icons (`play`, `pause`, `record`, `share`), room controls (`room-mic`, `room-camera`, `room-lock`, `screensharing`), feature icons (`poll`, `reactions`, `on-demand`, `ai`, `registration-page`, `event-management`), social (`linkedin`, `facebook`, `twitter`, `x-logo`, `instagram`, `youtube`), industries (`healthcare`, `finance-2`, `graduation-cap`, `office`), UI plumbing (`chevron-*`, `arrow-*`, `check`, `x`, `plus`, `minus`, `search`, `settings`).
- **Logo:** Not shipped in the codebase drop. A wordmark placeholder is provided in `preview/logo.html` and in the UI kit — **flag this and ship the real logo when available**.

---

## Caveats & substitutions

- **Logo:** no official Livestorm logo asset was provided. The UI kit uses an Object Sans wordmark in Livestorm Blue 700 with a small blue dot — a best‑effort placeholder. **Please supply the canonical SVG logo** (horizontal + square) and we'll swap them in.
- **Photography / marketing imagery:** none shipped. Hero areas and feature cards use subtle geometric placeholders. **Please supply brand photography or share the Figma library.**
- **Slide deck / presentation templates:** none provided, so no `slides/` folder was generated. If you have a Livestorm keynote template, attach it and we can build slide components.
- **Extra product surfaces (app, room):** this initial pass ships a **Marketing website** UI kit only. Room (in‑call) and Product app kits are good next steps once you confirm priorities.
- **Content voice examples above** are extrapolated from the product category, not copied from live marketing copy. Correct us if the brand voice document says otherwise.

---

## How to use this system

- For quick design work: read `colors_and_type.css`, import fonts from `fonts/`, grab any HTML from `preview/` as a starting point.
- For a full page mock: start from `ui_kits/marketing/index.html` and compose JSX components.
- For a production handoff: Tailwind tokens in the source repo remain the authoritative config; this folder mirrors them.

See `SKILL.md` for the agent‑invocable version of this skill.
