<div align="center">

# 🥙 MY GERMAN DÖNER — Operations Control Suite
### Enterprise Connected Restaurant Operations, Kiosk, POS, KDS & Signage Platform
**PRD & Technical Architecture v3.0**

[![Next.js](https://img.shields.io/badge/Next.js-15.0.0-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Status](https://img.shields.io/badge/Status-In_Development_(Audit_Complete)-yellow?style=for-the-badge)](https://mygermandoener.com)

**[🌐 Official Website](https://mygermandoener.com/)** • **[📑 Master Index](./Documents/00_CLIENT_PRESENTATION_PACKAGE_INDEX.md)** • **[🎨 Design System](./DESIGN.md)** • **[🏛️ Architecture](./Documents/MYGD_Technical_Architecture.md)**

</div>

---

## 🌟 Executive Overview

**MY GERMAN DÖNER (MYGD)** Operations Control Suite is an enterprise-grade, multi-location restaurant management and real-time operations engine built for high-throughput fast-casual döner restaurants in Cyprus (Flagship: **Emba / Paphos**, Delivery Hub: **Limassol Marina**).

The system replaces fragmented operational practices (paper food-safety logs, ad-hoc supplier messaging, manual shift scheduling, and disconnected registers) with a single, unified, offline-resilient architecture featuring **Zero-Internet Edge Continuity**, **Real-Time Event Infrastructure (WebSocket/SSE)**, and **Strict Shopify Commerce & Link4Pay Separation**.

---

## 🏛️ System Topology & Separation of Concerns

```mermaid
graph TD
    subgraph "COMMERCE LAYER (Shopify Cloud & Link4Pay)"
        SHOP_ADMIN["Shopify Admin API (Products, Variants, Customers)"]
        SHOP_POS["Shopify POS Till & Catalog SSOT"]
        L4P["Link4Pay Payment Terminals (Card Settlement)"]
    end

    subgraph "OPERATIONS BACKEND & REAL-TIME ENGINE (Custom Next.js / Node.js)"
        M1_CHECK["M1: Checklists (tasksJson/logsJson)"]
        M2_CATALOG["M2: Product/Price DB (HQ Authority)"]
        M3_BOM["M3: Inventory (Gram-Level BOM & Spit Depletion)"]
        M4_SUPP["M4: WhatsApp Supplier Ordering (>€250 Approval Gate)"]
        M5_KDS_ENG["M5: KDS (Station Routing & Claim Locks)"]
        M6_PRE["M6: Pre-Order Web App (Dynamic Wait Calculation)"]
        M7_ROSTER["M7: Scheduling (Shift Scheduling & PIN Timeclock)"]
        M8_BUILD["M8: Training Guides (Build-Sheet Reference Material)"]
        M9_REP["M9: Reporting (HQ Analytics & Cyprus 19% VAT)"]
        M10_CMS["M10: Digital Menu Boards (4x 4K Screens, 7 Rotation Slots)"]
        M11_POS["M11: POS Till (In-Store Order & Payment Capture)"]
        WS_HUB["Real-Time Event Dispatcher (WebSocket / SSE)"]
    end

    subgraph "LAYER 1 & 2: IN-STORE EDGE TOUCHPOINTS (Local LAN <2ms)"
        KIOSK["Self-Service Touch Kiosk (/ - 1080x1920 Portrait)"]
        POS_APP["Countertop Cashier Till (/pos - 1024x768 Landscape)"]
        KDS_MON["Kitchen Display System (/kds - 1920x1080 Landscape)"]
        TV_DISP["Customer Order Status TV (/display - 1920x1080)"]
        STAFF_TAB["Staff Station Tablet (/staff - 1024x768)"]
        BOARDS["Signage Menu Boards (/boards - 1920x1080)"]
        PRE_ORDER["Mobile Web Pre-Order (/order - 390x844 Smartphone)"]
        ADMIN_PORT["Store Manager & Owner HQ (/admin - Desktop/Tablet)"]
    end

    SHOP_ADMIN <-->|Webhooks & GraphQL| WS_HUB
    WS_HUB <===>|Real-Time State Push| KIOSK
    WS_HUB <===>|Real-Time State Push| POS_APP
    WS_HUB <===>|Real-Time State Push| KDS_MON
    WS_HUB <===>|Real-Time State Push| TV_DISP
    WS_HUB <===>|Real-Time State Push| STAFF_TAB
    WS_HUB <===>|Real-Time State Push| BOARDS
    WS_HUB <===>|Real-Time State Push| ADMIN_PORT
    M3_BOM -->|Computed Stock Status (isAvailable)| WS_HUB
```

### Separation of Responsibilities:
1. **Commerce, Products & Card Payments:** Managed by **Shopify Admin/Storefront APIs** and settled via **Link4Pay** card terminals.
2. **Operations & Kitchen Execution:** Managed by the custom **Ops Backend** (Recipe BOMs, Shift Checklists, KDS queues, Supplier automation, and HACCP compliance).
3. **Zero Data Duplication:** Operational models reference canonical Shopify IDs without copying redundant commerce records.

---

## 🚀 Key Modules & Capabilities (PRD Section 6)

| # | Module | Route / Surface | Summary & Functional Scope |
|:---:|:---|:---:|:---|
| **M1** | **Checklists** | `/staff` | Staff tablet — opening/closing tasks, numeric fridge/freezer HACCP temperature logging with danger-zone alerts. Stored as JSON (`tasksJson`, `logsJson`). |
| **M2** | **Product/Price DB** | Core DB / `/admin` | HQ-authoritative product and pricing source with `Product.basePrice`, localized copy (EN/DE/GR), and store overrides (`LocationPrice`). |
| **M3** | **Inventory (gram-level BOM)** | Core DB / `/admin` | Recipe-level stock consumption, incl. shared spit-meat depletion, 15:30 bakery reorder warnings, and dynamic `Product.isAvailable` compute. |
| **M4** | **WhatsApp Supplier Ordering** | `/admin` | Automated reorder triggers to suppliers via WhatsApp/Email, duplicate order shield, and `>€250` owner approval gate. |
| **M5** | **KDS** | `/kds` | Multi-station kitchen display (`GRILL`, `ASSEMBLY`, `FRYER`), aging-ticket color escalation (Green `<4m`, Amber `4-8m`, Red `>8m`), cook claim collision locks. |
| **M6** | **Pre-Order Web App** | `/order` | Customer-facing pre-order / drive-through ordering with dynamic wait times calculated from live KDS queue depth. Optimised for Limassol (~80% delivery). |
| **M7** | **Scheduling** | `/staff` | Staff shift scheduling, 4-digit PIN timeclock (`Clock In`, `Break`, `Clock Out`), role-filtered task portals (Slicers, Assemblers, Cashiers). |
| **M8** | **Training Guides** | `/staff` | Build-sheet reference material for staff — McDonald's-style visual assembly guides, portioning standards, and sauce dosing sequence rules. |
| **M9** | **Reporting** | `/admin` | HQ analytics dashboard — live sales velocity, average ticket, labor cost overlay, Cyprus 19% VAT ledger, and real-time net profit computation. |
| **M10** | **Digital Menu Boards** | `/boards` | 4x 4K physical signage screens (per PRD M10), with `MenuBoardConfig` supporting up to 7 content-rotation slots / dayparts in CMS. |
| **M11** | **POS Till** | `/pos` | In-store order and payment capture — fast-tap counter till, split billing, 10%/20% discount toggles, cash drawer RJ12 solenoid kick, ESC/POS thermal printing. |

---

## 🛡️ Food Safety & HACCP Thresholds

Adhering to strict EU Regulation (EC) 852/2004 food-safety and HACCP compliance standards:
- ❄️ **Chilled Storage (Walk-in Fridges / Prep Coolers):** **`0°C – 5°C`** (Target: `3.0°C`)
- 🧊 **Frozen Storage (Deep Freezers):** **`-18°C – -22°C`**
- 🔥 **Hot-Holding (Cooked Rotisserie Döner Meat):** **`≥ 63°C`** (Target: `65°C – 75°C`)
- ⚠️ **HACCP Danger Zone:** **`5°C – 63°C`** — Any recorded reading within this range triggers an immediate corrective action prompt, amber/red visual flashing, and manager notification.

---

## 🎨 Design System & Visual Identity

Engineered using **OKLCH Color Spaces** extracted from the live production website:
- **Canvas / Charcoal:** `oklch(0.18 0.005 285)` (`#1F1F21`)
- **Surface Cards:** `oklch(0.24 0.005 285)` (`#2B2B2E`)
- **Borders & Dividers:** `oklch(0.30 0.008 285)` (`#3A3A3E`)
- **Electric Neon Magenta (Primary CTA):** `oklch(0.60 0.28 350)` (`#E50D7E`)
- **Electric Neon Cyan (Badges & Accents):** `oklch(0.88 0.16 200)` (`#00FCED`)
- **Döner Gold (Bestsellers):** `oklch(0.75 0.18 75)` (`#E5A93C`)
- **Typography:** `Oswald` (Headlines / CTAs), `Figtree` (Body / Descriptions), `JetBrains Mono` (Receipts, VAT, IDs).
- **Touch Ergonomics:** Minimum 48px touch targets, recommended 64–80px for primary kiosk actions.

---

## 💾 Database Schema (15 Prisma Models)

The system is backed by Prisma ORM with strict field conventions:
1. `Location` — Multi-branch configuration (Emba, Limassol).
2. `Terminal` — Hardware client registry (Kiosk, POS, KDS, Display, Staff, Boards).
3. `Category` — Trilingual category definitions (EN, DE, GR).
4. `Product` — Master items with `Product.basePrice` and `Product.isAvailable`.
5. `LocationPrice` — Store-specific price overrides.
6. `ModifierGroup` — Customization categories (Meats, Breads, Sauces, Extras).
7. `Modifier` — Individual modifier options and price adjustments.
8. `ProductModifierGroup` — Join table associating modifier groups with products.
9. `Ingredient` — Raw ingredients (Beef Spit, Chicken Spit, Fladenbrot, Sauces).
10. `Recipe` — Product Bill of Materials (BOM) yield and preparation specs.
11. `RecipeIngredient` — Recipe-to-ingredient quantity links.
12. `InventoryItem` — Location-specific stock levels (`currentStock`, `minThreshold`).
13. `RecipeStep` — Visual assembly steps for M8 build sheets.
14. `Supplier` — Vendor contacts, categories, and lead times.
15. `SupplierOrder` — Purchase orders, status lifecycle, and snapshot payloads.
16. `ChecklistTemplate` — SOP routines with `tasksJson`.
17. `ChecklistLog` — Attributable completions with `logsJson`.
18. `ShiftSchedule` — Published roster shifts.
19. `TimeLog` — PIN timeclock punches (`clockIn`, `clockOut`, `totalMinutes`).
20. `Order` — Customer transactions (`{LOCATION}-{YYYYMMDD}-{HHmm}-{SEQ}`).
21. `OrderItem` — Order line items with spice levels and meal bundles.
22. `OrderItemModifier` — Applied modifier snapshots.
23. `KitchenTicket` — Station routing tickets and status progression.
24. `MenuBoardConfig` — Screen CMS configurations (4 physical screens; up to 7 rotation slots).
25. `AdminUser` — Bcrypt-hashed staff & manager PIN authentication.
26. `AuditLog` — Immutable security and override audit log.
27. `SyncQueue` — Outbound bi-directional cloud sync queue.

---

## 🛠️ Verification & Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Seed Database with official menu & staff accounts
npx tsx prisma/seed.ts

# 3. Run Automated Unit & Integration Tests
npm test

# 4. Compile Production Next.js Bundle (Turbopack)
npm run build

# 5. Start Development Server
npm run dev
```

---

## 📄 License & Credits

**Client:** MY GERMAN DÖNER TRADING LTD (Rico & Oliver, Owners / Managing Directors)  
**Lead Systems Architect & Developer:** **Md. Saied Sagar** ([@sagorxo](https://github.com/sagorxo))  
*Built with precision for MY GERMAN DÖNER Cyprus. © 2026 MY GERMAN DÖNER. All rights reserved.*
