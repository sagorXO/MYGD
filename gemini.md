# MY GERMAN DÖNER — Operations Control Suite
## Project Constitution (`gemini.md`)

> **Last Updated:** 2026-08-24T12:30:00+03:00  
> **Phase:** Full Enterprise Build (PRD & Technical Architecture v3.0)  
> **Status:** In Development (Audit Complete) • Multi-Location (Emba / Paphos & Limassol Marina) • Aligned with `mygermandoener.com`

---

## 1. Product Requirements & Architectural Separation

### Mission & Client Identity
Build an enterprise-grade connected operations suite for **MY GERMAN DÖNER** fast-casual restaurants in Cyprus.

- **Official Live Website:** `https://mygermandoener.com/`
- **Slogans:** `"BITE THE HYPE"`, `"THE FIRST REAL GERMAN DOENER IN CYPRUS"`
- **Flagship Location:** `Pavlides Court, Agíou Stefánou Street 134, 8260 Emba, Paphos, Cyprus`
- **Second Location (Delivery-First ~80%):** `Limassol Marina Commercial Promenade, Limassol`

### Shopify & Link4Pay Separation of Concerns
1. **Commerce, POS Catalog & Card Settlement:** Owned by **Shopify** (Admin/Storefront GraphQL APIs, Webhooks) and **Link4Pay** card terminals.
2. **Operations & Kitchen Execution:** Owned by the **Custom Ops Backend** (Recipe BOMs, Shift Checklists, KDS queues, Supplier automation, HACCP compliance, and Digital Menu Boards).
3. **Zero Data Duplication:** Custom backend maps directly to canonical Shopify IDs without copying redundant catalog/payment records.

---

## 2. Canonical Module Scope (PRD Section 6)

| # | Module | Summary & Primary Surfaces |
|:---:|:---|:---|
| **M1** | **Checklists** | Staff tablet — opening/closing tasks, fridge temp logging (`tasksJson`, `logsJson`) |
| **M2** | **Product/Price DB** | HQ-authoritative product and pricing source (`Product.basePrice`, `LocationPrice`) |
| **M3** | **Inventory (gram-level BOM)** | Recipe-level stock consumption, incl. shared spit-meat depletion & dynamic `Product.isAvailable` |
| **M4** | **WhatsApp Supplier Ordering** | Automated reorder triggers to suppliers (`>€250` owner approval gate) |
| **M5** | **KDS** | Multi-station kitchen display, aging-ticket escalation (`GRILL`, `ASSEMBLY`, `FRYER`) |
| **M6** | **Pre-Order Web App** | Customer-facing pre-order / drive-through ordering with dynamic wait times |
| **M7** | **Scheduling** | Staff shift scheduling & PIN timeclock |
| **M8** | **Training Guides** | Build-sheet reference material for staff (McDonald's-style visual SOPs) |
| **M9** | **Reporting** | HQ analytics dashboard, labor overlay & Cyprus 19% VAT reporting |
| **M10** | **Digital Menu Boards** | 4x 4K physical signage screens (per PRD M10), with `MenuBoardConfig` supporting up to 7 content-rotation slots in CMS |
| **M11** | **POS Till** | In-store order and payment capture (fast-tap counter till, drawer solenoid, ESC/POS printing) |

---

## 3. Core Brand Design Tokens & OKLCH Architecture

| Token | OKLCH Value | HEX Fallback | Usage |
|:------|:------------|:-------------|:------|
| `--mygd-charcoal` | `oklch(0.18 0.005 285)` | `#1F1F21` | Dark Graphite Background / Canvas |
| `--mygd-surface` | `oklch(0.24 0.005 285)` | `#2B2B2E` | Card & Container Surfaces |
| `--mygd-border` | `oklch(0.30 0.008 285)` | `#3A3A3E` | Input borders & Dividers |
| `--mygd-magenta` | `oklch(0.60 0.28 350)` | `#E50D7E` | Electric Neon Magenta (Primary CTA, Prices, Active) |
| `--mygd-cyan` | `oklch(0.88 0.16 200)` | `#00FCED` | Electric Neon Cyan (Secondary Badges, Highlights) |
| `--mygd-gold` | `oklch(0.75 0.18 75)` | `#E5A93C` | Popular Badges & VIP Accents |
| `--mygd-green` | `oklch(0.65 0.18 145)` | `#4CAF50` | Vegetarian & Success States |
| `--mygd-red` | `oklch(0.58 0.22 25)` | `#E53935` | Spicy Flame, Critical HACCP & Void Alerts |
| `--font-display` | `Oswald` | — | High-impact headlines, category titles, CTAs |
| `--font-body` | `Figtree` | — | Legible body copy, descriptions |
| `--font-mono` | `JetBrains Mono` | — | Receipts, order IDs, VAT calculations |

---

## 4. Food Safety & HACCP Compliance (EU Regulation (EC) 852/2004)

- ❄️ **Chilled Storage (Walk-in Fridges / Prep Counters):** **`0°C – 5°C`** (Target: `3.0°C`)
- 🧊 **Frozen Storage (Deep Freezers):** **`-18°C – -22°C`**
- 🔥 **Hot-Holding (Cooked Rotisserie Döner Meat):** **`≥ 63°C`** (Target: `65°C – 75°C`)
- ⚠️ **HACCP Danger Zone:** **`5°C – 63°C`** — Trigger immediate corrective action note, warning audit log, and manager escalation.

---

## 5. Curated High-Value Application Features

1. **"Döner Club" Loyalty & Voucher Engine:** Promo code redemption (`BITETHEHYPE` 10% off, `MYGD20` 20% off, `CYPRUS5` €5 off) with dynamic Cyprus 19% VAT recalculation.
2. **3-Step Visual Customizer:** Meat weights (`Standard 150g`, `Small 100g`, `Mini 75g`), bread choices, homemade sauces (up to 3 free), and €1 extras (Grilled Halloumi, Greek Feta, Fries inside).
3. **5-Flame Spice Meter:** From `Level 1: Mild` to `Level 5: Hölle!` with extreme spice safety confirmation modal.
4. **One-Tap Meal Combo Upsell:** Bundle any döner with crispy Berlin fries and 330ml drink (+€3.50).
5. **Dietary & Allergen Filter Matrix:** Instant menu filtering for `🌱 Veggie / Falafel`, `🔥 Spicy Kick`, and `⭐ Top Sellers`.
6. **Dynamic Kitchen Load & Smart Wait Estimator:** Live queue calculation (`~4-6 mins` off-peak to `~12-15 mins` peak).
7. **Digital e-Receipt & QR Pass:** Smartphone QR code on confirmation for paperless receipts.
8. **Dynamic Inventory-Driven Sold Out:** Products set `Product.isAvailable = false` automatically when ingredient stock reaches zero via M3 BOM deductions. Manual toggles are prohibited.

---

## 6. Database Schema (Prisma ORM / SQLite WAL Mode)

Source file: [`prisma/schema.prisma`](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/prisma/schema.prisma)

### 15 Core Enterprise Models
1. **`Location`** — Multi-store configuration (Emba, Limassol).
2. **`Terminal`** — Kiosk & POS hardware configs (Epson TM / Star Micronics).
3. **`Category`** — Localized EN/DE/GR categories.
4. **`Product`** — Master items with `Product.basePrice` and `Product.isAvailable`.
5. **`LocationPrice`** — Store-specific price overrides (M2).
6. **`ModifierGroup`** & **`Modifier`** — Customization choices with price adjustments.
7. **`ProductModifierGroup`** — Join table for product customizers.
8. **`Ingredient`** & **`Recipe`** & **`RecipeIngredient`** — Gram-precision BOM and yield definitions.
9. **`InventoryItem`** — Location-specific stock levels (`currentStock`, `minThreshold`).
10. **`RecipeStep`** — McDonald's-style visual assembly SOP build sheets (M8).
11. **`Supplier`** & **`SupplierOrder`** — 1-tap reordering, WhatsApp dispatch, and >€250 approval gates (M4).
12. **`ChecklistTemplate`** & **`ChecklistLog`** — Digital SOPs and HACCP logs stored strictly as JSON (`tasksJson`, `logsJson`) (M1).
13. **`ShiftSchedule`** & **`TimeLog`** — Published rosters and 4-digit PIN timeclock records (M7).
14. **`Order`**, **`OrderItem`**, **`OrderItemModifier`** — Order snapshots with Cyprus 19% VAT.
15. **`KitchenTicket`** — KDS queue, station routing, and claim collision locks (M5).
16. **`MenuBoardConfig`** — Screen CMS configurations (4 physical screens; up to 7 rotation slots) (M10).
17. **`AdminUser`** & **`AuditLog`** — Bcrypt PIN authentication and security audit trail.
18. **`SyncQueue`** — Outbound bi-directional cloud sync queue.

---

## 7. Multi-Device Routes & Operational Runbooks

| Route | Target Device | Resolution | Role |
|:------|:--------------|:-----------|:-----|
| `/` | Portrait Touch Kiosk | 1080×1920 | Self-service ordering |
| `/pos` | Countertop Cashier Till | 1024×768 (Landscape) | Rapid counter POS (M11) |
| `/kds` | Kitchen Display Monitor | 1920×1080 (16:9) | Real-time line cooking (M5) |
| `/display` | Customer Status TV Board | 1920×1080 (16:9) | Waiting area pickup board |
| `/staff` | Wall Station Tablet | 1024×768 (Landscape) | Checklists (M1), Timeclock (M7), Build Sheets (M8) |
| `/boards` | Overhead TVs | 1920×1080 (16:9) | Menu Board Player (M10 - 4 Screens, 7 Rotation Slots) |
| `/order` | Smartphone Mobile Browser | 390×844 (Portrait) | Pre-Order & Drive-Through (M6) |
| `/admin` | Store Backoffice Portal | 1440×900+ (Desktop) | Analytics (M9), Pricing (M2), Suppliers (M4) |

### Build & Verification Commands
```bash
# Seed Database with official menu & staff accounts
npx tsx prisma/seed.ts

# Run Unit Tests
npm test

# Production Compile (Next.js Turbopack)
npm run build

# Start Dev Server
npm run dev
```
