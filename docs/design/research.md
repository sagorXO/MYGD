# MYGD frontend redesign: research brief

> Status: **Phase 1 draft, awaiting Sagar's approval.** Sections 1–3 are written. Section 3 is part screenshot-evidenced, part domain knowledge (marked 📷 / 📚). See "Open questions" at the end.
> Date: 2026-10-05.

## 1. Brand source of truth: mygermandoener.com

Captured 2026-10-05 from the live site's computed styles and `@font-face` rules (Playwright).
Screenshot: `refs/brand-mygermandoener-home.png` (1200 px wide, full page).

### Confirmed

| Item | Value | Evidence |
|---|---|---|
| Brand magenta | **`#E50D7E`** (rgb 229, 13, 126) | Background of the hero block and buttons, and text accent colour |
| Lighter magenta (accent text on dark) | `#FF3D9E` (rgb 255, 61, 158) | 3 text uses |
| Ink / dark surface | `#1F1F21` (rgb 31, 31, 33) | Main page background and dark text |
| Deepest dark | `#0A0A0B` | Footer |
| Display font | **Oswald** 400/500/600/700, set uppercase | Google Fonts link plus self-hosted woff2 |
| Body font | **Figtree** 400/500/600/700 | Google Fonts link plus self-hosted woff2 |
| Logo (raster) | `https://mygermandoener.com/cdn/shop/files/MYGD.png` | `<img>` in the header |
| Badge logo | Round badge in the header (already in repo as `public/assets/brand/logo-badge.webp`, per the brain note) | Header |
| Store data shown | Paphos "open now"; Agiou Stefanou Rd 134, Emba 8260; open daily 11 AM–10 PM | Footer |
| Platform | Shopify theme (Dawn-based, `cdn/shop/t/3`) | Stylesheet URLs |

Licensing: Oswald and Figtree are both under the SIL Open Font License on Google Fonts. Both can be self-hosted (needed offline on the kiosk and till).

### Discrepancies to resolve

1. **Hex value is off by one.** The repo's tokens and the brain note use `#E50C7E`. The live CSS is `#E50D7E`. The visual difference is negligible, but the source of truth should match. Proposal: adopt `#E50D7E` and re-run the contrast checks. White on it is about 4.5:1, borderline for normal text. Use a darker shade for text-on-white and small labels.
2. **Nicosia appears on the live site** as "coming soon" in the footer store list. Per the brief, we do **not** add it anywhere. The client should be told that the live site lists it.
3. **Limassol** shows as "coming soon" on the site. That matches the plan to have it ready as data.
4. **The live site is dark-themed** (`#1F1F21` canvas, magenta blocks). The redesign brief asks for light by default with magenta at about 10% of the screen. That is a deliberate change from the current website and should be signed off as such.
5. **Menu images with prices baked in** are the site's main content (Döner Small/Standard/Mini, Wrap, Bowl XL/M/S, Pizza, Burger, Sides). Their sizes and prices don't obviously match the in-store posters (`Menu/1–4.jpeg`), which are the approved price source (menu plan D2). The site shouldn't be treated as a price source.
6. **Debug text on the live site:** the footer renders the literal "this is the actual footer.liquid". Worth telling the client.

### Not confirmed

- A vector logo (SVG) wasn't found on the site. Only PNG/WebP exist. Ask the client for the source artwork.
- No colour-token stylesheet exists on the site: colours are set per section in the Shopify theme editor. There is no secondary palette beyond magenta and the dark neutrals.
- No brand guideline document was found.

## 2. Repo audit (branch `feat/ui-kiosk` @ `d756291`)

### Stack (confirmed)
Next.js 15.2 (App Router), React 19, **Tailwind 3.4** (not v4), Prisma 6 + Postgres, framer-motion 11, lucide-react, zod. Tests: `tsx --test` (node test runner), **248/248 passing**; `tsc --noEmit` is clean. Playwright is installed (used by `npm run ui:smoke` for `/dev/ui`). There are no Playwright visual tests per route yet.

### Route map (real)

| Route | Surface | Module | Access | Notes |
|---|---|---|---|---|
| `/` | **Public homepage** (not the kiosk) | `src/app/page.tsx` (556 lines, inline) | public | The brief calls `/` "kiosk ordering"; in code it is the marketing site plus the menu |
| `/order` | Pre-order / web ordering (M11) | `src/app/order/page.tsx` (260 lines) | public | Has a "drive-through lane" plus a vehicle field. Unverified whether the store has a drive-through |
| `/pos` | Till (M9) | `modules/pos/POSTill.tsx` (612) + `ModifierModal.tsx` (382) | staff | |
| `/kds`, `/kds/grill`, `/kds/indoor` | KDS (M10) | `modules/kds/KDSTablet.tsx` (397) | staff | Station routes exist |
| `/display` | Customer order display | `modules/cx-wait/WaitDisplayBoard.tsx` (278) | public | |
| `/boards` | Menu boards (M8) | `modules/signage/MenuBoard4K.tsx` (415) | public | |
| `/staff` | HACCP and checklists (M1/M7) | `modules/haccp/StaffHaccpHub.tsx` (367) | staff | |
| `/admin`, `/admin/menu-boards`, `/admin/suppliers` | Back office | inline pages (309/520/407) + `MenuRecipeManager` (1163), `InventoryManager` (554), `BIDashboard` (185) | manager | Only 3 admin routes; most modules have no page |
| `/login` | Staff sign-in | uses the UI kit | public | The **only** route built on the UI kit |
| `/dev/ui` | Kit gallery | | dev only | |

**There is no kiosk route.** Per the contract, the in-store touch kiosk is DM Soft's hardware and software (see the brain note and `docs/contract-alignment.md`), so a kiosk surface (Phase 3, work unit 2) may not be ours to build. ⚠ Needs your confirmation.

**Proposed split** (route groups; URLs unchanged except where noted):
- `(public)`: `/`, `/menu`, `/order/*` (M11). Comfortable density, light theme.
- `(store-screens)`: `/display`, `/boards/[screen]`. No chrome, no navigation, dark high-contrast.
- `(staff)`: `/pos`, `/kds/[station]`, `/staff`. Touch density.
- `(admin)`: `/admin/*`. Compact density, sidebar, ⌘K.
- `/kiosk` only if you confirm it's in scope.

### Existing design foundation
`src/ui/` is a token-based kit of about 45 components (`tokens.css`, `SurfaceRoot` for per-surface density and theme, Button, IconButton, Field/TextField/Select/Switch, Tabs, SegmentedControl, Badge, PriceTag, IndexTable, EmptyState/ErrorState, Skeleton, Toast, Modal/Sheet/Menu/Tooltip, AppShell, Page). The spec is `docs/superpowers/specs/2026-09-28-ui-foundation-design.md`. **Almost nothing uses it:** only `/login` does. Every product surface is hand-styled.

**Decision (Sagar, 2026-10-05): "the current design must be removed and redesigned from scratch."** Applied as:
- Phase 2 builds new tokens and components from zero. Nothing from `src/ui` or the hand-styled surfaces is carried over visually.
- Per the brief's engineering rule, the current UI (`src/ui/`, `/dev/ui`, `features/home`, and the presentational parts of `modules/*/components`) **moves to `legacy/`** when its replacement lands. It is not deleted until you approve.
- Data and logic stay where they are (API, SSE, engines, `haccp-validator`, the auth flow behind `/login`). Only presentation is replaced.
- The kit's unit tests move with it to `legacy/`. New components get their own tests.

### Why it looks "AI-made": measured
Counted over the 24 `.tsx` files in `src/app`, `src/modules` and `src/features` (script: per-file regex counts; emoji via Unicode `Extended_Pictographic`):

| Signal | Count | Worst files |
|---|---|---|
| Raw hex colours in classes and styles | **886** | MenuRecipeManager 146, home 93, InventoryManager 81, POSTill 74 |
| Neon **cyan** second accent `#00FCED` (not a brand colour) | 56 text uses, plus backgrounds and buttons | home ("Order on Wolt" button), `/order`, display |
| Other ad-hoc accents | `#E5A93C`, `#10B981`, `#EF4444`, `#25D366`, `#FF5722`, `#E53935` | everywhere |
| Glass (`backdrop-blur`, `bg-white/x`) | 40 | MenuRecipeManager 11, MenuBoard4K 9 |
| Gradients | 11 | rainbow bar on `/display`, home |
| Coloured glow shadows | widespread `shadow-magenta-*`, `ring-[#E50D7E]` | home hero image, buttons, KDS |
| Radii in use | **7 values** (`rounded`, `-md`, `-lg`, `-xl`, `-2xl`, `-3xl`, `-full`) | |
| Font sizes below 12 px (`text-[9px]` to `text-[11px]`) | **142** | admin, KDS, display |
| `uppercase` / `tracking-widest` (shouting labels) | 177 | |
| Pulsing, bouncing or pinging animation | 25 | KDS urgent tickets pulse |
| Real emoji in UI | 13 (🔥×5, ⚠×2, ✅, 👋, 💀, 📞) | ModifierModal 4 |
| Monospace for body copy and labels | home, display, order (all small labels) | |

Qualitative findings from the screenshots in `before/`:
- **Fake or ungrounded copy:** "LIVE SYNC 12ms", "Spit: Active Carving", "Speed: FAST (2 cooks)" on the public display; "100% Halal", "12+ homemade sauces" stats on home (unverified); "Limassol Marina"; "Paphos & Limassol" as if both were open.
- **Internal links on the public site:** the home top bar links to "4K Menu Boards", "Owner CMS", "Cashier POS" and "Kitchen KDS".
- **"Order on Wolt"** on home. The brief only mentions Foody. Is MYGD on Wolt?
- **Broken scroll content:** below "The master menu", home renders about 2,800 px of empty dark page (`before/home-desktop.png`), probably a reveal animation that never fires.
- **Display:** order numbers are about 40 px on a 1080p screen, too small to read from a distance. German subtitles ("In Arbeit") are mixed into English UI.
- **Boards:** a portrait poster with baked-in prices is letterboxed on 16:9, with app chrome (screen tabs, Auto, hotkey hints, "CMS LIVE") visible on the signage screen. Five screens are offered (the contract says 4). The footer says "combo +€3.50" while the posters say Regular +€3.00, Medium +€3.50, Large +€4.50.
- **Price drift between surfaces:** `/order` shows "Original German Döner €6.50"; the board shows "Hamburg Döner €6,95". This is the known hard-coded-menu problem (menu single-source plan).
- **POS:** no offline or cash-only state, no keyboard shortcuts, discount not role-gated, `alert()` for errors, sold-out shown as grayscale only (colour-only signal).
- **KDS:** age thresholds hard-coded (240 s / 480 s), urgent = red + `animate-pulse`.
- **Staff/HACCP:** thresholds match EC 852/2004, and the corrective-action rule exists in `lib/haccp-validator.ts`. Fridge names are hard-coded in the UI; they should be data. Shell background `bg-[#121214]`.

### Before screenshots (`before/`)
Captured: `home-desktop`, `home-mobile`, `order-mobile`, `order-desktop`, `display`, `boards` (3840×2160), `login`.
**Not captured:** `/pos`, `/kds`, `/staff` and `/admin/*`. The local database has no seeded demo account (login returned 401). I didn't create users in your DB without asking.

## 3. Reference research

**Evidence level.** "📷 file" means the pattern is visible in that screenshot in `refs/`. "📚" means domain knowledge of the product; I haven't captured it yet. The first automated pass mostly got marketing pages, cookie walls and redirects:
- CAVA returned 403.
- Toast and Shake Shack URLs returned 404.
- Sweetgreen rendered only skeletons.

A click-through pass (item sheet, cart, checkout, KDS demo videos) is needed to back every 📚 row with a screenshot. See "Open questions".

### 3.1 Public site and pre-order (M11)

Adopt:

| # | Pattern | Source |
|---|---|---|
| 1 | Store and fulfilment choice comes first and stays visible in the header ("Find location near you"), not buried in checkout | 📷 `pub-sweetgreen-menu.png` |
| 2 | One persistent primary action on mobile, as a bottom bar ("Order", or cart total once items exist) | 📷 `pub-sweetgreen-menu.png` |
| 3 | Skeletons that match the final layout (card grid with title and price lines). Zero layout shift | 📷 `pub-sweetgreen-menu.png` |
| 4 | Light, calm canvas; colour reserved for the CTA and the logo | 📷 `pub-chipotle-order.png`, `pub-sweetgreen-menu.png` |
| 5 | Sticky horizontal category nav that tracks scroll position (scroll-spy), with plain text labels | 📚 Chipotle, Sweetgreen, Five Guys order flow |
| 6 | Item opens a **sheet** (bottom sheet on mobile, side panel on desktop): photo, name, price, then modifier groups with "Required · choose 1" or "Up to 3" rules, and a running price on the add button | 📚 Chipotle, Sweetgreen, CAVA |
| 7 | Allergens and dietary tags as text badges on the item, not icons alone; full allergen list in the sheet | 📚 Five Guys, Shake Shack (EU allergen practice) |
| 8 | Cart as a drawer that keeps the menu visible; inline quantity steppers; pickup time shown in the cart *before* checkout ("Ready in about 15 min") | 📚 Sweetgreen, Chipotle |
| 9 | Confirmation page with order number, estimated ready time and store address with a map link. No account needed | 📚 Chipotle |
| 10 | Real food photography on a neutral background, one consistent crop ratio (4:3 or 1:1) | 📷 `pub-fiveguys-menu.png` (cut-outs on white) |

Avoid:

| # | Anti-pattern | Source |
|---|---|---|
| 1 | Dark, cinematic, 3D or animated hero; country picker as a modal before content | 📷 `pub-germandonerkebab-menu.png` (GDK) |
| 2 | Menu as images with baked-in prices (can't update, can't show sold-out, unreadable on mobile) | 📷 `brand-mygermandoener-home.png` |
| 3 | Cookie wall covering the menu | 📷 `pub-fiveguys-menu.png`, `pos-square-restaurants.png` |
| 4 | Marketing stats and slogans above the menu on the order page | 📷 `before/home-desktop.png` |
| 5 | Internal staff links on the public site | 📷 `before/home-desktop.png` |

### 3.2 POS till (M9)

Adopt:

| # | Pattern | Source |
|---|---|---|
| 1 | Three panes: current ticket (left), category row, product grid. Ticket total and Pay fixed at the bottom of the ticket pane | 📷 `adm-odoo-pos.png` |
| 2 | Modifiers shown indented under the line item in the ticket, as small chips | 📷 `adm-odoo-pos.png` ("Extra soy sauce") |
| 3 | Category colour as a **thin bar** on the tile, not a full fill; tile text stays black on white | 📷 `adm-odoo-pos.png` |
| 4 | Product tiles at least 96 px high, name in 2 lines max, price below. Grid fills the space, no scrolling for the main categories | 📚 Toast, Square |
| 5 | Modifier sheet with group sections, "required" marked, and a confirm button that shows the running price | 📚 Toast, Square |
| 6 | Payment as a full-screen step: amount due large, tender buttons (exact cash, €10, €20, €50, card), change due large | 📚 Square, Clover |
| 7 | Manager override: void and discount open a PIN prompt in place, not a separate login | 📚 Toast, Lightspeed |
| 8 | Persistent status strip: store, terminal, connection, staff name | 📚 Toast |
| 9 | Sold-out item tile stays in place, dimmed **plus** a "Sold out" label, and can't be tapped | 📚 Toast, Square ("86'd") |

Avoid: hover states on touch devices; tiny icon-only buttons; colour-filled tiles with white text (Odoo's pink and green category chips are the borderline case); `alert()` dialogs; payment buttons that move position between states.

### 3.3 KDS (M10) and customer display

Adopt:

| # | Pattern | Source |
|---|---|---|
| 1 | Ticket grid, oldest first, left to right; header strip coloured by **order type** (dine-in, pickup, delivery) with the type also written as text | 📷 `pos-square-kds.png` |
| 2 | Modifiers in a contrasting colour under each item ("No onion" in red) | 📷 `pos-square-kds.png` |
| 3 | All-day counts in a left sidebar (item × quantity across open tickets) | 📷 `pos-square-kds.png` |
| 4 | Order number and timer at the top of each ticket; timer changes colour **and** gains a marker (icon or border weight) at configurable thresholds | 📚 Toast, Square |
| 5 | Bump by tapping the ticket; recall the last bumped ticket from a fixed button | 📚 Toast, Square |
| 6 | Customer display: two columns, Preparing and Ready, numbers only, at least 120 px high on 1080p; Ready numbers move with a brief highlight | 📚 McDonald's, Burger King order boards |

Avoid: pulsing animation (fatiguing over a shift); telemetry (sync ms, cook speed); bilingual sub-labels on every heading; tiny monospace text on a wall screen.

### 3.4 Back office / admin (M2–M6)

Adopt:

| # | Pattern | Source |
|---|---|---|
| 1 | Left sidebar with grouped sections and a filter box at the top | 📷 `adm-polaris-index-table.png` (Shopify dev docs) |
| 2 | Page header anatomy: title, one-line description, actions on the right | 📷 `adm-polaris-index-table.png` |
| 3 | Index tables: row selection, bulk actions, sortable columns, filters above the table, sticky header | 📚 Polaris IndexTable, Geist Table |
| 4 | Neutral palette with semantic colours only for status (success, warning, critical) | 📷 `adm-geist-colors.png`, `adm-geist-table.png` |
| 5 | Command palette (⌘K) for navigation and actions | 📷 `adm-linear-home.png` (product UI shown), 📚 Linear, Vercel |
| 6 | Empty states that say what goes here and offer the one action to fill it | 📚 Polaris EmptyState |
| 7 | Store switcher in the top-left, scoping every page | 📚 Shopify admin, Stripe accounts |
| 8 | Inline form validation on blur, with errors under the field | 📚 Stripe Dashboard |

Avoid: dashboards of placeholder metrics; card-per-metric grids with icons in coloured circles; Odoo-style menu sprawl (every module at the top level).

### 3.5 Menu boards (M8)

Adopt (📚 QSR signage practice; screenshot capture pending):
1. Fixed grid per screen; prices right-aligned in a column, tabular numerals.
2. Item name 2–3× the description size. At 4 m, names need roughly 100 px cap height at 2160p.
3. One featured item per screen, at most.
4. Sold-out shown as a strike-through **plus** a "Sold out" label, never by silently removing the item.
5. Content rendered from data, not from images.
6. No navigation chrome on the screen itself.

Avoid: posters with baked-in prices; scrolling or rotating content inside one screen; portrait art letterboxed on landscape screens; app controls and hotkey hints on the signage output.

### Theme decision (to justify)
Light by default everywhere except **KDS, `/display` and `/boards`**, which use dark high-contrast. Reasons:
- Wall-mounted screens in a bright shop read better as light text on dark, and dark reduces glare.
- Square KDS and McDonald's/Burger King order boards are both dark (📷 `pos-square-kds.png`).
- On boards, dark backgrounds let food photography carry the colour.

## Open questions for Sagar
1. **Kiosk:** is a kiosk surface ours to build, or is it DM Soft's (contract)? `/` is currently the public site, not a kiosk.
2. ~~Rebuild or rework~~ Answered: from scratch; old UI goes to `legacy/`, deleted only with approval.
3. **Brand hex:** adopt `#E50D7E` from the live site, replacing `#E50C7E`?
4. **Wolt and drive-through:** are both real? `/order` has a drive-through lane and home has "Order on Wolt".
5. **Staff-surface "before" screenshots:** may I seed the demo accounts (`npm run db:seed`, non-production only) into the local database? Or give me a login.
6. **Research depth:** do you want a click-through pass (about 1–2 h) to replace every 📚 with a screenshot before Phase 2, or is this level enough to approve?
7. **Boards:** 4 screens (contract and PRD) vs 7 `MenuBoardConfig` rows vs 5 tabs in the current UI. I'll design a layout that works for any count and leave the number to you.
