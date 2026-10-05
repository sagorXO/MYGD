# MYGD Menu Single Source of Truth — Implementation Plan (v2)

> **Status:** PLAN ONLY, v2 2026-10-04 (v1 2026-10-03). Updated with Sagar's decisions; awaiting "go". No code written.
> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkboxes.

**Goal:** Every menu item, price, VAT category, modifier/upgrade price, product image and menu-board layout lives **only in the database**. The till, menu boards, public site and `/order` all read it through the API. No menu content stays in source files, and none is baked into images shown on screens. (Sagar: *"don't hardcode anything"*; PRD M11.)

## Sagar's decisions (2026-10-04) and how the plan applies them

| # | Decision | Applied as | Correction / caveat raised |
|---|---|---|---|
| D1 | The menu is **data**; import it, then **delete the JSON file**. | The data file lives in `.import-work/menu/` (git-ignored, never committed). After a verified `--apply`, the importer writes a **DB export** (`.import-work/exports/menu-<timestamp>.json`) and then deletes the source JSON (Task 4). | Without the export, the DB would be the only copy (no backup until Phase 6), and staging, a new DB and Limassol could not be loaded. The export keeps the "no hand-maintained file" rule and gives a way back. |
| D2 | **Prices = the menu images** (`Menu/1–4.jpeg`, `drinks.jpeg`, `drinks 2.jpeg`, `sauce.jpeg`). | The data file is transcribed **from the images**, not copied from the other person's code. Their code is used only for a cross-check; every difference is listed (Task 1). | One price to confirm: onion rings 6 pcs **€1.95** (vs mozzarella sticks 6 pcs €5.90). |
| D3 | **VAT 5% for all items.** | Products keep **two VAT categories**: `FOOD_BEV` (food, soft drinks, coffee) and `ALCOHOL` (draft/bottled beer, wine). Both carry 5% until told otherwise; the rate is set per category, never per product. | ⚠ The menu sells **beer and wine**. The signed MSA §3.4 says 19% for alcohol, and the old till charged 19% on 11 items (likely those). Get the accountant's confirmation in writing; if alcohol is 19%, it's one change. Recorded as Q-VAT-4. |
| D4 | **The new menu with the new prices** is the live catalogue. | The Gladius catalogue is **not** applied to the live DB. Its importer stays only for mapping old sales history (Phase 2). | — |
| D5 | **Keep the photos and docs for now**; clean up before production. | Product photos (`public/assets/menu/…`) are referenced by `Product.imageUrl`. `images/` (26 GB), `Menu/`, `Old Data/`, `Documents/` and `docs/` are already excluded from Docker builds; the final production clean-up is a separate task later. | — |
| D6 | **4 menu boards** (2026-10-03). | Screens 1–4 = the four **portrait** food boards (`Menu/1–4.jpeg`). | ⚠ The menu art has **7 images**. Drinks (2× landscape) and sauces have no screen. Decision needed: **(a)** split or rotate drinks/sauces onto the 4 screens, or **(b)** add screens (contract change + hardware). Board content is also **rendered from the DB**: the posters are design references only, because images with baked-in prices can't update or show sold-out. |

## What the menu images contain (inventory for Task 1)

| Image | Content |
|---|---|
| `1.jpeg` (portrait) | Pizzas (5); tacos (4 × €3.50, plus "4 tacos €11.90"); **promo "second pizza 20% off"**; **Coming soon:** Doezza (4) and Burgers (4) with prices |
| `2.jpeg` (portrait) | Döner buns (4), wraps (4), Big's (4), bowls (4, fries or rice); sauce picker (11 sauces) |
| `3.jpeg` (portrait) | **"Make it a menu"** Regular/Medium/Large +€3.00/3.50/4.50 (fries or rice + 0.4 L drink); loaded fries (4 × €7.90 incl. 1 sauce); meatballs, mozzarella sticks, onion rings (6/12/20 pcs); salads (3) |
| `4.jpeg` (portrait) | **Kids meal €5.00** (choose main: kids döner / 4 nuggets / 4 meatballs + small fries + drink choice + Kinder Riegel); chicken nuggets and wings (6/12/20 pcs with 1/2/3 sauces); crunchy and sweet-potato fries (Regular/Large/XL) |
| `drinks.jpeg`, `drinks 2.jpeg` (landscape) | Draft beer (0.5 L / 0.3 L), bottled beer (7), wine (2), postmix soft drinks (6), cans (5), coffee (4) |
| `sauce.jpeg` | Sauces |

**How each kind of entry is modelled (current schema, no change):**

| Menu element | Modelled as |
|---|---|
| Single item at one price | `Product` |
| Sizes / piece counts (6/12/20, Regular/Large/XL, 0.3/0.5 L) | One `Product` per size (own SKU and price) |
| "Incl. 1/2/3 sauces" | `ModifierGroup` "Sauce" with `maxSelected` = included count, options at €0 |
| Make it a menu | `ModifierGroup` "Make it a menu" (Regular/Medium/Large, priced) + "Side" (fries/rice) + "Drink 0.4 L"; linked to products with `allowMealUpgrade` |
| Kids meal €5.00 | `Product` + required groups "Main" (3 options) and "Drink" (3 options) |
| 4 tacos €11.90 | Its own `Product` (fixed price) |
| **Second pizza 20% off** | **Not importable:** needs a promotions model (Phase 2 schema). Kept in the data file as `promotions[]`, reported, not applied |
| **Coming soon** (Doezza, Burgers) | Kept in the data file with `status: "coming_soon"`; **not imported** (reported) until you launch them. `isAvailable` means "sold out", not "not launched" |

## Global constraints

- **No menu literals in source:**
  - Banned outside `tests/` and the importer: product names with prices, price numbers, VAT rates, board item lists and SKU→image maps.
  - The menu data file itself is never committed and never imported by app code.
  - Guard test in Task 10.
- **Screens 1–4 only.** Anything else is rejected. The "1 to 7" schema comment is fixed in the Phase 2 schema pass.
- **No schema change in this plan:**
  - Promotions and the VAT-rate table belong to Phase 2.
  - The VAT **rate** stays out of product data: products carry a category only.
  - `src/lib/tax.ts` still hard-codes 9%/19%. It is not used for receipts yet; Phase 2 replaces it with the `VatRate` table (5%/5% per D3).
- **No silent fallbacks:** if the DB is down, the API returns 503 and screens show an error state.
- **Prices are rounded to cents.** Price changes and sold-out toggles are audit-logged.
- **Other person's work:**
  - Their photos are kept.
  - Their hard-coded data is used only as a cross-check, then deleted from the code (Task 10).
  - **Tell them before Task 1**, because their uncommitted files will change underneath them.
- **TDD for every task.** Each task ends with `npm test`, `npm run typecheck` and `npm run build` passing, then a commit.

## Review focus

1. **Price shown = price charged:** `/boards`, `/order`, `/` and `/pos` show the same price for the same SKU (Tasks 7 and 10).
2. **DB down:** `/api/menu` and `/api/menuboards` return 503; screens show an error state (Task 2).
3. **The JSON is deleted only after a verified apply plus a DB export.** If either fails, the file stays (Task 4).
4. **Coming-soon items and promotions are never sold by accident** (Task 1 and Task 3 reports).
5. **Meal upgrade and kids-meal prices come only from DB modifier groups** (Task 8).
6. **Board item with a deleted or sold-out SKU:** shown as sold out or hidden, never at a stale price (Task 6).

---

## Planned files

| File | Change |
|---|---|
| `.import-work/menu/menu-2026-10.json` | **New, never committed.** The menu transcribed from `Menu/*.jpeg`: categories, products (per size), VAT category, price, image, badge, modifier groups, kids meal, boards 1–4 as SKU lists, `promotions[]`, coming-soon items. |
| `src/lib/import/menu/schema.ts`, `plan.ts`, `apply.ts` | **New.** Zod schema and the import plan/apply logic, in the same pattern as the Gladius importer: dry-run default, upsert by SKU, never deletes, audit-logged; promos and coming-soon items reported, not applied. |
| `src/lib/import/menu/export.ts` | **New.** DB → menu JSON export, so the deleted source can be regenerated. |
| `scripts/import-menu.ts` + `npm run import:menu` | **New.** CLI: `--apply`; after a verified apply: export, then delete the source file. Report in `.import-work/reports/`. |
| `src/app/api/menu/route.ts` | Remove the `catalog-data` fallback; 503 on DB failure; add `imageUrl`, `badge` and modifier groups. |
| `src/app/api/menuboards/route.ts` | Remove the canonical seeding; screens 1–4; resolve SKU refs to live name/price/availability; PATCH takes SKU lists only. |
| `src/modules/signage/components/MenuBoard4K.tsx` | Fetch `/api/menuboards?screen=N`, portrait 4K layout, SSE refresh, loading/error/not-configured states. |
| `src/app/order/page.tsx` | Fetch `/api/menu`; loading/error/empty states. |
| `src/modules/pos/components/ModifierModal.tsx` | Meal upgrade and choices from DB modifier groups; remove the €3.00/3.50/4.50 literals. |
| `src/app/admin/menu-boards/page.tsx` | Board editor = SKU lists for screens 1–4; prices read-only. |
| `src/lib/catalog-data.ts`, `signage.engine.ts`, `menuboard-engine.ts` (data part), `menu-assets.ts` (registry part) | Delete the data; keep the pure helpers. |
| `prisma/seed.ts` | Remove the 103 hard-coded products and board configs (dev seed = locations, terminals, demo accounts). |
| `tests/no-hardcoded-menu.test.mjs` | **New** guard test. |

---

### Task 1: Transcribe the menu images into the data file
- [ ] Zod schema first, with tests. Rejected: missing or duplicate SKU, negative price, screen outside 1–4, image path outside `/assets/`, unknown VAT category, `coming_soon` items placed on a board.
- [ ] Transcribe every item and price from `Menu/1–4.jpeg`, `drinks*.jpeg` and `sauce.jpeg`:
  - one product per size
  - VAT category `ALCOHOL` for beer and wine, `FOOD_BEV` for everything else
- [ ] Cross-check against the other person's hard-coded values and list every difference (name or price) for Sagar.
- [ ] Map photos from `public/assets/menu/{products,sauces,upgrade}`; items without a photo use the placeholder.
- **Acceptance:** the file validates. Sagar confirms the difference list and the onion-rings price.

### Task 2: `/api/menu`: no silent fallback
- [ ] Tests first: DB error → 503 `{ code: "MENU_UNAVAILABLE" }`; success includes imageUrl, badge and modifier groups.
- [ ] Remove the `catalog-data` import.
- **Acceptance:** with the DB stopped, `/pos` and `/` show their error state (live check on a throwaway DB).

### Task 3: Menu importer (`npm run import:menu`)
- [ ] Tests first:
  - dry-run default
  - idempotent re-run
  - never deletes and never touches `isAvailable`
  - price changes audit-logged
  - `promotions[]` and `coming_soon` items reported as "not imported"
  - VAT category required
- [ ] Reuse `CatalogStore`; extend it for `imageUrl`, `badge`, `allowMealUpgrade` and required modifier groups.
- [ ] Boards go to `MenuBoardConfig.itemsJson` as `{ "skus": [...] }` for screens 1–4.
- **Acceptance:** live test on a throwaway Postgres: applied once, re-run unchanged.

### Task 4: Export after import, then delete the source JSON (D1)
- [ ] Tests first:
  - the export round-trips (export → plan → apply gives "all unchanged")
  - the source is deleted **only** if `--apply` succeeded **and** the export file was written and re-validated
  - on any failure the source stays and the exit code is non-zero
- [ ] `npm run import:menu -- --apply` does, in order: apply → verify counts → export → delete the source.
- **Acceptance:** after a successful run, `.import-work/menu/menu-2026-10.json` is gone, `.import-work/exports/menu-<ts>.json` exists, and re-importing the export changes nothing.

### Task 5: Remove the hard-coded products from `prisma/seed.ts`
- [ ] Seed = locations, terminals, demo accounts; the docs say "then run `npm run import:menu`".
- **Acceptance:** a seed on an empty DB creates 0 products.

### Task 6: `/api/menuboards`: SKU references, live prices, 4 screens
- [ ] Tests first:
  - screen 5 → 400/404
  - a SKU resolves to the current name, price and availability
  - an unknown SKU is dropped with a warning
  - a sold-out SKU comes back `isSoldOut: true`
  - PATCH accepts `{ screenNumber 1..4, title, layoutType, skus[] }`, rejects price fields, needs manager, and is audit-logged
- [ ] Remove the `CANONICAL_SCREEN_CONFIGS` seeding.
- **Acceptance:** changing a product price in the DB changes `/boards` with no other edit.

### Task 7: `/boards` (portrait 4K) and `/order` read the API
- [ ] `MenuBoard4K` renders screens 1–4 from the API in portrait 2160×3840 (layout follows the posters' sections), with SSE refresh and skeleton/error/not-configured states.
- [ ] `/order` reads `/api/menu`.
- [ ] Consistency test: every board SKU's price = its `/api/menu` price.
- **Acceptance:** live browser check: the same price on `/boards`, `/order` and `/pos` for three SKUs; an `/admin` price change shows on all three via SSE.

### Task 8: Meal upgrade and kids meal from the database
- [ ] Tests first:
  - upgrade options shown only for `allowMealUpgrade` products
  - prices come from the modifier group
  - kids meal requires a Main and a Drink choice
  - the modal never invents prices
- [ ] Remove the `mealUpgradePrice` literals.
- **Acceptance:** changing the "Medium" price in the DB changes the till without a code change.

### Task 9: Admin board editor (screens 1–4, SKU lists)
- [ ] Pick and order products per screen; prices read-only.
- **Acceptance:** a manager rebuilds screen 2 in the UI and `/boards?screen=2` updates live.

### Task 10: Delete the hard-coded copies + guard test
- [ ] Delete the data in `catalog-data.ts`, `CANONICAL_4K_SCREENS`, `CANONICAL_SCREEN_CONFIGS` items and `MENU_ASSET_REGISTRY`; keep the pure helpers.
- [ ] `tests/no-hardcoded-menu.test.mjs` fails on name+price literals, `CANONICAL_*` menu exports and SKU→image maps in `src/**` (proven with a temporary failing fixture).
- **Acceptance:** the guard passes; re-adding a price literal fails the build.

### Task 11: Docs
- [ ] PRD M10/M11 status; TRD API rows; open questions:
  - drinks/sauce screens (D6)
  - alcohol VAT (Q-VAT-4)
  - onion rings price
  - promotions → Phase 2
  - coming-soon launch
- [ ] README: "run `npm run import:menu -- --apply`".

## Order and risk

- **Tasks 1–4** first: the DB holds the confirmed menu, and the source file is replaced by a DB export.
- **Tasks 6–9** then switch every reader.
- **Task 10** deletes the hard-coded copies last, so every step is reversible until then.

**Open before "go":**
- D6: what happens to the drinks and sauces content on 4 screens.
- The accountant's written word on alcohol VAT. The import can run with 5% meanwhile; it's a one-value change later.
- Confirm the onion-rings price.
