# MYGD Menu Single Source of Truth — Implementation Plan

> **Status:** PLAN ONLY, 2026-10-03, awaiting Sagar's approval. No code has been written for it.
> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkboxes.

**Goal:** Every menu item, price, VAT category, modifier/upgrade price, product image and menu-board layout lives **only in the database**. The till, menu boards, public site and `/order` all read it through the API. No menu content stays in source files (Sagar's rule: *"don't hardcode anything"*; PRD M11 *"single source of truth"*).

**Why now (verified 2026-10-03):** the same menu is typed in several places, and the screens read different ones:

| Hard-coded copy | Size | Who reads it |
|---|---|---|
| `src/lib/catalog-data.ts` | 63 products with prices (uncommitted edits by another person) | **`/api/menu` as a silent fallback when the DB query fails**, so the till can sell at prices that aren't in the DB |
| `src/modules/signage/signage.engine.ts` (`CANONICAL_4K_SCREENS`) | 44 items with prices | `/boards` directly (no API call) |
| `src/lib/menuboard-engine.ts` (`CANONICAL_SCREEN_CONFIGS`) | screen layouts + items | `/api/menuboards`, which writes them into `MenuBoardConfig.itemsJson`, **copying names and prices** |
| `src/app/order/page.tsx` | 10 products with prices | `/order` directly |
| `src/modules/pos/components/ModifierModal.tsx` | "Make it a menu" €3.00 / €3.50 / €4.50 | the till |
| `src/lib/menu-assets.ts` (`MENU_ASSET_REGISTRY`) | SKU → image path | till, boards, admin |
| `prisma/seed.ts` | 103 products | dev seed |

The till reads `/api/menu` (the DB), but `/boards` and `/order` read the hard-coded copies, so a customer can see one price and be charged another.

**Architecture after this plan:**

```
menu import file (data, not code) ──npm run import:menu──▶ PostgreSQL ◀── /admin edits (audit-logged)
                                                               │
              /api/menu ── /api/menuboards (SKU refs → live price) ── SSE price/sold-out events
                 │                 │
            /pos, /, /order     /boards?screen=1..4
```

## Decisions needed before Task 1

| # | Question | Recommendation |
|---|---|---|
| D1 | Where does the **new menu** (the one the other person typed from the posters) enter the system? | A versioned data file `data/menu/menu-2026-10.json`, loaded **only** by `npm run import:menu` and never imported by app code. After that, `/admin` is where prices change. |
| D2 | Who confirms the new menu's **prices**? The 63 items match none of the old till's product names, so I can't verify them against sales. | Rico/Oliver sign off the price list before `--apply`. |
| D3 | **VAT** for the new menu items | Same rule as Q-VAT-4: items stay blocked until the accountant decides the 5% vs 9% question. |
| D4 | **Old till catalogue vs new menu**: which one goes live? | The new menu is the live catalogue. The Gladius import is kept as a reference and for sales-history mapping (SKUs `GLD-*`, not shown on screens). |
| D5 | **Product photos** in `public/assets/menu/` (~10 MB, added by the other person) | Keep them as files; the DB stores each product's `imageUrl`. The 26 GB `images/` library stays outside git (done: `5c3aaf9`). |

## Global constraints

- **No menu literals in source:**
  - Banned outside `tests/`, `data/` and the importer: product names with prices, price numbers, VAT rates, board item lists and SKU→image maps.
  - A guard test (Task 9) enforces it.
- **4 menu boards** (signed SOW; Sagar 2026-10-03). Valid screens are 1–4; anything else is rejected. The schema comment "1 to 7" is left for the Phase 2 schema pass.
- **No schema change in this plan.** Everything fits the current schema:
  - `Product.imageUrl`, `Product.badge`, `Product.allowMealUpgrade`.
  - `ModifierGroup`/`Modifier` for meal upgrades.
  - `MenuBoardConfig.itemsJson` holding **SKU references only**.
- **No silent fallbacks:** if the DB is unreachable, the API returns 503 and the screens show their error state. They never invent a menu.
- **Prices are rounded to cents.** Price changes and sold-out toggles are audit-logged (PRD P.2).
- **Don't break the other person's assets:** their images are kept; their hard-coded data is migrated into the import file, then deleted from the code.
- **TDD for every task.** Each task ends with `npm test`, `npm run typecheck` and `npm run build` passing, then a commit.

## Review focus

1. **Price shown = price charged:**
   - `/boards`, `/order`, the public site and `/pos` must show the same price for the same SKU.
   - Pinned by an API-level test (Task 6) and a guard test (Task 9).
2. **DB down:**
   - `/api/menu` and `/api/menuboards` return 503 with an error code instead of the old hard-coded catalogue.
   - Screens show an error state, not stale prices. (Task 2)
3. **Board item referencing a deleted or unavailable SKU:** it is shown as sold out or hidden, never with a stale price. (Task 5)
4. **Meal upgrade:** the price comes only from the DB modifier group; a product with `allowMealUpgrade = false` offers no upgrade. (Task 7)
5. **Screen number outside 1–4:** 400 on PATCH; `/boards?screen=5` shows "screen not configured". (Task 5)

---

## File structure (planned)

| File | Change |
|---|---|
| `data/menu/menu-2026-10.json` | **New.** The new menu as data (categories, products, VAT category, price, image, badge, upgrade eligibility, board layout as SKU lists). Built from the other person's uncommitted `catalog-data.ts`, `signage.engine.ts` and `order/page.tsx`. |
| `src/lib/import/menu/plan.ts`, `apply.ts` | **New.** Same pattern as the Gladius importer: zod-validated, dry-run by default, upsert by SKU, never deletes, audit-logged, blocks undecided VAT/prices. Reuses `CatalogStore`. |
| `scripts/import-menu.ts` + `npm run import:menu` | **New.** CLI with a report in `.import-work/reports/`. |
| `src/app/api/menu/route.ts` | Remove the `CANONICAL_CATALOG_CATEGORIES` fallback; 503 on DB failure; include `imageUrl`, `badge` and upgrade groups. |
| `src/app/api/menuboards/route.ts` | Remove the canonical seeding; screens 1–4 only; resolve SKU refs to live name/price/availability; PATCH accepts SKU lists only (manager role). |
| `src/modules/signage/components/MenuBoard4K.tsx` | Fetch `/api/menuboards?screen=N`; keep SSE; loading, error and empty states. |
| `src/app/order/page.tsx` | Fetch `/api/menu`; loading, error and empty states. |
| `src/modules/pos/components/ModifierModal.tsx` | Render the meal upgrade from the product's modifier groups (DB); remove the €3.00/3.50/4.50 literals. |
| `src/app/admin/menu-boards/page.tsx` | Edit boards as SKU lists (pick from products); no price fields. |
| `src/lib/catalog-data.ts`, `src/modules/signage/signage.engine.ts`, `src/lib/menuboard-engine.ts` (data part), `src/lib/menu-assets.ts` (registry part) | **Delete the data.** Keep only pure helpers (daypart resolver, layout validation, placeholder generator). |
| `prisma/seed.ts` | Remove the 103 hard-coded products and board configs. Dev seed = locations, terminals, demo accounts; the menu comes from `npm run import:menu`. |
| `tests/no-hardcoded-menu.test.mjs` | **New** guard test (Task 9). |

---

### Task 1: Menu data file + schema (from the other person's work)
- [ ] Write the zod schema for `data/menu/*.json`:
  - **Categories:** slug, name, sortOrder.
  - **Products:**
    - **Identity:** sku, category, name, description.
    - **Price and tax:** gross price, VAT category or `null`.
    - **Presentation:** imageUrl, badge.
    - **Options:** allowMealUpgrade, modifierGroups.
  - **Modifier groups and modifiers:** including the meal upgrade as a normal group with Regular/Medium/Large options and side/drink choices.
  - **Boards:** screen 1–4, title, layout, ordered SKU lists.
- [ ] Tests first: the schema rejects a missing SKU, a negative price, duplicate SKUs, screen 5, and an image path outside `/assets/`.
- [ ] Convert the uncommitted hard-coded menu into `data/menu/menu-2026-10.json` with a one-off conversion script (not committed). Mark every price `"confirmed": false` until D2 and every VAT `null` until D3.
- **Acceptance:** the file validates. Its item count equals the union of the three hard-coded sources (63 / 44 / 10, de-duplicated by SKU), and the report lists any item that appears in only one source.

### Task 2: `/api/menu`: no silent fallback
- [ ] Tests first (route test with an injected repository): DB error → 503 `{ code: "MENU_UNAVAILABLE" }`, never the canonical catalogue. Success returns imageUrl, badge and modifier groups.
- [ ] Remove the `catalog-data` import from the route.
- **Acceptance:** stopping the DB makes `/pos` and `/` show their error state (checked live on a throwaway DB).

### Task 3: Menu importer (`npm run import:menu`)
- [ ] Tests first, mirroring the Gladius importer:
  - dry-run by default
  - idempotent re-run
  - `confirmed: false` prices and `null` VAT block, with a report entry
  - never deletes and never touches `isAvailable`
  - price changes are audit-logged
- [ ] Reuse `CatalogStore` / `prismaCatalogStore`; extend it to set `imageUrl`, `badge` and `allowMealUpgrade`.
- [ ] Board layouts are written to `MenuBoardConfig.itemsJson` as `{ "skus": [...] }` only.
- **Acceptance:** live test on a throwaway Postgres: refused while blocked, applied once, re-run unchanged.

### Task 4: Remove hard-coded products from `prisma/seed.ts`
- [ ] The dev seed keeps locations, terminals and demo accounts only.
- [ ] The docs say to run `npm run import:menu -- --apply` after seeding.
- **Acceptance:** `npm run db:seed` on an empty DB creates zero products, and the import then creates the menu.

### Task 5: `/api/menuboards`: SKU references, live prices, 4 screens
- [ ] Tests first:
  - screen 5 → 404/400
  - a referenced SKU resolves to the product's current name, price and availability
  - an unknown SKU is dropped with a warning in the response
  - a sold-out product comes back `isSoldOut: true`
  - PATCH accepts `{ screenNumber: 1..4, title, layoutType, skus[] }` and rejects price fields
  - PATCH needs STORE_MANAGER (already enforced by the policy) and is audit-logged
- [ ] Remove the `CANONICAL_SCREEN_CONFIGS` seeding.
- **Acceptance:** changing a product price in the DB changes the price on `/boards` with no other edit.

### Task 6: `/boards` and `/order` read the API
- [ ] `MenuBoard4K` fetches `/api/menuboards?screen=N` and keeps SSE (`PRICE_UPDATED`, `STOCK_CHANGED` → refetch). It gets skeleton, error and "screen not configured" states.
- [ ] `/order` fetches `/api/menu` and gets skeleton, error and empty states.
- [ ] API-level consistency test: for every SKU on any board, the board price = the `/api/menu` price.
- **Acceptance:** live check in a browser on a throwaway DB: same price on `/boards`, `/order` and `/pos` for three sample SKUs; a price change in `/admin` shows on all three via SSE.

### Task 7: Meal upgrade from the database
- [ ] Tests first:
  - the modal shows upgrade options only for `allowMealUpgrade` products
  - option prices come from the product's modifier group
  - the line total is server-priced (the till already sends only IDs after Phase 4; until then the modal must not invent prices)
- [ ] Remove the `mealUpgradePrice` literals from `ModifierModal.tsx`.
- **Acceptance:** changing the "Medium" upgrade price in the DB changes the till without a code change.

### Task 8: Admin board editor: SKU lists, no prices
- [ ] `/admin/menu-boards` picks products for each of the 4 screens and orders them. Prices are read-only (shown from the DB) and the screen selector offers 1–4.
- **Acceptance:** a manager can rebuild screen 2 from the UI; `/boards?screen=2` updates live.

### Task 9: Delete the hard-coded copies + guard test
- [ ] Delete the data in `catalog-data.ts`, `CANONICAL_4K_SCREENS`, `CANONICAL_SCREEN_CONFIGS` items and `MENU_ASSET_REGISTRY`; keep the pure helpers.
- [ ] `tests/no-hardcoded-menu.test.mjs` scans `src/**` and fails on:
  - object literals combining `name` with a `price` / `priceEUR` / `basePrice` number
  - `CANONICAL_*` menu exports
  - SKU→image maps
- **Acceptance:** the guard passes; it fails if someone re-adds a price literal (verified by a temporary failing fixture inside the test).

### Task 10: Docs and handover
- [ ] PRD M10/M11 status; TRD API rows; open-questions D1–D3; the README "Getting started" gains the `import:menu` step.

## Order and risk

- Do Tasks 1–3 before any screen work, so the DB holds the new menu first.
- Tasks 5–7 then switch the readers.
- Task 9 deletes the copies last, which makes every step reversible until then.
- The other person's uncommitted edits are **not** overwritten by hand. Task 1 converts them into the data file, and Task 9 removes the code copies in a reviewed commit.
- **Tell them before starting**, because their files will change underneath them.
