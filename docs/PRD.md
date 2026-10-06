# MY GERMAN DÖNER (MYGD) — Master Product Requirements Document

- **Status:** 📝 **Draft v1.1: pending approval by Md. Saied Sagar.** v1.0 was approved 2026-10-03 and stays the baseline until v1.1 is approved. Changes from v1.0 are listed in the changelog below. Contract variances (⚠) still need the client's written confirmation (Q-CON-1).
- **Date:** v1.1 drafted 2026-10-06 (v1.0: 2026-10-03)
- **Owner:** Md. Saied Sagar (Contractor, sole engineer)
- **Client:** MY GERMAN DÖNER TRADING LTD — Rico & Oliver (owners), Markus (project lead)
- **Organisation:** grouped by module (M1–M13) plus platform requirements

**Sources, in order of authority:**
1. Signed contract, Revision 3.1, effective 24 Aug 2026: `Documents/01. MSA.docx`, `02. SOW.docx`, `03. Payment Schedule.docx`, `04. Technical prerequisites.docx`
2. Sagar's operating brief, 2026-10-01 (DM Soft kiosk, no Shopify, new database, rebuild phases)
3. Client brief `Requirements/MYGD Control System Developer Brief EN.pdf`, Draft 1.9, 4 Aug 2026
4. `docs/audit-phase0.md`, `docs/contract-alignment.md`, `docs/open-questions.md`
5. `docs/gladius-feature-extraction.md` (v1.1): analysis of the old Gladius till, which MYGD replaces. `docs/hardcoded-values-register.md` (v1.1): hard-coded values found in the code.

**Tag legend:**
- `[SOW]` / `[MSA]` / `[Sch-B]` / `[Sch-C]`: signed contract clauses.
- `[BRIEF]`: client brief.
- `[OPS]`: Sagar's 2026-10-01 operating brief.
- `[OPEN Q-…]`: unknown; see `docs/open-questions.md`. Nothing tagged OPEN may be guessed in code.
- **⚠ Variance:** the requirement departs from the signed SOW and needs the client's written confirmation (see `docs/contract-alignment.md` §3).
- `[GLADIUS]`: evidence from the old Gladius till (`docs/gladius-feature-extraction.md`). Figures are from the 24 Sep 2026 backup.
- **⚙ `key`**: the value is a **setting**, not a literal in code. Its default, scope and editor are in the Configuration catalogue (§⚙️ near the end). See P.8.

## 🔁 Changelog v1.0 → v1.1 (2026-10-06)

**Why:** Gladius is being replaced. Its analysis found two things MYGD must do before Gladius can be switched off: take **delivery-platform orders** (5,491 orders, about €110k, growing from 145 to about 700 a month `[GLADIUS]`) and run the **daily close** (272 Z reports, paid-outs of about €36k `[GLADIUS]`). Gladius's maintenance agreement ends **2026-12-01** `[GLADIUS]` `[OPEN Q-SWITCH-1]`.

| Change | Where |
|---|---|
| M12 widened from "DM Soft kiosk" to **Order Channel Intake** (kiosk, Foody, Bolt, Wolt). Original requirements M12.1–M12.9 keep their numbers; M12.10–M12.25 are new | M12 |
| New module **M13 Day Close**: business day, drawer events, paid-outs, X and Z reports, blind cash count, owner and accountant digest | M13 |
| New platform rules **P.8** (no hard-coded business values), **P.9** (time zone, currency, business date), **P.10** (secrets); Configuration catalogue; hard-coded values register | P.8–P.10, §⚙️, `docs/hardcoded-values-register.md` |
| Cross-references only (no change of meaning): drawer events, Link4Pay record, Z as the daily source | M4.4, M4.5, M4.8, M9.3 |
| Delivery intake and day close pulled **before** Gladius switch-off; two new proposed variances **V10** and **V11** | Development Phases |
| New screens, flows, metrics, out-of-scope and privacy items | later sections |

**Identified in the Gladius analysis but not specified yet** (each is a later v1.x increment with its own approval): capability roles with override PIN and mandatory reason codes; per-person sign-in at the till; promotions engine; printer profiles, failover and bag labels; order-type-aware price and VAT; stock movement ledger; gift vouchers; staff meals. M13 uses a minimal set of capabilities (M13.17) so it can ship before the full role model.

**Not changed:** M1–M11 requirement text, except the cross-references above.

---

## 📊 Project Overview

MYGD replaces a Windows-2000-era till, WhatsApp ordering, ConnectTeam scheduling, Canva+USB menu boards and paper logs with **one connected operations system** for a döner restaurant group in Cyprus `[BRIEF]`. Five systems ship under a fixed-price, 12-month contract (€12,000) `[MSA §3]`:

| System | Scope `[SOW §2]` | Modules |
|---|---|---|
| 1. Public brand & ordering platform | Public website (mygermandoener.com), Emba + Limassol profiles, queue-based pickup ETA | M6 |
| 2. Overhead signage & customer queue | 4 × 4K menu boards, sold-out sync, dayparting, `/display` wait board with chime | M10, M5 (display) |
| 3. Front-of-house till | iPad web POS `/pos`, Link4Pay, cash drawer kick, dual-rate VAT, unified ticket numbers; order channels (kiosk, delivery platforms); daily close | M4, M12, M13 |
| 4. Kitchen production & routing | 2 Ethernet thermal printers (TCP 9100), web KDS `/kds/indoor`, `/kds/grill` | M5 |
| 5. Back-of-house dashboard | `/admin`: price push, sold-out matrix, BOM, HACCP, supplier approvals, VAT reporting | M1, M2, M3, M7, M8, M9, M11 |

**Locations** `[MSA]`:
- Emba / Paphos flagship: Pavlides Court, Agíou Stefánou Street 134, 8260 Emba (live).
- Limassol Marina: Commercial Promenade, Limassol (being set up; contract Month 9).

**Roles** `[OPS]`:
- **Sagar** builds all software, the database, the store server set-up and the integrations.
- **DM Soft** supplies the touch-screen self-order kiosk and a bridge connection portal that sends kiosk orders to MYGD.
- **Link4Pay** card payment on the kiosk is embedded by DM Soft. At the till, Link4Pay has been the only card method since 2026-08-25 `[GLADIUS]`.
- **Delivery platforms** (Foody today; Bolt and Wolt supported by the old vendor's adapters `[GLADIUS]`) send delivery and takeaway orders. Access terms: `[OPEN Q-FOODY-1]`.

## 🎯 Product Vision

"One system instead of twelve separate tools" `[BRIEF]`. The design rules:
- **Single source of truth.** Prices, products and recipes live in exactly one place (M11). The till, kiosk, menu boards, website, inventory and training all read from it; a price typed once is correct everywhere `[BRIEF]`.
- **The store keeps trading without internet.** The till, printers and kitchen display keep working through an internet outage and sync to HQ afterwards `[BRIEF]` `[SOW: 100% offline store autonomy]`. Exception `[OPS]`: the DM Soft kiosk, the delivery platforms and the card terminals need connectivity; a 5G/4G backup router covers this `[Sch-C §7]`.
- **Owners see the business from anywhere:** revenue, busyness, temperatures and stock `[BRIEF]`, plus a digest after every daily close (M13.15).
- **Multi-location from day one** in the data model, even though only Emba is live `[BRIEF]`.
- **No hard-coded business values** (v1.1). Rates, thresholds, times, recipients, addresses and IDs are data or settings with an audit trail (P.8).

## 👤 Target Users

| Persona | Device | Needs |
|---|---|---|
| Owners (Rico, Oliver) | Phone / laptop → `/admin` | Remote visibility, approvals (> €250 supplier orders `[SOW]`), price and sold-out control |
| Project lead (Markus) | Laptop → `/admin` | Templates, schedules, master data, channel mapping |
| Accountant (external) | Email / download | Daily Z (PDF) and VAT CSV without logging in (M13.15, M13.16) |
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

### M12 — Order Channel Intake (DM Soft kiosk, Foody, Bolt, Wolt) ⚠ Variances V1, V10
**Purpose:** one inbound pipeline for every order that does not start at the till: the DM Soft self-order kiosk `[OPS]` (the signed SOW names "Register 2: dedicated Shopify POS terminal" instead, V1) and the **delivery platforms**. Delivery was about a third of sales in the last year (5,491 platform orders, about €110k, growing from 145 a month in Dec 2025 to about 700 a month) and must work before Gladius is switched off `[GLADIUS]`. The signed schedule has it at Stage 9 (V10).

A **channel** is a source of orders with its own adapter, credentials, rules and report line. `Channel.type` is `KIOSK`, `DELIVERY_PLATFORM` or `WEB`. Every `⚙` value below is a per-channel setting (see the Configuration catalogue).

**Original requirements (v1.0), generalised from "kiosk" to "channel":**

| # | Requirement |
|---|---|
| M12.1 | One inbound endpoint per channel. Verify the sender (signature, shared secret or allow-list, chosen per channel ⚙ `channels.<code>.verification`), **store the raw payload first**, acknowledge fast, then process asynchronously. |
| M12.2 | De-duplicate on `(channel, externalOrderId)`. Retries and repeated status messages never create a second order, a second kitchen ticket or a second print. |
| M12.3 | Payment state by channel. Kiosk orders not yet paid (before Link4Pay is embedded) arrive as **PENDING_PAYMENT** and appear on the till for cash payment `[OPS]`. **Platform orders are paid to the platform**: they arrive PAID with payment method `PLATFORM` and the channel recorded, never as cash `[OPEN Q-FOODY-1]`. Paid orders go straight to the kitchen. |
| M12.4 | An unknown product or modifier **must not lose the order**: the order is stored with status **NEEDS_REVIEW**, the kitchen ticket is still printed using the platform's item text marked "UNMAPPED", and staff are alerted `[OPS]`. |
| M12.5 | Cancelled and refunded channel orders are mirrored into order status; a refund is recorded as a credit note (M4). A platform cancel after preparation started alerts the kitchen and offers "record as waste". |
| M12.6 | **A thin adapter per channel**: the payload maps to one internal order format, so a format change touches one file. Each adapter declares its capabilities (can accept, can reject, can push ready, can push sold-out, sends ETA). DM Soft payload unknown `[OPEN Q-DM-2]`. |
| M12.7 | Push sold-out and availability changes to every channel that supports it, through an outbound client per channel (stub until the API is known) `[OPEN Q-DM-3, Q-FOODY-1]`. |
| M12.8 | Health per channel: last order received, last error, inbox backlog. Alert if no orders arrive during that channel's opening hours ⚙ `channels.<code>.noOrdersAlertMinutes` `[OPEN Q-DM-5]`. |
| M12.9 | Kiosk: prints only a payment confirmation and an order number; **MYGD issues the official receipt/invoice** `[OPS]`. Which number the customer sees `[OPEN Q-DM-4]`. Platform orders: the tax document and its addressee `[OPEN Q-INV-4]`; the sale is always in the Z with its VAT. |

**New requirements (v1.1):**

| # | Requirement |
|---|---|
| M12.10 | **Channel registry** (`/admin/channels`, owner and manager): code, name, type, enabled per location, opening hours, and the settings below. Credentials are **references to secrets** (P.10), never stored in the database in plain text. |
| M12.11 | **Item mapping.** Platform and kiosk item ids map to MYGD products and modifiers through the external-id map (M11.3). Matching never uses names alone. A mapping screen (`/admin/channels/mapping`) lists every unmapped external item seen, with the count of orders and last-seen time, and offers name matches **as suggestions only**. Saving a mapping re-processes all NEEDS_REVIEW orders that were waiting on it. Orders land on **real products**, never on a catch-all department (the old till posted every platform order to one dummy department, hiding about 44% of revenue from item reports) `[GLADIUS]`. |
| M12.12 | **Prices as paid.** For platform orders the price the customer paid is recorded as the sold price. The MYGD catalogue price is not applied. VAT is computed from the product's VAT category and the order type (delivery or takeaway) on that gross amount (M11.4, M4.6). The difference to the catalogue price is stored for reporting. |
| M12.13 | **Accept rule** per channel. ⚙ `channels.<code>.autoAccept`: when on, the order goes to the kitchen and printers immediately. When off, it appears in an **Incoming** queue on the till and the KDS with an alert tone; staff accept or reject (reject needs a reason code) within ⚙ `channels.<code>.acceptTimeoutSec`. On timeout the owner is alerted and the order stays visible. Initial values `[OPEN Q-AUTOACCEPT-1]`. |
| M12.14 | **Kitchen routing.** A channel order creates tickets per station exactly like a till order (M5.2), with a channel badge, the platform order number, the promised time and the customer's first name. The kitchen slip omits the address and phone unless the channel is own-delivery (privacy, P.7). |
| M12.15 | **Bag label.** For takeaway and delivery orders print a label with order number, channel, first name and promised time ⚙ `channels.<code>.printLabel`. If no label printer is configured the same data prints as a header on the slip `[OPEN Q-HW-6]`. |
| M12.16 | **Order lifecycle**, synced to the platform where its adapter allows: `RECEIVED → ACCEPTED → IN_PREPARATION → READY → PICKED_UP (or COLLECTED) → COMPLETED`, plus `REJECTED` and `CANCELLED`. Rider-assigned and picked-up events from the platform update the order. No order stays "pending" forever (the old till left all 5,491 platform orders "Pending") `[GLADIUS]`. |
| M12.17 | **Promised time.** Every accepted order has a promised time = acceptance time + ⚙ `channels.<code>.defaultPrepMinutes`, later replaced by the kitchen-load estimate used for pre-orders (M6.2). Sent to the platform when it supports ETA `[OPEN Q-PREP-1, Q-PO-1]`. |
| M12.18 | **Customer screen.** Whether a channel's orders show on `/display` ⚙ `channels.<code>.showOnDisplay` (kiosk: on; delivery platforms: off by default, riders collect by order number). |
| M12.19 | **Reporting.** Every Z, dashboard and CSV splits by channel: orders, gross, average, rejections and cancellations, late orders (ready after promised time), and estimated platform commission ⚙ `channels.<code>.commissionPct` with the net revenue after it `[OPEN Q-COMM-1]`. |
| M12.20 | **Retention.** Raw payloads are kept ⚙ `channels.<code>.rawPayloadRetentionDays` (default 90) then personal fields in them are erased. Customer name, phone and address on a channel order are kept ⚙ `…personalDataRetentionDays` (default 30) after completion, then erased. Order, item and money data are kept `[OPEN Q-PRIV-1]`. |
| M12.21 | **Replay.** Any stored raw payload can be re-processed (after a mapping or code fix). Replay is idempotent (M12.2) and logged. |
| M12.22 | **Test mode.** A channel can run in test mode ⚙ `channels.<code>.testMode`. Test orders are marked TEST, print with a "TEST" banner and are excluded from every report and Z. |
| M12.23 | **Connectivity.** If the store server is unreachable, the cloud endpoint keeps the raw payload and delivers it on reconnect. After ⚙ `channels.<code>.storeOfflineAlertSeconds` offline during opening hours the owner is alerted through a channel that does not depend on the store (platforms may auto-cancel unanswered orders). Where the endpoint lives `[OPEN Q-DB-1, Q-ARCH-1]`. |
| M12.24 | **Sold-out race.** An order containing an item that became unavailable after the platform accepted it is flagged NEEDS_REVIEW "contains sold-out item" and alerts staff. It is not silently dropped. |
| M12.25 | **Print-once guard.** Auto-print runs once per order per station. A reprint is an explicit action, logged with who and why (the old system showed duplicate-order bugs in its kitchen screen) `[GLADIUS]`. |

**Acceptance tests (write first, per Definition of Done):**
1. The same platform payload posted twice yields one order, one kitchen ticket, one print.
2. A payload with an unmapped item yields an order in NEEDS_REVIEW and a printed ticket marked UNMAPPED; saving the mapping moves it to ACCEPTED or the configured next state without a second print.
3. A platform price differing from the catalogue price is recorded as paid, VAT is correct for the order type, and the difference is stored.
4. With `autoAccept` off, an order waits in Incoming; after `acceptTimeoutSec` the owner is alerted; accept sends the status to a fake platform client.
5. A bad signature or unknown channel returns the configured error and stores nothing outside an audit entry.
6. A cancel message after READY marks the order CANCELLED, alerts the kitchen and records the waste option.
7. Test-mode orders appear in no Z or report.
8. The Z (M13) shows each channel's count and gross and they add up to the day total.

**Status:** not built. The old in-house kiosk UI was removed (DM Soft supplies the kiosk). Platform access `[OPEN Q-FOODY-1]` and the DM Soft payload `[OPEN Q-DM-2]` are the blockers.

### M13 — Day Close (business day, drawer, paid-outs, X/Z, cash-up) ⚠ Variance V11
**Purpose:** run the shop's money day correctly: open the day with a float, record every drawer event and paid-out, count the cash blind, close with an immutable Z report, and tell the owners and the accountant. The old till did this daily (272 Z reports in 319 trading days, auto-close at 22:30, five PDFs emailed after each close) but only 11 of the 272 closes have a closing (Z-type) cash count, 323 paid-outs took about €36k in cash, and 87% of drawer opens carry only the label "No Reason Tables", so a sale kick cannot be told from a manual no-sale `[GLADIUS]`. Extends M4.8 and M9.3. The SOW names "daily dual-VAT reporting" but not cash-up (V11).

| # | Requirement |
|---|---|
| M13.1 | **Business day** per location with states `OPEN`, `CLOSING`, `CLOSED`. At most one OPEN day per location. A business day is not a calendar date; it can run past midnight ⚙ `locale.timeZone` `[OPEN Q-DAY-1]`. No sale can be taken without an OPEN day; the till offers "Open day". |
| M13.2 | **Opening float** recorded per drawer when the day opens (amount, who, when). There is no default amount `[OPEN Q-CASH-1]`. |
| M13.3 | **Drawer events.** Every drawer open is logged with a cause: `SALE`, `NO_SALE`, `PAID_OUT`, `COUNT`, `REFUND`, `X_REPORT`, `Z_REPORT`. A `NO_SALE` open needs the capability and a reason code; an open without a cause is not possible. |
| M13.4 | **Paid-outs.** Cash taken from the drawer to pay someone: payee (a supplier record or free text), category ⚙ `cash.paidOut.categories`, amount (> 0), reference, optional receipt photo, who. Above ⚙ `cash.paidOut.approvalLimit` an override PIN is required `[OPEN Q-PAYOUT-1]`. A **payment voucher** with a signature line prints on the receipt printer. Paid-outs are immutable; a mistake is corrected by a reversing entry. |
| M13.5 | **Cash movements** other than paid-outs: `SAFE_DROP` (cash moved to the safe) and `TOP_UP` (float added). Both change expected cash (M13.7) and need a capability. |
| M13.6 | **X report.** A read-only live view of the open day with the same sections as the Z (M13.9). Viewing is logged. It never closes anything. |
| M13.7 | **Expected cash** = opening float + cash sales − cash refunds − paid-outs − safe drops + top-ups. Worked example with the real figures of Z 273 on 2026-09-24 (cash sales 250.78, paid-out 28.29) and an assumed float of 150.00: 150.00 + 250.78 − 28.29 = **372.49**. |
| M13.8 | **Blind cash count.** The cashier enters the count per denomination ⚙ `cash.denominations` (EUR: 0.01, 0.02, 0.05, 0.10, 0.20, 0.50, 1, 2, 5, 10, 20, 50, 100, 200, 500). The expected amount is **hidden until the count is submitted**. Then the screen shows counted, expected and variance. A non-zero variance needs a reason; a variance above ⚙ `cash.varianceAlertAbs` alerts the owners `[OPEN Q-CASH-1]`. A count is immutable; a recount is a new count linked to the first. |
| M13.9 | **Z report = immutable snapshot** created on close, with a sequential Z number per location (never resets, never skips, collision-free under concurrent requests). Sections: header (company, VAT number, store, Z number, business date, opened and closed by and at); **VAT by rate** (net, VAT, gross); **payments by method**; **by order type and by channel** (count, gross, average, first and last order number); **hourly bands** ⚙ `report.hourBands`; **sales by category**; **voids, discounts, refunds and credit notes**; **paid-outs, drops, top-ups**; **cash reconciliation** (float, cash sales, refunds, paid-outs, expected, counted, variance); **exceptions** (items in M13.10). Totals must add up across sections; a mismatch blocks the close. Section list from the old Z `[GLADIUS]`. |
| M13.10 | **Close checks.** Close is blocked while any of these exist, each listed with a link: an unpaid ticket (including PENDING_PAYMENT kiosk orders), an order still in NEEDS_REVIEW, a drawer not counted, a failed invoice print, a gap in the invoice number sequence. A manager can **force** the close with the capability `day.close.force` and a reason; forced closes show "closed with exceptions" and the list on the Z and in the digest. |
| M13.11 | **Document numbers.** The Z records the first and last invoice number and credit-note number of the day and the document count. A number gap is flagged. Invoice and credit-note sequences run across days (M4.6). |
| M13.12 | **A closed day is never reopened.** A mistake found later is fixed by a dated adjusting document (credit note or adjustment entry) in the current open day and shown in the next Z under "prior-day adjustments" `[OPEN Q-INV-1, Q-FISCAL-1]`. |
| M13.13 | **Auto-close** (optional) per location ⚙ `day.autoClose.enabled`, ⚙ `day.autoClose.time`. It runs the close only when every check in M13.10 passes and the drawer is counted. Otherwise it alerts the managers and waits. It never forces a close. The old till auto-closed at 22:30 `[GLADIUS]` `[OPEN Q-CLOSE-1]`. |
| M13.14 | **Printing.** The Z prints on the receipt printer and a PDF is stored. A print failure does not undo the close; it raises an alert and the Z can be reprinted. A **reprint** is marked "COPY" and logged with who and when (capability `report.reprint`). |
| M13.15 | **Digest after close.** Owners get a push or email with headline numbers (gross sales, tickets, average ticket, by channel, cash variance, voids and discounts count, paid-outs total, "closed with exceptions") and a link ⚙ `digest.owner.recipients`, ⚙ `digest.owner.channels`. The accountant gets the Z as PDF and the day's invoice and VAT lines as CSV ⚙ `digest.accountant.recipients`. Delivery is retried; a failure shows in the admin. The digest holds **no customer personal data** `[OPEN Q-DIGEST-1]`. |
| M13.16 | **Range exports.** Any date range of Z reports, and a VAT summary CSV (date, Z number, VAT rate, net, VAT, gross, payment method, channel), for the accountant. Supports M4.8 and M9.3. |
| M13.17 | **Capabilities used by M13** (minimal set; the full role model follows in a later increment): `day.open`, `day.close`, `day.close.force`, `cash.count`, `cash.paidOut.create`, `cash.drop`, `drawer.noSale`, `report.view`, `report.reprint`. Defaults: cashier = `day.open`, `cash.count`, `cash.paidOut.create` (up to the limit), `report.view`; manager = all except `day.close.force`, which the owner grants per person; owner = all. Defaults are data, editable in `/admin/settings`. |
| M13.18 | **Offline.** Every M13 function works with the internet down on the store server, which is the single writer of Z numbers for its location. The digest and sync queue on reconnect (P.3, TRD outbox). |
| M13.19 | **Multi-location.** Business days, drawers, Z numbers and settings are per location. The owner view consolidates across locations; Z numbers are independent per location. |
| M13.20 | **Audit.** Open, close, force, count, paid-out, drop, top-up, reprint, no-sale and X view each write an audit entry with who, when and before/after. |
| M13.21 | **Card reconciliation (optional).** The closer can enter the Link4Pay terminal's settlement total for the day; the Z shows the difference to the card total. |
| M13.22 | **Not included:** tips (3 tickets in 11 months `[GLADIUS]`), cheques, multi-currency cash, service charge. |

**Acceptance tests (write first):**
1. Two simultaneous closes of the same day produce exactly one Z; the second fails cleanly.
2. Z numbers are 1, 2, 3 … with no gap or duplicate across 100 concurrent closes in a test with several locations.
3. Expected cash matches the formula in M13.7 for the worked example, including a refund and a safe drop.
4. A count with variance ≠ 0 cannot be saved without a reason; the expected amount is not in the API response before submission.
5. Close is blocked by an unpaid ticket and by an uncounted drawer; forced close shows the exceptions on the Z.
6. Editing or deleting a Z, a count or a paid-out through any route fails; the database refuses it too.
7. Z totals by VAT rate, payment method and channel each add up to the same day total.
8. Reprint prints "COPY" and writes an audit entry.
9. A day opened before midnight and closed after it is one business day with one Z.
10. Auto-close does nothing when a check fails and alerts instead.

**Status:** not built. Needs M4 payments and invoice numbers, the VAT rate table (M11.4) and decimal money (P.4). Blockers: `[OPEN Q-CLOSE-1, Q-CASH-1, Q-DAY-1, Q-FISCAL-1, Q-PAYOUT-1, Q-DIGEST-1]`.

### M4 — Till / POS `/pos`
| # | Requirement |
|---|---|
| M4.1 | iPad 10.9" landscape web POS with a 3-step customiser `[SOW]`. |
| M4.2 | New cash orders, plus a queue of **PENDING_PAYMENT** kiosk orders: take cash and mark paid `[OPS]`. |
| M4.3 | Prices are **always computed on the server** from M11; the client never sends trusted prices. |
| M4.4 | Link4Pay card terminal: amount passed automatically, never retyped `[BRIEF]` `[SOW]`. Integration details `[Sch-C §3]` (Merchant ID, Terminal ID) still to be supplied. Per payment store the Link4Pay transaction id, approval code, terminal id and masked card brand (no card numbers). Timeouts are settings: ⚙ `payments.link4pay.connectTimeoutSec` and ⚙ `payments.link4pay.customerTimeoutSec` `[GLADIUS]`. |
| M4.5 | Cash drawer opens through the receipt printer on cash payment (24 V RJ12 kick) `[SOW]`. Every open is logged with a cause (M13.3). The kick command bytes are **printer-profile data, not code** (known: Epson `1B 70 00 19 FA`, Star `1B 07 0E 14` `[GLADIUS]`). |
| M4.6 | Official receipt/invoice: sequential number per store that can never be edited or deleted; corrections only via **credit notes** `[OPS]`. Net, VAT rate, VAT amount and gross stored **per line and per sale**, with a dual-rate breakdown `[MSA §3.4]`. Mandatory fields `[OPEN Q-INV-1..3]`. |
| M4.7 | Refunds only through credit notes; refunds and voids are written to the audit log `[OPS]`. |
| M4.8 | Daily and monthly CSV export of invoices with VAT for the tax advisor `[OPS]` `[SOW: daily dual-VAT reporting]`. The daily file is produced by the day close (M13.15, M13.16). |
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
| M9.3 | **Dual-rate VAT (9%/19%) accounting export** `[Sch-B Stage 3]` `[MSA §3.4]`. The Z report (M13.9) is the daily source; rates come from the VAT rate table, never from code (P.8). |
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
| P.8 | **Configuration over code (v1.1).** No literal VAT rate, currency, time zone, location name or id, address, phone, email, URL, threshold, timeout, time of day or recipient in application code. Business values are rows in tables (with history, e.g. VAT rates) or **settings** (typed key, one default, a scope of global, location or channel, an editor role, an audit entry on every change). Settings are read through one validated accessor. Secrets never live in settings (P.10). The catalogue is the §⚙️ table; existing violations are in `docs/hardcoded-values-register.md` and are fixed in the phase that touches each file. A CI check fails the build on known literals (`0.19`, `0.09`, `1.19`, `"EUR"`, private IPs, remote image hosts, hex colours outside tokens). |
| P.9 | **Time, currency, locale (v1.1).** Every location has a time zone, currency and locale. Timestamps are stored in UTC; a **business date** is derived from the business day (M13.1), not from the clock date. Money is exact decimal (P.4) with the currency from the location. Number and date formats come from the locale. |
| P.10 | **Secrets (v1.1).** API keys, webhook secrets, platform credentials, database URLs and session secrets come from the environment or a secret manager, are validated at startup (the app refuses to start without a required one), are never logged, never stored in plain text in the database or the repository, and can be rotated without a deploy where the provider allows it. |

## 📱 Screen Inventory

| Route | Device / viewport | Module | Status |
|---|---|---|---|
| `/` | Public web (responsive) | M6 | Redesigned home (kit) |
| `/order` | Public web | M6 | Static, not wired |
| `/pos` | iPad landscape 1024×768 | M4 | Wired, see M4 status |
| `/kds`, `/kds/indoor`, `/kds/grill` | Kitchen monitor 1920×1080, iPads | M5 | Wired (single-ticket model) |
| `/display` | 43" TV 1920×1080 | M5 | Wired via KDS tickets |
| `/boards?screen=1..4` | 4K TVs | M10 | Hard-coded content |
| `/staff` | Wall tablet 1280×800 | M1, M7, M8 | Broken (wrong API paths) |
| `/admin` | Laptop / phone | M3, M9, M11, M8 | Wired, **no login** |
| `/admin/menu-boards` | Laptop | M10 | Wired |
| `/admin/suppliers` | Laptop | M2 | Static |
| `/dev/ui` | Dev only (404 in production) | — | UI kit gallery |

New screens needed:
- login (P.1)
- till pending-payment queue (M4.2)
- invoice and credit-note views (M4.6)
- kiosk order monitor and review queue (M12)
- print-failure banner (M5.5)
- channel registry `/admin/channels` and item-mapping screen `/admin/channels/mapping` (M12.10, M12.11)
- **Incoming** queue with alert tone on the till and the KDS (M12.13), and a NEEDS_REVIEW list (M12.4)
- day open, drawer count, paid-out form and cash-movement form on `/pos` (M13.2–M13.8)
- X/Z viewer and Z archive `/admin/day` and `/admin/day/[id]` (M13.6, M13.9, M13.16)
- settings `/admin/settings` for the Configuration catalogue (P.8)

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
10. **Platform order (auto-accept on):** the platform posts the order → MYGD stores the raw payload and acks → maps items → creates the order PAID/PLATFORM at the price paid → tickets per station, slip and bag label print once → the crew bump per station → READY is pushed to the platform → the rider collects → COMPLETED. Totals appear under the channel in the Z.
11. **Platform order with an unmapped item:** the order is stored NEEDS_REVIEW and the ticket prints with "UNMAPPED" so the food is still made → a manager maps the item on `/admin/channels/mapping` → waiting orders are re-processed without a second print.
12. **Platform order, manual accept:** it appears in Incoming with a tone → staff accept or reject with a reason within the timeout → the platform is told → flow 10 continues. On timeout the owner is alerted.
13. **Open the day:** the cashier opens the day and enters the float per drawer → trading starts. A paid-out is recorded with payee, amount and a receipt photo; the voucher prints.
14. **Close the day:** the cashier counts the drawer **blind** by denomination → the screen shows counted, expected and variance (reason required if not zero) → close checks pass or a manager forces with a reason → the Z is created and printed → the owner digest and the accountant's PDF and CSV go out.

## 📊 Success Metrics

Contract-backed:
- Sold-out and price changes visible on all in-store screens in **< 500 ms** `[SOW]`.
- Till, printers and KDS keep taking and producing orders **with the WAN unplugged** `[BRIEF]` `[SOW]`.
- Uptime target **99.9%** for cloud APIs and signage `[Sch-B §2 / SLA]`. Severity 1 response < 1 h, Severity 2 < 4 h, Severity 3 < 24 h `[Sch-B]`.
- **Zero duplicate orders** from kiosk or platform retries.
- **Zero lost platform orders:** every payload received is either an order or a NEEDS_REVIEW entry, never dropped; the inbox count of unresolved items is 0 at each close.
- **Every Z is immutable and gap-free:** Z numbers consecutive per location; Z totals by VAT rate, payment method and channel add up to the same day total.
- **Cash-up done at every close** (baseline: 11 of 272 closes with a Z-type count `[GLADIUS]`); every non-zero variance has a reason.
- **No hard-coded business values** in new code (the CI check in P.8 passes); register items closed per phase.
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
- Gladius features deliberately not carried over: floor plans, table merge/split/move, course firing, party size and seat numbers, tips, comp invoices, salesperson, CRM loyalty and account balances, reservations, caller ID, multi-currency, cheque payments, retail features (barcode, scale, lots), waiter handheld app, licence/dongle locks. Reasons and evidence: `docs/gladius-feature-extraction.md` §3 and §10.
- Own-driver delivery dispatch (driver app, driver cash-out): only if MYGD runs its own drivers `[OPEN Q-DRIVER-1]`.
- Hardware procurement and network cabling (client, `[Sch-C]`).

## 🎯 Development Phases

### Engineering phases `[OPS]`
Each phase ends with a test suite run, a type check, a production build, and a stop for review.

| Phase | Content | Status |
|---|---|---|
| 0 | Audit (read-only) | ✅ done (`docs/audit-phase0.md`) |
| 0-c | Cleanup: Shopify, legacy code, media, docs | ✅ done and merged into `feat/ui-kiosk` (2026-10-03) |
| 0.5 | Security floor: sessions + roles, login lockout fix, hashed PINs | ✅ done and merged into `feat/ui-kiosk` (2026-10-03) |
| 1 | Legacy import (products, modifiers, prices, BOM, external-ID map) | 🟡 importer built and live-tested (`npm run import:gladius`); 145 of 181 products blocked on the 5% VAT question (Q-VAT-4) and missing prices (Q-OLD-2) |
| 2 | Data model: orderSource, externalOrderId, statuses, Payment (several per order), Invoice/credit note, VAT rate table, audit log, decimals, migrations. **v1.1 adds:** Channel, ChannelInbox, Setting, Location time zone/currency/locale, BusinessDay, Drawer, DrawerEvent, PaidOut, CashMovement, CashCount, ZReport, ReasonCode (TRD update after PRD v1.1 approval) | needs your approval of the TRD schema |
| 3 | **Order channel intake (M12):** channel registry, inbox, item mapping, Foody and Bolt adapters first (revenue), DM Soft adapter when its payload arrives | blocked on `[Q-FOODY-1]` (platform access) and `[Q-DM-2]` |
| 4 | Till (M4) incl. Link4Pay payment record | — |
| 4b | **Day close (M13):** business day, drawer events, paid-outs, X/Z, blind cash count, digest and exports | needs phase 2 and 4; target **before 2026-12-01** `[OPEN Q-SWITCH-1]` |
| 5 | Kitchen, printing, `/display` (M5) | — |
| 6 | Admin: channel monitor, sold-out push, backups | — |
| all | **Hard-code remediation (P.8):** each item in `docs/hardcoded-values-register.md` is closed in the phase that touches the file. The CI literal check is added in phase 2 | tracked in the register |

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
> - **v1.1, proposed Variance V10:** delivery-platform intake (M12) moves from Stage 9 to just after the till, because platform orders were about a third of sales and the old till's maintenance agreement ends 2026-12-01 `[GLADIUS]`.
> - **v1.1, proposed Variance V11:** the day close with cash-up (M13) is not named in the SOW (only "daily dual-VAT reporting"). Confirm with the client whether it sits inside Stage 3 or is a change request, since the contract is fixed-price.
>
> Agree the re-ordering and both variances with the client in writing `[OPEN Q-SCHED-1, Q-CON-3]`. After approval, add V10 and V11 to `docs/contract-alignment.md` §3.

## 🔐 Privacy & Safety

- **Roles:** the client is controller, the contractor is processor `[MSA §6]`. EU GDPR and Cyprus Law 125(I)/2018 apply.
- **Legacy data:** `import/` is read-only, git-ignored and excluded from Docker builds. Customer and staff PII is not imported; it is reported by column name and count only.
- **Channel orders (v1.1):** delivery-platform orders carry the customer's name, phone and address. They are used to make and hand over the order, kept only as long as M12.20 says, kept off kitchen slips and out of the digest, shown only to roles that need them, and erased by the retention job. Raw payloads are stored for replay (M12.21) and have their personal fields erased after ⚙ `channels.<code>.rawPayloadRetentionDays` `[OPEN Q-PRIV-1]`.
- **Cash and receipts (v1.1):** paid-out receipt photos may show third-party details; they are visible to owners and managers only and are covered by the audit log.
- **Payment data:** no card data is stored. Only the Link4Pay transaction ID, the amount and timestamps.
- **Staff PINs:** hashed. Lockout per user (the current lockout is broken, see audit finding 13).
- **Legal records:** invoices are immutable and corrected only through credit notes. Retention period `[OPEN — accountant]`.
- **Food safety:** HACCP logs are retained as compliance records (EU Reg. EC 852/2004, `DESIGN.md` §5).

## ⚙️ Configuration catalogue (v1.1)

Every value below is **a setting or a table row, never a literal in code** (P.8). Scope: **G** global, **L** per location, **C** per channel. "Initial" is the value to seed; where the source is an open question the value is not guessed and the setting is required before the feature is enabled. Editors: **O** owner, **M** manager. Every change is audited.

| Key | Meaning | Scope | Initial / default | Editor | Source |
|---|---|---|---|---|---|
| `VatRate` (table) | rates with `validFrom`, category mapping, order-type mapping | G | 0% / 9% / 19% per MSA §3.4; 5% **not seeded** | O | `[MSA §3.4]` `[OPEN Q-VAT-1, Q-VAT-4]` |
| `locale.timeZone` | location time zone for business date and schedules | L | `Asia/Nicosia` for Cyprus stores (set on the Location record) | O | P.9 |
| `locale.currency` | ISO currency | L | `EUR` (Location record) | O | P.9 |
| `locale.defaultLanguage`, `locale.languages` | customer languages | L | `en`; `en`, `de`, `gr` | O | `[SOW]` |
| `day.autoClose.enabled` / `.time` | optional automatic close | L | off / not set `[OPEN Q-CLOSE-1]` | O | M13.13 |
| `cash.denominations` | EUR notes and coins for the count | G | 0.01 … 500 (euro standard) | O | M13.8 |
| `cash.varianceAlertAbs` | variance that alerts the owners | L | not set `[OPEN Q-CASH-1]` | O | M13.8 |
| `cash.paidOut.categories` | paid-out categories | L | supplies, produce, repairs, other (editable) | M | M13.4 |
| `cash.paidOut.approvalLimit` | override PIN above this | L | not set `[OPEN Q-PAYOUT-1]` | O | M13.4 |
| `report.hourBands` | hourly sales bands | L | 06–10, 11–14, 15+ (from the old Z) | M | `[GLADIUS]` |
| `digest.owner.recipients` / `.channels` | who gets the digest, and how | L | not set `[OPEN Q-DIGEST-1]` | O | M13.15 |
| `digest.accountant.recipients` | PDF and CSV after close | L | not set `[OPEN Q-DIGEST-1]` | O | M13.15 |
| `channels.<code>.enabled` | channel on or off per location | C | off until configured | M | M12.10 |
| `channels.<code>.verification` | signature, secret or allow-list | C | per adapter `[OPEN Q-DM-2, Q-FOODY-1]` | O | M12.1 |
| `channels.<code>.autoAccept` | accept without staff | C | not set `[OPEN Q-AUTOACCEPT-1]` | M | M12.13 |
| `channels.<code>.acceptTimeoutSec` | wait before the owner is alerted | C | 180 | M | M12.13 |
| `channels.<code>.defaultPrepMinutes` | promised-time base | C | not set `[OPEN Q-PREP-1]` | M | M12.17 |
| `channels.<code>.showOnDisplay` | show on `/display` | C | kiosk on, platforms off | M | M12.18 |
| `channels.<code>.printSlip`, `.printLabel` | kitchen slip, bag label | C | slip on, label on if a label printer exists | M | M12.14, M12.15 |
| `channels.<code>.commissionPct` | estimated commission | C | not set `[OPEN Q-COMM-1]` | O | M12.19 |
| `channels.<code>.noOrdersAlertMinutes` | silence alert in opening hours | C | not set `[OPEN Q-DM-5]` | M | M12.8 |
| `channels.<code>.storeOfflineAlertSeconds` | alert when the store server is unreachable | C | 120 | O | M12.23 |
| `channels.<code>.rawPayloadRetentionDays` | erase personal fields in raw payloads | C | 90 | O | M12.20 |
| `channels.<code>.personalDataRetentionDays` | erase name, phone, address | C | 30 `[OPEN Q-PRIV-1]` | O | M12.20 |
| `channels.<code>.testMode` | test orders excluded from reports | C | off | M | M12.22 |
| `payments.link4pay.connectTimeoutSec` | wait for the payment host | L | 10 | O | M4.4 `[GLADIUS]` |
| `payments.link4pay.customerTimeoutSec` | wait for the customer on the terminal | L | 120 | O | M4.4 `[GLADIUS]` |
| `kds.urgency.mediumAfterSec` / `.urgentAfterSec` | ticket colour thresholds | L | 240 / 480 | M | `DESIGN.md` §6 |
| `supplier.approvalThreshold` | owner PIN above this order value | L | 250 | O | `[SOW]` M2.3 |
| `session.ttlSeconds` per device type | login length | G | 43200 until decided `[OPEN Q-SEC-3]` | O | P.1 |
| `Printer` (table) | host, port, profile, station | L | none; unset means a visible error, never a guessed address | O | M5.5 |
| `PrinterProfile` (table) | drawer-kick bytes, fonts, copies | G | Epson and Star kick bytes as data | O | M4.5 |

**Secrets are not settings** (P.10): `SESSION_SECRET`, `DATABASE_URL`, `DIRECT_URL`, per-channel credentials and webhook secrets, Link4Pay keys. They come from the environment or a secret manager and are listed in `.env.example` without values.

---

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
