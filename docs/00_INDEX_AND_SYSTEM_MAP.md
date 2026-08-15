# MY GERMAN DÖNER — Connected Operations Control System
## Master System Documentation Index (`docs/00_INDEX_AND_SYSTEM_MAP.md`)

> **Client:** MY GERMAN DÖNER (Rico & Oli, Founders; Markus, Project Lead)  
> **Target Locations:** Emba / Paphos (Flagship Live), Limassol Marina (In Setup)  
> **System Architecture:** 3-Layer Connected Operations (Layer 1 Devices, Layer 2 In-Store Offline Hub, Layer 3 HQ Control Center)  
> **Mission:** Replace 12 fragmented tools with one cohesive, measurable, offline-resilient platform.

---

## 📚 Complete Documentation Suite

| Document | Title & Focus | Target Module / Area |
|:---|:---|:---|
| [`01_LAYERED_ARCHITECTURE_AND_OFFLINE_SYNC.md`](./01_LAYERED_ARCHITECTURE_AND_OFFLINE_SYNC.md) | 3-Layer Model, Local SQLite WAL, Bi-Directional 30s Sync Queue | Architecture & Layer 2 Core |
| [`02_M1_CHECKLISTS_AND_DIGITAL_LOGBOOK.md`](./02_M1_CHECKLISTS_AND_DIGITAL_LOGBOOK.md) | Opening/Closing SOPs, Temperature Logging, Overdue Escalations | Module M1 (Phase 1) |
| [`03_M2_SUPPLIER_ORDERING_AND_APPROVALS.md`](./03_M2_SUPPLIER_ORDERING_AND_APPROVALS.md) | 1-Tap Reordering, WhatsApp/Email Dispatch, Spend Limits | Module M2 (Phase 2) |
| [`04_M3_GRAM_PRECISION_INVENTORY.md`](./04_M3_GRAM_PRECISION_INVENTORY.md) | Gram-Level Recipe Consumption, Predictive Reorder Triggers | Module M3 (Phase 5) |
| [`05_M4_POS_CASHIER_TILL.md`](./05_M4_POS_CASHIER_TILL.md) | Counter Till, Fast-Tap Grid, Split Billing, Drawer Kick, Card Pass-Through | Module M4 (Phase 7) |
| [`06_M5_KITCHEN_DISPLAY_SYSTEM.md`](./06_M5_KITCHEN_DISPLAY_SYSTEM.md) | Station Routing (Grill/Assembly/Fryer), Claim Locks, Urgency Alerts | Module M5 (Phase 7) |
| [`07_M6_PRE_ORDER_AND_DRIVE_THROUGH.md`](./07_M6_PRE_ORDER_AND_DRIVE_THROUGH.md) | Mobile Web Ordering, Dynamic Wait Calculation, Drive-Through Queue | Module M6 (Phase 8) |
| [`08_M7_SCHEDULING_AND_TIME_TRACKING.md`](./08_M7_SCHEDULING_AND_TIME_TRACKING.md) | Shift Scheduling, PIN Clock-In/Out, Role-Specific Task Views | Module M7 (Phase 4) |
| [`09_M8_BUILD_SHEETS_AND_TRAINING.md`](./09_M8_BUILD_SHEETS_AND_TRAINING.md) | McDonald's-Style Step-by-Step Visual Assembly Guides & Training | Module M8 (Phase 5) |
| [`10_M9_EXECUTIVE_REPORTING_AND_ANALYTICS.md`](./10_M9_EXECUTIVE_REPORTING_AND_ANALYTICS.md) | Net Profit Analytics, Cyprus 19% VAT, Labor/COGS, Cross-Location | Module M9 (Phase 3) |
| [`11_M10_7_SCREEN_DIGITAL_MENU_BOARDS.md`](./11_M10_7_SCREEN_DIGITAL_MENU_BOARDS.md) | 7-Screen Overhead Menu CMS, Dayparting, Screen Health Alerts | Module M10 (Phase 6) |
| [`12_M11_MASTER_PRODUCT_AND_PRICE_DATABASE.md`](./12_M11_MASTER_PRODUCT_AND_PRICE_DATABASE.md) | Single Source of Truth for Prices, Multi-Store Overrides, Recipes | Module M11 (Phase 2) |
| [`13_ALL_SCREENS_AND_HARDWARE_SPECIFICATIONS.md`](./13_ALL_SCREENS_AND_HARDWARE_SPECIFICATIONS.md) | Hardware Requirements, Viewports, Touch Gestures, Printer Solenoids | Multi-Device Deployment |

---

## 🖥️ Screen & Route Registry

| Screen Route | Device Persona | Resolution & Form Factor | Core Purpose |
|:---|:---|:---|:---|
| [`/`](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/src/app/page.tsx) | Guest Customer | 1080×1920 Portrait Touch Kiosk | Self-Service Touch Ordering (Attract, Menu, Customizer, Cart, Payment, Confirmation) |
| [`/pos`](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/src/app/pos/page.tsx) | Cashier / Till Staff | 1024×768 Landscape Tablet | High-Speed Countertop Cashier Register (Split bill, discounts, drawer kick) |
| [`/kds`](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/src/app/kds/page.tsx) | Grill Cook / Line Assembly | 1920×1080 Landscape 16:9 Monitor | Station-routed Kitchen Display with Claim Locks & Bump/Recall |
| [`/display`](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/src/app/display/page.tsx) | Waiting Customers | 1920×1080 Landscape Overhead TV | Order Status Pickup Board with Chime Audio & Live Clock |
| [`/admin`](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/src/app/admin/page.tsx) | Store Manager / Owners | 1440×900+ Widescreen Desktop/Mobile | Operations, Sales KPIs, Cyprus 19% VAT, Stock Switches & Hardware Control |
| [`/staff`](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/src/app/staff/page.tsx) | Store Crew & Slicers | 1024×768 Wall-Mounted Tablet | Digital Checklists (M1), PIN Timeclock (M7), Visual Build Sheets (M8) |
| [`/boards`](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/src/app/boards/page.tsx) | Overhead TVs (Screens 1–7) | 1920×1080 Landscape / Portrait | 7-Screen Centrally Controlled Digital Menu Board Player (M10) |
| [`/order`](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/src/app/order/page.tsx) | Mobile Drive-Through Guest | 390×844 Smartphone Web App | Pre-Order & Drive-Through with calculated pickup time (M6) |
