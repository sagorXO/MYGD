# MYGD — Technical Requirements Document (TRD)

- **Status:** Draft 1.0 for Sagar's approval
- **Date:** 2026-10-03
- **Companion to:** `docs/PRD.md`

**Rule for this document:** anything labelled **PROPOSED** is a design for review, not a decision. The Prisma schema in `prisma/schema.prisma` stays unchanged until Sagar approves Phase 2. Unknowns reference `docs/open-questions.md`.

---

## 📊 Document Overview

| Item | Value |
|---|---|
| Product | MYGD connected operations system (five systems, modules M1–M12) |
| Codebase | Single Next.js app, root `src/` (the monorepo `apps/*` and `packages/*` were archived on branch `archive/apps-packages`) |
| Delivery | Store server (offline-capable) + cloud VPS `[SOW]` |
| Engineering rules | TDD; Zod at every boundary; no `any` in new code; conventional commits; every phase ends with tests + `npm run typecheck` + `npm run build` |

## 🏗️ System Architecture

```
                        ┌────────────────────────── CLOUD (Linux VPS, Docker) ──────────────────────────┐
  Owners (phone/laptop) │  Next.js (same codebase) · /admin remote · public site / · /order pre-order   │
  Guests online ───────▶│  PostgreSQL (HQ copy, cross-store reporting)                                  │
                        └───────────────▲───────────────────────────────────────────────────────────────┘
                                        │  sync (outbox, retried; store keeps working when this link is down)
┌──────────────────────── STORE (Emba; Limassol later) ── LAN ─────────────────────────────────────────┐
│  Store server PC (static LAN IP, Windows service)                                                     │
│   Next.js server ── PostgreSQL (local, authoritative for the store) ── SSE broker ── print queue      │
│      ▲            ▲                    ▲                   │                      │                  │
│      │ HTTPS/LAN  │ webhook            │ SSE               ▼                      ▼ TCP 9100          │
│   /pos iPad   DM Soft bridge ◀─ kiosk  /kds, /display,  live updates      kitchen printer, grill     │
│   (Link4Pay)  (internet)               /boards, /staff                    printer (+ drawer kick)    │
└───────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Offline rule** `[BRIEF]` `[SOW]`: everything inside the STORE box must work with the WAN down. The kiosk and card terminals need connectivity `[OPS]`; a 4G/5G failover router covers them `[Sch-C §7]`.

**Hosting** `[Sch-C §1]`: the contract specifies an in-store Windows PC at static IP 192.168.1.50 running the app as a background service (NSSM/WinSW), plus a cloud Linux VPS (Hostinger/Hetzner, Docker) `[SOW]`.

## 🛠️ Technology Stack

| Component | Technology (current, verified in `package.json`) | Why / note |
|---|---|---|
| Web framework | Next.js 15 (App Router, `output: standalone`), React 19 | One codebase for every screen; standalone build runs as a Node service |
| Language | TypeScript 5.7 (strict) | — |
| Validation | Zod 3 | Boundary validation for routes and webhooks |
| ORM | Prisma 6 | Migrations required from Phase 2 (today: `db push`, no history) |
| Database | **PostgreSQL** (schema provider). Engine and hosting for the "new database" **[OPEN Q-DB-1]** | **PROPOSED:** PostgreSQL 16 on the store PC (offline) + PostgreSQL on the VPS (HQ), synced through an outbox table. This satisfies the SOW intent with one SQL dialect |
| Realtime | Server-Sent Events, in-process broker (`src/lib/events.ts`) | Single Node process per store. Add event IDs and refetch-on-reconnect |
| Printing | ESC/POS over raw TCP 9100 (`src/modules/printer/*`) | **PROPOSED:** `PrinterDriver` interface + persistent `PrintJob` queue |
| UI | Tailwind 3.4 + in-house kit `src/ui/` (~45 components), `lucide-react`, `framer-motion` | Design tokens in `src/ui/tokens.css` |
| Auth | **None today.** **PROPOSED:** server-side sessions (HTTP-only cookie, signed with `SESSION_SECRET`), PIN for shared devices, roles | P.1 in the PRD |
| Password/PIN hashing | `bcryptjs` (already a dependency) | Also for timeclock PINs |
| Tests | `node:test` via `tsx` (`npm test`, 168 tests); Playwright for UI smoke (`npm run ui:smoke`) | No route or DB tests yet: add them from Phase 2 |
| Container | Dockerfile (node:20-alpine, multi-stage, `npm ci`) | See Deployment |
| Images | Plain `<img>` on 7 screens (10 `@next/next/no-img-element` lint warnings) | **Deliberately deferred:** the sources are remote stock photos, and Next's optimiser would fetch them through the store server, which breaks offline. Switch to `next/image` with local files when Phase 1 imports the client's photography (Sch-C §6) |

## 🗄️ Database Schema

### Current (unchanged, `prisma/schema.prisma`, 30 models)
- **Catalogue:** `Category`, `Product`, `LocationPrice`, `ModifierGroup`, `Modifier`, `ProductModifierGroup`.
- **Inventory:** `Ingredient`, `Recipe`, `RecipeIngredient`, `RecipeBOM`, `InventoryItem`, `RecipeStep`, `Supplier`, `SupplierOrder`.
- **Ops:** `ChecklistTemplate`, `ChecklistLog`, `HaccpLog`, `ShiftSchedule`, `TimeLog`, `StaffShift`.
- **Orders:** `Order`, `OrderItem`, `OrderItemModifier`, `KitchenTicket`.
- **Infra:** `Location`, `Terminal`, `MenuBoardConfig`, `AdminUser`, `AuditLog`, `SyncQueue`.

Known defects (from `docs/audit-phase0.md`):
- **Money:** stored as `Float`.
- **VAT:** a single `vatRate` per order or location.
- **Payments and invoices:** no payment, invoice or credit-note tables.
- **Statuses:** duplicate order statuses.
- **Overlapping models:** `Recipe`/`RecipeBOM` and `TimeLog`/`StaffShift` duplicate each other.
- **Sold-out:** two sold-out flags.

### PROPOSED changes (Phase 2, needs approval; tests first, then migrations)

| Change | Fields (exact names proposed) |
|---|---|
| Money as decimal | All money fields → `Decimal @db.Decimal(10,2)` |
| `Order` | `orderSource OrderSource` (KIOSK, POS, ONLINE, DELIVERY); `externalOrderId String?`; `@@unique([orderSource, externalOrderId])`; `ticketNumber Int` (store-wide sequence); `status OrderStatus` reduced to PENDING_PAYMENT, PAID, IN_PREPARATION, READY, COLLECTED, CANCELLED, REFUNDED |
| `OrderSequence` (new) | `locationId`, `businessDate`, `lastValue` (incremented inside the order transaction, so numbers can't collide) |
| `Payment` (new) | `orderId`, `method` (CARD, CASH), `status`, `amount`, `link4payTransactionId String?`, `createdAt`, `capturedAt?`, `refundedAt?` |
| `Invoice` (new) | `locationId`, `number` (sequential per store, `@@unique([locationId, number])`), `orderId`, `issuedAt`, `netTotal`, `vatTotal`, `grossTotal`; append-only (no update/delete in code; DB trigger proposed) |
| `InvoiceLine` (new) | `invoiceId`, `description`, `quantity`, `unitGross`, `vatRateId`, `vatRate`, `net`, `vat`, `gross` |
| `CreditNote` (+ lines) (new) | `invoiceId`, `number` (own sequence), `reason`, `issuedBy`, amounts per line as above |
| `VatRate` (new) | `code`, `rate Decimal(5,4)`, `validFrom`, `validTo?`. Seed values from `[MSA §3.4]`: FOOD 0.09, ALCOHOL 0.19 (accountant to confirm, Q-VAT-1) |
| `ExternalIdMap` (new) | `system` (XP_POS, DMSOFT), `entityType` (PRODUCT, MODIFIER), `externalId`, `entityId`; `@@unique([system, entityType, externalId])` |
| `KioskInbox` (new) | `receivedAt`, `rawPayload Json`, `signatureValid Boolean`, `status` (RECEIVED, PROCESSED, FAILED, NEEDS_REVIEW), `error?`, `orderId?` |
| `KitchenTicket` | `station` → enum (PREP, GRILL, FRYER, PACKING; `[OPS]`, mapping Q-HW-3); `Product.station` |
| `PrintJob` (new) | `printerId`, `ticketId?`, `invoiceId?`, `payload Bytes`, `status`, `attempts`, `lastError?` |
| `AuditLog` | Structured `entityType`, `entityId`, `before Json?`, `after Json?`, `actorId` |
| `SalesHistory` (+ lines) (new, read-only) | Imported legacy sales; never joined into live orders |
| Removals | Merge `Recipe`+`RecipeIngredient` into `RecipeBOM`, and `TimeLog` into `StaffShift` (Q-DM-8); drop `MenuBoardConfig.itemsJson[].isSoldOut` in favour of `Product.isAvailable` (Q-DM-7) |

## 🔌 API Design

Current routes (`src/app/api/*`). All of them are **unauthenticated** today.

| Route | Methods | Caller | Note |
|---|---|---|---|
| `/api/menu` | GET | `/`, `/pos`, home | Catalogue read |
| `/api/orders` | POST | `/pos` | Till order. Trusts client prices (fix in Phase 4) |
| `/api/kds` | GET, PATCH | `/kds`, `/display` | Tickets + bump |
| `/api/events` | GET (SSE) | all live screens | Channels `kds`, `display`, `boards`, `pos`, `admin` |
| `/api/menuboards` | GET, PATCH | `/admin/menu-boards` | `/boards` should use it (TODO) |
| `/api/terminal/print` | POST | KDS reprint | Uses `src/modules/printer` |
| `/api/admin/{menu,recipes,inventory,inventory/restock,inventory/recompute,reports}` | various | `/admin` | `recompute` has no caller |
| `/api/admin/login` | POST | **none** | Checks the PIN but issues no session; replace in Phase 0.5 |
| `/api/checklists/{log,template}`, `/api/staff/{timeclock,build-sheets}` | various | **none** | Backends for `/staff`; the screen calls the wrong paths (TODO marked) |

**PROPOSED** additions:

| Route | Purpose |
|---|---|
| `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` | Sessions + roles |
| `POST /api/integrations/dmsoft/orders` | Kiosk webhook: verify → `KioskInbox` → 2xx fast → async processing (M12.1–12.6) |
| `GET /api/health` | Liveness, DB reachability, last kiosk order age |
| `POST /api/pos/orders/:id/pay`, `GET /api/pos/pending` | Cash payment for PENDING_PAYMENT orders |
| `POST /api/invoices/:id/credit-notes` | Refunds |
| `GET /api/exports/vat?from=&to=&format=csv` | Daily/monthly VAT export |
| `PATCH /api/admin/availability` | Sold-out toggle → SSE + outbound kiosk client stub |

## 🔒 Security & Rate Limiting

| Area | Requirement |
|---|---|
| Authentication | Every `/api/admin/*`, `/api/pos/*`, `/api/kds` (PATCH), `/api/terminal/*`, `/api/checklists/*`, `/api/staff/*` route requires a session; role checks per route (staff < manager < owner). `/admin` pages require login |
| PIN login | bcrypt; per-user lockout after 5 failures (today's code locks out the first user instead) |
| Webhook | Signature or shared-secret check (configurable). Reject unsigned requests; store a raw-payload copy; idempotent on `externalOrderId` |
| Rate limits | Login: 5 per minute per device. Webhook: per-source limit `[OPEN — DM Soft volume]` |
| Secrets | Only in env; `.env*` git-ignored and excluded from Docker builds (`.dockerignore`) |
| Exposure | `/dev/*` returns 404 in production (verified). The image optimiser is restricted to two hosts |
| Known exposed credentials | Old Supabase URLs remain in git history (pre-cleanup); rotate or confirm the project is dead (see `docs/contract-alignment.md`) |

## 🤖 AI Integration

None in the product. (Schedule C §5 provides an AI tooling allowance for the contractor's development tools only.)

## 🚀 Deployment Strategy

1. **Store server:**
   - Install Node 20 LTS and PostgreSQL on the store PC.
   - `npm ci && npm run db:generate && npm run build`.
   - Run `.next/standalone/server.js` as a Windows service (NSSM) `[Sch-C §1]`.
2. **Migrations:** `prisma migrate deploy` from Phase 2 onwards (no more `db push`).
3. **Cloud:** build the Docker image from the `Dockerfile` and run it on the VPS with its own `DATABASE_URL`. *Verified 2026-10-03 (Colima, Docker 29): the image builds and starts; `/` → 200; `/dev/ui` → 404; no `.env*`, `import/` or `Documents/` in the image.*
4. **Backups:** nightly `pg_dump` from the store DB to a second location (VPS or external disk); weekly restore test; restore steps documented in Phase 6 `[OPS]`.
5. **Staging:** a staging environment for UAT before every milestone `[SOW §3]`.

## 📊 Performance Requirements

| Metric | Target | Source |
|---|---|---|
| Sold-out and price propagation to in-store screens | < 500 ms | `[SOW]` |
| Kiosk order → visible on KDS | ≤ 3 s *(proposed acceptance test)* | — |
| Webhook acknowledgement | < 1 s, with processing asynchronous | `[OPS]` |
| Cloud API and signage availability | 99.9% | `[Sch-B]` |
| Offline operation | Till, KDS and printing fully functional with the WAN down | `[BRIEF]` `[SOW]` |

## 💰 Cost Estimate

The software licences and the in-house stack cost €0 (open source). Running costs are either the client's or unknown:
- **VPS hosting:** `[OPEN Q-DB-1]`.
- **WhatsApp Business API:** `[OPEN]`.
- **Menu-board players:** about €130 each `[BRIEF]`.
- **Contractor AI tooling allowance:** $150–200 per month `[Sch-C §5]`.

## 📋 Development Checklist (engineering order, see PRD §Development Phases)

1. Merge `cleanup/fresh-start` (after approval).
2. Phase 0.5: auth + roles, lockout fix, hashed PINs.
3. Phase 1: legacy importer (when `import/` is delivered).
4. Phase 2: schema changes above, written test-first, with the first Prisma migration.
5. Phase 3: DM Soft webhook + adapter + fixtures:
   - normal order
   - duplicate
   - unpaid
   - paid
   - cancelled
   - refunded
   - malformed
   - unknown product
6. Phase 4: till pending queue, invoices, credit notes, drawer kick, VAT CSV.
7. Phase 5: multi-ticket KDS by station, `PrinterDriver` + persistent queue, `/display` columns.
8. Phase 6: admin kiosk monitor, sold-out push, backup script + restore guide.

## 🎯 Technical Success Criteria

- `npm test`, `npm run typecheck` and `npm run build` are green on every commit. Route and DB tests exist for every money-moving path.
- Replaying the same kiosk payload N times creates exactly one order.
- 30 concurrent orders produce 30 distinct, consecutive ticket numbers.
- An issued invoice can't be updated or deleted through any code path; a credit note is the only correction.
- With the WAN unplugged, an order placed at `/pos` prints and appears on `/kds` and `/display`.
- No unauthenticated access to any staff or admin route (automated test).
