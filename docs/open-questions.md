# MYGD — Open Questions

Living list. Every unknown is a config value or a marked TODO in the code and is tracked here. Status: `OPEN` / `ANSWERED (date)`.

## Blocking Phase 1
- **Q-DATA-1 (OPEN)** `import/` is missing. Please copy the XP till data, kiosk menu exports/photos and inventory lists into `MYGD/import/{xp-pos,kiosk-menu,inventory}/`. `import/` is now git-ignored.
- **Q-DATA-2 (OPEN)** What software ran on the XP till (vendor/product name)? It tells us the file formats and the codepage (Greek cp1253 vs cp1252).
- **Q-DATA-3 (OPEN)** May I install `clamav` (Homebrew) to scan the XP files, plus `mdbtools` if there are `.mdb` files? Neither is installed.
- **Q-DATA-4 (OPEN)** Customer and staff records from the XP till: ignore them entirely (my recommendation, GDPR data minimisation), or import staff names only?
- **Q-DATA-5 (OPEN)** How many years of sales history should go into the read-only history table, if any?

## Security / scope
- **Q-SEC-1 (OPEN)** Approve a small "Phase 0.5 security floor" before Phase 1? It covers server-side sessions plus role guards on admin/staff routes, disabling the Shopify webhook, the login lockout fix, and hashed timeclock PINs.
- **Q-SEC-2 (OPEN)** Delete all Shopify code (`src/lib/shopify*.ts`, `api/webhooks/shopify`, its test, catalog references)? Yes / keep disabled.
- **Q-SEC-3 (OPEN)** Staff auth model: per-person PIN on shared devices (till/KDS/iPads), plus a longer password for admin? Session length per device type?
- **Q-ARCH-1 (OPEN)** Confirm that `apps/*`, `packages/*` and root `components/` are dead and may be removed in a separate cleanup commit.

## Tax / invoicing (waiting for the accountant — I will not guess)
- **Q-VAT-1 (OPEN)** VAT rates and categories for: food eaten in, takeaway food, soft drinks, alcohol, packaging/deposit. The code currently contradicts itself (9%/19% split in `tax.ts` vs a flat 19% in the POS and order routes).
- **Q-VAT-2 (OPEN)** Are menu prices gross (VAT-inclusive)? Assumed yes.
- **Q-VAT-3 (OPEN)** Rounding rule: VAT per line or per invoice per rate?
- **Q-INV-1 (OPEN)** Mandatory receipt/invoice fields in Cyprus (company name, VAT reg. no., TIC, address, invoice number format, date/time, per-rate breakdown, payment method). Is a fiscal device or e-invoicing registration required?
- **Q-INV-2 (OPEN)** Invoice numbering: one sequence per store or per store per year? Prefix format?
- **Q-INV-3 (OPEN)** Simplified receipt for every sale plus a full invoice on request (business customer with a VAT number), or one document type?

## DM Soft / kiosk
- **Q-DM-1 (OPEN)** `~/Downloads/MYGD-KioskPOS-Integration-Spec-v1.0.md` is our draft proposing a pull model (kiosk polls `/menu` and `/availability`). The brief says DM Soft pushes orders to our webhook. Which is agreed? Was that draft sent to DM Soft?
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
- **Q-UI-1 (OPEN)** 4 vs 7 menu boards. The schema allows 1–7.
- **Q-UI-2 (OPEN)** Official brand hex codes. The current primary `#E50C7E` was calibrated by us; confirm it with the brand owner.
- **Q-UI-3 (OPEN)** Customer languages after English (Greek, German, Russian?). `de`/`gr` locale files exist.

## Data model
- **Q-DM-7 (OPEN)** Two sold-out flags exist (`Product.isAvailable` and `MenuBoardConfig.itemsJson[].isSoldOut`). OK to make `Product`/`Modifier` availability the single source and derive the boards from it?
- **Q-DM-8 (OPEN)** Duplicate models: `Recipe`+`RecipeIngredient` vs `RecipeBOM`, and `TimeLog` vs `StaffShift`. Which ones are kept?
