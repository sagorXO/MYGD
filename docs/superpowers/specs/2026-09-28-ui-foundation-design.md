# MYGD UI Redesign — Sub-project 1: Design Foundation

**Status:** Draft v2 for review · **Date:** 2026-09-28 · **Branch:** `feat/ui-foundation`

## 1. Intent

**Stated by Sagar:**
- Complete redesign of the whole UI — *same brand, better execution*.
- "Create the design like Shopify" for **all screens**.
- **`#E50C7E` is the main colour.** Brand mark = the round "MY GERMAN DOENER · BITE THE HYPE ·
  ESTD 2025" badge (magenta / black / white), saved as `public/assets/brand/logo-badge.webp`.
- **Light + dark themes with a toggle** on every screen.
- Customer-facing surfaces first; foundation first, then per-surface Stitch mockup → approval → rebuild.

**Constraint found (licence):** Shopify's icons (`@shopify/polaris-icons` 9.3.1) and components
(`@shopify/polaris` 13.9.5, deprecated) may only be used in apps that integrate with Shopify, and
stand-alone apps must be *"dissimilar and visually distinct from Shopify products"*. MYGD is
stand-alone (it only receives Shopify webhooks). **Therefore: no Shopify assets, code or icons.**
We adopt Shopify-admin *design principles* (§4.1) — which are not licensed material — expressed in
MYGD's own identity, with an MIT icon set (`lucide-react`, already installed).

**Assumptions (correct me):**
- Languages EN / DE / GR (`src/lib/i18n`) stay; the kit never hard-codes copy.
- Redesign is **presentation-only**: data fetching, stores, pricing, VAT, order submission untouched
  → no collision with remediation WU-1…WU-4.

**Success criteria for this sub-project:**
1. One token source for both themes; zero hex literals in `src/ui/**`; no growth elsewhere (test-enforced).
2. A shared component kit in `src/ui/` used by every later surface redesign.
3. Theme toggle works on every route, persists per device, no flash of the wrong theme on load.
4. Fonts bundled at build time — kiosk renders correctly offline.
5. Every kit component: loading / empty / error / disabled states where relevant, WCAG 2.2 AA in
   **both** themes, visible focus, `prefers-reduced-motion` respected.
6. Existing screens keep working (they migrate surface by surface later).

## 2. Decomposition

| # | Sub-project | Default theme |
|---|---|---|
| **1** | **Foundation: tokens, themes, fonts, kit, app shell, gallery (this spec)** | — |
| 2 | Kiosk `/` | dark |
| 3 | Web order `/order` | light |
| 4 | Menu boards `/boards` | dark |
| 5 | Wait display `/display` | dark |
| 6 | Counter POS `/pos` | light |
| 7 | KDS `/kds/*` | dark |
| 8 | Staff hub `/staff` | light |
| 9 | Admin `/admin/*` | light |

"Default theme" applies until a device's user toggles; each of 2–9 gets its own Stitch mockups
(both themes) → spec → plan → PR.

## 3. Current state (measured 2026-09-28)

- 1,100+ literal hex colours in `.tsx`; `mygd-*` Tailwind tokens used **0** times.
- Drift: success `#10B981`/`#4CAF50`, danger `#EF4444`/`#E53935`, orange `#FF5722` not in
  `DESIGN.md`, one-off canvases `#121214`, `#343438`. Magenta is `#E50D7E` (→ becomes `#E50C7E`).
- Five ad-hoc radii; fonts via render-blocking Google `@import` (fail offline).
- Global `user-select: none` also blocks text selection in admin.
- `public/assets/brand/logo.svg` is a placeholder mark, not the real logo.
- Available: Tailwind 3.4, `clsx`, `tailwind-merge`, `framer-motion`, `lucide-react`, Playwright;
  tests via `node:test` (`tsx --test tests/*.test.mjs`).

## 4. Design

### 4.1 Design language — "Shopify-grade calm, MYGD identity"

Principles taken from Shopify-admin-quality UIs, applied with our own visuals:

1. **Calm neutral canvas, one accent.** Greys carry the layout; `#E50C7E` is reserved for the one
   primary action per view, selection and focus. Status colours are muted tints, not neon.
2. **Everything is a card.** Content sits in cards on the canvas; cards have a hairline border
   plus a soft shadow; sections inside cards are separated by dividers, not boxes-in-boxes.
3. **Page anatomy:** page header (title, optional back link, status badges, one primary + secondary
   actions) → content in a 2/3 + 1/3 layout on desktop, single column on mobile.
4. **Tight 4px spacing grid, compact type**, clear hierarchy by weight rather than size jumps.
5. **Scannable data:** index tables with filters, tabs and bulk actions; numbers right-aligned in
   tabular figures.
6. **Small, consistent line icons** (lucide, 1.5px stroke, 16/20/24px) — never mixed icon styles.
7. **Brand moments** (logo badge, Oswald display type, black) live in headers, the kiosk attract
   screen and menu boards — not on every button.

Visual distinctness from Shopify (licence): MYGD magenta accent, MYGD logo/typography (Oswald +
Figtree), our own component shapes and icon set.

### 4.2 Tokens — `src/ui/tokens.css`

**Primitives** (never used directly by components):
- Magenta ramp from `#E50C7E`: `--mygd-magenta-50 … -900`, **500 = `#E50C7E`** exactly;
  `-600 #C20A6A`, `-700 #B8095F` (darker, for text on light).
- Neutral ramp `--mygd-gray-0 (#FFFFFF) … -1000 (#000000)` (logo black = 1000).
- Status hues: green, amber, red, cyan (info), gold (highlight) — each 100 / 500 / 700.

**Semantic tokens**, defined twice: `:root, [data-theme="light"]` and `[data-theme="dark"]`:

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-canvas` | gray-50 `#F4F4F5` | gray-950 `#0B0B0C` | page background |
| `--color-surface` | white | gray-900 `#18181B` | cards |
| `--color-surface-raised` | white + shadow-2 | gray-850 | modals, popovers |
| `--color-surface-hover` | gray-100 | gray-800 | row/card hover |
| `--color-border` / `-subtle` | gray-200 / -150 | gray-750 / -800 | hairlines |
| `--color-text` | gray-950 | gray-50 | primary copy |
| `--color-text-secondary` | gray-600 | gray-400 | supporting copy |
| `--color-text-subtle` | lightest grey ≥ 4.5:1 on surface | same rule | meta, placeholders |
| `--color-accent` | magenta-500 `#E50C7E` | magenta-500 `#E50C7E` | primary button bg, selection |
| `--color-accent-hover` | magenta-600 | magenta-400 | hover |
| `--color-on-accent` | white | white | label on accent (bold ≥ 14px) |
| `--color-accent-text` | magenta-700 `#B8095F` | magenta-300 | links / accent text |
| `--color-accent-subtle` | magenta-50 | magenta-950 | selected row, active nav bg |
| `--color-success/-warning/-danger/-info/-highlight` + `-subtle` | 700 on 100 | 300 on 900 | badges, banners |
| `--color-focus` | magenta-500 ring + 2px offset | same | focus |
| `--brand-black` | `#000000` | `#000000` | logo, brand headers (theme-independent) |

Drift resolution: all old greens → `success`, reds → `danger`, `#FF5722` → `warning`, cyan
`#00FCED` → `info` (demoted from brand colour to status), `#E5A93C` → `highlight`,
`#25D366` → `--brand-whatsapp` (allow-listed third-party constant). `DESIGN.md` is updated to
match (new primary `#E50C7E`, light theme, principles above).

**Scales:** radius `--radius-sm 6px`, `--radius-md 8px` (default), `--radius-lg 12px` (cards),
`--radius-pill`; shadows `--shadow-card` (hairline + 0 1px 2px), `--shadow-2`, `--shadow-3`
(dark theme uses borders + lighter surfaces instead of heavy shadows); motion `--dur-fast 120ms`,
`--dur-base 200ms`, `--dur-slow 320ms`, `--ease-out` → all `0ms` under reduced motion.

**Surface density** — `data-surface` on `<html>`, set by each route's layout:

| Surface | Base font | Min touch target | Text selection |
|---|---|---|---|
| `kiosk` | 20px | 64px | off |
| `order` (phone) | 16px | 44px | on |
| `board` (4K) | 32px | n/a | off |
| `display` (TV) | 28px | n/a | off |
| `pos`, `kds`, `staff` | 17px | 52px | off |
| `admin` | 14px | 32px | **on** |

### 4.3 Theme switching

- `ThemeProvider` (`src/ui/theme/`) with `theme: "light" | "dark" | "system"`, stored per device in
  `localStorage` key `mygd.theme.<surface>` (so the kiosk and admin on one machine can differ).
- Default when nothing stored = the surface default in §2 (`system` for `order`).
- **No flash:** a tiny inline script in `app/layout.tsx` sets `data-theme` before paint.
- `ThemeToggle` component (sun / moon / monitor). Placement: app-shell top bar for staff/admin;
  a long-press / hidden manager control on kiosk, boards, display, KDS (customers shouldn't flip
  a kiosk theme) — exact placement decided per surface in its own spec.
- `localStorage` access wrapped in try/catch; falls back to the default.

### 4.4 Tailwind — `tailwind.config.ts`

`darkMode: ["selector", '[data-theme="dark"]']`. Colours map only to semantic variables
(`canvas`, `surface`, `surface-raised`, `surface-hover`, `border`, `text`, `text-secondary`,
`text-subtle`, `accent`, `accent-hover`, `on-accent`, `accent-text`, `accent-subtle`, `success`,
`warning`, `danger`, `info`, `highlight`, `focus`) — because the variables switch per theme,
components need **no `dark:` variants**. Legacy `mygd.*` keys stay as temporary aliases.

### 4.5 Fonts and icons

- `next/font/google`: Figtree (UI body), Oswald (display/brand headings only), JetBrains Mono
  (order numbers, IDs). Downloaded at build, self-hosted, offline-safe, no layout shift.
- Icons: `lucide-react` only, through an `Icon` wrapper enforcing size (16/20/24) and 1.5 stroke.

### 4.6 Component kit — `src/ui/`

Built on `cn()` (`clsx` + `tailwind-merge`); variants as typed maps; no new runtime dependency.
All: typed props, no `any`, forward `className`, token classes only, visible focus, correct ARIA,
render correctly in both themes.

**Layout / shell**
| Component | Purpose |
|---|---|
| `AppShell` | top bar (logo badge, location switcher slot, `ThemeToggle`, user menu) + collapsible side nav (staff/admin); full-bleed mode for kiosk/boards/display |
| `Page` | page header: title, back link, badges, primary/secondary actions; `fullWidth`, `narrow` |
| `Layout` / `Layout.Section` | 2/3 + 1/3 responsive columns |
| `Card` (+ `Card.Section`, `Card.Header`) | the core container; `interactive`, `selected` |
| `Stack` / `Inline` / `Grid` | spacing primitives on the 4px scale |
| `Divider` | — |

**Actions & inputs**
| Component | Variants / states |
|---|---|
| `Button` | `primary \| secondary \| tertiary \| critical \| plain`; `sm\|md\|lg\|xl`; icon; hover/active/focus/disabled/**loading** |
| `IconButton` | same, required `label` |
| `ButtonGroup`, `Menu` (action list popover) | keyboard navigable |
| `TextField`, `Select`, `Textarea`, `Checkbox`, `Radio`, `Switch` | label, help text, error, disabled |
| `SearchField`, `Filters` (chips + clear) | for index pages |
| `Tabs`, `SegmentedControl` | arrow keys, active indicator |

**Feedback & data**
| Component | Variants / states |
|---|---|
| `Badge` | `neutral \| info \| success \| warning \| critical \| highlight \| accent`; with dot / icon |
| `Banner` | `info \| success \| warning \| critical`; dismissible |
| `Toast` + `useToast` | auto-dismiss, `aria-live` |
| `Modal`, `Sheet` | focus trap, Esc, scroll lock, reduced motion |
| `Tooltip` | hover + focus |
| `IndexTable` | columns, selectable rows, bulk-action bar, sortable header, loading/empty rows |
| `DescriptionList`, `Stat`, `PriceTag` (`formatEuro`, tabular), `Thumbnail`, `Avatar` | — |
| `Skeleton` (text/block/card/table-row), `Spinner`, `EmptyState`, `ErrorState` | — |
| `ProgressBar`, `Kbd`, `VisuallyHidden`, `Icon`, `Logo` (badge / wordmark) | — |

Not in the kit (per-surface): product grid, cart, KDS ticket, menu-board layouts.

### 4.7 Gallery — `/dev/ui`

Every component × variant × state, with controls for theme (light/dark) and density
(`data-surface`). Served only when `NODE_ENV !== "production"` (404 in prod). Used for review
and Playwright screenshots.

### 4.8 Error handling

Kit components are presentational: they never fetch or throw. Async state comes in as props
(`loading`, `error`) and renders via `Skeleton` / `ErrorState`. Invalid variants are type errors.

## 5. Testing

- **Token guard** (`tests/ui-tokens.test.mjs`): no hex/`rgb()` literal in `src/ui/**`; hex count in
  `src/**/*.tsx` may not rise above a recorded baseline (ratchet → 0 as surfaces migrate).
- **Theme parity:** every semantic token is defined in both `light` and `dark` blocks; every
  Tailwind colour key maps to an existing token; magenta-500 is exactly `#E50C7E`.
- **Contrast** (`tests/ui-contrast.test.mjs`), computed from token values in **both themes**:
  text ≥ 4.5:1 on canvas/surface/hover; secondary/subtle ≥ 4.5:1; UI borders of inputs ≥ 3:1;
  on-accent labels bold ≥ 14px (measured white on `#E50C7E` = 4.48:1 → large/bold only);
  `accent-text` ≥ 4.5:1 (`#B8095F` on white = 6.48:1).
- **Component tests** (`tests/ui-kit.test.mjs`): `react-dom/server` render per component/variant —
  classes, ARIA, disabled/loading markup, `PriceTag` EN/DE/GR, `Logo` alt text.
- **Theme script test:** stored value / system / surface default resolve correctly; broken
  `localStorage` falls back safely.
- **Gallery smoke** (Playwright): `/dev/ui` loads without console errors in both themes;
  screenshots per theme × density attached to the PR.
- Existing `npm test`, `tsc --noEmit`, `next lint`, `next build` stay green.

## 6. Out of scope

Redesigning existing screens (sub-projects 2–9); data flow, stores, APIs; any Shopify asset or
code; Storybook; a vectorised SVG of the badge logo (the provided WebP is used; an SVG trace is a
follow-up — needed for crisp 4K menu boards).

## 7. Risks

- **Licence:** reviewers must reject any `@shopify/*` UI dependency or copied Shopify icon/asset.
- **Two themes double visual QA** — mitigated by semantic tokens (no `dark:` classes) and the
  gallery screenshots per theme.
- **Mac-only `node_modules`** (Phase 0 lesson): run tests on the Mac.
- **SSR test rendering (Next 15 / React 19):** only stateful components are `"use client"`.
- **Legacy aliases** could let hex creep back — the ratchet test blocks growth.
- **Logo is raster (WebP 1,932 px):** fine up to 1080p; 4K boards need the SVG follow-up.
