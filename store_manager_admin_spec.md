# MY GERMAN DÖNER — Store Manager Admin & Analytics Portal Specification

> **Project ID:** `8267423676963551603`  
> **Design System:** `assets/344892017512994051`  
> **Device Type:** `DESKTOP` (Widescreen Backoffice Dashboard 1440x900)  
> **Created At:** 2026-08-15T19:37:00+03:00  

---

## 1. Visual Mockup & Screen Output

![Store Manager Admin & Analytics Portal](/Users/saiedsagar/.gemini/antigravity/brain/c02b9c39-e695-4ccb-af84-dab726ebcabb/store_manager_dashboard_1786811769546.jpg)

---

## 2. Screen Architecture & Visual Hierarchy

The **Store Manager Admin & Analytics Portal** is the central command center for store managers, franchise supervisors, and operational leadership. It operates in high-contrast German precision dark mode (#1A1A1A / #242424 / #FF5722 / #E5A93C) with real-time SSE/WebSocket data binding across all kiosks, POS tills, kitchen displays, and cloud receipt printers.

### A. Left Navigation Sidebar (240px Fixed Width)
1. **Brand Header:**
   - Visual: Flame grill badge with gradient `#FF5722` to `#FF8A65`
   - Title: `MY GERMAN DÖNER HQ`
2. **Navigation Items:**
   - **Overview (Active):** Signal orange pill background `#FF5722`/15 with glowing outline and `#FF5722` text.
   - **Live Orders:** Includes live pending badge with red tag `12 active`.
   - **Menu & Inventory CRUD:** Quick modifier and item catalogue management.
   - **Pricing & Locations:** Multi-store pricing tier control and VAT compliance.
   - **Hardware & Printers:** Direct peripheral telemetry and Star Micronics printer spooling.
   - **Staff & Security:** Shift pin management, cashier till locks, and audit trails.
   - **Reports & VAT:** Tax export (Cyprus 19% VAT) and end-of-day Z-Report reconciliation.
3. **Manager Shift Box:**
   - Current Manager: `Marco S. (Store Manager)`
   - Active Shift Counter: `06h 42m` with pulsating emerald green status dot
   - Quick Terminal Lock button.

---

### B. Top Header Bar
1. **Location Switcher:** `Emba Store #01` dropdown with active status indicator.
2. **Date Range Filter:** `Today: 15 Aug 2026` with calendar picker.
3. **Telemetry Status Pill:** `3 Kiosks Online · 2 POS Online · Printers OK (Star Micronics ESP/LAN)`.
4. **Cyprus VAT Rate Badge:** `CY VAT 19%` active tax calculation tag.
5. **Manager Profile & Notifications:** Unread operations alerts (3) and avatar dropdown.

---

### C. Top Row KPI Metric Cards (4 Cards)
1. **Today's Gross Sales (Highlighted Primary Card):**
   - Value: `€2,845.50` (Font size: 32px, bold `#FF5722`, glowing border)
   - Trend: `+14% vs last week` (+€352.10) with emerald upward trend tag.
2. **Total Orders:**
   - Value: `218 Orders`
   - Breakdown: `Avg Ticket: €13.05` · 124 Dine-in / 94 Takeaway & Delivery.
3. **Cyprus VAT (19%):**
   - Value: `€454.33 Collected`
   - Breakdown: `Net Sales: €2,391.17` with tax authority API reconciliation status.
4. **Average Kitchen Prep Time:**
   - Value: `5m 12s` (Target: `< 6m 00s`)
   - Status: `Optimal` (Emerald green badge linked to KDS).

---

### D. Main Content Layout (60% / 40% Split)

#### 1. Left Section (60% Width):
- **Live Hourly Sales & Order Flow Chart:** Dual-axis visualization (10:00 to 22:00) comparing hourly revenue bars (gradient `#FF5722`) and order volume lines (`#E5A93C`). Shows clear peaks during lunch rush (12:00-14:00) and dinner rush (18:30-20:30).
- **Top Selling Menu Items Table:**
  - *Classic Döner (Bread):* 88 sold · €704.00 revenue · 72% margin · `High Demand`
  - *Döner Spezial (Extra Sauce & Feta):* 54 sold · €513.00 revenue · 68% margin · `High Demand`
  - *Berlin Fries (Curry Sauce):* 92 sold · €322.00 revenue · 81% margin · `Steady`
  - *Ayran (250ml):* 65 sold · €130.00 revenue · 78% margin · `Normal`

#### 2. Right Section (40% Width):
- **Quick Inventory (86/Out-of-Stock) Toggles:** Instant one-click switch to disable items across all self-ordering kiosks and online menus.
  - *Beef Skewer (Rotisserie A):* 14.2 kg remaining (`IN STOCK`)
  - *Chicken Skewer (Rotisserie B):* 8.5 kg remaining (`IN STOCK`)
  - *Falafel Mix:* 45 portions remaining (`IN STOCK`)
  - *Halloumi Slices:* 6 portions left (`LOW STOCK` amber threshold alert)
  - *House Garlic Kräuter Sauce:* 12.0 L remaining (`IN STOCK`)
  - *Fresh Red Cabbage & Tomatoes:* 18.5 kg remaining (`IN STOCK`)
- **Hardware Telemetry Monitor:**
  - *Star Micronics Kitchen CloudPRNT:* `100% ONLINE` (IP: 192.168.1.104, Paper Roll 85%)
  - *Front POS Receipt Printer:* `100% ONLINE` (IP: 192.168.1.105, Paper Roll 92%)
  - *Kiosk Terminal 01 (Lobby Touch):* `100% ONLINE` (Verifone P400 connected)
  - *Kiosk Terminal 02 (Lobby Express):* `100% ONLINE` (Verifone P400 connected)
  - *Kiosk Terminal 03 (Drive-thru):* `100% ONLINE` (Verifone P400 connected)

---

## 3. Design Tokens & Palette

| Token | Hex / Value | Usage |
|:------|:------------|:------|
| `bg-app` | `#121212` | Main viewport background |
| `bg-primary` | `#1A1A1A` | Dashboard canvas surface |
| `bg-sidebar` | `#161616` | Left navigation sidebar |
| `bg-card` | `#242424` | Primary metric & widget cards |
| `bg-card-subtle` | `#1E1E1E` | Inner list items & telemetry rows |
| `border-subtle` | `#2E2E2E` / `#333333` | Card and divider borders |
| `brand-orange` | `#FF5722` | Gross sales card border, revenue values, logo |
| `brand-gold` | `#E5A93C` | Orders trend line, VAT pills, low stock alerts |
| `brand-green` | `#10B981` | Online telemetry status, growth rates, prep speed |
| `brand-red` | `#EF4444` | Live order alert badge, out-of-stock tag |
| `font-primary` | `Inter` | Primary text and UI controls |
| `font-display` | `Space Grotesk` | Brand title, headlines, card titles |
| `font-mono` | `JetBrains Mono` | Currency amounts, quantities, IP addresses |

---

## 4. Deliverables & Code Artifacts

- **Interactive HTML Prototype:** [store_manager_admin_screen.html](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/store_manager_admin_screen.html)
- **Production React Component:** [StoreManagerAdminDashboard.tsx](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/components/StoreManagerAdminDashboard.tsx)
- **Visual Mockup Artifact:** [store_manager_dashboard_1786811769546.jpg](file:///Users/saiedsagar/.gemini/antigravity/brain/c02b9c39-e695-4ccb-af84-dab726ebcabb/store_manager_dashboard_1786811769546.jpg)
