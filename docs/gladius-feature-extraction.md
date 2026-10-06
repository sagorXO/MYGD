# Gladius → MYGD: complete feature and reference extraction

- **Date:** 2026-10-06
- **Status:** analysis only. No code written. Nothing here changes the approved PRD v1.0 until you approve a v1.1 (§11).
- **Purpose:** MYGD replaces Gladius. This file lists **everything in the old system that MYGD can use**: features (with the modern version of each), exact report layouts, reference data, hardware and integration facts, and the data model.
- **Sources** (all under `MYGD/Old Data/`): the 24 Sep 2026 `BERLIN` export (152 tables, 13 backups), `GladiusSQL.sql`, the vendor change log `Gladius_Updates.docx` (Sep 2024 – Dec 2025), the `Reports` catalogue (58 definitions; about 280 `.rpt` files), the receipt templates, the KDS / PDA / order-status / JCC / label / import `.ini` files, and the sample report PDFs (Z 273, 24 Sep 2026).
- **Safety:** no credentials, PINs, IPs, emails, customer or staff rows are quoted. Configuration values that look like secrets were masked when read.
- **Verdict scale:** **P0** needed before Gladius is switched off · **P1** high value, early · **P2** worthwhile later · **Skip** not worth building (with the reason).
- **Evidence rule:** every verdict is backed by how much the shop actually used the feature (§2). A large menu entry that nobody used is not a requirement.

---

## 1. Corrections to earlier notes

| Earlier claim | Correction | Evidence |
|---|---|---|
| `GLADIUS_ANALYSIS.md`: payment `RC` is "staff" (5% of sales, €16.3k) | **`RC` is LINK4PAY (card).** Real staff payments are tiny: `ST` 12 tickets / €433, `SF` 4 tickets / €15 | Z 273 shows a LINK4PAY column equal to the `RC` row (€424.29); receipts print a "LINK4PAY" banner; Z-report columns are Cash, Cheque, C.Card, O/A, Voucher, OnLine, Staff, Waste, LINK4PAY, B/Points |
| Card payments were one method | The terminal card method `CC` **ends on 25 Aug 2026**. From late Aug all card goes through Link4Pay (`RC`): 159 tickets in Aug, 553 in Sep | Monthly ticket counts by payment method (closed tickets) |
| Card share 62% | Card total is about **€229.5k of €344.4k (67%)**: `CC` €213.2k + `RC` €16.3k | Payment amount columns on closed tickets |
| `legacy-data-inventory.md` §3: "Kitchen routing evidence: printers `kitchen`, `PREPARATION`, `CHECKS`" | Confirmed, and extended: routing is by **department** (`Dept_Stations`, e.g. `01-02-99`) and **per item** (`Printers` table, 730 rows) | `Departments`, `Printers` |

---

## 2. What the shop actually used

Closed and voided tickets 24 Oct 2025 – 23 Sep 2026: 20,048 (18,422 closed, 1,625 voided, 1 open), 203,652 lines.

| Gladius feature | Real usage | Verdict |
|---|---|---|
| Delivery platform intake (Foody; Bolt via Foody) | 5,491 orders, €110k, from 145/month (Dec) to about 700/month | **P0** |
| Link4Pay card payments built into the till | 7,823 card transactions logged; Link4Pay now the only card method | **P0** (M4.4) |
| X / Z reports, auto-Z, emailed PDFs | 272 Z reports in 319 trading days; 5 PDFs emailed after each close to owners and accountant | **P0** |
| Cash paid-outs | 323 payouts, **€36,072**, 58 payees | **P0** |
| Void / discount / drawer controls | 13,931 voided lines, **89% (12,348) with undefined reason code 999**; 3,295 drawer opens, 87% labelled "No Reason Tables" | **P0**, stricter |
| Per-person login | **83% of tickets (16,561 of 20,048) under shared login `01`** | **P1** |
| Promotions | 17 rules created Jan–Aug 2026 (weekday and happy-hour % off, fixed price, buy-X-get-Y) | **P1** |
| Gift vouchers | 79 issued (74 gift), redeemed on 26 tickets (€860) | **P2** |
| Cash count at close | 185 counts: 174 X-type, only **11 Z-type** in 272 closes | **P0** (fix in design) |
| Staff meals | 12 `ST` tickets, €433 | **P2** (small) |
| Line notes (kitchen free text) | 1,519 of 203,652 lines (0.7%) | **P2** |
| Price-change audit | 1,020 rows (item, old/new price and tax, who, note) | already in PRD (M11.7) |
| Time clock | 277 records | already in PRD (M7) |
| Tips | 3 tickets, €73.70 | **Skip** |
| Party size, comp invoices, salesperson, order-by-seat | 0 tickets | **Skip** |
| Floor plans, merge/split tables, course firing, reservations | Tables are free text (`MGD`, `M`, `01QS`…); reservations table empty | **Skip** |
| CRM loyalty, account balances, caller ID | no balances, no points, 1 caller-ID row | **Skip for now** |
| Stock, vendors, recipes, cost | `Vendors` 0 rows, `Assembly` 0, `Total_Cost` 0 on every invoice | **Copy the model, not the usage** |

---

## 3. Feature catalogue

Each row: what Gladius did → status in MYGD today → verdict → the modern version.

### A. Selling at the till

| # | Gladius capability (evidence) | MYGD today | Verdict | Modern version |
|---|---|---|---|---|
| A1 | Touch-screen order entry by department pages with button colours, fonts, per-page layouts (`Departments.Dept_Colour`, `PosPages`) | `/pos` exists | PRD M4 | Keep. Per-location product page layout as data, not code |
| A2 | **Modifiers**: six modifier-group slots per item (`ModGroupCode`…`5`), group rules (`GroupModifiers`, `NumSel` = how many may be picked), signs `+ − YES NO ONLY EXTRA`, default `ONLY`, decimal quantities, negative-priced modifiers, "skip modifiers" button | PRD M11.1 (min/max/required) | Extend | Add a **modifier action** per modifier: ADD, NO, EXTRA, ONLY, plus optional price. Döner shops need "NO onion / EXTRA sauce". Bulk-assign a group to a whole category |
| A3 | **Combos / meal deals** (`Combo_Sets`, `combo_header`, levels, free modifier items; 6 rows) | 3-step customiser (M4.1) | Covered | Model a combo as a product with slots, a price rule and a "don't charge modifier" flag |
| A4 | **Open-price, open-quantity and prompt-modifier items** (`PromptPrice`, `PromptQty`, `PromptModifiers`) | none | P2 | Allow `askPrice` and `askQty` on a product with a role limit and audit |
| A5 | Order type drives price **and VAT**: `Inventory` holds two prices and two tax rates (`Price`, `TaxRate`, `TaxRate1`; audit has `Price1/Tax1/Price2/Tax2`), delivery has price lists `DPrice1`–`4`. The shop also used dummy lines `*** EAT HERE` and a negative `*** TAKEAWAY` line to adjust the bill | M11.4 (dual VAT) | **P0** | Make `OrderType` (dine-in / takeaway / delivery) a first-class input to price and VAT resolution so no dummy or negative lines are needed |
| A6 | Line notes with quick text (`Invoice_LineNotes`); kitchen note clipped to 19 characters per line | `customerNote` only | P2 | Per-line note, plus preset note chips ("no sauce", "cut in half") |
| A7 | Hold / park an order, scheduled orders with a promised time (`Invoice_OnHold`: `DeliveryDateTime`, `OrderTaken`, `ReadyOrder`) | PRD M6.2 pre-order | Covered | Park order and scheduled order share one `scheduledFor` field |
| A8 | Item availability by weekday and time (`Inventory_TimeMenu`, station flag `TimeBasedMenu`); "stop sales" on a page button (`Pg_StopSales`); `Hide` (hidden but sellable) | M10.3, M11.5 | Extend | One availability model: `isAvailable` plus time windows per product, shared by till, boards, web, kiosk |
| A9 | Split check, move items, merge up to 160 tables, change table | none | **Skip** (counter service) | If a tab is ever needed, "split by item / by amount" at payment only |
| A10 | Return invoice / refund with reason, including online-payment returns; "invoice correction: assign a client" | M4.7 credit notes | Covered | Credit note only; never edit a closed invoice |
| A11 | Barcode scanning, scale items, lot numbers, serial numbers | none | **Skip** | Retail features |
| A12 | Order number for the customer: quick order number, **resets at Z**, range 80–205, kiosk orders get "PREPARING" automatically | M4.9 | Covered | Keep the customer-visible number daily, the invoice number never resets |

### B. Payments and cash

| # | Gladius capability (evidence) | MYGD today | Verdict | Modern version |
|---|---|---|---|---|
| B1 | Payment codes: `CA` cash, `CH` cheque, `CC` terminal card, `OA` on account, `GC` voucher/gift card, `OL` online, `ST`/`SF` staff, `WS` waste, `RC` user-defined (= Link4Pay), `PR` bonus points | enum CASH, CARD, NFC_WALLET, QR_CODE | **P0** | Payment methods as a table; per-payment line (`Invoice_Totals_MultiplePM`: method, currency, rate, amount, change due, voucher number, cheque number) so one order can hold several payments |
| B2 | Card-terminal integration ("XPay" station settings): amount sent automatically, void card payment, cashback, DCC (dynamic currency), merchant receipt print, card log file, detail report; stores approval code, terminal and card per transaction (`CC_Trans`: `cc_approval`, `cc_terminal`, `cc_card`) | PRD M4.4 (details pending Sch-C §3) | **P0** | Link4Pay client behind an interface. Store transaction id, approval code, terminal id, masked card brand. **Use these timeouts**: connect to payment host 10 s, wait for customer on the terminal 120 s (from the JCC config) |
| B3 | Pay-at-table QR (DigitalFox): guest scans, sees bill, pays full or partial | none | P2 / **Skip** now | Revisit only if dine-in grows |
| B4 | Cash drawer kick on cash, card or cheque (`Open_Drawer_CC/CH/AL`), manual open with reason, **logged** (`OpenDrawer`) | M4.5 | **P0** | Kick on cash payment; no-sale open needs permission and a cause code; log every open |
| B5 | **Cash paid-outs** (`Payouts`: who, when, payee, amount, reference, posted flag) and printed "Payment voucher" with signature line | none | **P0** | `PaidOut` with payee (supplier or free text), category, amount, reference, **receipt photo**; printed voucher; counted in the day-close cash formula |
| B6 | **Float assignment** per station (`StationFloatAmount`, permission `CFA_Assign_Float`) | none | **P0** | Opening float recorded at day open, per drawer |
| B7 | Cash count by denomination (`MoneyCount`: 15 denominations, cards, cheques, vouchers, other, expected vs actual, X vs Z type) | none | **P0** | Blind count at close; variance needs a reason; only manager can reopen |
| B8 | **Gift vouchers**: value, issue and expiry (one-year validity on the template), issue by whom, types gift / return / refund, issued as change due, cancelled flag, redeemed as payment (`Vouchers`) | none | P2 | `Voucher` with code (QR/barcode), balance, expiry, ledger of issue and redeem, partial redemption |
| B9 | Receivables and prepayments (`Receivables`: customer paid in advance or owes) | none | **Skip** | No account customers in use |
| B10 | Multi-currency (EUR default; GBP, USD, TRY rows with rates 0) | none | **Skip** | Unused; add only if tourists ask |
| B11 | Cheque as a payment | none | **Skip** | 1 ticket in 11 months |
| B12 | Tip handling, tip in cash or card, tips deducted from expected cash | none | **Skip** | 3 tickets. Revisit if card tips are introduced on the terminal |

### C. Staff, permissions, audit

| # | Gladius capability (evidence) | MYGD today | Verdict | Modern version |
|---|---|---|---|---|
| C1 | About 60 per-employee permission flags (`CFA_*`): discounts, price change, delete item, void, refund, reprint Z, open drawer, payouts, merge, change payment method after close, issue vouchers, view closed invoices, execute query, assign float, money count, member discount and **max discount %** | roles staff / manager / owner | **P0** | **Capabilities** per role plus limits (e.g. `discount.apply ≤ 20%`, `payout.create ≤ €50`). Short list, not 60 checkboxes |
| C2 | Four employee levels (Administrator, Manager, Cashier, ClockIn) plus Waiter; **allowed stores per employee** | PRD P.1 | Covered / extend | Add per-location access. "ClockIn-only" role for staff who only use the timeclock |
| C3 | Manager password prompt for sensitive actions (`PromptAdminPass`, `PromptOnVoid`) | none | **P0** | **Override PIN**: cashier stays signed in, the approver is recorded on the event |
| C4 | Mandatory reasons: void (6 defined), discount and complimentary reason lists, waste flag on a reason (`VoidReasons`: `VoidRStock`, `VoidWaste`, `VoidRType` V/D) | `cancellationReason` only | **P0** | `ReasonCode` table with type (void, discount, waste, comp, drawer), flags `restock` and `waste`, active flag. No "skip" |
| C5 | Event log (`LogEvents`, 53,248 rows; toggle in settings) and price-change audit (`Inventory_Audit`) | AuditLog (price, refund, void) | **P0** | Extend to every sensitive action: discounts, no-sale opens, reprints, Z reprint, price override, payout, login failures |
| C6 | Employee login by 4-digit code, swipe card or fingerprint (`Swipe_ID`, `FPReader`, `OpenTableByCard`) | PIN planned | P2 | PIN first; optional NFC badge later |
| C7 | **Shared login problem**: 83% of tickets under `01` | none | **P1** | Fast PIN tap-in per order, same hashed PIN as the timeclock |
| C8 | Time clock with wages earned per shift and hours reports (`Schedule`, `EMP_REP_EmpHours*`) | M7 | Covered | Add labour cost per shift to the BI overlay (Sch-B Stage 3) |
| C9 | Staff meals (`ST` payment, staff tables only openable by selecting the employee, staff consumption report) | none | P2 | Staff-meal payment with allowance and monthly cap; tiny usage today |
| C10 | Employee free items / complimentary count | none | **Skip** | 0 comp invoices |

### D. Day close and reporting

| # | Gladius capability (evidence) | MYGD today | Verdict | Modern version |
|---|---|---|---|---|
| D1 | **Z report** (immutable numbered closing; `ZetInfo`, `Setup_Corp.CurrentZ`), X report (same, mid-day), Z reprint permission, Z-range reports | none | **P0** | `BusinessDay` close creates an immutable snapshot (§4). X is the same view, read-only |
| D2 | **Auto-Z** at a set time with auto-email (`PosAutoZet`, `PosAutoEmail`); "close open invoices before Z" setting | none | **P0** | Auto-close at a configured time; blocked by open tickets or an uncounted drawer unless a manager overrides |
| D3 | Shift closure (`ShiftClosure`: cash, cheque, card, on-account, voucher, points, online, other, tips, payouts; "service zone" closes all stations in it) | none | **P0** | Per-drawer shift close feeding the day close |
| D4 | Z checks: invoice value vs cash mismatch; popup for expired services on Z | none | P1 | Z blocks on mismatch and surfaces expiring integrations |
| D5 | **Email reports** after close (`AutoReports`: 19 report slots, 6 recipients, PDF): Z, detailed Z, hourly sales, hourly by order method, department analysis, complimentary / staff / waste by group, sales by order method, receivable list, resend last Z | none | **P0** | Scheduled owner **digest** (push, email) and a **CSV/PDF for the accountant** (extends M4.8, M9) |
| D6 | **58 report definitions** (`Reports`) | `/admin` BI | P1 | Eight dashboards (§6) |
| D7 | Comparisons: period vs same period last year (sample report compares 01/09/2025–27/05/2026 vs previous year) | none | P1 | Year-on-year and week-on-week on every dashboard |
| D8 | Group / profit-centre / category analysis with margin | M9.4 | P2 | Needs product cost (§7 F-cost) |
| D9 | Daily Sales Summary, average hourly sales, sales per day, sales by type | M9.1 | Covered | Hourly heatmap by channel |
| D10 | Export Z and sales files to accounting (`Z_Exp_Loc`, `ExportReceipts`, `ExportDS`) | M4.8 | Covered | CSV/JSON export, one format agreed with the accountant |
| D11 | Receipt reprint, "Today's invoices" list with keyboard search | none | P1 | Invoice search by number, time, amount; reprint logged |

### E. Kitchen, printing, order status

| # | Gladius capability (evidence) | MYGD today | Verdict | Modern version |
|---|---|---|---|---|
| E1 | **KDS options** (`GladiusKDSS.ini`): refresh 1–65 s, 4 or 8 orders per screen, order-type filter (seat-in / takeaway / delivery), sound on incoming order, quick close, show or hide completed items, keep completed orders 0–6 h, item notes shown, view-only vs process vs "delivered not allowed" modes, print completed items to a printer, merge tables | M5.1–5.4 | Extend | Multi-ticket board (already planned). Add: channel filter, alert chime on new order, completed-order retention window, read-only mode for a monitor-only screen |
| E2 | Priority groups on tickets (Starters, Main, Desserts, In the middle, Other; header shown on slip and KDS; "Fire Main") | none | **Skip** | Not needed for a döner counter. Reuse the idea as **station** grouping |
| E3 | **Kitchen routing** by department and by item (`Dept_Stations` such as `01-02-99`, `Printers` per item, `Inventory.Kitchen` group 1 or 2) | Q-HW-3 open | **P0** | Use as the starting product→station map in the importer |
| E4 | **Printer profile** per printer (`PrinterPort`): font, size, double-height font, buzzer, print voids (so the kitchen sees cancellations), copies, bold, modifier font size, priority headers, prints for seat-in / takeaway / delivery flags, "note on table change" | M5.5 | **P0** | `PrinterProfile` table with the same options minus tables. **Always print a "VOID" line on the kitchen slip** |
| E5 | Printer redirection on a schedule or on failure (`Printer_Redirection`: old → new printer, time window, weekdays) | none | **P1** | **Printer failover**: if the grill printer is down, route to the prep printer and show a banner |
| E6 | Side-printer merge rules: items with a note, different seat or modifiers are never merged on the slip | none | P1 | Copy the rule |
| E7 | **Order-status screen**: refresh 5 s, order disappears 5 min after done, logo, driven from the KDS Order Status button | M5.6 | Covered | Add the chime and the removal timer |
| E8 | **Labels** for takeaway/delivery bags (Zebra, linerless): order number, customer name, channel; selectable per order method; 40×28 and 60×45 label sizes; "auto labels" flags (`ItemTagsAuto`, `ItemTagslinerless`, `ItemTagsInvoice`) | none | **P1** | `LabelPrinter` driver beside ESC/POS. Template in data, not code |
| E9 | Sounds: new order, price, scale, warning, item ok (`Sounds/*.wav`) | chime planned | P2 | Reuse the idea (not the files): one new-order tone, one warning tone |
| E10 | Second customer-facing screen with pictures, videos and a message (`EnableSD`, `SDPict`, `SDVideo`, `SDMessage`); 2-line VFD with Greek | none | P2 | Reuse `/boards` content on a till-side customer screen |
| E11 | Kiosk orders arrive as "PREPARING", print on the prep printers, tab closes automatically, recorded as card sales, order number to label | M12 | Covered | Same behaviour for DM Soft orders |

### F. Online and delivery channels

| # | Gladius capability (evidence) | MYGD today | Verdict | Modern version |
|---|---|---|---|---|
| F1 | **Platform intake** (`Web_APIs`, `Web_Header`, `Web_Lines`, `SoftechOnLineOrders`): Foody (active, order method 2), "Foody New" (3), Wolt ×3, Bolt ×2, WooCommerce and 6 other vendor entries (inactive). Self item-match flag. ETA in minutes stored. Customer name goes into invoice notes. **Auto-accept prints the check.** | M6.5 / Stage 9 | **P0** | Generic **channel inbox** (raw payload first, ack fast, de-dupe on `(source, externalOrderId)`), one adapter per platform; items through `ExternalIdMap` to **real products**; status sync accepted → ready → picked up |
| F2 | **Menu Mapping** tool (`SoftechMenuMapping`) links platform items to till items | M11.3 | **P0** | Mapping screen with "unmapped item" review queue |
| F3 | Sold-out sync to platform | M12.7 | **P0** | Same trigger as the kiosk |
| F4 | Delivery order monitor with promised, out, delivered times and **driver cash-out** (`Invoice_DMonitor`, `Drvanalysis`, `DriverApp`) | none | P2 | Only if MYGD runs its own drivers (Limassol ~80% delivery). With platforms it is not needed |
| F5 | Delivery address book (building, floor, flat, delivery charge) | none | P2 | Needed for web pre-order delivery |
| F6 | EatApp (reservations) and RetailZoom, FTP stock export | none | **Skip** | Other clients' integrations |
| F7 | Order not "closed" while a delivery monitor exists | none | P2 | Tied to F4 |

### G. Menu, prices, promotions

| # | Gladius capability (evidence) | MYGD today | Verdict | Modern version |
|---|---|---|---|---|
| G1 | Departments → items, with parent, colour, kitchen stations, display flag. **29 departments** are the real menu (§7.2) | M11 | **P0** | Seed categories from them |
| G2 | **Promotions** (`Inventory_OnSale_Info`): item or department, date range, weekday selection, **24-hour mask** for happy hour, % off, amount off, fixed price, bulk price, buy-X-get-Y with free item, one-day event; user-id and timestamps | M10.3 (boards only) | **P1** | `Promotion` rules table (§5), server-side, shown on boards and web |
| G3 | Mix & Match types 1–5 (e.g. 5 = "select another for free"), valid from/to, time, days, up to 24 items (`Mix_Match`, 0 rows) | none | P2 | Covered by the rule table's "free item" and "bundle" effects |
| G4 | Customer price lists and discount levels (`CustomerPrices`, `CustomerDiscLevels`, 0 rows) | none | **Skip** | Unused |
| G5 | Member discount as amount or percent, group-level members | none | P2 | Optional later |
| G6 | Price-change workflow (`ApplyPriceChange`, `CFA_Update_Promo_Price`) | M11.7 | Covered | One price source, audit on change |
| G7 | Product images (`ImageName`, 775 images in `PICTURES/`, bmp/gif) | M11 | P2 | Low quality; use as placeholders only |
| G8 | Menu list and price-list reports (`MenuList.rpt`, `INV_Rep_Price_List`) | boards | Covered | Boards replace paper lists |

### H. Stock, purchasing, suppliers

| # | Gladius capability (evidence) | MYGD today | Verdict | Modern version |
|---|---|---|---|---|
| H1 | **Stock transaction types** (`PDefinitions`): Purchase invoice (+), Purchase return (−), Cash purchase (+), Order requisition, Adjustment in (+), Adjustment out (−), Transfer in (+), Transfer out (−), Waste note (−), Opening stock (+) | M3 | **P1** | `StockMovement.type` enum with the same ten meanings and signs; one ledger |
| H2 | Purchase documents (`Purchase_Header/Lines/Payments`, `Purchase_ST`): vendor, reference, lines with cost, tax, discount, lot, expiry; post and export | M2 | P1 | Supplier order → delivery receipt → posted movements |
| H3 | Reorder level and quantity per item, reorder report | M3.3 | P1 | Suggest reorder from stock, feed M2 |
| H4 | Stock take sheets (`Inventory_STake`: daily, weekly, monthly), variance report | M3.4 | P1 | Guided count on the staff tablet |
| H5 | Waste: reason flag on void, waste payment `WS`, waste analysis | M9.4 | P1 | Waste record plus stock deduction |
| H6 | Inter-store transfers (`Invoice_Transfers`, transfer in/out) | multi-location | **P1** | Emba → Limassol transfers |
| H7 | Recipes and kits (`Assembly`, `Inventory_Ingredients`, `BarRecipes`, `IsKit`) | M3.1 | P1 | Recipe (BOM) drives deduction. Data is empty, so the recipes must be authored |
| H8 | Cost per item, last cost, markup, profit analysis (`Inventory.Cost`, `LastCost`, `Departments.Cost_MarkUp`) | M9.4 | P1 | `CostFix` queries show the cost back-fill pattern (update lines and totals from item cost) |
| H9 | Item movement and slow-moving / slow-selling / top-selling reports | M9 | P2 | Dashboard 3 |
| H10 | Vendors (company, contact, tax id, terms, commission) | M2 | P1 | `Supplier` already exists. **Never import the `SSN` column** |
| H11 | Inventory matrix (size/colour/season), lot numbers, packages | none | **Skip** | Retail features |

### I. Customers and loyalty

| # | Gladius capability (evidence) | MYGD today | Verdict | Modern version |
|---|---|---|---|---|
| I1 | Customer file (2,156), addresses (2,105), groups (General, Member, Staff, Company, Inactive), notes, events | none | **Skip** now | GDPR minimisation (Q-DATA-4). Create customers from web orders with consent |
| I2 | Loyalty points, matrix, issue vouchers from sales | none | **Skip** | No points issued |
| I3 | SMS (provider URL user-defined, per-customer flag) | none | P2 | Order-ready message for pre-orders (WhatsApp or SMS) |
| I4 | Season tickets / prepaid packages with visit counts (`Packages`, `Invoice_Allowance`) | none | **Skip** | Unused |
| I5 | Caller ID | none | **Skip** | 1 row |
| I6 | A4 invoice for company customers (`PrintA4Invoice`, `numA4Copies`, `Delivery_Note.rpt`) | none | P2 | B2B PDF invoice if catering customers appear |

### J. Platform and operations

| # | Gladius capability (evidence) | MYGD today | Verdict | Modern version |
|---|---|---|---|---|
| J1 | Database backup service and `Backup.bat` | P.5 | Covered | Only 13 backups in 9 months existed. Nightly offsite with restore test |
| J2 | **Multi-store from day one**: `Store_ID` on every table, per-store prices and promos, per-store employee access | multi-location | Covered | Keep |
| J3 | Station concept (01 main till, 02 second till, 99 KDS) and service zones | `Terminal` | Covered | Terminal types in schema |
| J4 | Sync folder and DB sync (`Sync_Loc`, `SYNC/`) | offline sync | Covered | MYGD uses its own sync queue |
| J5 | Licence locks (maintenance unpaid → platform locks; internet down 15 days → lock; dongle) | n/a | **Skip** | The opposite of offline-first |
| J6 | Help file and manual (`Gladius.hlp`, "Gladius POS Ver 5.0"; topics: login, open tabs, table diagram, order entry, line and invoice options) | none | P2 | Write a short staff guide in-app instead |
| J7 | Remote support tool (`TeamViewerQS`) | none | **Skip** | |
| J8 | Android APK waiter app (v276), PDA server (up to 40 devices) | `/staff` tablet | **Skip** | Not a table-service shop |

---

## 4. Z report: exact content to reproduce

From the real Z 273 PDFs (24 Sep 2026). MYGD should print/show at least:

**Z - Analysis (summary)**
- Header: company name, store id and name, Z number, Z date, print date and time, cashier, station.
- One line per VAT rate with **net, VAT, gross**; Z total; store total; grand total.

**Detailed Z**
- **By order method** (Seat-in, Take away, Delivery, Staff): amount, guests, average per guest, invoice count, average per invoice.
- **Payment columns** per method: Cash, Cheque, Card, On account, Voucher, Online, Staff, Waste, Link4Pay, Bonus points.
- **Payout** total and **Receivables** total.
- **VAT analysis**: rate, code letter, net, VAT, gross.
- **Group analysis**: department group, VAT %, gross, net, VAT, share of sales %.
- **Order-method analysis**: method, payment code, count, gross, net, share %.
- **Service-charge analysis** (not used by MYGD).
- **Waste / staff / complimentary analysis** and **group complimentary analysis**.
- **Void-item analysis** (description, gross, net).
- **Discount analysis** by VAT rate (net, VAT, total).
- Notes seen in the change log: voided merge invoices excluded; if the Z total is negative, group analysis must still add up; cash mismatch check.

**Hourly sales analysis**: time bands (06–10, 11–14, 15+; configurable bands) with sales amount, customers and invoices, per order method, and the note "does not include complimentary, staff, waste, void documents".

**Department sales analysis** per item: sold quantity, amount, discount, total, net, cost, unit cost, average selling price, profit, margin %, plus complimentary, void, staff, waste quantity and cost.

**Receipt line format** (for reference): description, qty `@` unit price, line total, VAT letter; total quantity; grand total in EUR; VAT analysis block; order number banner; "Check closed" footer.

---

## 5. Promotion rule model (from `Inventory_OnSale_Info`)

| Field in Gladius | Meaning | MYGD field |
|---|---|---|
| `ItemNum` (item or department) | what the promo applies to | `scopeType` PRODUCT / CATEGORY / ORDER, `scopeId` |
| `Sale_Start`, `Sale_End`, `OneDayEvent` | date window | `validFrom`, `validTo` |
| `Daysweek` / `Daysselect` (digits 1–7) | weekdays | `weekdays` |
| `HHTimes` (24 Y/N flags) | hours | `timeBands` |
| `DiscountPerc`, `Discount` (amount or % flag) | % or amount off | `effect = PERCENT / AMOUNT` |
| `FixedPrice`, `SelFixedPrice` | fixed price | `effect = FIXED_PRICE` |
| `Bulkprice`, `Buldquan` | quantity price | `effect = BULK` |
| `PromoType`, `FreeItemNum`, `ItemCount` | buy X get Y | `effect = FREE_ITEM`, `buyQty`, `freeProductId` |
| `PromoIDNum`, `pro_userc`, `pro_datec` | id, who created | `id`, `createdBy`, `createdAt` |
| (none) | stacking | `stackable`, `priority` |

---

## 6. Reports → eight dashboards

Gladius ships **58 report definitions in 7 families** (Finance 1xxx, Sales 2xxx, Inventory 3xxx, Purchases 4xxx, Reservations 5xxx, Customers 6xxx, Employees 7xxx). All of them take the same filters (store, station, cashier, vendor, item, department, customer, table, group, analytical on/off, actual cost on/off, monthly on/off). Reduce to:

| # | MYGD dashboard | Gladius reports folded in |
|---|---|---|
| 1 | **Day close (X/Z)** | Z-Analysis 1101, Z-Invoice List 1102, Shift Analysis 1103, Detailed Z 1110, Daily Sales Summary 1112 |
| 2 | **Sales over time** (hour, day, week, month, year-on-year, by channel) | 2101–2103, 2107, 2120, 2121, 2123, 2124, 2180 |
| 3 | **Products and categories** (sales, quantity, margin, top and slow sellers) | 2104–2110, 3105, 3103, INV slow-moving / slow-selling |
| 4 | **Exceptions** (voids, discounts, no-sales, overrides, reprints, price changes) | 2116, 2118, 1106 (tips), `Inventory_Audit` |
| 5 | **Cashier and station performance** | 2112–2114, 7102 |
| 6 | **Staff meals, complimentary, waste** | 2115, 2117, 2122, 7103 |
| 7 | **Cash and suppliers** (paid-outs, supplier spend, receivables) | 1109, 4101–4106, `PayoutReport` |
| 8 | **Stock** (balances, valuation, reorder, movement, stock-take variance) | 3101, 3102, 3104, 3106–3109 |

Drop: all `CUS_REP_*` (customer balances, statements, bonus points, discount levels), `RES_REP_*`, `PROMO_REP_Layout_*` (shelf labels for other clients), employee list reports, and every `*_OLD` and per-client variant.

---

## 7. Reference data to reuse

### 7.1 Codes and lists

- **VAT rates configured:** 0% (code Z), 5% (C), 9% (B), 19% (A). Currency EUR. (Real usage: 5% on 91% of lines, see Q-VAT-4.)
- **Order methods:** 1 Shop Direct Sale, 2 Foody, 21 Bolt Online (all loyalty-eligible). Foody New = 3.
- **Void reasons (6):** Change Mind, Late Delivery, Not Well Cooked, Waiter Error, Walked Out, Loyalty Discount (discount type, percent). 87% of voided tickets use "Change Mind".
- **Customer groups:** General, Member, Staff, Company, Inactive.
- **Priority groups:** Starters, Main Course, Desserts, In The Middle, Other.
- **Auto-numbers:** quick/auto order number (clears at Z), split table, order voucher (clears at Z), loyalty transaction, promotion id, offer catalogue id, order requisition.
- **Stock transaction types:** see H1.
- **Service zones:** 9 numbered zones (unused names).
- **Stations:** 01 main till, 02 second till, 99 KDS.
- **Printers (names):** `CHECKS` (receipt and order slips), `THERMAL Receipt Printer`, `ORDER`, `ORDER2`, `kitchen`, `PREPARATION`. Printer driver: Sewoo thermal (ESC/POS).

### 7.2 The real menu (29 departments)

Food: FOOD MENU (018), MY MEALS, WRAP, BOWLS, BURGER, PIZZA, SALAD, SAUCE, SIDES (FRIES), BREAD, MY BOX, MY BRUNCH, MORE.
Drinks and sweets: DRINK, MY COFFEE, MY SWEETS, ICECREAM, MIXERS (666).
Other: MERCH, EXTRAS, INFO, EMPLOYEES (EE), `OLD` = "FOODY Orders".
Modifier departments: `+EXTRAS`, `+INFO`, `+SALAD`, `+SAUCES`, 777 DRINKS MODIFIERS, 888 FOOD MODIFIERS.
Best sellers: Doener Chicken, Doener Beef, Softdrink, Doener Steak, Mix Beef+Chicken, Wrap Chicken, Lamb-Beef, Doener Lamb, Fries. Salad and sauce add-ons are ordered by the thousand at price 0 (e.g. onions 166, lettuce 209 in one period), which is why **"remove ingredient / extra sauce" must be one tap**.

### 7.3 Receipt and voucher templates (text)

Three plain-text templates with a small control-code language: `#C` centre, `#B` bold, `#L` large, `#R` reverse (inferred), `#Z<value>` barcode value (inferred), `#@` cut.
- **Invoice:** company, VAT no, date, time, cashier, doc no, lines, grand total, VAT analysis table, footer.
- **Gift voucher:** value, issue and expiry dates, signature and name lines, terms ("cannot be exchanged for cash", "all vouchers have an expiry date").
- **Payment voucher:** "Pay To", "The Amount of", "Reference No", "Received From", signature.

### 7.4 Hardware and protocol facts

- **Cash-drawer kick bytes:** Epson `1B 70 00 19 FA`; Star `1B 07 0E 14`. The old till also supports "kick on card" and "kick on cheque".
- **Receipt printer drivers:** Sewoo "Elite" 4.64 and a generic thermal driver are in the folder; the kitchen slip uses font A 1×1 and 1×2 (double height) at size 10.
- **Label printers:** Zebra GC420t, 40×28 and 60×45 label sizes (also 28×25, 35×10, 60×30, 40×35 templates `.zeb`), linerless printer for bags.
- **Card terminal:** Link4Pay via the till's card module; timeouts 10 s (host) and 120 s (customer on the device).
- **Customer display:** 2-line VFD with Greek code page (patch note 4 Aug 2025).
- **Kiosk path:** PDA server `kioskordermethod` sets the order method for kiosk orders.

### 7.5 Items to be careful with when importing

- Takeaway/eat-here dummy lines and the negative `*** TAKEAWAY` item must be dropped (see A5).
- 68 active items have no price (info lines, free sauces, price-typed items): the importer already reports these.
- `Setup` numeric columns are misaligned on old rows; use booleans and text only (cash-count variance and voucher value columns are also unreliable).

---

## 8. Settings that were switched on in this shop

(From `Setup` and `Stations`; booleans only, others may be misaligned.)

**Setup:** end-of-day mode, shift mode (`UseShift`), void printed on Z, prompt on void, combine identical lines, join tables, print priority headers, print item VAT, print modifier item notes, decimal quantities, default modifier sign "ONLY", sort departments, import sales on, clear sales on, inventory matrix on, restore inventory on, close invoices before Z **off**, auto client id, print invoice notes, receipt invoice printing on, table order by cashier, `LogEvents` **off** (so audit history stops at the last enabled period).
**Station 01 (till):** prompt table and customer id, default payment cash, card module on, order type "LINK4PAY", driver app on, quick-service modifiers on, other payment method "Cheque".
**Station 02:** prompt for salesperson, item tags and labels (auto, linerless, on invoice).
**Station 99 (KDS):** card cashback and detail report flags on; shows toolbar.
**Fiscal-device fields exist** in both `Setup` and `Stations` (device IP, DLL, folder, "check box", "disconnect handling", "fiscal Z report"). I did not read their values. This bears on **Q-INV-1** and must be asked of the accountant: did Gladius drive a fiscal device here?

---

## 9. Data model: Gladius → MYGD

152 tables. 69 hold data. Everything else is empty vendor schema.

| Group | Gladius tables (rows) | MYGD target |
|---|---|---|
| Tickets | `Invoice_Totals` (20,048), `Invoice_Itemized` (203,652), `Invoice_Totals_MultiplePM` (18,923), `Invoice_Totals_Notes` (34), `Invoice_LineNotes` (1,519), `Invoice_OnHold` (1), `Void_Items` (13,931) | `Order`, `OrderItem`, `Payment` (many per order), `OrderNote`, `VoidLine`. Read-only `SalesHistory` |
| Online | `Web_Header` (5,491), `Web_Lines` (81,690), `Web_APIs` (15), `Web_Item_References` (1) | `ChannelInbox`, `Order` with `orderSource`, `ExternalIdMap` |
| Menu | `Inventory` (458), `InventoryAD` (458), `Departments` (29), `GroupModifiers` (202), `Combo_Sets` (6), `Inventory_OnSale_Info` (17), `Inventory_TimeMenu` (0), `Printers` (730), `PrinterPort` (6), `PosPages` (0) | `Product`, `Category`, `ModifierGroup`/`Modifier`, combo, `Promotion`, availability windows, `PrinterProfile`, product→station |
| Cash | `Payouts` (323), `MoneyCount` (185), `OpenDrawer` (3,295), `ShiftClosure` (0), `ZetInfo` (272), `Setup_Corp` (1), `Vouchers` (79), `CC_Trans` (7,823) | `PaidOut`, `CashCount`, `DrawerEvent`, `ShiftClose`, `BusinessDay`, `Voucher`, `CardTransaction` |
| People | `Employee` (19), `Schedule` (277), `LogEvents` (53,248), `Inventory_Audit` (1,020), `Unlock_Tables` (12) | `AdminUser`+capabilities, `StaffShift`, `AuditLog` (never import PINs) |
| Reference | `TaxRates` (4), `VoidReasons` (6), `OrderMethods` (3), `PriorityDef` (5), `AutoNumbers` (23), `Currency_Codes` (4), `CustomerGroups` (5), `Service_Zone` (10), `Stations` (3), `Setup` (1), `Reports` (58), `AutoReports` (27) | `VatRate`, `ReasonCode`, `Channel`, sequences, `Terminal`, settings, digest schedule |
| Stock | `StoreQtys` (381), `PDefinitions` (10), `Purchase_*` (0), `Assembly` (0), `Inventory_Ingredients` (2), `Vendors` (0), `Inventory_STake` (0) | `InventoryItem`, `StockMovement`, `Supplier`, `RecipeBOM` |
| Customers | `Customer` (2,156), `CustomerAddress` (2,105), `Loyalty_*` (0), `CallerID` (1), `Reservations` (0) | not imported |
| Worksheets | `RepWorksheet*`, `RepWorkSheet*` | temporary report tables, ignore |

**Stored procedures** are thin CRUD (`sp_Inventory`, `sp_Employees`, `sp_VoidReasons`, `sp_OpenDrawer`, `sp_GetNextInvNum`, `sp_GetLastZ`, `sp_Rep_*`). The sales reports (`sp_Rep_DepartmentSalesAnalysis`, `sp_Rep_ItemSalesAnalysis`, `sp_Rep_SalesByGroup`, `sp_Rep_HourlySales`, `sp_Rep_AverageHourlySales`, `sp_Rep_StationAnalysis`) are the only logic worth reading when you build the matching queries.

**Proposed schema additions** (Phase 2, same style as the TRD list): `BusinessDay`, `ShiftClose`, `CashCount` (+ denomination lines), `PaidOut`, `DrawerEvent`, `Promotion`, `Voucher` (+ ledger), `ReasonCode`, `OverrideEvent`, `Capability` (role → capability, limit), `ChannelInbox`, `StockMovement` (typed), `PrinterProfile`, `LabelTemplate`, `CardTransaction`, `ProductAvailabilityWindow`, a payment-line table allowing several payments per order with change due and voucher reference, and `OrderType`-aware price and VAT rules.

---

## 10. Not carried over (and why)

Floor plans and backgrounds; merge, split and move tables; course firing and priority headers; party size, seat numbers and order-by-guest; tips; comp invoices and salesperson; CRM loyalty, account balances, season tickets and packages; caller ID; reservations; EatApp, RetailZoom and FTP stock export (other clients); Mix & Match as a separate engine; inventory matrix, lot and serial numbers, scale and barcode ports; multi-currency; A4 delivery notes; licence and dongle locks; direct SQL access and `.ini` files with embedded logins; the Android waiter app and PDA server; other customers' configurations found in the vendor kit (`colburgers`, `colbeach`, `columbia`, `esoft`, `PETSHOPSTAVROS`, label layouts for Svanas, Tsiartas, Yakumo).

---

## 11. Plan

### 11.1 Switch-off checklist

Gladius's Maintenance Agreement ends **01-12-2026** and unpaid platform services lock the system. Before you stop using it, MYGD needs:

- [ ] Delivery-platform intake with printing and status sync (F1–F3)
- [ ] Link4Pay card payment in the till (B2)
- [ ] Sequential receipts with a VAT analysis table, and credit notes (A10, M4.6)
- [ ] Day open, X/Z close, guided cash-up, owner and accountant digest (B6, B7, D1–D5)
- [ ] Paid-outs (B5)
- [ ] Reason-enforced voids and discounts, override PIN, capability roles, per-person sign-in (C1–C5, C7)
- [ ] Cash drawer kick and kitchen routing on the real printers, kitchen slip shows voids (B4, E3, E4)
- [ ] Promotions that are live today (G2)
- [ ] Historical sales kept read-only from the `.bak` exports (M9.5)

If the date cannot be met, one more maintenance period costs less than a gap in delivery orders or the daily close.

### 11.2 Suggested PRD v1.1 changes (needs your approval)

| Change | Module |
|---|---|
| Generic channel inbox for Foody, Bolt, Wolt and DM Soft; **bring delivery intake forward from Stage 9** | M12 / M6.5 / Sch-B |
| Business day, X/Z, shift close, blind cash count, owner and accountant digest | new **M13 Day close** (extends M9.3, M4.8) |
| Cash paid-outs, opening float, drawer events | M4 (+ M2 link) |
| Capability roles, override PIN, mandatory reason codes, exceptions dashboard, fuller audit log | P.1, P.2, M4.7 |
| Per-person PIN tap-in at the till | M4 / M7.2 |
| `OrderType`-aware price and VAT; modifier actions (NO, EXTRA, ONLY) | M11 / M4 |
| Promotions rules engine | M11 (+ M4, M10, M6) |
| Gift vouchers; staff-meal payment | M4 (P2) |
| Stock movement-type ledger, waste, transfers | M3 |
| Printer profiles, printer failover, label printer, kitchen slip prints voids | M5.5 / M4.5 |
| Link4Pay transaction record and timeouts | M4.4 |

### 11.3 New open questions

- **Q-FOODY-1:** Does Foody (and Bolt) give MYGD a direct API or webhook, or is the Softech bridge the only route? Who owns the platform credentials?
- **Q-FISCAL-1:** Was a fiscal device connected to Gladius? (Fields exist; I did not read their values.) Feeds Q-INV-1.
- **Q-CLOSE-1:** Who counts the drawer and closes the day, and at what time?
- **Q-PAYOUT-1:** Which of the 58 payees are suppliers, and what approval limit applies to paid-outs?
- **Q-PROMO-1:** Which of the 2026 promotions should be recreated, and do they stack?
- **Q-VOID-1:** What reason list do the owners want for voids, discounts and waste?
- **Q-LINK4PAY-1:** Is the Link4Pay terminal the same device model that Gladius used (so the XPay-style settings carry over), and what are the Merchant and Terminal IDs (Sch-C §3)?
- **Q-DRIVER-1:** Will MYGD run its own delivery drivers (F4), or platforms only?
- **Q-SWITCH-1:** Target date to stop using Gladius, relative to 01-12-2026?

### 11.4 Confidence and limits

- Ticket numbers come from `Invoice_Totals`, `Void_Items`, `Payouts`, `Vouchers`, `MoneyCount`, `Invoice_Totals_MultiplePM` in the 24 Sep 2026 export and agree with the earlier analysis (20,048 tickets, 18,422 closed).
- "Reason 999" is not in the six-row reason list. I treat it as "no valid reason" without having read the code that writes it.
- "No Reason Tables" drawer opens may simply be the label used when a cash payment opens the drawer. The data cannot separate sale kicks from no-sales, which is the argument for logging a cause.
- Report names and parameters come from the catalogue and from the five sample PDFs. I did not open the `.rpt` Crystal binaries or read the WinHelp file beyond its topic titles.
- `Setup`, `Stations`, voucher-value and cash-count-variance columns have misaligned older rows. I used counts and booleans, not those amounts.
- Whether `ST` vs `SF` mean "staff" vs "staff food" is not verified. Both are rare.
- Hardware byte sequences come from the vendor change log (2 Dec 2025), not from a test on your printers.
