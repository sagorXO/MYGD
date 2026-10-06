# Hard-coded values register

- **Date:** 2026-10-06
- **Status:** **register only. No code has been changed.** Per the engineering phases, code changes start after PRD v1.1 is approved. Each row is fixed in the phase that touches the file (PRD §Development Phases).
- **Rule:** PRD **P.8**. Business values are data or settings with an audit trail. Secrets and infrastructure endpoints come from the environment or a secret manager. Presentation values come from design tokens.
- **Scan:** `grep` over `src/` and `prisma/` on 2026-10-06 (VAT rates, thresholds, hosts, addresses, currency, hex colours, seed data). It finds the common cases, not every case. Re-run before each phase (commands at the end).

## Where each kind of value belongs

| Kind of value | Examples | Home |
|---|---|---|
| Business rule that changes over time and needs history | VAT rates, prices, promotions, reason codes, supplier approval limit | **Database table** with `validFrom` and audit (e.g. `VatRate`, `ReasonCode`) |
| Per-location or per-channel setting | time zone, currency, opening hours, auto-accept, prep time, digest recipients, printer addresses | **`Setting` / `Channel` / `Printer` records**, editable in `/admin/settings`, audited |
| Thresholds and timers | KDS urgency seconds, variance alert, accept timeout | **Settings** with a typed default in one `config` module |
| Secrets and endpoints | `SESSION_SECRET`, DB URLs, platform credentials, webhook secrets | **Environment / secret manager**. Never in the repository or the database in plain text |
| Look and feel | colours, spacing, fonts | **Design tokens** (`src/ui/tokens.css`) |
| Fixed standards | EUR denominations, ESC/POS command bytes, ISO currency codes | **Named constants** in one module, or printer-profile data for device bytes |
| Content | product names, images, menu text, board content | **Catalogue (M11) and media records**. Never in components |
| Demo data | sample orders, sample suppliers | **Dev fixtures only**, never shipped to production |

## Register

| # | Location (2026-10-06) | Hard-coded value | Problem | Fix | Phase | PRD |
|---|---|---|---|---|---|---|
| H1 | `src/lib/order-engine.ts:38,51`; `src/modules/pos/pos.service.ts:41-42` | VAT `0.19`, net `= gross / 1.19` | Contradicts MSA §3.4 (9% food); wrong tax on every sale | Resolve rate from `VatRate` by product category and order type; compute per line; round per Q-VAT-3 | 2, 4 | M11.4, M4.6 |
| H2 | `src/app/api/menu/route.ts:142`; `src/app/api/staff/timeclock/route.ts:37,184` | `vatRate: 0.19`, `currency: "EUR"` literals in responses | Same, and the timeclock route should not return sales fields | Read from the order or `VatRate`; currency from the location | 2 | M4, M7 |
| H3 | `src/lib/tax.ts:10-12,62,123-137` | `CYPRUS_VAT_RATES` constants | Rates live in code, no history | Seed the `VatRate` table from these once; delete the constants | 2 | M11.4 |
| H4 | `prisma/schema.prisma` (`price`, `priceAdjustment`, `subtotal`, `totalAmount`, `totalPrice`, `totalEUR`, `vatRate @default(0.19)`) | Money as `Float`; default VAT 0.19 | Rounding errors; wrong default | `Decimal(10,2)` for money; quantities `Decimal(10,3)`; no default VAT | 2 | P.4 |
| H5 | `src/app/api/menu/route.ts:141`, `src/modules/pos/pos.schema.ts:48`, `src/lib/i18n.ts:20-22`, `prisma/seed.ts` | `"EUR"`, `z.literal("EUR")`, locale to currency map | One currency, one format forever | `Location.currency`, `Location.timeZone`, `Location.locale`; one formatter fed by them | 2 | P.9 |
| H6 | `src/app/order/page.tsx:95,214`; `src/app/admin/suppliers/page.tsx:58,138,184`; `src/app/admin/page.tsx:50,132` | "Emba Store (Paphos)", `location=EMBA`, sample order id `EMBA-20260815-1423-049`, sample supplier "Paphos Fresh Bakery", "Emba and Limassol Marina" banner | Location names and ids typed into pages | Read the `Location` record; remove sample data (see H8) | 4, 6 | M11.2 |
| H7 | `src/app/admin/suppliers/page.tsx:114,134,174,303,304,368` | `250` (EUR approval limit) in the browser | Business rule enforced only in the client | Setting `supplier.approvalThreshold` (default 250, `[SOW]`), checked on the server | M2 | M2.3 |
| H8 | `src/app/order/page.tsx:39-74`, `src/app/page.tsx:220`, `src/app/api/admin/menu/route.ts:199`, `src/lib/timeclock-engine.ts:37-63` | Third-party image URLs (`images.unsplash.com`) and sample products | Hot-linked images fail offline and leak visitor IPs; sample catalogue in engine code | Own media records or `public/assets`; no remote hot-links; remove sample products from engines | M6, M11 | M11, M6 |
| H9 | `src/lib/kds-formatter.ts:28-34`; `src/modules/kds/components/KDSTablet.tsx:80-81` | `240` and `480` seconds, duplicated | Same rule in two places | Settings `kds.urgency.mediumAfterSec` (240) and `urgentAfterSec` (480) from `DESIGN.md` §6; one shared function | 5 | M5.4 |
| H10 | `src/modules/printer/tcp-spooler.ts:30-36` | Fallback IPs `192.168.1.101/102`, port `9100` | A wrong fallback prints to a random device | `Printer` records (host, port, profile) per location; if unset, fail visibly, never guess | 5 | M5.5 |
| H11 | `src/lib/auth/session.ts` (`SESSION_TTL_SECONDS`) | 12 h for every device | One value for tills, tablets and admin | Setting per device type `[OPEN Q-SEC-3]` | 0.5+ | P.1 |
| H12 | `src/lib/catalog-data.ts` (451 lines) | Static catalogue | A second source of truth next to the database | Remove after the importer and M11 are live | 1 | M11 |
| H13 | `src/app/boards/*`, `MenuBoardConfig.itemsJson[].isSoldOut` | Hard-coded board content; second sold-out flag | Boards can disagree with the till | Boards read the catalogue; availability from `Product.isAvailable` only | 6 | M10, Q-DM-7 |
| H14 | `prisma/seed.ts` (about 99 name/price lines; demo PINs `demo_*` in dev) | Demo products and PINs | Seed doubles as data | Production seed = reference data only (roles, VAT rates, reason codes, defaults). Demo data in a dev-only fixture | 2 | P.6 |
| H15 | 543 hex colours in `*.tsx` outside `/dev/` | `#RRGGBB` in components | Bypasses the design system and dark mode | Replace with token classes during each screen's rework | each | DESIGN.md |
| H16 | `.env.example`: `PRINTER_*_IP/PORT`, `NEXT_PUBLIC_MGD_EDGE_URL` | Per-location printer addresses in the environment | Not editable by the owner; wrong layer | Keep env for secrets and bootstrap only; printers move to records (H10) | 5 | P.8 |

## Rules for new code (v1.1 onward)

1. No literal VAT rate, currency, time zone, location name or id, address, phone, email, URL, threshold, timeout, or recipient in application code. Tests may use fixtures.
2. A new setting needs: a typed key, a default in one place, a scope (global, location, channel), an owner role that can edit it, an audit entry on change, and a line in the PRD configuration catalogue.
3. Settings are read through one typed accessor (validated with Zod at load) and cached with change notification. They are never read ad hoc from the database in components.
4. Secrets only from the environment or a secret manager; each required secret is validated at startup, and the app refuses to start without it.
5. Any literal that is kept must be a named constant with a comment saying why it is fixed (law, standard, or device protocol).
6. CI check (to add in Phase 2): a lint rule or script fails the build when it finds `0.19`, `0.09`, `1.19`, `"EUR"`, `192.168.`, `images.unsplash.com` or a 6-digit hex colour outside the allowed files.

## Re-run the scan

```bash
bash -c '
G() { grep -rnE "$1" src prisma --include="*.ts" --include="*.tsx" --include="*.prisma" | grep -vE "\.test\.|/locales/|tokens\.css"; }
G "0\.19|0\.09|\* *1\.19|/ *1\.19|vatRate +Float"
G "\"EUR\"|Europe/|Asia/Nicosia|en-CY|el-CY"
G "192\.168\.|https?://[A-Za-z0-9.-]+\.[a-z]{2,}"
G "Pavlides|Paphos|Limassol|EMBA"
G "\b(240|250|480)\b"
'
```
