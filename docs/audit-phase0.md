# MYGD — Phase 0 Audit (read-only)

- **Date:** 2026-10-01
- **Branch audited:** `feat/ui-kiosk` @ `c9eb751`
- **Scope:** repo state + `import/` legacy data. No code or schema was changed. Only this report, `docs/open-questions.md`, and `/import/` + `/.import-work/` lines in `.gitignore` were added.

---

## 0. Headline findings

| # | Finding | Severity |
|---|---|---|
| 1 | **`import/` does not exist.** No XP till data, kiosk menu, or inventory lists are in the repo, so section 2 (legacy data) could not be done. Nothing else was found under `DEVELOPER/` or `~/Downloads`. | **Blocker for Phase 1** |
| 2 | **No server-side authentication.** `/api/admin/login` checks a PIN but issues no session, cookie or token. There is no `middleware.ts`. Every `/api/admin/*` route (menu, prices, recipes, inventory, reports) and every order, KDS and print route can be called by anyone on the network. `SESSION_SECRET` is declared in `.env.example` but never used. | Critical |
| 3 | **Shopify code is still present**, contradicting the "no Shopify" rule: `src/lib/shopify.ts`, `src/lib/shopify-order-sync.ts`, `src/app/api/webhooks/shopify/route.ts`, `tests/shopify-webhook.test.mjs`, and references in `src/lib/catalog-data.ts` and `src/app/dev/ui/Gallery.tsx`. The webhook falls back to a hard-coded secret and **skips HMAC verification when the header is missing**, which makes it an open, unauthenticated order-injection endpoint. | Critical |
| 4 | **VAT is defined in three conflicting places, all hard-coded.** `src/lib/tax.ts`: 9% food / 19% alcohol. `POSService.tenderOrder`: flat `/1.19`. `/api/orders/create`: `location.vatRate` (default 0.19). `Location.vatRate` and `Order.vatRate` are single floats, so a split-rate sale cannot be stored. | High (fiscal) |
| 5 | **The POS order endpoint trusts client prices.** `POST /api/orders` → `POSService` accepts `basePrice` and `totalPrice` from the browser and persists them. The kiosk path (`/api/orders/create`) correctly re-prices from the DB. | High |
| 6 | **Order numbers race.** Both paths use `count(today) + 1` (`pos.service.ts`, `src/lib/orderNumber.ts`). Two concurrent orders get the same number, and the `@unique` index then throws, so one order fails. Kiosk webhook retries make this worse. | High |
| 7 | **Money is `Float`** everywhere (`basePrice`, `subtotal`, `vatAmount`, `totalAmount`, `priceAdjustment`). That is unsuitable for invoices and needs `Decimal(10,2)` or integer cents. | High |
| 8 | **No migrations.** There is no `prisma/migrations/`; the schema is applied with `db push`, so there is no history and no safe path to production changes. | High |
| 9 | **The real-time bus is in-memory and single-process** (`globalThis` broker). It only works with one Node process, and events are lost on restart (clients must refetch). The client also tries `mgd-edge.local:8080` first by default, which fails in every environment until the fallback kicks in. | Medium |
| 10 | **`/staff` is broken.** `StaffHaccpHub` calls `/api/staff` and `/api/checklists`; neither route exists (the real ones are `/api/staff/timeclock`, `/api/checklists/log`, `/api/checklists/template`). | Medium |
| 11 | **Duplicate code trees.** `apps/*` (7 Next apps), `packages/*` (db, printing, types, ui), root `components/`, and a second identical `packages/db/prisma/schema.prisma`. Nothing in `src/` imports `@mygd/*`. Three separate print implementations exist (`src/lib/printer.service.ts`, `src/modules/printer/*`, `packages/printing/*`). | Medium (maintenance) |
| 12 | **Plaintext staff PINs** are compared in `src/lib/timeclock-engine.ts:455` (`member.pin === trimmedPin`; `StaffShift.pin` is a plain string). Also, `docker-compose.yml` has an inline `POSTGRES_PASSWORD`. Both were already flagged on 2026-09-28 and are not yet fixed. | Medium |
| 13 | **Login lockout bug.** Failed PIN attempts always increment `users[0]`, so one user gets locked out while brute force continues freely against the others. | Medium |

**Healthy:** `npm test` → **175/175 pass**; `npx tsc --noEmit` → **0 errors**. No test touches a database or an API route (all are pure-function or render tests), so the green suite says nothing about persistence or routes.

---

## 1. Repository state

### 1.1 Stack (verified)
Next.js 15.2 (App Router) · React 19 · TypeScript 5.7 · Prisma 6.3 → **PostgreSQL** (`DATABASE_URL`/`DIRECT_URL`, Supabase project linked under `supabase/.temp`) · Zod · Zustand · Tailwind 3.4 · tests via `node --test` + `tsx`. Turborepo workspaces are declared, but the **canonical app is the root `src/`** (consistent with the 2026-09-28 vault decision).

A stale SQLite file `prisma/data/kiosk_pos.db` (+wal/shm) exists locally. It is git-ignored, but `src/lib/prisma.ts` still has SQLite PRAGMA code paths.

### 1.2 Prisma schema (`prisma/schema.prisma`, 729 lines)
The schema has **30 models and 10 enums**, not 15 as the brief states.

- **Catalogue:** `Category`, `Product` (`sku @unique`, `basePrice Float`, `vatCategory`, `isAvailable`), `LocationPrice`, `ModifierGroup`, `Modifier`, `ProductModifierGroup`.
- **Inventory/BOM:** `Ingredient`, `Recipe`, `RecipeIngredient`, `RecipeBOM` (two overlapping recipe models), `InventoryItem`, `RecipeStep`, `Supplier`, `SupplierOrder`.
- **Ops:** `ChecklistTemplate`, `ChecklistLog`, `HaccpLog`, `ShiftSchedule`, `TimeLog`, `StaffShift` (TimeLog and StaffShift overlap).
- **Orders:** `Order`, `OrderItem`, `OrderItemModifier`, `KitchenTicket`.
- **Infra:** `Location`, `Terminal`, `MenuBoardConfig`, `AdminUser`, `AuditLog`, `SyncQueue`.

Gaps versus the Phase 2 requirements:

| Requirement | Today |
|---|---|
| `orderSource` (KIOSK/POS/ONLINE/DELIVERY) | Missing. Only `orderType` (DINE_IN/TAKE_AWAY/DELIVERY) and an implicit `terminalId`. |
| `externalOrderId` unique per source | Missing. |
| Status set (PENDING_PAYMENT … REFUNDED) | `OrderStatus` exists but is a superset with duplicates (`PENDING`, `PREPARING`, `READY_FOR_PICKUP`, `COMPLETED`) and no `COLLECTED`/`IN_PREPARATION`. |
| `Payment` table (method, status, amount, Link4Pay txn id, timestamps) | Missing. Payment is three columns on `Order`, which allows only one payment per order. |
| Immutable sequential `Invoice` + credit notes | Missing entirely. |
| Per-line net / VAT rate / VAT amount | Missing. `OrderItem` has `vatCategory` only. |
| VAT config table | Missing. Rates are hard-coded (finding 4). |
| Station routing (prep/grill/fryer/packing) | `KitchenTicket.station` is a free string; the code uses `ALL/INDOOR/GRILL/ASSEMBLY/FRYER`. There is no `PREP` or `PACKING` and no product→station mapping. |
| External-ID mapping for DM Soft items | Missing. |
| Sales history (read-only) | Missing. |
| Audit log | `AuditLog` exists (free-text `action`/`details`). It is written on login and menu PATCH only, not on refunds or voids (which don't exist yet). |

**`isAvailable` inversion.** `Product.isAvailable = true` means *orderable*, so "sold out" = `!isAvailable`. `MenuBoardConfig.itemsJson` additionally stores its own `isSoldOut` flag, with a hand-written inverse at `src/app/admin/menu-boards/page.tsx:102` (`isAvailable: currentStatus, // Inverse`). That gives **two sources of truth for sold-out**, and the board flag is not linked to `Product`.

### 1.3 Screens: wired vs not

| Route | Component | Data source | Live (SSE) | Status |
|---|---|---|---|---|
| `/` | `src/app/page.tsx` (+ new `features/home` at `/dev/preview/home`) | `GET /api/menu` (DB) | – | Wired (read) |
| `/order` | `src/app/order/page.tsx` | **none** (static) | – | Not wired |
| `/pos` | `modules/pos/POSTill` | `GET /api/menu` (DB); `POST /api/orders` | yes | Wired, but trusts client prices, flat 19% VAT, marks orders PAID/CAPTURED immediately, no pending-payment queue |
| `/kds`, `/kds/grill`, `/kds/indoor` | `modules/kds/KDSTablet` | `GET/PATCH /api/kds` (DB) | yes | Wired. `location=EMBA` is hard-coded. One ticket per order (`station: "ALL"`), so no per-station bump. |
| `/display` | `modules/cx-wait/WaitDisplayBoard` | `GET /api/kds` | yes | Wired via KDS tickets, not order status; contains some fallback/mock data |
| `/boards` | `modules/signage/MenuBoard4K` | **no fetch**, hard-coded/canonical configs | yes | Partially wired (events only) |
| `/staff` | `modules/haccp/StaffHaccpHub` | `/api/staff`, `/api/checklists` | – | **Broken: both routes 404** |
| `/admin` | BI, Inventory, HACCP, MenuRecipe managers | `/api/admin/*` (DB) | partial | Wired, **unauthenticated** |
| `/admin/menu-boards` | page | `/api/menuboards` (DB) | – | Wired |
| `/admin/suppliers` | page | **none** | – | Not wired |

### 1.4 API routes (21)
`admin/{inventory, inventory/recompute, inventory/restock, login, menu, recipes, reports}`, `checklists/{log,template}`, `events`, `kds`, `menu`, `menuboards`, `orders`, `orders/[id]`, `orders/create`, `staff/{build-sheets,timeclock}`, `terminal/{print,printer-test}`, `webhooks/shopify`.

- **Authentication:** none (finding 2).
- **Input validation:** Zod on `orders`, `orders/create`; ad-hoc checks elsewhere; many handlers use `any`.

### 1.5 SSE / real-time
- `src/lib/events.ts`: in-process pub/sub singleton on `globalThis`, with channels `kds|display|boards|pos|admin|all`.
- `GET /api/events?channel=…`: a `ReadableStream`, a `CONNECTED` handshake, and a 15 s heartbeat.
- `src/hooks/useRealtimeEvents.ts`: tries `NEXT_PUBLIC_MGD_EDGE_URL` (default `http://mgd-edge.local:8080/events`) first, then falls back to `/api/events`, with exponential backoff up to 10 s.

Limitations:
- There is no event id or `Last-Event-ID` replay, so screens must refetch on reconnect.
- It only works with a single Node process.
- `"all"` and `"*"` listeners are merged incorrectly (`get("all") || get("*")`, so a `*` subscriber is skipped if any `all` subscriber exists).

### 1.6 Printing
- `src/modules/printer/tcp-spooler.ts`: raw TCP 9100, an in-memory retry queue, two hard-coded stations (`INDOOR` 192.168.1.101 / `GRILL`), IPs overridable from env.
- Two more parallel implementations exist (`src/lib/printer.service.ts`; `packages/printing` with ESC/POS, StarPRNT and drawer-kick).
- The queue is not persisted (lost on restart), and print failures are only logged to the console.

### 1.7 Tests
- 37 files in `tests/*.test.mjs`, **175 passing**.
- Covered: pure logic (tax maths, order-number formatting, ESC/POS encoding, inventory engine, KDS formatter, HACCP, timeclock) and UI-kit render/contrast tests.
- Not covered: routes, the database, SSE, or auth.
- No coverage tool is configured, so the 80% target cannot be measured yet.

---

## 2. Legacy data in `import/`

**Not possible: the folder is absent.** Expected sub-folders were `import/xp-pos/`, `import/kiosk-menu/`, `import/inventory/`.

When the data arrives, this is the per-file procedure, read-only and on copies:

1. **Quarantine copy:** `import/` → `.import-work/` (git-ignored), then strip execute bits on the copy. Originals are never touched, and nothing from the XP machine is ever executed.
2. **Malware scan:** `clamscan` if installed (currently **not installed** on this Mac; `brew install clamav` needed, see Q-DATA-3). Otherwise list file types with `file` and refuse any executable, script, or macro-bearing file (`.exe .dll .bat .cmd .vbs .js .lnk .scr`, macros in `.mdb`/`.xls`).
3. **Identify the format by magic bytes**, not extension:

   | Format | How to read it |
   |---|---|
   | `.mdb` (Jet 3/4) | `mdbtools` (`mdb-tables`, `mdb-export`; not installed) |
   | `.dbf` (dBase/FoxPro) | A DBF reader with explicit codepage (likely `cp1253` Greek or `cp1252`) |
   | `.sqlite` | `sqlite3 -readonly` |
   | CSV/XLS(X) | Encoding sniff + spreadsheet reader |
   | Screenshots / photos | Manual transcription into a CSV with a `source_image` column. Prices from photos get `needs_review=true`. |

4. **Profile each table:** row count, columns, null rates, distinct counts, and candidate keys. Then classify each table as products, prices, categories, modifiers, VAT, stock, sales, customers or staff.
5. **Handle PII (GDPR):** tables containing customers/staff (names, phones, emails, card fragments) are reported by **column name and row count only**. They are not copied into the repo, not imported, and not echoed into logs or this report.

### 2.1 Proposed mapping (to finalise once the data is seen)

| Legacy concept | Target | Notes |
|---|---|---|
| Product / PLU / item | `Product` (+ new `ExternalIdMap{system:'XP_POS', externalId}`) | Match on legacy item id, **never by name**. The SKU is generated if missing and flagged for review. |
| Category / department | `Category` | Greek/German names go to `nameGR`/`nameDE` if present. |
| Price, price levels | `Product.basePrice` (gross, see Q-VAT-2); store-specific prices → `LocationPrice` | A missing or zero price is a human decision; never default it. |
| Modifiers / options / "extras" | `ModifierGroup` + `Modifier` + `ProductModifierGroup` | Min/max selection rules are often absent in old POS data and need review. |
| VAT code per item | New `VatRate` config table + `Product` reference | Mapped from the legacy code, **not** from our assumptions. |
| Stock items | `Ingredient` + `InventoryItem` | Units must be normalised (kg→g, l→ml); unknown units are flagged. |
| Recipes / BOM | `RecipeBOM` (decide on the duplicate `Recipe`/`RecipeIngredient` in Phase 2) | Only where the legacy data really links item→ingredient. |
| Kiosk item IDs (DM Soft) | `ExternalIdMap{system:'DMSOFT'}` | Filled once the DM Soft export is available. |
| Sales history | New read-only `SalesHistory` / `SalesHistoryLine` | **Never** into `Order`. PII is stripped. |
| Customers, staff | **Not imported** in Phase 1 | Pending your decision (Q-DATA-4). |

**Expected data-quality checks:** duplicate products (same name across departments), multiple prices per item, items with zero/negative price, retired items still flagged active, inconsistent naming (case, Greek/Latin mixes, "Doner"/"Döner"/"Donner"), modifiers stored as products, VAT codes that disagree with category, and orphan stock items.

---

## 3. Other relevant input found

`~/Downloads/MYGD-KioskPOS-Integration-Spec-v1.0.md` is **our own draft proposal to DM Soft**, not DM Soft documentation. It is useful as the starting point for the **internal order format** in Phase 3: `externalOrderId` idempotency, `200 DUPLICATE` replay, `409` unknown SKU, `422` totals mismatch, and an availability feed.

It **conflicts with the current brief** in places:
- It assumes the kiosk **pulls** (`GET /menu`, `/availability`, `POST /orders` with `X-API-Key`), whereas the brief says DM Soft **pushes** to a webhook.
- It assumes the kiosk works offline on the LAN, whereas the brief says it does not.
- Its payment example uses a Viva `terminalRef`, whereas the brief says Link4Pay.
- It rejects unknown SKUs with `409`, whereas the brief says to **accept and flag**.

The brief wins. I will reconcile the draft before reusing it (Q-DM-1).

---

## 4. Assumptions (made for this audit; correct me)

- A1. Root `src/` is the only deployed app; `apps/*`, `packages/*` and root `components/` are legacy.
- A2. The deployment target is a single Node process (which the SSE bus requires).
- A3. Catalogue prices are VAT-inclusive (gross), as all current code assumes.
- A4. One store for now (`EMBA`), but keep `locationId` everywhere.
- A5. "isAvailable is inverted vs sold out" means `soldOut = !isAvailable`. The importer and the DM Soft adapter must translate, never copy.
- A6. Removing the Shopify code is in scope, but only with your approval and as its own commit (not done in Phase 0).

All questions are in **`docs/open-questions.md`**.

## 5. Recommendation: Phase 0.5 security floor before Phase 1

This would be small and test-first:
1. Server-side session auth plus role guards on all staff/admin routes.
2. Remove or disable the Shopify webhook.
3. Fix the login lockout.
4. Hash timeclock PINs.

Phases 3 and 4 add money-moving endpoints, and these should not sit on top of an unauthenticated API. **Your call (Q-SEC-1).**
