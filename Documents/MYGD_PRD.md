# 🥙 MY GERMAN DÖNER — Connected Operations Control System
## Master Product Requirements Document (PRD) — Revision 3 (Complete & Authoritative)

> **Document Status:** Complete & Engineering-Ready  
> **Last Updated:** 2026-08-23  
> **Authors:** Lead Solutions Architect & Engineering Team  
> **Client Stakeholders:** Rico & Oli (Founders / Decision-Makers), Markus (Project Lead)  
> **Sole Implementation Engineer:** Sagar  
> **Commercial Terms:** €30,000 Fixed Price (5 Milestones) + €500 / month Recurring Support  
> **Target Locations:** Emba / Paphos (Flagship Live), Limassol Marina (In Setup — ~80% Delivery)  
> **Official Website:** [mygermandoener.com](https://mygermandoener.com/) | **Slogan:** *"BITE THE HYPE"* • *"THE FIRST REAL GERMAN DOENER IN CYPRUS"*

---

## Executive Summary & Document Overview

This Master PRD unifies and finalizes **100% of project requirements**, combining:
1. **The Original Developer Brief (Draft 1.9)** based on 6 founder voice memos (Sections 1 through 9).
2. **Direct Client Directives & Locked Decisions** from WhatsApp communications with Co-Founder Rico.
3. **The Shopify-Centered Architecture Pivot** (Shopify POS, Link4Pay, Multi-Location Cloud Inventory).
4. **Visual Menu Board Design Requirements for Monday's Pitch** (Sales-driven layouts, large appetizing food imagery, interim AI/web mockups).
5. **Hardware Procurement Framework** (Shopify Countertop POS, In-Store Monitors, Tablets, Printers).
6. **Detailed Engineering Specifications** for all 11 operational building blocks (9 custom modules + Shopify Core).

---

## 1. Project Background & The 6 Voice Memos Problem Statement

### 1.1 The Core Pain Points (Founder Voice Memos Transcribed & Paraphrased)
Before this system, MY GERMAN DÖNER operated across **12 fragmented, disconnected tools and chaotic manual habits**:
- **Ad-hoc WhatsApp Ordering:** *"Ordering happens through ad-hoc WhatsApp messages ('we could use this... we need toilet paper') — described by the client as total chaos."* Duplicate orders were placed, and no spending caps existed.
- **Critical Evening Stock-Outs:** *"Stock-outs are reported too late in the evening to act on (e.g. 'we're out of bread'), by which point it's too late to call the baker."*
- **Zero Remote Visibility:** *"There is no visibility into the business at all — nothing is measurable, which makes it impossible to find where things are breaking down. An absent owner has no way to know what's happening in the shop that day."*
- **Fragmented Software Stack:** ConnectTeam for scheduling, WhatsApp for ordering, Canva + USB flash sticks walked manually to each TV for menu boards, and a legacy Windows POS dating back to the year 2000.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PREVIOUS FRAGMENTED TOOLS                              │
├───────────────────────┬────────────────────────────┬────────────────────────┤
│ WhatsApp (Ordering)   │ Canva + USB (Menu Boards)  │ Windows 2000 (POS Till)│
├───────────────────────┼────────────────────────────┼────────────────────────┤
│ ConnectTeam (Roster)  │ Paper Logs (Food Safety)   │ Verbal Phone Calls     │
└───────────────────────┴────────────────────────────┴────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│             MY GERMAN DÖNER CONNECTED OPERATIONS CONTROL SYSTEM             │
│        "One connected operations system instead of twelve separate tools"   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Client Communications & Evidence Transcripts

The following three records document the direct instructions, confirmations, and design requests agreed upon with Co-Founder Rico.

### 2.1 WhatsApp Evidence & Transcripts

#### Conversation 1: Menu Board Design, Screen Dimensions & Presentation Assets
![WhatsApp Chat with Rico - Menu Board Design, Screen Dimensions & Interim AI Assets](file:///Users/saiedsagar/.gemini/antigravity/brain/4f478a23-1097-4652-bec4-bbeae9cd4d80/.user_uploaded/media_1787433020581.png)

> **Verbatim Transcript:**
> - **Sagar:** *"Hello Mr. Rico. I visited your restaurant on last Wednesday. I saw the screens and have an estimated idea of that to do. For the menu design i need images of all the food items. And regarding the other screens and system i am working on them."*
> - **Rico:** *"The new monitors have different dimensions, and I sent the exact measurements to Arafat. You should have received them from him in the meantime."*
> - **Rico:** *"For us, it would be important to have a few ideas from you by Monday, especially since you mentioned that you're a graphic designer, showing how you would design the menu for the screens in a strong, sales-driven way."*
> - **Rico:** *"We want large, appealing product images so that the products really catch the customer's eye. I also told Arafat that if you need product photos, he should have the relevant products prepared for you so they can be photographed directly in the store."*
> - **Rico:** *"Whatever you need to create the designs, you can get. We just want to see what ideas you have and how creatively you would approach it."*
> - **Sagar:** *"Sure if i have the photos i can create a draft for the menu. See you on Monday. 👍"*
> - **Rico:** *"That's great. Maybe for the first presentation, you could also use AI-generated images or images from the internet until we have the actual photos. For us, it's mainly about getting an idea of the design and what it could look like."*
> - **Rico:** *"One more question: Are you familiar with Shopify and comfortable working with it?"*
> - **Sagar:** *"Yes. It wont be any problem."*

---

#### Conversation 2: Shopify POS Core, Link4Pay, Offline Fallback & Limassol 80% Delivery
![WhatsApp Chat with Rico - Shopify POS, Link4Pay, Offline Strategy & Limassol Delivery](file:///Users/saiedsagar/.gemini/antigravity/brain/4f478a23-1097-4652-bec4-bbeae9cd4d80/.user_uploaded/media_1787433020575.png)

> **Verbatim Transcript:**
> - **Rico:** *"Great. We want to use Shopify as the new POS"*
> - **Sagar:** *"Got it on Shopify. Quick question so i build this right — do you want Shopify to fully replace the till/payments system, or do you want it connected alongside the checklist/ordering/reporting system we discussed? Also, does the shop need to keep taking payments if the internet goes down? That affects which setup I recommend."*
> - **Rico:** *"Shopify should become our central system, both for inventory management and for POS in the restaurants. We should always plan ahead and assume that we will have several locations very soon, which can then all be managed across locations directly from the Shopify dashboard.*
> *Payments should of course also run through Shopify. We can connect our Link4Pay card payment terminal to Shopify as well."*
> - **Sagar:** *"Understood. Shopify becomes the central system for products, inventory, POS, and payments across all locations, with Link4Pay integrated for card payments. Two things I want to confirm before I build:*
> *1. if internet ever drops at a store, is it okay if card payments briefly can't process, or does the till need to keep working no matter what?*
> *2. For gram level ingredient tracking eg. auto deducting döner meat per sale, Shopify tracks by product not by ingredient weight out of the box. I can build a layer on top for that, just confirming it's still wanted."*
> - **Rico:** *"Yes, if the internet goes down, we generally have a problem with payments. I don't think we'll be able to completely avoid that. In that case, the only option would be cash payments. But if the internet is down, we also wouldn't be able to accept online orders.*
> *It's important to know that the store in Limassol will be around 80% delivery.*
> *And regarding point two: yes, it would be great if we could find a solution where the inventory is calculated in such a way that the system automatically notifies me when certain products are running low or are about to run out."*

---

#### Conversation 3: Sole Developer Confirmation & Monday Hardware Walkthrough
![WhatsApp Chat with Rico - Sole Developer Confirmation & Shopify Hardware Store](file:///Users/saiedsagar/.gemini/antigravity/brain/4f478a23-1097-4652-bec4-bbeae9cd4d80/.user_uploaded/media_1787433020585.png)

> **Verbatim Transcript:**
> - **Sagar:** *"Perfect, that makes sense. Cash only fallback if internet is down, got it. Good to know about Limassol being mostly delivery, I'll make sure that's a priority for that location. And for the stock alerts. I'll set up reorder points per product so you get notified automatically when something's running low on Shopify. Also, I heard there's another developer working on this too. Can you tell me what his role is? Want to make sure we're not overlapping and that everything's clearly divided."*
> - **Rico:** *"No other developers."*
> - **Sagar:** *"Arafat told me there was so I assumed. No worries i can build the whole system for you. See you on Monday with the demos!"*
> - **Rico:** *"Great! ❤️ Hi Sagar. Please let us check on monday together, which items we need from Shopify POS or which we can use from them, we already have in the restaurant. hardware.shopify.com https://hardware.shopify.com/de-be/pages/build-your-countertop-pos"*
> - **Sagar:** *"Yeah sure. I was gonna ask you about that on monday."*

---

## 3. Seven Locked Client Decisions (Non-Negotiable)

1. **Shopify as Single Source of Truth:** Shopify manages POS, Catalog, Core Inventory, and Payments across all current and future stores.
2. **Link4Pay Card Terminal Integration:** Link4Pay is the official payment terminal provider, connected to Shopify POS transactions via manual confirmation workflow.
3. **Offline Behavior (Cash-Only Fallback):** During internet dropouts, card processing and online ordering halt; the store operates in Cash-Only mode with local receipt printing.
4. **Limassol Delivery Priority:** ~80% of Limassol orders are delivery. Pre-order, dispatch, and delivery workflows must be optimized for this store.
5. **Simplified Stock Alerts:** Reorder notifications trigger based on Shopify product par levels rather than real-time gram-level meat deductions.
6. **Sole Lead Developer:** Sagar is the sole engineer and technical authority on this project.
7. **Commercial Structure:** €30,000 total fixed fee across 5 milestone payments, followed by €500 / month ongoing post-launch maintenance.

---

## 4. 3-Layer System Architecture & Technical Specification

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      LAYER 3: HQ / CONTROL CENTER                           │
│  - Shopify Cloud Admin: Multi-Location Products, Inventory, POS & Customers │
│  - Custom Next.js Admin (/admin): Cross-location Reporting, Labor, Orders   │
│  - Cloud Storage (R2/S3): Build Sheet Photos, High-Res Menu Board Videos    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Real-Time GraphQL & Webhooks
                                       │ (orders/create, inventory/update)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                  LAYER 2: CUSTOM BACKEND & SYNC ENGINE                      │
│  - Next.js 15 Serverless / Node.js Engine with PostgreSQL                    │
│  - Webhook Receiver & Polling Fallback (5s Interval)                        │
│  - KDS Queue Dispatcher & Bump Station Synchronizer                         │
│  - Scheduled Cron: Overdue Checklist & Stock Alert Notification Daemon      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ In-Store Wi-Fi / LAN Websocket
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                         LAYER 1: STORE DEVICES                              │
│  - POS Counter Till: iPad / Android Tablet running Shopify POS App          │
│  - Payment Terminal: Link4Pay Card Reader                                   │
│  - Kitchen Display System (KDS): 1920x1080 Monitors (/kds)                  │
│  - Customer Status TV Board: 1920x1080 Overhead Screen (/display)           │
│  - Staff Wall Tablets: 1024x768 Checklists & Build Sheets (/staff)          │
│  - Digital Menu Boards: Up to 7x 1080p/4K Screens (/boards)                 │
│  - Online Ordering & Delivery: Smartphone & Web (/order)                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Detailed Specifications for the 11 Building Blocks

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          11 BUILDING BLOCKS                                 │
├────────────────────────────────┬────────────────────────────────────────────┤
│ Native Shopify Core            │ Custom Engineering Modules (9 Modules)     │
├────────────────────────────────┼────────────────────────────────────────────┤
│ • POS Cashier Till (M4)        │ • M1: Checklists & HACCP Logbook           │
│ • Master Catalog & Prices (M11)│ • M2: Supplier Ordering & Approval Engine  │
│ • Core Stock & Alerts (M3)     │ • M9: Executive Cross-Location Reporting   │
│ • Link4Pay Payments Gateway    │ • M7: Shift Scheduling & PIN Timeclock     │
│                                │ • M8: Visual Build Sheets & Training       │
│                                │ • M10: 7-Screen Digital Menu Board CMS     │
│                                │ • M5: Station-Routed Kitchen Display (KDS) │
│                                │ • M6: Dynamic Pre-Order & Delivery Portal  │
│                                │ • Low-Stock Alert Dispatcher               │
└────────────────────────────────┴────────────────────────────────────────────┘
```

---

### M1 — Checklists & Logbook (Phase 1 / Milestone 1)
- **Problem Solved:** Replaces verbal reminders, forgotten tasks, and paper HACCP temperature sheets.
- **Device Target:** Wall-mounted 1024×768 staff tablet (`/staff`).
- **Core Features:**
  - Morning Opening (08:30), Lunch Prep (11:30), Afternoon Swap (16:00), and Night Closing (23:00) SOP checklists.
  - Digital HACCP Fridge/Freezer Temperature Log (Safe range: Fridge 0°C to 4°C, Freezer -18°C to -22°C). Prompts mandatory corrective action note if out of spec.
  - Photo attachment proof for clean-down tasks.
  - Automatic escalation alerts to manager if mandatory tasks remain incomplete 15 minutes past shift cutoff.
- **Data Model:** `ChecklistTemplate`, `ChecklistTask`, `ChecklistLog`, `TaskVerification`.

---

### M2 — Supplier Ordering & Approval Engine (Phase 2 / Milestone 1)
- **Problem Solved:** Eliminates chaotic ad-hoc WhatsApp messages, duplicate orders, and late-night baker stock-outs.
- **Device Target:** Store Manager & Owner Backoffice (`/admin`).
- **Core Features:**
  - 1-Tap Purchase Order generation mapped to suppliers (Meat Purveyor, Bakery, Produce, Packaging, Sauces).
  - Duplicate Order Shield: Warns if identical SKUs were ordered within the previous 24 hours.
  - Spend Approval Gate: Orders totaling **>€250 require digital approval from Oli/Rico** before dispatch.
  - Automated Dispatch: Approved orders auto-generate PDF and send via Outbound Email and WhatsApp API.
- **Data Model:** `Supplier`, `PurchaseOrder`, `POLineItem`, `ApprovalLog`.

---

### M11 / M4 — Shopify POS & Master Product Database (Phase 2 & 7 / Milestone 2)
- **Problem Solved:** Replaces Windows 2000 legacy till and disjointed per-store price lists.
- **Device Target:** Countertop iPad/Android stand with Link4Pay terminal, cash drawer, and thermal printer.
- **Core Features:**
  - Centralized catalog: Döner Kebabs, Dürum Wraps, Döner Boxes, Berlin Currywurst, Loaded Fries, Drinks.
  - Fast-tap till with modifier groups: Meat (Veal/Beef, Chicken, Mixed, Falafel), Bread (Fladenbrot, Dürum), Sauces (Kräuter, Knoblauch, Scharf, Sesame), Extras (Halloumi, Feta, Jalapeños).
  - Cyprus 19% VAT inclusive receipt calculation:
    $$\text{Subtotal (Net)} = \frac{\text{Gross Total}}{1.19}, \quad \text{VAT (19\%)} = \text{Gross Total} - \text{Subtotal (Net)}$$
  - Cash-only offline fallback mode with auto-print.
  - Link4Pay manual entry workflow.

---

### M9 — Executive Reporting & Remote Visibility (Phase 3 / Milestone 2)
- **Problem Solved:** Gives absent owners live operational visibility without calling store staff.
- **Device Target:** Responsive mobile web & desktop dashboard (`/admin`).
- **Core Features:**
  - Real-time Gross & Net Sales, Guest Count, Average Order Value (AOV), and Peak Hour Heatmaps.
  - Store-by-store comparison: Emba vs Limassol.
  - COGS and Labor Cost overlay (integrating M7 timeclock logs) to calculate estimated Daily Net Operating Profit.
  - Automatic daily midnight executive summary emailed to Rico, Oli, and Markus.

---

### M7 — Scheduling & PIN Time Tracking (Phase 4 / Milestone 3)
- **Problem Solved:** Replaces expensive third-party ConnectTeam app and unmonitored hourly claims.
- **Device Target:** Wall-mounted staff tablet (`/staff`).
- **Core Features:**
  - Weekly Drag-and-Drop Shift Planner with labor budget forecasting.
  - Role-specific assignments (e.g. *Slicer / Döner Cutter*, *Grill Master*, *Cashier*, *Assembler*). Slicers see only meat prep tasks.
  - In-Store 4-digit PIN Timeclock (`Clock In`, `Start Break`, `End Break`, `Clock Out`).
  - Shift swap marketplace: Staff-initiated swaps require peer acceptance + Manager sign-off.
- **Data Model:** `Employee`, `Role`, `ShiftSchedule`, `TimeLog`, `SwapRequest`.

---

### M3 — Low-Stock Alerts & Inventory Reorder Points (Phase 5 / Milestone 2)
- **Problem Solved:** Replaces manual stock guessing with proactive reorder warnings before evening rush.
- **Implementation:** Shopify product inventory tracking + Webhook Alert Dispatcher.
- **Core Features:**
  - Configurable minimum stock threshold per SKU and location (e.g., Fladenbrot Bread < 50 pcs).
  - Webhook listener on `inventory_levels/update`: Dispatches instant Push & Dashboard alerts when threshold is breached.
  - Direct 1-tap redirect to M2 Supplier Ordering to restock immediately.

---

### M8 — Visual Build Sheets & Training (Phase 5 / Milestone 3)
- **Problem Solved:** Standardizes food preparation quality and eliminates reliance on informal peer training.
- **Device Target:** Staff wall tablet (`/staff`).
- **Core Features:**
  - McDonald's-style step-by-step assembly guides with high-res photos and dosing rules (e.g., standard 150g meat portion, sauce spread order, salad layers).
  - Target assembly speed timers (e.g., Classic Döner target: 45 seconds).
  - Centralized updates: Editing a recipe at HQ instantly updates all store build sheets.

---

### M10 — 7-Screen Digital Menu Board CMS (Phase 6 / Milestone 4)
- **Problem Solved:** Replaces Canva + USB stick workflow with cloud-managed, dynamic 1080p/4K signage.
- **Device Target:** Up to 7 overhead commercial displays per store (`/boards?screen=1..7`).
- **Core Features:**
  - Remote cloud push: Instant price, combo, and promotion updates from HQ.
  - Automatic Dayparting: Switches between Lunch Combos (11:00–15:00) and Evening Dinner Offers (17:00–23:00).
  - Screen Health Heartbeat: Alerts owners within 3 minutes if any screen goes offline or dark.
  - Sales-Driven UI: Large, appetite-stimulating product imagery, video loops, and price hierarchy.

---

### M5 — Kitchen Display System (KDS) (Phase 7 / Milestone 4)
- **Problem Solved:** Replaces paper tickets and lost orders with coordinated digital station routing.
- **Device Target:** 1920×1080 kitchen monitors (`/kds`).
- **Core Features:**
  - Multi-Station Routing: `GRILL` (meat carving), `ASSEMBLY` (bread, salad, sauce), `FRYER` (fries, halloumi), `EXPO` (packaging/handoff).
  - Order Claim & Collision Lock: Cook tapping "Claim" locks the ticket with their color tag.
  - Urgency Timers & Color Progression:
    - 🟢 **Green:** `< 4 minutes` (Normal)
    - 🟡 **Amber:** `4 – 8 minutes` (Approaching Target)
    - 🔴 **Flashing Red:** `> 8 minutes` (Late / Critical Intervention)
  - Bump Bar / Touch Recall: Clears completed items and pushes ticket to Expo screen.
  - Latency Guard: Hybrid Shopify webhook + 5-second polling fallback.

---

### M6 — Pre-Order & Delivery Engine (Phase 8 / Milestone 5)
- **Problem Solved:** Powers the Limassol delivery-first hub (~80% delivery volume) with realistic live ETAs.
- **Device Target:** Customer Mobile Web (`/order`), Driver Dispatch Screen.
- **Core Features:**
  - Live Kitchen-Load Dynamic ETA:
    $$\text{Estimated Delivery Time} = \text{Transit Time} + \text{Base Prep (10m)} + (\text{Active KDS Queue} \times 1.5\text{m})$$
  - Order Type Toggle: Pickup / Takeaway / Delivery.
  - Real-time Order Status Tracker with Push / SMS notifications.
  - Priority dispatch tagging on KDS: Delivery tickets highlighted in neon with delivery driver pickup countdown.

---

## 6. Monday Presentation Design Blueprint (Menu Boards & UI)

Per Rico's specific request for the Monday meeting:
> *"For us, it would be important to have a few ideas from you by Monday, showing how you would design the menu for the screens in a strong, sales-driven way. We want large, appealing product images so that the products really catch the customer's eye... you could also use AI-generated images or images from the internet until we have the actual photos."*

### 6.1 Design Tokens & Visual Hierarchy
- **Canvas:** Dark Graphite (`#121214` / `#1F1F21`) for high-contrast food rendering.
- **Brand Accents:** Electric Neon Magenta (`#E50D7E`) for primary CTAs and prices; Electric Cyan (`#00FCED`) for combos and badges; Döner Gold (`#E5A93C`) for bestsellers.
- **Typography:** `Oswald` Bold for headlines; `Figtree` for descriptions; `JetBrains Mono` for pricing.
- **Card Composition:** **60%+ card area dedicated to appetizing macro food imagery** with clean typography and transparent allergen badges.

### 6.2 7-Screen Layout Allocation for Monday Presentation

| Screen # | Focus Category | Layout Structure | Key Visual Elements |
|:---|:---|:---|:---|
| **Screen 1** | **Hero Promo & Slogan** | Full-bleed 16:9 Video / Image Loop | Large rotating Döner spit, *"BITE THE HYPE"*, Berlin street aesthetic. |
| **Screen 2** | **Original German Döner** | 2-Column Split Grid | Macro photography of Classic Beef/Veal & Chicken Döner with bread cutaway. |
| **Screen 3** | **Dürum Wraps & Döner Boxes**| 3-Card Vertical Cards | Rolled Dürum cross-section, loaded low-carb salad box. |
| **Screen 4** | **Specialties & Combos** | Feature Hero + 2 Secondary | Berlin Currywurst, Mixed Platters, Meal Deal Upgrade badge (+€3.50). |
| **Screen 5** | **Sides & Vegetarian** | 4-Tile Grid | Crispy Berlin Fries, Grilled Halloumi, Fresh Falafel Bowl (🌱 Green badge). |
| **Screen 6** | **Sauce Bar & Extras** | Horizontal Ingredient Rail | Homemade Garlic, Herb, and Spicy Fire sauces with heat flame indicators. |
| **Screen 7** | **Drinks & Desserts** | Split Clean Layout | German Sodas, Ayran, Baklava, Fresh Iced Teas. |

---

## 7. Hardware Architecture & Procurement Framework

Referencing [hardware.shopify.com Countertop POS](https://hardware.shopify.com/de-be/pages/build-your-countertop-pos) and the Monday walkthrough checklist:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STORE HARDWARE MAP                                  │
├───────────────────────┬────────────────────────────┬────────────────────────┤
│ Countertop POS        │ Kitchen & Displays         │ Operations & Signage   │
├───────────────────────┼────────────────────────────┼────────────────────────┤
│ • iPad / Android 11"+ │ • 2-3x 1920x1080 KDS TVs   │ • Up to 7x 1080p TVs   │
│ • Secure Swivel Stand │ • Wall VESA Brackets       │ • 7x 4K HDMI Players   │
│ • Star / Epson TM ESC │ • Loud Chime Speaker       │ • 1x 1024x768 Tablet   │
│ • RJ12 Cash Drawer    │ • Customer Order TV Board  │ • Dual-WAN 4G/5G Router│
│ • Link4Pay Terminal   │                            │                        │
└───────────────────────┴────────────────────────────┴────────────────────────┘
```

### 7.1 Monday Hardware Walkthrough Decision Matrix

| Hardware Component | Shopify Store Recommendation | Existing Store Equipment Option | Decision Status |
|:---|:---|:---|:---|
| **POS Terminal** | iPad 10.9" + Shopify POS Swivel Stand | Existing Windows 2000 hardware (To be decommissioned) | Purchase New (Shopify) |
| **Card Reader** | Link4Pay Payment Terminal (Client-provided) | Existing Link4Pay In-Store Terminal | **Re-use Existing** |
| **Receipt Printer** | Star Micronics mC-Print3 / Epson TM-m30III (LAN/USB) | Existing Thermal Receipt Printer (Check ESC/POS support) | Verify on Monday |
| **Cash Drawer** | APG Vasario / Star Cash Drawer (RJ12 triggered) | Existing Heavy-Duty Drawer | Verify RJ12 Pinout |
| **KDS Monitors** | 24"-32" Commercial 1080p HDMI Monitors | New Commercial Monitors | Purchase New |
| **Menu Board Players** | Android/Raspberry Pi 4K HDMI Stick (~€130/ea) | Existing USB stick setup | Purchase New Players |
| **Network Router** | Dual-WAN Gigabit Router with 4G LTE SIM failover | Standard Store ISP Modem | Recommend 4G Failover |

---

## 8. Financial Structure, Milestones & Timeline

### 8.1 Commercial Breakdown
- **Total Fixed Project Fee:** **€30,000**
- **Initial Deposit (Kickoff):** **25% (€7,500)**
- **Ongoing Post-Launch Maintenance:** **€500 / month** (Hosting, monitoring, bug fixes, updates)

### 8.2 Milestone Payment Schedule & Deliverables

```mermaid
gantt
    title MY GERMAN DÖNER — 5-Milestone Delivery Schedule
    dateFormat  YYYY-MM-DD
    section Milestones
    Kickoff & Architecture (Deposit 25% - €7,500)      :m0, 2026-08-25, 10d
    M1: Checklists & Supplier Ordering (20% - €6,000)  :m1, after m0, 14d
    M2: Shopify Sync & Executive Reports (20% - €6,000):m2, after m1, 16d
    M3: Scheduling & Visual Build Sheets (15% - €4,500):m3, after m2, 14d
    M4: Menu Boards & Kitchen Display (15% - €4,500)   :m4, after m3, 16d
    M5: Limassol Delivery Flow & Handover (5% - €1,500):m5, after m4, 18d
```

| Milestone | Deliverables Included | Payment % | Amount (€) |
|:---|:---|:---:|:---:|
| **Deposit / Kickoff** | Project kickoff, Shopify instance configuration, API connection, pruned schema setup, Monday hardware sign-off. | **25%** | **€7,500** |
| **Milestone 1** | **M1 Checklists & HACCP Logbook** + **M2 Supplier Ordering & Approvals Engine**. | **20%** | **€6,000** |
| **Milestone 2** | **Shopify Integration Layer** (Catalog sync, Stock alerts, Link4Pay workflow) + **M9 Executive Reporting Dashboard**. | **20%** | **€6,000** |
| **Milestone 3** | **M7 Shift Scheduling & PIN Timeclock** + **M8 Visual Build Sheets & Staff Training**. | **15%** | **€4,500** |
| **Milestone 4** | **M10 7-Screen Digital Menu Board CMS** + **M5 Station-Routed Kitchen Display (KDS)**. | **15%** | **€4,500** |
| **Milestone 5** | **M6 Limassol Pre-Order & Dynamic Delivery Flow** + Full System Handover & Staff Go-Live. | **5%** | **€1,500** |
| **TOTAL** | **Complete 11-Module Connected Operations System** | **100%** | **€30,000** |

---

## 9. Comprehensive Risk Register & Mitigations

| Risk ID | Category | Description | Probability | Impact | Mitigation Strategy | Status |
|:---|:---|:---|:---:|:---:|:---|:---:|
| **R01** | Technical | **Shopify lacks native per-location pricing.** | HIGH | HIGH | Implement Shopify Markets pricing or duplicate location-specific variants in the catalog. | Active Mitigation |
| **R02** | Operational | **Internet outage disables card reader and KDS webhooks.** | HIGH | HIGH | Enforce cash-only offline till mode; KDS falls back to physical receipt tickets; install 4G backup router. | **Accepted Tradeoff** |
| **R03** | Technical | **Previous KDS integration attempt failed.** | HIGH | HIGH | Hold dedicated kitchen workflow session; build simple bump UI with webhooks + 5s polling fallback. | Active Mitigation |
| **R04** | Commercial | **Milestone 5 (Delivery) is under-budgeted at 5% (€1,500).** | HIGH | HIGH | Utilize Shopify Local Delivery apps + custom ETA wrapper to avoid rebuilding routing from scratch. | Active Mitigation |
| **R05** | Technical | **Link4Pay requires manual amount entry on Shopify POS.** | MEDIUM | LOW | Staff training on 2-step entry; display clear confirmation prompts on till. | **Accepted Tradeoff** |
| **R06** | Hardware | **Menu board monitor dimensions vary by store.** | MEDIUM | MEDIUM | Responsive CSS container queries that scale dynamically to any 16:9 or custom display aspect ratio. | Resolved |

---

## 10. Monday Walkthrough Action Plan & Next Steps

1. **Menu Board Design Presentation:** Present high-impact, sales-driven draft mockups for Screens 1 through 7 with large, appetizing food photography (using curated AI/web mockups for initial visual alignment).
2. **Hardware Walkthrough:** Audit existing in-store printers, cash drawers, and screens against [hardware.shopify.com](https://hardware.shopify.com/de-be/pages/build-your-countertop-pos) to finalize the purchase order.
3. **Contract Execution:** Finalize and sign the Master Services Agreement (MSA) and Statement of Work (SOW Revision 2).
4. **Deposit Invoice:** Issue Milestone 0 commercial invoice (€7,500) for project commencement.
5. **Phase 1 Build Kickoff:** Initialize the Shopify Development App, configure the multi-location store instances, and deploy the Milestone 1 Checklists & Ordering modules.

---
*End of Master Product Requirements Document — MY GERMAN DÖNER Control System Revision 3*
