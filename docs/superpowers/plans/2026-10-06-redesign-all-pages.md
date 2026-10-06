# MYGD — Redesign of every page (sub-projects 2–9)

> **Status:** PLAN, 2026-10-06. **Wave 1 step 1 is done:** the redesigned home is live at `/` (old page removed), with the offers banner, "Make it a menu" badges and the theme toggle.
> Everything after it waits for a mockup approval per surface (Gate A below).
> **Builds on:** `docs/superpowers/specs/2026-09-28-ui-foundation-design.md` (tokens, kit, themes — done) and
> `DESIGN.md`. **Not in scope here:** data flow, APIs, pricing and VAT logic (presentation only).

## 1. Where we are (measured 2026-10-06)

**Done:** the foundation (sub-project 1): `src/ui/` kit (35 components), tokens for light + dark, bundled fonts, theme toggle, `/dev/ui` gallery, hex-colour ratchet test. The public home was **already rebuilt** with the kit (`src/features/home/`) but only lives at `/dev/preview/home`; the live `/` is still the old 557-line page.

**Not done — every other surface is still old-style** (hand-typed hex colours, one-off radii, no theme toggle):

| Surface | Route | Lines | Hex literals | Uses kit |
|---|---|---:|---:|:--:|
| Public site (old copy, live) | `/` | 557 | 93 | no |
| Web pre-order | `/order` | 324 | 51 | no |
| Overhead menu boards | `/boards` | 450 + 74 | 49 | no |
| Wait display | `/display` | 278 | 51 | no |
| Counter POS | `/pos` | 784 + 217 | 118 | no |
| Kitchen display | `/kds`, `/kds/grill`, `/kds/indoor` | 397 | 47 | no |
| Staff hub (HACCP, timeclock, build sheets) | `/staff` | 367 | 54 | no |
| Admin hub + BI | `/admin` | 317 + 186 | 92 | no |
| Admin: inventory | (tab in `/admin`) | 554 | 81 | no |
| Admin: menu & recipes | (tab in `/admin`) | **1,164** | 146 | no |
| Admin: menu boards | `/admin/menu-boards` | 507 | 59 | no |
| Admin: suppliers | `/admin/suppliers` | 407 | 54 | no |
| Admin: vouchers (new this week) | `/admin/vouchers` | 221 | 27 | no |
| Login | `/login` | 32 | 0 | **yes** |

Roughly **1,000 hex literals in ~6,500 lines** to migrate. Tokens already exist for all of it, so this is mostly *recomposition with the kit*, not new visual invention — except where a surface gains features that did not exist when the kit was designed (§3).

## 2. Principles (apply to every surface)

1. **Presentation only.** Fetching, stores, VAT (`src/lib/tax.ts`), discounts (`src/lib/discounts`), order submission are not touched; view logic moves into small pure functions with tests (like `features/home/menuModel.ts`).
2. **Kit only.** `src/ui/*` components and semantic tokens. No new hex (the ratchet test fails the PR). No `@shopify/*` (licence).
3. **Both themes on every screen**, with the per-surface *default* below; toggle persists per device (already built).
4. **Loading = skeleton boxes that match the final layout** (0.00 CLS), plus explicit empty and error states with retry. No spinner-only screens.
5. **Touch surfaces** (POS, KDS, staff, order): ≥ 48 px targets, primary action 64–80 px, option tiles ≥ 56 px, spacing on the 8 px grid (`DESIGN.md` §4).
6. **A11y: WCAG 2.2 AA** in both themes, visible focus, reduced-motion respected; test with keyboard only.
7. **Copy through i18n (EN / DE / GR)** — no new hard-coded strings in components.
8. **No mock data left in screens** (the old `/order` and boards carried literals; they now read the database).
9. **Fonts bundled; works offline on the LAN** (kiosk/boards/KDS must not need the internet).
10. **One PR per surface**; the old implementation is **deleted in the same PR** that replaces it (no two versions living side by side).

## 3. New UI the kit does not have yet (built once, in the first surface that needs it)

Features added since the foundation need design homes. Each is added to `src/ui/` + the gallery, then reused:

| Component | Needed by | Why |
|---|---|---|
| `OptionGroupPicker` (radio / checkbox tiles, required/optional, price delta) | POS, `/order` | "Make it a menu" (size → fries/rice → 0.4L drink), sauce choice, kids meal |
| `OfferBanner` / `OfferChip` | `/`, `/order`, POS, boards | "Second pizza 20% off", "4 tacos €11.90" |
| `CartSummary` (lines, offers, voucher, staff %, VAT, total) | `/order`, POS | currently hand-rolled twice |
| `VoucherField` (input → applied chip → reason on reject) | POS, later `/order` | voucher / gift-card entry |
| `PriceBoardSection` (heading, dotted-leader price rows, sold-out state) | `/boards`, `/display` | the live price board that replaced the baked-price posters |
| `StatusTicket` (age → green / amber / flashing red) | KDS | urgency rules in `DESIGN.md` §6 |
| `TemperatureReading` (in-range / danger-zone) | staff HACCP | `DESIGN.md` §5 |
| `FormSection` / `ConfirmDialog` patterns | admin | create-voucher, edit-product, delete confirms |

## 4. Order of work

Customer-facing first (they are what guests and the owner judge the brand by), then the screens guests see in-store, then staff, then back office.

| Wave | # | Surface | Default theme | Size | Depends on | Notes |
|---|---|---|---|:--:|---|---|
| **1** | 2 | **Public site `/`** | dark | S | — | ✅ **Done 2026-10-06** — promoted to `/`, offers banner, "Make it a menu" badge, theme toggle added, old page deleted. **Follow-up (needs Gate A mockup):** 29 menu sections do not fit one row of tabs → group them (Döner & bowls · Pizza & tacos · Burgers · Sides & snacks · Drinks) with a `group` on the category; real photos (one placeholder per section today). |
| 1 | 3 | **Web pre-order `/order`** | light | M | `OfferBanner`, `CartSummary`, `OptionGroupPicker` | Real cart exists (this week); needs option groups (required choices) so the order can actually be placed. Order submission endpoint is a separate backend item. |
| **2** | 4 | ~~Menu boards `/boards`~~ | — | — | — | **Superseded 2026-10-06:** `/boards` now redirects to ScreenyPro. The in-app board (`src/modules/signage`, `PriceBoardSection`) is no longer redesigned unless ScreenyPro is dropped. D1 (4 vs 5 screens) moves to ScreenyPro. |
| 2 | 5 | **Wait display `/display`** | dark | M | — | Order numbers + status columns; big type, no interaction. |
| **3** | 6 | **Counter POS `/pos`** | light | **L** | `OptionGroupPicker`, `CartSummary`, `VoucherField`, `OfferChip` | Biggest operational risk — keep behaviour identical; split `POSTill` (784 lines) into catalog / ticket / payment. Includes the new customise popup. |
| 3 | 7 | **KDS `/kds/*`** | dark | M | `StatusTicket` | Three routes share one ticket component. |
| 3 | 8 | **Staff hub `/staff`** | light | M | `TemperatureReading` | HACCP, timeclock, build sheets. |
| **4** | 9a | **Admin shell + dashboard `/admin`** | light | M | `AppShell` (exists) | Replaces the 4-tab page with real navigation (sidebar). |
| 4 | 9b | Admin: vouchers & offers | light | S | `FormSection` | New page; redo it in the kit. |
| 4 | 9c | Admin: suppliers | light | M | `IndexTable` | |
| 4 | 9d | Admin: menu boards | light | M | `PriceBoardSection` | Live preview already uses it. |
| 4 | 9e | Admin: BI | light | S | `Stat` | |
| 4 | 9f | Admin: inventory | light | M | `IndexTable` | |
| 4 | 9g | Admin: **menu & recipes** | light | **XL** | `FormSection` | 1,164 lines / 146 hex — split into products, option groups, recipes, then rebuild each. Last, because it changes least often. |

Size key: **S** < 150 lines to write, **M** 150–400, **L** 400–900, **XL** > 900 or several screens. (Sizes are scope, not time.)

## 5. The loop for each surface

1. **Gate A — mockup.** Stitch mockups of the surface, **light and dark**, at the viewport in `DESIGN.md` §7, using the tokens. Sagar approves or comments. *No code before approval.*
2. **Short spec** (what changes, new components, states, i18n keys) — a half page appended to this plan.
3. **Tests first:** view-model functions and any new kit component (render test in the existing harness).
4. **Build** with the kit; add new components to `/dev/ui`.
5. **Verify:** `tsc`, `npm test`, `next build`, the hex ratchet, then Playwright screenshots in both themes at the target viewport and with the keyboard; console clean. Behaviour checks against the real seeded database (not mocks).
6. **Cut over:** delete the old implementation, update `DESIGN.md` §7 if the route changed, open the PR (**Gate B** — Sagar reviews screenshots in the PR).

## 6. Decisions I need from Sagar

| # | Decision | Recommendation |
|---|---|---|
| D1 | `/boards`: 4 screens (statement of work) or 5 (what the seed and board data have now: the drinks board is the 4th, kids meal + fries the 5th)? | Keep 5 and amend `DESIGN.md` §7, unless the hardware only has 4 TVs — then merge screen 5 into 3 and 4. |
| D2 | Default themes per surface as in §4? | Yes — dark for guest-facing screens, light for tills / staff / admin. |
| D3 | Stitch mockups: all surfaces up front, or one wave at a time? | One wave at a time (cheaper to correct, keeps the design consistent with what was built). |
| D4 | Real product photography and the brand logo as SVG (needed for 4K boards). | Provide when ready; placeholders are used until then. |
| D5 | The self-order kiosk is supplied by DM Soft (per `DESIGN.md`), so "Kiosk `/`" in the foundation spec means the **public site**. Confirm. | Confirm. |

## 7. Definition of done (per surface and for the programme)

- Zero hex literals in the surface's files; ratchet test green; both themes pass AA contrast (token tests).
- Skeleton, empty and error states exist and were seen in the browser.
- EN / DE / GR strings present; no component hard-codes copy.
- Works at the viewport in `DESIGN.md` §7 and one size smaller; keyboard-operable.
- Old implementation deleted; tests, typecheck and build green.
- **Programme done:** no `bg-[#…]` left outside `src/ui/tokens.css`; every route has a theme toggle; `/dev/ui` shows every component; `DESIGN.md` matches the code.

## 8. Risks

| Risk | Mitigation |
|---|---|
| POS regression (money, speed at the counter) | Keep logic untouched; extract view code only; run the real-DB order scenario (offers + gift card) before and after; pilot on one till first. |
| Two design systems living side by side for months | Per-surface cut-over deletes the old code in the same PR; wave order keeps the old/new boundary at route level. |
| Stitch output drifts from the tokens | Mockups are references; the build uses kit components and tokens, never pasted markup. |
| Mac-only `node_modules` / Playwright | Run verification on the Mac (as in the foundation spec). |
| 4K boards on raster logo | SVG logo before wave 2 (D4). |

## 9. Gate A for `/order` (next surface) — status and brief

**Status 2026-10-06:** Stitch project "MYGD — /order mobile pre-order (redesign)" (`11269257137459033565`) was created and the first generation was sent, but Stitch returned **no screen** (request timed out; project still empty after ~2 minutes). Re-run from the brief below, then Sagar approves before any code.

**Brief (3 screens × light + dark, 390×844):**
1. *Menu list* — black top bar (badge logo, name, "Emba (Paphos)", "~9 mins" pill); segmented "Drive-through | Counter pickup"; **offers banner** ("Second pizza 20% off · 4 tacos €11.90"); **grouped category chips** (Döner & bowls · Pizza & tacos · Burgers · Sides & snacks · Drinks); product cards (64 px photo, name, one-line ingredients, mono price, round "+" or "− 2 +" stepper); "Make it a menu" badge on döner items; sticky cart bar (items, "Offers −€x", total).
2. *Option sheet* for "Make it a menu" — size (Regular +€3.00 / Medium +€3.50 / Large +€4.50) → fries or white rice → 0.4L drink; required-choice states; running price on the confirm button.
3. *Cart* — lines, applied offers, voucher field (applied chip / error reason), VAT-inclusive total, place-order button.

Tokens: primary `#E50C7E`, brand black `#000`, light canvas `#F4F4F5` / cards `#FFF` / text `#18181B`; dark canvas `#0B0B0C` / cards `#18181B` / text `#FAFAFA`; Oswald (headings), Figtree (body), JetBrains Mono (prices); 8 px grid, 12 px radius, ≥ 48 px targets.
