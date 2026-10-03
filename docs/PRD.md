# MY GERMAN DÖNER (MYGD) — Master Product Requirements Document

- **Status:** ✅ **Approved v1.0** by Md. Saied Sagar, 2026-10-03. Changes from here on need a new version and re-approval. Contract variances (⚠) still need the client's written confirmation (Q-CON-1).
- **Date:** 2026-10-03
- **Owner:** Md. Saied Sagar (Contractor, sole engineer)
- **Client:** MY GERMAN DÖNER TRADING LTD — Rico & Oliver (owners), Markus (project lead)
- **Organisation:** grouped by module (M1–M12) plus platform requirements

**Sources, in order of authority:**
1. Signed contract, Revision 3.1, effective 24 Aug 2026: `Documents/01. MSA.docx`, `02. SOW.docx`, `03. Payment Schedule.docx`, `04. Technical prerequisites.docx`
2. Sagar's operating brief, 2026-10-01 (DM Soft kiosk, no Shopify, new database, rebuild phases)
3. Client brief `Requirements/MYGD Control System Developer Brief EN.pdf`, Draft 1.9, 4 Aug 2026
4. `docs/audit-phase0.md`, `docs/contract-alignment.md`, `docs/open-questions.md`

**Tag legend:**
- `[SOW]` / `[MSA]` / `[Sch-B]` / `[Sch-C]`: signed contract clauses.
- `[BRIEF]`: client brief.
- `[OPS]`: Sagar's 2026-10-01 operating brief.
- `[OPEN Q-…]`: unknown; see `docs/open-questions.md`. Nothing tagged OPEN may be guessed in code.
- **⚠ Variance:** the requirement departs from the signed SOW and needs the client's written confirmation (see `docs/contract-alignment.md` §3).

---

## 📊 Project Overview

MYGD replaces a Windows-2000-era till, WhatsApp ordering, ConnectTeam scheduling, Canva+USB menu boards and paper logs with **one connected operations system** for a döner restaurant group in Cyprus `[BRIEF]`. Five systems ship under a fixed-price, 12-month contract (€12,000) `[MSA §3]`:

| System | Scope `[SOW §2]` | Modules |
|---|---|---|
| 1. Public brand & ordering platform | Public website (mygermandoener.com), Emba + Limassol profiles, queue-based pickup ETA | M6 |
| 2. Overhead signage & customer queue | 4 × 4K menu boards, sold-out sync, dayparting, `/display` wait board with chime | M10, M5 (display) |
| 3. Front-of-house till | iPad web POS `/pos`, Link4Pay, cash drawer kick, dual-rate VAT, unified ticket numbers | M4, M12 |
| 4. Kitchen production & routing | 2 Ethernet thermal printers (TCP 9100), web KDS `/kds/indoor`, `/kds/grill` | M5 |
| 5. Back-of-house dashboard | `/admin`: price push, sold-out matrix, BOM, HACCP, supplier approvals, VAT reporting | M1, M2, M3, M7, M8, M9, M11 |

**Locations** `[MSA]`:
- Emba / Paphos flagship: Pavlides Court, Agíou Stefánou Street 134, 8260 Emba (live).
- Limassol Marina: Commercial Promenade, Limassol (being set up; contract Month 9).

**Roles** `[OPS]`:
- **Sagar** builds all software, the database, the store server set-up and the integrations.
- **DM Soft** supplies the touch-screen self-order kiosk and a bridge connection portal that sends kiosk orders to MYGD.
- **Link4Pay** card payment on the kiosk is embedded by DM Soft.

## 🎯 Product Vision

"One system instead of twelve separate tools" `[BRIEF]`. The design rules:
- **Single source of truth.** Prices, products and recipes live in exactly one place (M11). The till, kiosk, menu boards, website, inventory and training all read from it; a price typed once is correct everywhere `[BRIEF]`.
- **The store keeps trading without internet.** The till, printers and kitchen display keep working through an internet outage and sync to HQ afterwards `[BRIEF]` `[SOW: 100% offline store autonomy]`. Exception `[OPS]`: the DM Soft kiosk and the card terminals need connectivity; a 5G/4G backup router covers this `[Sch-C §7]`.
- **Owners see the business from anywhere:** revenue, busyness, temperatures and stock `[BRIEF]`.
- **Multi-location from day one** in the data model, even though only Emba is live `[BRIEF]`.

## 👤 Target Users

| Persona | Device | Needs |
|---|---|---|
| Owners (Rico, Oliver) | Phone / laptop → `/admin` | Remote visibility, approvals (> €250 supplier orders `[SOW]`), price and sold-out control |
| Project lead (Markus) | Laptop → `/admin` | Templates, schedules, master data |
| Cashier | iPad 10.9" on stand → `/pos` `[SOW]` | Fast cash and exception handling, taking payment for unpaid kiosk orders |
| Kitchen crew (prep, grill/slicer, fryer, packing) | Kitchen monitor + iPads → `/kds` | See **many orders at once**, claim, bump per station `[BRIEF]` `[OPS]` |
| Staff (all) | 10.1" wall tablet → `/staff` `[SOW]` | Checklists, HACCP readings, clock in/out, build sheets |
| Guest at the kiosk | DM Soft kiosk (not our UI) | Order and pay; gets an order number |
| Guest waiting | 43" TV → `/display` `[SOW]` | See "In preparation" / "Ready" with a chime |
| Guest online (Limassol, ~80% delivery) | Phone → `/` and `/order` | Pre-order with a realistic pickup time `[SOW]` `[BRIEF]` |

## ✨ Core Features — grouped by module

Each module lists: purpose, requirements (numbered, testable), contract stage, current code status (2026-10-03) and open items. The contract stage is the payment milestone in `[Sch-B]`.

### M11 — Product & Price Master Data *(foundation)*
**Purpose:** the single catalogue every other module reads `[BRIEF]`.

| # | Requirement |
|---|---|
| M11.1 | Products with categories, sizes/variants, modifier groups (min/max, required) and modifiers with price adjustments. |
| M11.2 | Per-location prices and per-location availability `[BRIEF]`. |
| M11.3 | **External-ID mapping** per product and modifier: legacy XP till IDs and DM Soft kiosk item IDs. Matching never uses names alone `[OPS]`. |
| M11.4 | VAT category per product, resolved through a VAT rate **configuration table**. Initial rates from `[MSA §3.4]`: **9%** food, dine-in, takeaway and non-alcoholic drinks; **19%** alcoholic drinks. Accountant to confirm `[OPEN Q-VAT-1]`. |
| M11.5 | Sold-out = `isAvailable = false` (the flag is inverted relative to "sold out") `[OPS]`. A single source of truth; menu boards derive from it `[OPEN Q-DM-7]`. |
| M11.6 | Price and sold-out changes propagate to the till, boards and kiosk in **< 500 ms** in-store `[SOW]`. |
| M11.7 | Every price change is written to the audit log (who, when, old → new) `[OPS]`. |
| M11.8 | Idempotent importer from the legacy data in `import/` (dry run by default) `[OPS]`. Blocked: no data delivered yet `[OPEN Q-DATA-1]`. |

**Contract stage:** Advance/M0 "schema init". **Status:** schema exists (30 models), money is stored as `Float`, VAT is hard-coded, and there is no external-ID map or audit of price changes.

### M12 — DM Soft Kiosk Integration ⚠ Variance V1
**Purpose:** accept orders from the DM Soft self-order kiosk through DM Soft's bridge `[OPS]`. The signed SOW names "Register 2: dedicated Shopify POS terminal" instead.

| # | Requirement |
|---|---|
| M12.1 | Inbound endpoint for kiosk orders. Verify the sender (signature or shared secret, configurable), **store the raw payload first**, acknowledge fast, then process asynchronously. |
| M12.2 | De-duplicate on `(source, externalOrderId)`; retries never create a second order. |
| M12.3 | Unpaid kiosk orders (before Link4Pay is embedded) arrive as **PENDING_PAYMENT** and appear on the till for cash payment `[OPS]`. Paid orders go straight to the kitchen. |
| M12.4 | An unknown product **must not lose the order**: flag it for staff review `[OPS]`. |
| M12.5 | Cancelled and refunded kiosk orders are mirrored into order status, and the refund is recorded as a credit note (M4). |
| M12.6 | A thin adapter: the DM Soft payload maps to one internal order format, so a format change touches one file. Payload unknown `[OPEN Q-DM-2]`. |
| M12.7 | Push sold-out and availability changes to the kiosk through an outbound client (stub until the DM Soft API is known) `[OPEN Q-DM-3]`. |
| M12.8 | Health check, plus an alert if no kiosk orders arrive during opening hours `[OPEN Q-DM-5]`. |
| M12.9 | The kiosk prints only a payment confirmation and an order number; **MYGD issues the official receipt/invoice** `[OPS]`. Which number the customer sees `[OPEN Q-DM-4]`. |

**Status:** not built. The old in-house kiosk UI was removed (DM Soft supplies the kiosk).

### M4 — Till / POS `/pos`
| # | Requirement |
|---|---|
| M4.1 | iPad 10.9" landscape web POS with a 3-step customiser `[SOW]`. |
| M4.2 | New cash orders, plus a queue of **PENDING_PAYMENT** kiosk orders: take cash and mark paid `[OPS]`. |
| M4.3 | Prices are **always computed on the server** from M11; the client never sends trusted prices. |
| M4.4 | Link4Pay card terminal: amount passed automatically, never retyped `[BRIEF]` `[SOW]`. Integration details `[Sch-C §3]` (Merchant ID, Terminal ID) still to be supplied. |
| M4.5 | Cash drawer opens through the receipt printer on cash payment (24 V RJ12 kick) `[SOW]`. |
| M4.6 | Official receipt/invoice: sequential number per store that can never be edited or deleted; corrections only via **credit notes** `[OPS]`. Net, VAT rate, VAT amount and gross stored **per line and per sale**, with a dual-rate breakdown `[MSA §3.4]`. Mandatory fields `[OPEN Q-INV-1..3]`. |
| M4.7 | Refunds only through credit notes; refunds and voids are written to the audit log `[OPS]`. |
| M4.8 | Daily and monthly CSV export of invoices with VAT for the tax advisor `[OPS]` `[SOW: daily dual-VAT reporting]`. |
| M4.9 | **One shared ticket-number sequence** across till, kiosk and pre-order, used by the kitchen and `/display` `[SOW]`. Must be collision-free under concurrency. |
| M4.10 | Works with no internet (local server) `[BRIEF]` `[SOW]`. |

**Contract stage:** Month 2. **Status:** wired to the DB, but trusts client prices, uses a flat 19% VAT, has a racy order number, no invoices, credit notes or drawer kick, and is unauthenticated.

### M5 — Kitchen Display, Printing & Customer Status Screen
| # | Requirement |
|---|---|
| M5.1 | `/kds`: **multi-ticket board** with many orders visible at once (the old one-at-a-time screen failed) `[BRIEF]` `[OPS]`. Large touch targets (≥ 48 px, `DESIGN.md` §4); usable on the kitchen monitor and iPads. |
| M5.2 | Stations **prep, grill, fryer, packing** `[OPS]`. The contract minimum is Station 1 Indoor Assembly and Station 2 Outdoor Charcoal Grill `[SOW]`; `/kds/indoor` and `/kds/grill` remain as filtered views (Variance V4). Product → station mapping `[OPEN Q-HW-3]`. |
| M5.3 | Claim lock: claiming an order locks it from other staff `[BRIEF]` `[SOW]`. Bump/complete **per station**. |
| M5.4 | Per-order timer and urgency colours: green < 4:00, amber 4:00–8:00, red > 8:00 (`DESIGN.md` §6). |
| M5.5 | Printing: ESC/POS print queue **behind an interface** with a network-printer (TCP 9100) driver first, routing by station to the kitchen and grill printers `[SOW]` `[OPS]`. Retry failed prints and **show failures on screen**. Printer models unknown `[OPEN Q-HW-1, Q-HW-2, Q-HW-4]`. |
| M5.6 | `/display`: two live columns, **"In preparation"** and **"Ready"** `[OPS]` (SOW wording "Preparing / Ready for Pickup", Variance V3), with a chime `[SOW]`. |
| M5.7 | Kitchen and display keep working with no internet `[BRIEF]`. |

**Contract stage:** Month 7. **Status:** KDS and display are wired via SSE, but each order is a single "ALL" ticket (no per-station bump), the print queue is in memory and failures only reach the log.

### M10 — Menu Boards `/boards`
| # | Requirement |
|---|---|
| M10.1 | **4** overhead 4K screens, `/boards?screen=1..4` `[SOW]` (the client brief allowed up to 7; the schema allows 1–7). Allocation `[SOW]`: Hero, Döner, Wraps/Boxes, Combos/Drinks. |
| M10.2 | Content comes from M11 prices; sold-out shown within 500 ms `[SOW]`. |
| M10.3 | Automated dayparting `[SOW]`. Daypart times `[OPEN — not in signed SOW]`. |
| M10.4 | Remote control from HQ; owners alerted when a screen goes dark (heartbeat) `[BRIEF]` `[Sch-B Stage 6]`. |

**Contract stage:** Month 6. **Status:** `/boards` renders hard-coded content (TODO marked); the DB-backed `/api/menuboards` exists but `/boards` doesn't use it.

### M1 — Checklists & HACCP Logbook `/staff`
| # | Requirement |
|---|---|
| M1.1 | Opening, mid-day and closing checklists from editable templates (no developer needed) `[BRIEF]`. |
| M1.2 | Records who completed what and when; follows up on undone tasks `[BRIEF]`. |
| M1.3 | HACCP temperature logs: chilled 0–5 °C, hot-holding ≥ 63 °C `[SOW]`; freezer −18 to −22 °C (`DESIGN.md` §5). Out of range → mandatory corrective-action note and owner alert. |

**Contract stage:** Month 1. **Status:** backend routes exist (`/api/checklists/log`, `/template`), but the `/staff` screen calls non-existent APIs (404, TODO marked).

### M2 — Supplier Ordering `/admin/suppliers`
| # | Requirement |
|---|---|
| M2.1 | "We're out of this" → order to the correct supplier `[BRIEF]`, via WhatsApp `[SOW]` (needs WhatsApp Business API access `[BRIEF]`). |
| M2.2 | Duplicate-order detection, quantity caps `[BRIEF]`. |
| M2.3 | Orders **> €250 need approval** by an owner PIN `[SOW]` `[Sch-B Stage 1]`. A copy of every order is kept `[BRIEF]`. |

**Contract stage:** Month 1. **Status:** static page only; nothing wired.

### M3 — Inventory & BOM
| # | Requirement |
|---|---|
| M3.1 | Gram-level recipes; every sale deducts ingredients automatically `[BRIEF]` `[SOW]`. |
| M3.2 | Shared rotisserie-spit depletion `[SOW]`; deterministic sold-out triggers `[Sch-B Stage 2]`. |
| M3.3 | Low stock triggers a reorder suggestion before running out `[BRIEF]` (feeds M2). |
| M3.4 | Stock discrepancies traceable to source `[BRIEF]`. Requires a kitchen scale and barcode scanner `[BRIEF]` `[OPEN — hardware not in Schedule C]`. |

**Contract stage:** Month 2. **Status:** engine and tests exist; admin APIs are unauthenticated; BOM deduction is "non-blocking" (errors only logged).

### M9 — Reporting & Remote Visibility `/admin`
| # | Requirement |
|---|---|
| M9.1 | Revenue, guest count, average ticket, peak hours, per location, on mobile `[BRIEF]`. |
| M9.2 | Store comparison (Emba vs Limassol), labour-cost overlay `[Sch-B Stage 3]`. |
| M9.3 | **Dual-rate VAT (9%/19%) accounting export** `[Sch-B Stage 3]` `[MSA §3.4]`. |
| M9.4 | Later: food cost, waste tracking, HACCP audit archive `[Sch-B Stage 10]`. |
| M9.5 | Optional read-only **sales history** imported from the old till, never mixed into live orders `[OPS]`. |

**Contract stage:** Month 3 (advanced: Month 10). **Status:** BI dashboard exists; `lib/tax.ts` holds the 9/19 split but only tests use it; no export.

### M7 — Shift Scheduling & PIN Timeclock
| # | Requirement |
|---|---|
| M7.1 | Plan, swap and finalise shifts with automatic notification; replaces ConnectTeam `[BRIEF]` `[SOW]`. |
| M7.2 | 4-digit PIN clock in/out at the staff tablet `[SOW]`. PINs stored hashed, never in plain text. |
| M7.3 | Role-specific task lists (e.g. slicer) `[BRIEF]`. |

**Contract stage:** Month 4. **Status:** backend route only, no UI; PINs compared in plain text.

### M8 — Build Sheets & Training
| # | Requirement |
|---|---|
| M8.1 | Step-by-step assembly guide per product, with photos, built from the same recipe data as M3 `[BRIEF]` `[Sch-B Stage 5]`. |
| M8.2 | Client provides a photo sequence per product `[BRIEF]`. |

**Contract stage:** Month 5. **Status:** backend route `/api/staff/build-sheets` exists, no UI.

### M6 — Public Website & Pre-Order `/`, `/order`
| # | Requirement |
|---|---|
| M6.1 | Public site with Emba and Limassol profiles; EN/DE/GR `[SOW]` (English first, extensible `[OPS]`). |
| M6.2 | Pre-order with a pickup time calculated from **actual kitchen load** `[BRIEF]` `[SOW]`. Formula `[OPEN — the signed SOW gives no formula]`. |
| M6.3 | Online payment `[BRIEF]`; provider `[OPEN]`. |
| M6.4 | Drive-through car detection: the client must provide a method `[BRIEF]`. |
| M6.5 | Later: Wolt/Foody bridge `[Sch-B Stage 9]`. |

**Contract stage:** Month 8 (Limassol live: Month 9). **Status:** old home at `/`, redesigned home at `/dev/preview/home` (not live), `/order` static.

### Platform requirements (all modules)
| # | Requirement |
|---|---|
| P.1 | **Authenticated staff and owner routes** with roles (staff, manager, owner/admin), sessions and least privilege `[OPS]`. **Built in Phase 0.5:** signed 12 h session cookie, deny-by-default middleware (`src/lib/auth/policy.ts`), role checks in admin/till handlers, `/login`. |
| P.2 | **Audit log** for price changes, refunds and voids `[OPS]`. |
| P.3 | Live updates over SSE to all screens, with reconnect and refetch. |
| P.4 | Money stored as exact decimals (not floats). |
| P.5 | Nightly database backup to a second location, with documented restore steps `[OPS]` `[Sch-B SLA]`. |
| P.6 | No secrets in the repo; every input validated at the boundary (Zod) `[OPS]`. |
| P.7 | GDPR: the client is controller, the contractor is processor `[MSA §6]`. |

## 📱 Screen Inventory

| Route | Device / viewport | Module | Status |
|---|---|---|---|
| `/` | Public web (responsive) | M6 | Old home page; redesign waiting at `/dev/preview/home` |
| `/order` | Public web | M6 | Static, not wired |
| `/pos` | iPad landscape 1024×768 | M4 | Wired, see M4 status |
| `/kds`, `/kds/indoor`, `/kds/grill` | Kitchen monitor 1920×1080, iPads | M5 | Wired (single-ticket model) |
| `/display` | 43" TV 1920×1080 | M5 | Wired via KDS tickets |
| `/boards?screen=1..4` | 4K TVs | M10 | Hard-coded content |
| `/staff` | Wall tablet 1280×800 | M1, M7, M8 | Broken (wrong API paths) |
| `/admin` | Laptop / phone | M3, M9, M11, M8 | Wired, **no login** |
| `/admin/menu-boards` | Laptop | M10 | Wired |
| `/admin/suppliers` | Laptop | M2 | Static |
| `/dev/ui`, `/dev/preview/home` | Dev only (404 in production) | — | UI kit gallery and preview |

New screens needed:
- login (P.1)
- till pending-payment queue (M4.2)
- invoice and credit-note views (M4.6)
- kiosk order monitor and review queue (M12)
- print-failure banner (M5.5)

## 🔄 Key User Flows

1. **Paid kiosk order:** the guest pays on the kiosk (Link4Pay) → the DM Soft bridge POSTs → MYGD stores the raw payload and acks → creates the order (status PAID) → tickets per station → printers and KDS → crew bump per station → order READY → `/display` "Ready" + chime → COLLECTED.
2. **Unpaid kiosk order (until Link4Pay is live):** the order arrives as PENDING_PAYMENT → it appears in the till queue → the guest pays cash at the counter → the cashier marks it paid → drawer kick and official receipt → flow 1 continues from the tickets step.
3. **Counter cash order:** the cashier builds the order (server-priced) → cash tendered → invoice number assigned → receipt + drawer kick → kitchen.
4. **Refund:** a manager selects the invoice → issues a credit note (never edits the invoice) → audit-log entry → included in the VAT export.
5. **Unknown kiosk product:** the order is stored with a "needs review" flag → staff map the item → the order proceeds. It is never dropped.
6. **Sold out:** a manager taps sold-out in `/admin` → till, boards and display update in < 500 ms → availability pushed to the kiosk client.
7. **HACCP reading out of range:** staff enter a temperature → out of range → corrective note required → owner alerted.
8. **Supplier order > €250:** created → held → owner approves with PIN → sent via WhatsApp → copy kept.
9. **Clock in:** staff enter a PIN at `/staff` → shift recorded → visible to owners.

## 📊 Success Metrics

Contract-backed:
- Sold-out and price changes visible on all in-store screens in **< 500 ms** `[SOW]`.
- Till, printers and KDS keep taking and producing orders **with the WAN unplugged** `[BRIEF]` `[SOW]`.
- Uptime target **99.9%** for cloud APIs and signage `[Sch-B §2 / SLA]`. Severity 1 response < 1 h, Severity 2 < 4 h, Severity 3 < 24 h `[Sch-B]`.
- **Zero duplicate orders** from kiosk retries.
- **Strictly sequential, collision-free** ticket and invoice numbers.

Business outcomes `[BRIEF]` (baselines to be measured; target values `[OPEN]`):
- Owners can see same-day revenue and HACCP completion remotely.
- Fewer late-evening stock-outs (bread, meat).
- Supplier orders leave WhatsApp chats.

## 🚫 Out of Scope

- **Shopify**, in any form `[OPS]` (⚠ Variance V1).
- The **kiosk hardware, kiosk UI and bridge portal**: supplied by DM Soft `[OPS]`.
- Card acquiring / Link4Pay contracts (client), and Greek e-invoicing providers.
- Fiscal-device integration, unless the accountant says it is required `[OPEN Q-INV-1]`.
- Importing customer personal data from the old till (GDPR minimisation, `[OPEN Q-DATA-4]`).
- Hardware procurement and network cabling (client, `[Sch-C]`).

## 🎯 Development Phases

### Engineering phases `[OPS]`
Each phase ends with a test suite run, a type check, a production build, and a stop for review.

| Phase | Content | Status |
|---|---|---|
| 0 | Audit (read-only) | ✅ done (`docs/audit-phase0.md`) |
| 0-c | Cleanup: Shopify, legacy code, media, docs | ✅ done and merged into `feat/ui-kiosk` (2026-10-03) |
| 0.5 | Security floor: sessions + roles, login lockout fix, hashed PINs | ✅ built on `feat/phase-0.5-auth` (2026-10-03), awaiting merge |
| 1 | Legacy import (products, modifiers, prices, BOM, external-ID map) | blocked: `import/` empty `[Q-DATA-1]` |
| 2 | Data model: orderSource, externalOrderId, statuses, Payment, Invoice/credit note, VAT config, audit log, decimals, migrations | needs your approval of the TRD schema |
| 3 | DM Soft kiosk webhook (M12) | waiting for the DM Soft payload `[Q-DM-2]` |
| 4 | Till (M4) | — |
| 5 | Kitchen, printing, `/display` (M5) | — |
| 6 | Admin: kiosk order monitor, sold-out push, backups | — |

### Contract payment schedule `[Sch-B]`
Calendar dates are **estimates** (Month n ≈ 24 Aug 2026 + n months).

| Stage | Deliverable | ≈ Due |
|---|---|---|
| M0 | Kickoff, schema init, store server | 24 Aug (paid, MGD-INV-2026-001) |
| 1 | M1 Checklists & HACCP + M2 Supplier ordering | ~24 Sep |
| 2 | M3 Inventory/BOM + iPad POS | ~24 Oct |
| 3 | M9 Reporting + dual-VAT ledger | ~24 Nov |
| 4 | M7 Scheduling + timeclock | ~24 Dec |
| 5 | M8 Build sheets | ~24 Jan |
| 6 | M10 Menu boards (System 2) | ~24 Feb |
| 7 | M5 KDS + print spooler + `/display` (System 4) | ~24 Mar |
| 8 | M6 Pre-order + public app (System 1) | ~24 Apr |
| 9 | Limassol live, Link4Pay pairing, Wolt/Foody | ~24 May |
| 10 | Advanced BI, food cost, waste | ~24 Jun |
| 11 | Warranty audit, sign-off | ~24 Jul |

> ⚠ **Schedule risk:**
> - Stage 1 (M1 + M2) appears overdue, and neither is finished.
> - The engineering plan builds kiosk, till and kitchen (Stages 2 and 7) first, because they generate revenue.
>
> Agree the re-ordering with the client in writing `[OPEN Q-SCHED-1]`.

## 🔐 Privacy & Safety

- **Roles:** the client is controller, the contractor is processor `[MSA §6]`. EU GDPR and Cyprus Law 125(I)/2018 apply.
- **Legacy data:** `import/` is read-only, git-ignored and excluded from Docker builds. Customer and staff PII is not imported; it is reported by column name and count only.
- **Payment data:** no card data is stored. Only the Link4Pay transaction ID, the amount and timestamps.
- **Staff PINs:** hashed. Lockout per user (the current lockout is broken, see audit finding 13).
- **Legal records:** invoices are immutable and corrected only through credit notes. Retention period `[OPEN — accountant]`.
- **Food safety:** HACCP logs are retained as compliance records (EU Reg. EC 852/2004, `DESIGN.md` §5).

## ✅ Definition of Done (per module)

1. Tests written first. The full test suite, `npm run typecheck` and `npm run build` all pass.
2. All inputs validated with Zod; no `any` in new code; routes authenticated and role-checked.
3. No hard-coded secrets or unconfirmed business rules; every unknown is a config value or marked TODO, listed in `docs/open-questions.md`.
4. Works on the target device viewport (Screen Inventory) in light and dark themes.
5. Deployed to staging; the client has a **5-business-day UAT window**, and defects are fixed within 7 business days `[MSA §4]`.
6. Written client sign-off, or the Stage invoice paid `[SOW §3]`.

## 🎨 Design System

The source of truth is `src/ui/tokens.css`, documented in `DESIGN.md`. In brief:
- **Primary** `#E50C7E` (MYGD magenta); white labels on magenta are bold (4.48:1). Accent text `#B8095F` on light, `#F170B0` on dark.
- **Light and dark themes per surface** (`SurfaceRoot`), with no-flash boot.
- **Typography** (self-hosted, so it works offline): Oswald (display, uppercase), Figtree (body), JetBrains Mono (prices, order numbers).
- **Touch targets** ≥ 48 px; primary actions on the till and kitchen screens 64–80 px; 8 px spacing grid.
- **Component kit** in `src/ui/` (about 45 components); gallery at `/dev/ui`. Icons from `lucide-react`.
- **Brand hex codes** to be confirmed by the brand owner `[OPEN Q-UI-2]`.
