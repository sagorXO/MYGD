# 🥙 MY GERMAN DÖNER — Connected Operations Control System
## Complete System Status, Architecture & Handoff Brief

> **Target Readership:** AI Assistants (Gemini / Claude), Engineers, Founders (Rico & Oli), and Project Lead (Markus).  
> **Repository Location:** `/Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD`  
> **Last Verified:** 2026-08-15 | **Build Status:** 100% Production Ready (0 Errors)

---

## 1. Executive Summary & Client Background

**MY GERMAN DÖNER** is a fast-casual restaurant chain operating in Cyprus:
- **Flagship Store (Live):** Pavlides Court, Agíou Stefánou Street 134, 8260 Emba, Paphos, Cyprus.
- **Second Location (In Setup):** Limassol Marina Commercial Promenade, Limassol.
- **Official Live Website:** `https://mygermandoener.com/`
- **Slogans:** `"BITE THE HYPE"`, `"THE FIRST REAL GERMAN DOENER IN CYPRUS"`.
- **Client Decision-Makers:** Rico & Oli (Founders/Owners), Markus (Project Lead).

### The Core Problem Solved
The business was previously run on **12 disconnected tools & chaotic manual habits**:
- Shouted verbal instructions & paper notes.
- Ad-hoc WhatsApp ordering resulting in duplicate orders and late evening stock-outs (*"we're out of bread"* after baker closing hours).
- High ConnectTeam subscription fees for basic scheduling.
- Canva + USB flash drives for overhead menu boards requiring manual walking to each TV.
- A legacy electronic POS till dating back to the year 2000.
- Zero remote visibility into revenue, labor cost, food safety temps, or store performance when owners were off-site.

**The Solution:** Built **"One connected operations system instead of twelve separate tools"**, fully offline-resilient, beautifully branded, and manageable from anywhere.

---

## 2. The 3-Layer System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      LAYER 3: HQ / CONTROL CENTER                       │
│    (Cloud / Mobile Web — Accessible by Rico, Oli & Markus Remotely)     │
│  - M11: Master Catalog, BOM Recipes & Multi-Store Price Overrides       │
│  - M9: Remote Executive Analytics, Daily Net Profit & Cyprus 19% VAT   │
│  - M2: Supplier Purchase Orders & Spending Approval Engine (>€250)      │
│  - M7: Centralized Roster Planning & ConnectTeam Replacement            │
│  - M10: 7-Screen Digital Menu Board Layout CMS                          │
│  - M1: Digital SOP & Checklist Template Builder                         │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ 30-Second Bi-Directional
                                     │ HTTP Sync Queue (Fail-Safe)
┌────────────────────────────────────▼────────────────────────────────────┐
│                      LAYER 2: IN-STORE LOCAL HUB                        │
│          (Local In-Store Mini-PC Server running SQLite WAL Mode)        │
│  - Embedded SQLite Database (Full Local Snapshot on Store LAN)          │
│  - Real-Time POS Engine (100% Offline Capable without Internet)         │
│  - Multi-Station Kitchen Display (KDS) Synchronization (M5)             │
│  - Dual Thermal Printer Spoolers (Epson TM ESC/POS & StarPRNT)          │
│  - RJ12 Cash Drawer Solenoid Pulse Controller                           │
│  - Offline Transaction Buffer & Auto-Replay Engine                      │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ In-Store Low-Latency
                                     │ WebSocket / Local REST
┌────────────────────────────────────▼────────────────────────────────────┐
│                         LAYER 1: STORE DEVICES                          │
│  - Self-Service Kiosks: 1080x1920 Portrait Touchscreens (Route: `/`)    │
│  - Cashier Till: 1024x768 Countertop Tablet (Route: `/pos`)             │
│  - Kitchen Line Screens: 1920x1080 Monitors (Route: `/kds`)             │
│  - Customer Status TV Board: 1920x1080 Pickup Screen (Route: `/display`)│
│  - Staff Wall Tablet: 1280x800 Station (Route: `/staff`)                │
│  - 7x Overhead Digital Menu Boards: HDMI Players (Route: `/boards`)     │
│  - Mobile Web Pre-Order & Drive-Through: Smartphone (Route: `/order`)   │
│  - Store Manager Backoffice: Desktop / Tablet (Route: `/admin`)         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. The 11 Operational Building Blocks (M1 to M11)

| Module | Name & Focus | Route / Screen | Key Functionality |
|:---|:---|:---:|:---|
| **M1** | **Checklists & Logbook** | `/staff` | Opening (08:30), lunch prep, closing checklists, and walk-in fridge/freezer HACCP temperature logs with overdue auto-escalation. |
| **M2** | **Supplier Ordering & Approvals** | `/admin` | 1-Tap reorder to bakery/meat purveyors via WhatsApp API / Email, duplicate order prevention, and Oli spending approval thresholds (>€250). |
| **M3** | **Gram-Precision Inventory** | Database Core | Recipe-level deduction per sale (150g meat, bread count, sauce weights), predictive 15:30 bakery reorder warnings, waste tracking. |
| **M4** | **POS Cashier Till** | `/pos` | Fast-tap till, card terminal pass-through, split billing, discounts (`10%`, `20% Staff`), RJ12 drawer kick, full offline SQLite resilience. |
| **M5** | **Kitchen Display (KDS)** | `/kds` | Station routing (`GRILL`, `ASSEMBLY`, `FRYER`), cook claim collision locks, urgency color timers (Green `<4m`, Amber `4-8m`, Red `>8m`), Bump & Recall. |
| **M6** | **Pre-Order & Drive-Through** | `/order` | Mobile web ordering with dynamic pickup wait time calculated dynamically from active KDS queue depth. |
| **M7** | **Scheduling & Time Tracking** | `/staff` | Replaces ConnectTeam with in-store geofenced 4-digit PIN timeclock (`Clock In`, `Break`, `Clock Out`) and role-filtered task views. |
| **M8** | **Visual Build Sheets** | `/staff` | McDonald's-style step-by-step visual assembly sheets with photos and sauce dosing sequence rules for all products. |
| **M9** | **Executive Remote Reporting** | `/admin` | Live gross revenue KPIs, average ticket, Cyprus 19% VAT reconciliation, estimated daily net profit, and cross-location comparison (Emba vs Limassol). |
| **M10** | **7-Screen Menu Board CMS** | `/boards` | Centralized 7-screen menu board controller with automated dayparting (Lunch combo vs Dinner) and dark screen heartbeat alerts. |
| **M11** | **Master Product & Price DB** | Database Core | Single source of truth for products, prices, recipes, per-location overrides, and supplier costs. |

---

## 4. Live Brand & Visual Aesthetics (Berlin Minimalist)

Fully aligned with the live website `https://mygermandoener.com/`:
- **Dark Graphite Canvas:** `#121214` / `#1F1F21`
- **Surface Cards:** `#1A1A1E` / `#2B2B2E` (Borders: `#27272A` / `#3A3A3E`)
- **Electric Neon Magenta (Primary CTA & Highlights):** `#E50D7E`
- **Electric Neon Cyan (Secondary Badges & Data):** `#00FCED`
- **Typography:**
  - Headlines & CTAs: `Oswald` (Google Font)
  - Body & Descriptions: `Figtree` (Google Font)
  - Receipts, Currency & Order IDs: `JetBrains Mono`

---

## 5. Security & Fiscal Specifications

- **Cyprus 19% VAT:** Correct gross-to-net derivation:
  $$\text{Net Subtotal} = \frac{\text{Gross Total}}{1.19}, \quad \text{VAT (19\%)} = \text{Gross Total} - \text{Net Subtotal}$$
- **Zero-Trust Pricing:** Client-sent prices are discarded; prices and taxes are calculated server-side from SQLite.
- **Bcrypt PIN Authentication:**
  - `admin` (PIN: `9999`) — HQ System Administrator
  - `manager` (PIN: `1234`) — Store Manager
  - `cashier` (PIN: `1111`) — Cashier Till #01
  - `staff` (PIN: `0000`) — Floor Crew & Kiosk Maintenance
  - 5 failed attempts trigger a 5-minute lockout and log to `AuditLog`.
- **Order Numbering Format:** `{LOCATION}-{YYYYMMDD}-{HHmm}-{SEQ}` (e.g. `EMBA-20260815-1423-047`).
- **Thermal Printer Drivers:** Built-in driver layer supporting **Epson TM (ESC/POS)** and **Star Micronics (StarPRNT)**.

---

## 6. Complete Documentation Directory Map

Detailed architectural SOPs are saved in `docs/`:
- [`docs/00_INDEX_AND_SYSTEM_MAP.md`](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/docs/00_INDEX_AND_SYSTEM_MAP.md)
- [`docs/01_LAYERED_ARCHITECTURE_AND_OFFLINE_SYNC.md`](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/docs/01_LAYERED_ARCHITECTURE_AND_OFFLINE_SYNC.md)
- [`docs/02_M1_CHECKLISTS_AND_DIGITAL_LOGBOOK.md`](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/docs/02_M1_CHECKLISTS_AND_DIGITAL_LOGBOOK.md)
- [`docs/03_M2_SUPPLIER_ORDERING_AND_APPROVALS.md`](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/docs/03_M2_SUPPLIER_ORDERING_AND_APPROVALS.md)
- [`docs/04_M3_GRAM_PRECISION_INVENTORY.md`](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/docs/04_M3_GRAM_PRECISION_INVENTORY.md)
- [`docs/05_M4_POS_CASHIER_TILL.md`](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/docs/05_M4_POS_CASHIER_TILL.md)
- [`docs/06_M5_KITCHEN_DISPLAY_SYSTEM.md`](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/docs/06_M5_KITCHEN_DISPLAY_SYSTEM.md)
- [`docs/07_M6_PRE_ORDER_AND_DRIVE_THROUGH.md`](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/docs/07_M6_PRE_ORDER_AND_DRIVE_THROUGH.md)
- [`docs/08_M7_SCHEDULING_AND_TIME_TRACKING.md`](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/docs/08_M7_SCHEDULING_AND_TIME_TRACKING.md)
- [`docs/09_M8_BUILD_SHEETS_AND_TRAINING.md`](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/docs/09_M8_BUILD_SHEETS_AND_TRAINING.md)
- [`docs/10_M9_EXECUTIVE_REPORTING_AND_ANALYTICS.md`](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/docs/10_M9_EXECUTIVE_REPORTING_AND_ANALYTICS.md)
- [`docs/11_M10_7_SCREEN_DIGITAL_MENU_BOARDS.md`](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/docs/11_M10_7_SCREEN_DIGITAL_MENU_BOARDS.md)
- [`docs/12_M11_MASTER_PRODUCT_AND_PRICE_DATABASE.md`](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/docs/12_M11_MASTER_PRODUCT_AND_PRICE_DATABASE.md)
- [`docs/13_ALL_SCREENS_AND_HARDWARE_SPECIFICATIONS.md`](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/docs/13_ALL_SCREENS_AND_HARDWARE_SPECIFICATIONS.md)

---

## 7. Verification & Runbook Commands

```bash
# 1. Seed Database with official menu items, categories, and staff accounts:
npx tsx prisma/seed.ts

# 2. Run Automated Unit Tests:
npm test

# 3. Compile Production Next.js Bundle:
npm run build

# 4. Start Production Server:
npm run start
```
