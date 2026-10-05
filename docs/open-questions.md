# MYGD — Open Questions

Living list. Every unknown is a config value or a marked TODO in the code and is tracked here. Status: `OPEN` / `ANSWERED (date)`.

## Blocking Phase 1
- **Q-DATA-1 (OPEN)** `import/` is missing. Please copy the XP till data, kiosk menu exports/photos and inventory lists into `MYGD/import/{xp-pos,kiosk-menu,inventory}/`. `import/` is now git-ignored.
- **Q-DATA-2 (OPEN)** What software ran on the XP till (vendor/product name)? It tells us the file formats and the codepage (Greek cp1253 vs cp1252).
- **Q-DATA-3 (OPEN)** May I install `clamav` (Homebrew) to scan the XP files, plus `mdbtools` if there are `.mdb` files? Neither is installed.
- **Q-DATA-4 (OPEN)** Customer and staff records from the XP till: ignore them entirely (my recommendation, GDPR data minimisation), or import staff names only?
- **Q-DATA-5 (OPEN)** How many years of sales history should go into the read-only history table, if any?

## Security / scope
- **Q-SEC-1 (ANSWERED 2026-10-03)** Approve a small "Phase 0.5 security floor" before Phase 1? It covers server-side sessions plus role guards on admin/staff routes, disabling the Shopify webhook, the login lockout fix, and hashed timeclock PINs. **→ approved as Phase 0.5 in the approved PRD v1.0.**
- **Q-SEC-2 (ANSWERED 2026-10-03)** Delete all Shopify code (`src/lib/shopify*.ts`, `api/webhooks/shopify`, its test, catalog references)? Yes / keep disabled. **→ all Shopify code removed (commit c83abc2); the generator scripts went in 99a5177.**
- **Q-SEC-3 (PARTLY ANSWERED 2026-10-03)** Staff auth model: per-person PIN on shared devices (till/KDS/iPads), plus a longer password for admin? Session length per device type? **→ built: per-person username + PIN, 12 h sessions for every device. Still open: different session lengths per device, and a longer password for owners.**
- **Q-ARCH-1 (ANSWERED 2026-10-03)** Confirm that `apps/*`, `packages/*` and root `components/` are dead and may be removed in a separate cleanup commit. **→ apps/* and packages/* archived on branch archive/apps-packages (191abfb); root components/ removed (74a5b56).**

## Tax / invoicing (waiting for the accountant — I will not guess)
- **Q-VAT-1 (PARTLY ANSWERED 2026-10-03)** VAT rates and categories for: food eaten in, takeaway food, soft drinks, alcohol, packaging/deposit. The code currently contradicts itself (9%/19% split in `tax.ts` vs a flat 19% in the POS and order routes). **→ the signed MSA §3.4 fixes 9% (food, dine-in, takeaway, non-alcoholic drinks) and 19% (alcohol). Accountant still to confirm, plus packaging/deposit.**
- **Q-VAT-2 (OPEN)** Are menu prices gross (VAT-inclusive)? Assumed yes.
- **Q-VAT-3 (OPEN)** Rounding rule: VAT per line or per invoice per rate?
- **Q-INV-1 (OPEN)** Mandatory receipt/invoice fields in Cyprus (company name, VAT reg. no., TIC, address, invoice number format, date/time, per-rate breakdown, payment method). Is a fiscal device or e-invoicing registration required?
- **Q-INV-2 (OPEN)** Invoice numbering: one sequence per store or per store per year? Prefix format?
- **Q-INV-3 (OPEN)** Simplified receipt for every sale plus a full invoice on request (business customer with a VAT number), or one document type?

## DM Soft / kiosk
- **Q-DM-1 (ANSWERED 2026-10-03)** `~/Downloads/MYGD-KioskPOS-Integration-Spec-v1.0.md` is our draft proposing a pull model (kiosk polls `/menu` and `/availability`). The brief says DM Soft pushes orders to our webhook. Which is agreed? Was that draft sent to DM Soft? **→ DM Soft supplies the touch-screen kiosk and a bridge connection portal that sends orders to MYGD (push). The ~/Downloads pull-model draft is superseded. Payload and auth: Q-DM-2.**
- **Q-DM-2 (OPEN)** DM Soft payload format, auth method (HMAC signature vs shared-secret header), retry behaviour, and their item IDs.
- **Q-DM-3 (OPEN)** How do the menu and prices get onto the kiosk: maintained in DM Soft's back office, or pushed from MYGD? (This decides who owns prices.)
- **Q-DM-4 (OPEN)** Does the customer-facing order number come from the kiosk or from MYGD? Which number is shown on `/display`?
- **Q-DM-5 (OPEN)** Opening hours per weekday (for the "no kiosk orders" alert) and the alert channel (screen banner only, or also email/WhatsApp/SMS).
- **Q-DM-6 (OPEN)** Link4Pay: which fields will DM Soft forward (transaction id, auth code, card brand, last4)?

## Kitchen / hardware
- **Q-HW-1 (OPEN)** Printer make/model and connection (LAN IP / USB / Bluetooth) for the kitchen and grill printers. Which printer drives the cash drawer?
- **Q-HW-2 (OPEN)** Which printer prints the customer receipt/invoice: one of the two kitchen printers, or a third front-counter printer?
- **Q-HW-3 (OPEN)** Station mapping: which products/components go to prep, grill, fryer and packing? Does "packing" see every order?
- **Q-HW-4 (OPEN)** Station → printer routing: does grill print on the grill printer, and prep/fryer/packing on the kitchen printer?
- **Q-HW-5 (OPEN)** Kitchen monitor resolution and the iPad models (for touch-target and column sizing).

## Brand / UI
- **Q-UI-1 (ANSWERED 2026-10-03)** 4 vs 7 menu boards. The schema allows 1–7. **→ the signed SOW specifies 4 screens (/boards?screen=1..4).**
- **Q-UI-2 (OPEN)** Official brand hex codes. The current primary `#E50C7E` was calibrated by us; confirm it with the brand owner.
- **Q-UI-3 (PARTLY ANSWERED 2026-10-03)** Customer languages after English (Greek, German, Russian?). `de`/`gr` locale files exist. **→ the signed SOW requires EN/DE/GR. More languages: open.**

## Data model
- **Q-DM-7 (OPEN)** Two sold-out flags exist (`Product.isAvailable` and `MenuBoardConfig.itemsJson[].isSoldOut`). OK to make `Product`/`Modifier` availability the single source and derive the boards from it?
- **Q-DM-8 (OPEN)** Duplicate models: `Recipe`+`RecipeIngredient` vs `RecipeBOM`, and `TimeLog` vs `StaffShift`. Which ones are kept?


## Contract, schedule and infrastructure (added 2026-10-03)
- **Q-CON-1 (OPEN)** Client written confirmation (addendum or email) of the contract variances in `docs/contract-alignment.md` §3, mainly V1 (Shopify Register 2 → DM Soft kiosk) and V2 (database/offline model).
- **Q-CON-2 (OPEN)** The final `03. Payment Schedule.docx` SEPA block looks like a placeholder (IBAN ending …1234 5678, "Revolut Bank UAB / Bank of Cyprus"). Which account does the client pay into?
- **Q-SCHED-1 (OPEN)** Contract Stage 1 (M1 checklists + M2 supplier ordering, ≈ due 24 Sep) is not delivered, and the engineering plan builds kiosk, till and kitchen first. Agree the order with the client.
- **Q-DB-1 (OPEN)** New database: engine and hosting. Proposed: PostgreSQL 16 on the store PC + PostgreSQL on the VPS, outbox sync (`docs/TRD.md`). Who provides and pays for the VPS?
- **Q-CRED-1 (OPEN)** Old Supabase connection strings with passwords remain in git history (pre-cleanup `.env.example`, `docker-compose.yml`). Rotate them or confirm the projects are deleted.
- **Q-WEB-1 (OPEN)** When does the redesigned homepage (`/dev/preview/home`) replace the current `/`?
- **Q-BRD-1 (OPEN)** Menu-board daypart times (the signed SOW says "automated dayparting" without times).
- **Q-PO-1 (OPEN)** Pre-order: ETA formula (not in the signed SOW), online payment provider, and drive-through car detection method (client to provide, per the brief).

## Legacy data (added 2026-10-03)
- **Q-VAT-4 (OPEN, blocking import)** The old Gladius till charged **5% VAT** on 216 of 256 active items (≈ 91% of sales lines). The signed MSA says 9% food / 19% alcohol. Which rate is correct per item type (take-away vs eat-in, food vs drinks)? The importer blocks the 5% items until `vatRateToCategory["5"]` is set in `.import-work/gladius-decisions.json`.
- **Q-OLD-2 (OPEN)** 68 active items have no price (info lines, free extras, price typed at the till). For each: give a price override, or skip it? (Full list in the import report.)
- **Q-OLD-3 (OPEN)** Is store `BERLIN` / ID `1010` the Emba shop?
- **Q-OLD-4 (OPEN)** The old till's `.ini` files hold live-looking credentials (SQL Server, FTP stock export, JCCPay). If the old till or the JCCPay account is still active, the client should rotate them.
- **Q-DATA-3 (ANSWERED 2026-10-03)** No ClamAV install needed: nothing from `Old Data` was executed; the backup was read only by SQL Server in an isolated container.
- **Q-DATA-4 (ANSWERED 2026-10-03)** Customers, loyalty, online orders and employees are not imported.
- **Q-DATA-5 (PARTLY ANSWERED 2026-10-03)** Sales history is kept (the `.bak` files) and will be imported after Phase 2 adds the read-only history table. How many months: open.
- **Q-HW-1 (PARTLY ANSWERED 2026-10-03)** The old receipt printers use the **SEWOO "Elite"** driver (ESC/POS). Exact models and connections still needed.
