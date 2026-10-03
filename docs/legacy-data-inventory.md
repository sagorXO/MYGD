# Legacy data inventory — `Old Data/` (Gladius POS)

- **Date:** 2026-10-03
- **Status:** read-only inventory. Nothing has been restored, imported or executed.
- **Source:** `MYGD/Old Data/`, copied from the old store PC. 7,708 files, 1.9 GB.
- **Handling:**
  - The folder is git- and docker-ignored (commit `e9108cd`).
  - The originals are never modified.
  - No program from it is run.
  - Personal data is described by column name only.

## 1. What the old system is

- **Gladius POS:** a Windows till application on Microsoft SQL Server. The store is named **`BERLIN`** in the backups.
- **Patch level:** `Patch_8141_08_12_2025` (8 Dec 2025).
- **Add-ons in the patch:** KDS, PDA server, JCCPay (card gateway), Zebra labels, an "Import-Esoft-Items" tool, and online-order connectors (Softech Online Orders, EatApp, menu mapping, FTP stock export).

## 2. Contents

| Item | Size / count | What it is | Use for MYGD |
|---|---|---|---|
| `Gladius_Backup/BERLIN-*.bak` | 13 files, 12–117 MB; **15 Dec 2025 → 24 Sep 2026** | Microsoft SQL Server native backups (MTF "TAPE" header). Newest: `BERLIN-24092026-100936.bak` (117 MB) | **The real data source.** Needs a SQL Server restore to read (§5) |
| `GladiusPOS/SCRIPT/GladiusSQL.sql` | 600 KB, UTF-16 | Full schema: **83 tables** plus stored procedures. Its 106 `INSERT`s are only defaults (reports, service zones, 4 tax-rate rows, currencies) | Used to plan the mapping (§4) |
| `GladiusPOS/*.rpt` | 282 | Crystal Reports layouts (Z-report, sales, stock, food cost…) | Reference only: which reports the client is used to (useful for M9) |
| `GladiusPOS/OnlineOrders/*.xml` | 5,666 | Exported online orders | ⚠ **Personal data** (names, phones, addresses likely). Not opened. Not imported (GDPR) unless you decide otherwise |
| `GladiusPOS/Emails/*.pdf` | 5 | E-mailed documents | ⚠ Possibly personal or financial. Not opened |
| `GladiusPOS/INTERFACE/ZETS` (+ `Backup`) | 462 `.zet` | Z-report exports (daily closings) | Possible cross-check for historical sales totals |
| 12 × `*.ini` | — | Settings for the till DB, FTP stock export, **JCCPay**, KDS, PDA, labels | ⚠ **Contain credentials.** Values not read or copied. **Rotate any that are still live** |
| Installers and binaries | 39 `.exe`, 55 `.dll`, 2 `.ocx`, 30 `.bat` | Gladius, SQL Server Express 2019 (1.1 GB), SSMS, Sewoo printer driver 4.64 | **Never executed.** Not needed |
| `THERMAL Receipt Printer 4.X/` | 26 MB | **Sewoo "Elite" thermal-printer driver** | ✅ **Answers part of Q-HW-1:** the old receipt printers are **SEWOO** (ESC/POS compatible). Model and connection still to confirm |
| Images, fonts, sounds, labels | 823 bmp, 221 gif, 20 ttf, 6 wav, 10 zeb | Till UI assets and Zebra label layouts | Not needed |

## 3. Data quality and risk notes (from the schema, before seeing data)

- **Prices:**
  - `Inventory` holds both `Price` and `Retail_Price`, plus `PriceList` with price lists per store. Which one is the menu price must be confirmed from the data.
  - Money is SQL `money` (4 decimals), so it must be rounded to cents deliberately.
- **VAT:**
  - Per item: `Inventory.TaxRate` (real).
  - Per line at the time of sale: `Invoice_Itemized.ItemVatRate`.
  - Lookup table `TaxRates` (4 rows).

  This will show the VAT the old till actually charged; compare it to MSA §3.4 (9% / 19%).
- **Modifiers:** three mechanisms: per-item `Modifiers`, shared `GroupModifiers` (with `NumSel` = how many may be chosen), and `Inventory.ModGroupCode/1/2`. Plus "choice items" (`Inventory_ChoiceItems`) and kits (`IsKit`, `Assembly`).
- **Modifiers stored as products:** `Inventory.IsModifier` marks them. These must become `Modifier` rows, not products.
- **Inactive items:** `Inventory.ActiveItem`. Import active items only, and report the inactive ones.
- **Kitchen routing:** `Inventory.Kitchen` and `Departments.Dept_Stations` record which station or printer each item went to. Useful for the station mapping (Q-HW-3).
- **Recipes:** `Assembly` (kit components with quantities and cost) and `BarRecipes` (free text). There's no gram-level recipe table, so the BOM will be partial.
- **Personal data:**
  - **`Customer`:** names, addresses, phones, e-mail, birthdays/events, balances.
  - **`Employee`:** names, `Password` (probably plain text), wages.
  - **`Vendors`:** contact details plus an **`SSN`** column.
  - Also `Loyalty_Trans`, `CallerID`, `Reservations`.

## 4. Proposed mapping (Gladius → MYGD), to confirm against real data

| Gladius | MYGD (current schema) | Rule |
|---|---|---|
| `Departments` (Description, Dept_Parent) | `Category` | Top-level departments become categories. Sub-departments: flattened or kept, decided once the data is seen |
| `Inventory` where `IsModifier = 0`, `ActiveItem = 1` | `Product` | `ItemNum` → external-ID map (`system = GLADIUS`), **never matched by name**. `ItemName` → `name`. Price as decided in §3 → `basePrice` (gross). `TaxRate` → VAT category |
| `Inventory` where `IsModifier = 1`, `Modifiers`, `GroupModifiers` | `ModifierGroup` + `Modifier` + `ProductModifierGroup` | `ModGroup` → group; `NumSel` → max selections; `Priced`/`Price` → `priceAdjustment` |
| `PriceList` (`Store_ID`, `PriceList`) | `LocationPrice` | Only if more than one price list is actually in use |
| `Inventory.Cost`, `LastCost`, `Vendors` | `Ingredient.costPerUnitEUR`, `Supplier` | Supplier: company, phone and e-mail only. **`SSN` is never read or stored** |
| `Assembly` | `RecipeBOM` | Only where quantities are real. Each needs your review (gram weights are probably missing) |
| `StoreQtys` (`Closing`) | `InventoryItem.currentStock` | Snapshot from the newest backup, for information. Live stock starts from a fresh count |
| `Invoice_Totals` + `Invoice_Itemized` | New read-only `SalesHistory` (Phase 2 schema) | Optional (Q-DATA-5). `CustNum` is dropped. Never mixed into live orders |
| `Customer`, `Loyalty_Trans`, `CallerID`, `Reservations`, `OnlineOrders/*.xml` | — | **Not imported** (GDPR minimisation, Q-DATA-4) |
| `Employee` | — | **Not imported.** Staff get new accounts with `npm run user:create`. The old passwords are never used |

## 5. How to read the backups (needs your decision)

A `.bak` file can only be read by SQL Server. This Mac is Apple Silicon (arm64), and SQL Server for Linux is published for x86-64 only. The options:

| Option | What it takes | Notes |
|---|---|---|
| **A. SQL Server 2022 in Docker on this Mac (recommended)** | Download `mcr.microsoft.com/mssql/server:2022-latest` (Microsoft, about 1.5 GB). Run it under Colima with Rosetta x86 emulation, which may require recreating the Colima VM. Restore the newest `.bak` into a throwaway container, export the needed tables to CSV, then delete the container | Everything stays on this Mac. The restored DB never leaves the container. No program from `Old Data` runs; SQL Server only reads the backup file |
| B. Restore on a Windows PC | You (or the client) restore the `.bak` with the included SSMS and export the tables to CSV for me | No download here; manual work for you |
| C. Old till PC | Export straight from the running Gladius / SQL Server | Only if the old PC is still available |

**Malware check:** ClamAV isn't installed (Q-DATA-3). With option A, nothing from the folder is executed; SQL Server parses the backup inside an isolated container. Scanning the `.exe`/`.dll` files matters only if anyone ever plans to run them, and nobody should.

## 6. Questions

- **Q-OLD-1:** Which option in §5 (A, B or C)? For A: may I download the SQL Server 2022 image (about 1.5 GB from Microsoft) and switch Colima to Rosetta mode?
- **Q-OLD-2:** Use the newest backup (`BERLIN-24092026`) for the catalogue? (Recommended. The older ones would only matter for sales history.)
- **Q-OLD-3:** Is "BERLIN" the Emba store? (No other store appears in the backups.)
- **Q-DATA-4 (existing):** Confirm customers, loyalty, online orders and employees are **not** imported.
- **Q-DATA-5 (existing):** Sales history: how many months, if any?
- **Q-OLD-4:** The `.ini` files hold live-looking credentials (till DB, FTP, JCCPay). Is the old till still running? If so, the client should change those passwords.

## 7. Results (2026-10-03, after your approval)

Option A was approved (SQL Server 2022 Developer edition in Docker; Microsoft's licence accepted by Sagar).

- **Restore:**
  - Ran in a separate Colima profile `mssql` (Apple Virtualization + Rosetta); your `default` profile was untouched.
  - The newest backup, `BERLIN-24092026-100936.bak` (made by SQL Server 2014 Express, store ID `1010`), restored cleanly.
  - The container and the restored database (which includes customer and staff data) were **deleted** after export, and the admin password file was removed.
  - The `.bak` files stay in `Old Data/` for the Phase 2 sales history.
- **Exported:** a catalogue-only snapshot to `.import-work/gladius-2026-09-24/`: 11 JSON files, git-ignored, mode 600. No customer, employee or sales rows. One derived table (`last_charged_price`) holds only item numbers, prices and dates.
- **Database contents:**

  | Table | Rows |
  |---|---|
  | `Inventory` | 458 (256 active, 75 modifiers) |
  | `Departments` | 29 |
  | `GroupModifiers` | 202 (21 groups) |
  | `Invoice_Totals` | 20,048 (24 Oct 2025 → 23 Sep 2026) |
  | `Invoice_Itemized` | 203,652 |
  | `Customer` | 2,156 (not exported) |

  `Modifiers`, `Vendors` and `Assembly` are empty, so there are no suppliers or kit recipes to import.

### ⚠ VAT: the old till charged 5% on almost everything

| Gladius rate | Active items | Sales lines in the last 12 months |
|---|---|---|
| **5%** | **216** | **184,460 (≈ 91%)** |
| 9% | 29 | 18,843 |
| 19% | 11 | 349 |

The signed MSA §3.4 specifies 9% food / 19% alcohol and has no 5% category. **This needs the accountant before go-live.** The importer blocks every 5% item until `vatRateToCategory["5"]` is set (open question Q-VAT-4).

### Prices
- `Inventory.Price` is the menu price. On the last sale of each item it matched for 81 of 172 items; `Retail_Price` matched for only 8.
- 68 active items have no price: info lines, free sauces/extras, and price-typed items. They are blocked until you add a price override or skip them.

### Importer dry run (decisions template: 0/9/19 per the MSA, 5% left open)

| | Count |
|---|---|
| Importable now | 36 products in 4 categories, plus 21 modifier groups / 202 modifiers |
| Blocked: VAT 5% only | 77 |
| Blocked: no price only | 4 |
| Blocked: both | 64 |
| Inactive (reported, not imported) | 202 |

**Live-tested on a throwaway Postgres:** `--apply` is refused while items are blocked; `--allow-blocked` created the 36 decided products; a second run changed nothing.

**Kitchen routing evidence (Q-HW-3):** items go to the printers `kitchen`, `PREPARATION` and `CHECKS` (order slips), and to a `Kitchen` group 1 or 2. The full table is in the import report.
