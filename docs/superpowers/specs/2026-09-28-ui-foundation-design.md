# MYGD UI Redesign — Sub-project 1: Design Foundation

**Status:** Draft for review · **Date:** 2026-09-28 · **Branch:** `feat/ui-foundation`

## 1. Intent

**Stated by Sagar:** complete redesign of the whole UI. Goal = *same brand, better
execution* — keep the `DESIGN.md` identity (Berlin industrial, dark graphite, neon
magenta/cyan, Döner gold) and make it consistent, polished and professional on every
surface. Customer-facing surfaces first. Approach A: foundation first, then per-surface
Stitch mockup → approval → rebuild.

**Assumptions (correct me):**
- Dark theme only; no light mode.
- Existing languages (EN / DE / GR via `src/lib/i18n`) stay; the kit must not hard-code copy.
- Redesign is **presentation-only**. Data fetching, stores, pricing, VAT and order
  submission are untouched, so this work cannot collide with remediation WU-1…WU-4.

**Success criteria for this sub-project:**
1. One token source; zero hard-coded palette hex values in `src/ui/**` and no growth of
   hex literals elsewhere (enforced by a test).
2. A shared component kit in `src/ui/` used by all later surface redesigns.
3. Fonts bundled at build time — kiosk renders correctly with no internet.
4. Every kit component has loading / empty / error / disabled states where they apply,
   meets WCAG 2.2 AA contrast and visible focus, and respects `prefers-reduced-motion`.
5. Existing screens need not change visually in this sub-project (they migrate surface by
   surface later) — but nothing may break.

## 2. Decomposition

| # | Sub-project | Depends on |
|---|---|---|
| **1** | **Foundation: tokens, fonts, kit, gallery (this spec)** | — |
| 2 | Kiosk `/` | 1 |
| 3 | Web order `/order` | 1 |
| 4 | Menu boards `/boards` | 1 |
| 5 | Wait display `/display` | 1 |
| 6 | Counter POS `/pos` | 1 |
| 7 | KDS `/kds/*` | 1 |
| 8 | Staff hub `/staff` | 1 |
| 9 | Admin `/admin/*` (menu/recipes, inventory, suppliers, BI) | 1 |

Each of 2–9 gets its own Stitch mockups → spec → plan → PR.

## 3. Current state (measured 2026-09-28)

- 1,100+ literal hex colours in `.tsx`; `bg-/text-/border-mygd-*` Tailwind tokens used **0** times.
- Drifted duplicates: success `#10B981` vs `#4CAF50`; danger `#EF4444` vs `#E53935`;
  orange `#FF5722` exists in code but not in `DESIGN.md`; one-off canvases (`#121214`, `#343438`).
- Five radius styles in use (`lg`, `xl`, `2xl`, `3xl`, `full`) with no rule.
- Fonts via render-blocking Google `@import` in `globals.css` → fail offline.
- `globals.css` sets `user-select: none` and `touch-action: manipulation` globally — right
  for kiosk/POS, wrong for admin (text in tables can't be selected).
- Available: Tailwind 3.4, `clsx`, `tailwind-merge`, `framer-motion`, `lucide-react`, Playwright.
  Tests: `node:test` via `tsx --test tests/*.test.mjs`.

## 4. Design

### 4.1 Tokens — `src/ui/tokens.css`

Three layers, all CSS custom properties, OKLCH values copied exactly from `DESIGN.md`.

**Primitives** (never used directly by components):
`--mygd-magenta`, `--mygd-magenta-strong` (hover), `--mygd-cyan`, `--mygd-gold`,
`--mygd-green`, `--mygd-red`, `--mygd-orange`, and a graphite scale
`--mygd-graphite-{950,900,850,800,750,700,600,500,300,100}`
(900 = canvas `oklch(0.18 0.005 285)`, 800 = surface, 700 = raised, 600 = border).

**Semantic** (what components use):

| Token | Maps to | Use |
|---|---|---|
| `--color-canvas` | graphite-900 | page background |
| `--color-surface` | graphite-800 | cards, panels |
| `--color-surface-raised` | graphite-700 | modals, popovers, hover |
| `--color-border` / `--color-border-subtle` | graphite-600 / -750 | dividers |
| `--color-text` / `-muted` / `-subtle` | white / `DESIGN.md` secondary / muted | copy |
| `--color-accent` / `-accent-hover` / `-on-accent` | magenta | primary CTA, active |
| `--color-accent-2` | cyan | combos, secondary pills, info |
| `--color-highlight` | gold | bestseller, VIP |
| `--color-success` | green | veggie, done, ready |
| `--color-warning` | orange | delays, low stock |
| `--color-danger` | red | spicy, critical HACCP, errors |
| `--color-focus` | cyan | focus ring (3px) |

Drift resolution: `#10B981`/`#4CAF50` → `--color-success`; `#EF4444`/`#E53935` →
`--color-danger`; `#FF5722` → `--color-warning` (added to `DESIGN.md`); `#25D366`
stays as `--brand-whatsapp` (third-party constant, allow-listed).

**Scales:** radius `--radius-sm 6px`, `--radius-md 10px`, `--radius-lg 16px`,
`--radius-pill 999px` (replaces the five ad-hoc radii). Spacing = Tailwind 4px grid.
Elevation `--shadow-1/2/3`, plus the existing glows as `--glow-accent`, `--glow-accent-2`.
Motion `--dur-fast 120ms`, `--dur-base 200ms`, `--dur-slow 320ms`, `--ease-out`;
all `0ms` under `prefers-reduced-motion: reduce`.

**Surface density** — `<body data-surface="…">`, set by each route's layout:

| Surface | Base font | Min touch target | Text selection |
|---|---|---|---|
| `kiosk` | 20px | 64px | off |
| `order` (phone) | 16px | 44px | on |
| `board` (4K) | 32px | n/a | off |
| `display` (TV) | 28px | n/a | off |
| `pos`, `kds`, `staff` | 18px | 56px | off |
| `admin` | 15px | 36px | **on** |

Implemented as `--text-base` and `--hit-min` overrides per `[data-surface]`; the global
`user-select`/`touch-action` rules move under the non-admin, non-order surfaces.

### 4.2 Tailwind — `tailwind.config.ts`

`theme.extend.colors` maps semantic names only to `var(--color-*)`
(`canvas`, `surface`, `surface-raised`, `border`, `text`, `muted`, `subtle`, `accent`,
`accent-2`, `highlight`, `success`, `warning`, `danger`, `focus`). Radii, shadows and
durations come from tokens. Legacy `mygd.*` keys stay temporarily as aliases so old screens
don't break; they are removed in the last surface sub-project.

### 4.3 Fonts

`next/font/google` for Oswald (display), Figtree (body), JetBrains Mono (numbers, order
IDs). Files are downloaded **at build time** and self-hosted → works offline, zero layout
shift, no render-blocking `@import`. Exposed as `--font-display`, `--font-body`,
`--font-mono`. Prices and order numbers use `tabular-nums`.

### 4.4 Component kit — `src/ui/`

Built on `cn()` (`clsx` + `tailwind-merge`); variants as typed maps (no new dependency).
Every component: typed props, no `any`, forwards `className`, token classes only,
visible focus ring, correct `aria-*`.

| Component | Variants / props | Required states |
|---|---|---|
| `Button` | `primary \| secondary \| ghost \| danger`; `size sm\|md\|lg\|xl`; `icon`, `fullWidth` | hover, active, focus, disabled, **loading** (spinner, keeps width) |
| `IconButton` | same variants; required `label` (aria) | as Button |
| `Card` | `surface \| raised \| outline`; `interactive`, `selected` | hover/press when interactive |
| `Badge` | `accent \| accent-2 \| highlight \| success \| warning \| danger \| neutral`; `size` | — |
| `PriceTag` | `amountCents`, `locale`, `size`, `strike` | uses `formatEuro`; tabular |
| `Input`, `Select`, `Textarea` | `label`, `hint`, `error` | focus, invalid, disabled |
| `Tabs` / `SegmentedControl` | controlled | arrow-key navigation, active indicator |
| `Modal` | `size`, `title`, `onClose` | focus trap, Esc, scroll lock, reduced motion |
| `Sheet` | `side bottom\|right` | as Modal (mobile / POS panels) |
| `Toast` + `useToast` | `success \| warning \| danger \| info` | auto-dismiss, `aria-live` |
| `Skeleton` | `text \| block \| card` | pulse (static under reduced motion) |
| `EmptyState` | icon, title, body, action | — |
| `ErrorState` | title, body, `onRetry` | — |
| `Spinner` | `size` | `role="status"` |
| `Stat` | label, value, delta | for BI/admin |
| `Kbd`, `Divider`, `VisuallyHidden` | — | — |

Not in the kit (built per surface later): product grid, cart, KDS ticket, menu-board
layouts, sortable tables.

### 4.5 Gallery — `/dev/ui`

A route that renders every component in every variant and state, switchable across the
`data-surface` densities. Served only when `NODE_ENV !== "production"` (404 in prod).
Used for review and Playwright screenshots.

### 4.6 Error handling

Kit components are presentational: they never fetch or throw. Async state is passed in
(`loading`, `error`) and rendered with `Skeleton` / `ErrorState`. Optional props have
defaults; invalid variant values are type errors.

## 5. Testing

- **Token guard** (`tests/ui-tokens.test.mjs`): fails on any hex / `rgb()` literal in
  `src/ui/**`; fails if the count of hex literals in `src/**/*.tsx` **rises** above a
  recorded baseline (a ratchet that reaches 0 as surfaces migrate).
- **Token integrity:** every colour referenced in `tailwind.config.ts` exists in
  `tokens.css`; brand OKLCH values match `DESIGN.md`.
- **Contrast** (`tests/ui-contrast.test.mjs`): computes WCAG ratios from the token values;
  body text ≥ 4.5:1, large text and UI ≥ 3:1 on every surface colour and on accent.
- **Component tests** (`tests/ui-kit.test.mjs`): `react-dom/server` `renderToStaticMarkup`
  per component/variant — classes, `aria-*`, disabled/loading markup, PriceTag in EN/DE/GR.
- **Gallery smoke** (Playwright): `/dev/ui` loads without console errors; screenshots per
  density attached to the PR.
- Existing `npm test`, `tsc --noEmit`, `next lint` and `next build` stay green.

## 6. Out of scope

Redesigning existing screens; changing data flow, stores or APIs; light theme; a new icon
set (stay on `lucide-react`); Storybook.

## 7. Risks

- **Mac-only `node_modules`** (Phase 0 lesson): run tests on the Mac, not the Linux VM.
- **SSR test rendering (Next 15 / React 19):** only stateful components (Modal, Sheet, Tabs,
  Toast) are `"use client"`; the rest stay server-safe so they render in node tests.
- **Legacy aliases** could let old hex values creep back — the ratchet test blocks growth.
- **Contrast (measured):**

  | Pair | Ratio | Verdict |
  |---|---|---|
  | secondary `#A1A1AA` on surface | 5.51 | pass |
  | cyan on canvas | 12.65 | pass |
  | white on magenta | 4.48 | fails small text by 0.02 |
  | magenta text on canvas | 3.68 | large text / UI only |
  | muted `#71717A` on surface | **2.92** | **fails AA** |

  Resolutions: (a) `--color-text-subtle` is lightened from `DESIGN.md` muted to the lowest
  graphite step that reaches 4.5:1 on `--color-surface-raised`, and `DESIGN.md` is updated;
  (b) text on magenta is ≥ 18px bold only (button labels) — no small text on accent;
  (c) magenta is never used for body text on canvas. The contrast test enforces all three.
