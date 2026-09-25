# 🥙 MY GERMAN DÖNER — Connected Operations Control System
## Master Product Requirements Document (PRD) — Final Revision 3.3 (Authoritative)

> **Document Status:** Complete, Authoritative & Engineering-Ready  
> **Last Updated:** 2026-08-24T16:00:00+03:00  
> **Lead Systems Architect:** MD. SAIED SAGAR (Sole Implementation Engineer)  
> **Client Stakeholders:** RICO & OLIVER (Founders & Managing Directors), Markus (Project Lead)  
> **Commercial Terms:** **€12,000.00 Fixed Contract Value** (€1,000.00 Upfront Advance + €1,000.00 / Month for 11 Months — 12-Month Total Active Term)  
> **Payment Settlement:** SEPA Electronic Bank Wire or Direct Cash Remittance against Signed Official Receipt  
> **Target Deployments:**  
> 1. **Emba / Paphos (Flagship Store — Dine-In & Takeaway):** Pavlides Court, Agíou Stefánou Street 134, 8260 Emba, Cyprus  
> 2. **Limassol Marina (Delivery Hub — ~80% Delivery Volume):** Commercial Promenade, Limassol, Cyprus  
> **Official Website:** [mygermandoener.com](https://mygermandoener.com/) | **Brand Slogans:** *"BITE THE HYPE"* • *"THE FIRST REAL GERMAN DOENER IN CYPRUS"*  

---

## 1. Executive Summary & The 5 Integrated Systems

MY GERMAN DÖNER Connected Operations Control Suite unifies all restaurant touchpoints, kitchen stations, digital signage, and cloud commerce into **5 Seamlessly Integrated Systems** supported by a **Hybrid On-Premise & Cloud Compute Architecture**:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    THE 5 INTEGRATED SYSTEMS                                      │
├────────────────────────────────┬─────────────────────────────────────────────────────────────────┤
│ System                         │ Core Capabilities & Architectural Role                          │
├────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ System 1: Public Brand &       │ Next.js SSR/ISR on Cloud Linux VPS, live menu sync, multi-store │
│ Ordering Platform              │ profile hubs (Emba & Limassol Marina), customer pre-ordering.   │
├────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ System 2: Overhead 4x 4K       │ 3840x2160 vector layouts, sub-500ms Sold-Out sync, automated    │
│ Signage & Customer Queue       │ dayparting, real-time customer pickup queue TV (/display).      │
├────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ System 3: Front-of-House (FOH) │ Dual-Till Concurrency: Register 1 (iPad 10.9" Web POS /pos) +    │
│ Dual-Till Cashier Counters     │ Register 2 (Shopify POS Terminal). Central ingestion & unified  │
│                                │ ticket queue on 192.168.1.50, Link4Pay, 24V RJ12 drawer kick.   │
├────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ System 4: Kitchen Production   │ Dual LAN ESC/POS thermal printers on TCP Port 9100 (Indoor &    │
│ & Routing                      │ Outdoor Grill), responsive web KDS (/kds/indoor & /kds/grill).  │
├────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ System 5: Back-of-House (BOH)  │ Single-pane-of-glass management (/admin): instant price push in │
│ Master Operations Dashboard    │ <500ms, 1-tap Sold-Out, gram-level BOM, HACCP logs, BI sales.   │
└────────────────────────────────┴─────────────────────────────────────────────────────────────────┘
```

---

## 2. Compute Topology: 100% In-Store Offline Autonomy

```mermaid
graph TD
    subgraph "LAYER 3: CLOUD TIER (Linux VPS - Hostinger KVM / Hetzner Ubuntu 24.04 Docker)"
        CLOUD_WEB["System 1: Public Web & Pre-Order (mygermandoener.com - Next.js)"]
        CLOUD_DB["Central Cloud Sync Database (Multi-Tenant PostgreSQL)"]
        CLOUD_BI["Remote Executive BI Analytics & P&L Overhead"]
        CLOUD_BRIDGE["External Delivery Integration Bridges (Wolt, Foody)"]
    end

    subgraph "LAYER 2: LOCAL IN-STORE SERVER (Dedicated Windows PC at static 192.168.1.50)"
        EDGE_SRV["Unattended Background Windows Service (NSSM / WinSW Daemon)"]
        INGEST_ENG["Dual-Till Ingestion Engine & Unified Ticket Sequencer"]
        BOM_ENGINE["Central Real-Time BOM & Spit Depletion Engine"]
        LOCAL_DB["Embedded Local Database (SQLite WAL Mode <2ms LAN Latency)"]
        LOCAL_SSE["Real-Time SSE Event Broker (<15ms Local LAN Broadcast)"]
        PRINT_HUB["Raw TCP Multi-Printer Spooler (Port 9100 - Multi-Printer Hub)"]
        SYNC_QUEUE["Outbound SyncQueue Buffer & Cloud Replay Machine"]
    end

    subgraph "LAYER 1: STORE TOUCHPOINTS & HARDWARE (Local Gigabit LAN)"
        POS_REG1["System 3 (Register 1): iPad 10.9\" Web POS (/pos) + Link4Pay + 24V RJ12 Drawer"]
        POS_REG2["System 3 (Register 2): Dedicated Shopify POS Hardware Terminal"]
        PRN_INDOOR["System 4: Indoor Assembly Line Thermal Printer (TCP:9100)"]
        PRN_GRILL["System 4: Outdoor Charcoal Rotisserie Printer (TCP:9100)"]
        KDS_VIEWS["System 4: Responsive Dual Web KDS (/kds/indoor & /kds/grill)"]
        TV_PICKUP["System 2: Customer Pickup Status 43\" TV (/display)"]
        STAFF_TAB["System 5: Staff Station 10.1\" Tablet (/staff - HACCP, Clock, SOPs)"]
        BOARDS_4K["System 2: 4x 4K Overhead Smart TVs (/boards - Zero-Reflow Vector CMS)"]
    end

    CLOUD_WEB <-->|Bidirectional SyncQueue| EDGE_SRV
    EDGE_SRV --> INGEST_ENG
    INGEST_ENG --> BOM_ENGINE
    BOM_ENGINE --> LOCAL_DB
    EDGE_SRV --> LOCAL_SSE
    EDGE_SRV --> PRINT_HUB
    POS_REG1 ===>|Direct LAN API Order Ingestion| INGEST_ENG
    POS_REG2 ===>|Local Webhook / App Bridge Ingestion| INGEST_ENG
    LOCAL_SSE <===> POS_REG1
    LOCAL_SSE <===> KDS_VIEWS
    LOCAL_SSE <===> TV_PICKUP
    LOCAL_SSE <===> STAFF_TAB
    LOCAL_SSE <===> BOARDS_4K
    PRINT_HUB -->|Raw TCP Stream| PRN_INDOOR
    PRINT_HUB -->|Raw TCP Stream| PRN_GRILL
```

### 2.1 Compute Roles & Offline Safeguards
1. **Local Edge Server (Static LAN IP `192.168.1.50`):**
   - Runs as a 24/7 background Windows service via NSSM/WinSW on the dedicated in-store Windows PC.
   - Hosts the local Next.js engine, SQLite WAL database, SSE local event broker (<15ms), and raw TCP printer spooler on Port 9100.
   - **Central Dual-Till Ingestion Engine:** Acts as the single central hub ingesting local transactions directly from **Register 1 (iPad Web POS `/pos`)** over LAN and **Register 2 (Shopify POS Hardware Terminal)** via local webhook/app bridge.
   - **Unified Sequential Ticket Number Queue:** Both registers increment a single, synchronized ticket number queue for kitchen production chits and Customer Pickup TV (`/display`) tracking.
   - **Multi-Till Printing & Central Inventory Deduction:** Orders from both the iPad and Shopify POS trigger identical split routing across the 2x LAN thermal printers (Port 9100) — Indoor Assembly and Outdoor Grill. Real-time Bill of Materials (BOM) inventory deductions and rotisserie spit meat depletion calculate centrally on `192.168.1.50` regardless of which till originated the transaction.
   - **100% Offline Autonomy:** In the event of an external ISP or WAN outage, in-store operations (cash transactions, drawer kick, dual-till concurrent ordering, kitchen ticket printing, and menu displays) function with zero interruption.
2. **Cloud Tier (Linux VPS):**
   - High-availability Linux VPS (Hostinger KVM or Hetzner Ubuntu 24.04 LTS Docker container).
   - Serves public customer traffic (`mygermandoener.com`), PostgreSQL synchronization, and remote owner BI analytics.

---

## 3. Statutory Cyprus Dual-Rate VAT Mathematics

In strict accordance with the **Cyprus Value Added Tax Law (Law 95(I)/2000 as amended)**, the platform performs deterministic reverse VAT calculations:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            CYPRUS STATUTORY DUAL-RATE VAT ENGINE                            │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. 9% REDUCED VAT (Prepared Food, Dine-In, Takeaway & Non-Alcoholic Beverages):             │
│    • Covered Items: Classic Döner, Dürum, Döner Box, Currywurst, Fries, Sauces, Sodas, Water│
│    • Mathematical Formula:                                                                  │
│      Subtotal (Net) = Gross Amount / 1.09                                                   │
│      VAT (9%)       = Gross Amount - Subtotal (Net)                                         │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ 2. 19% STANDARD VAT (Alcoholic Beverages):                                                  │
│    • Covered Items: German Pilsner Beer, Keo Beer, Alcoholic Ciders                         │
│    • Mathematical Formula:                                                                  │
│      Subtotal (Net) = Gross Amount / 1.19                                                   │
│      VAT (19%)      = Gross Amount - Subtotal (Net)                                         │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ 3. COMPOSITE CART FISCAL AGGREGATION:                                                       │
│    Total Gross Amount = Sum(Gross_Food) + Sum(Gross_Alcohol)                                │
│    Total Net Amount   = Sum(Gross_Food / 1.09) + Sum(Gross_Alcohol / 1.19)                  │
│    Total Cyprus Tax   = Total Gross Amount - Total Net Amount                               │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Deep Dive into the 5 Integrated Systems

---

### System 1: Public Brand & Ordering Platform
* **Hosting:** Cloud Linux VPS (`mygermandoener.com`).
* **Core Capabilities:**
  - Next.js SSR/ISR architecture ensuring sub-second page loads and high Google Lighthouse / SEO scores.
  - Multi-store profile routing for **Emba / Paphos Flagship** and **Limassol Marina Hub** (~80% delivery focus).
  - Live menu synchronization bound to central product availability.
  - Dynamic queue-based pre-order wait estimator:
    $$\text{Estimated Delivery Time} = \text{Transit Time} + \text{Base Prep (10m)} + (\text{Active KDS Queue} \times 1.5\text{m})$$

---

### System 2: Overhead 4x 4K Digital Signage & Customer Queue
* **Display Target:** 4x 4K Commercial Smart TVs (`/boards?screen=1..4`) + 43" Customer Queue TV (`/display`).
* **Core Capabilities:**
  - Zero-reflow, GPU-accelerated 3840×2160 vector layouts rendered locally from `192.168.1.50`.
  - **Sub-500ms Sold-Out Sync:** When any ingredient runs out, affected menu cards display animated "Sold Out" badges across screens in under 500ms via SSE.
  - **Dynamic Dayparting:** Automatically alternates between Lunch Specials (11:00–15:00) and Evening Offers (17:00–23:00).
  - **4-Screen Category Mapping:**
    * **Screen 1:** Hero Brand & Slogan ("BITE THE HYPE", rotating spit 4K video loop).
    * **Screen 2:** Original German Döner & Platters (Veal/Beef, Chicken, Mixed).
    * **Screen 3:** Dürum Wraps & Döner Boxes.
    * **Screen 4:** Specialties, Loaded Fries, Combos (+€3.50), Homemade Sauces & Drinks.
  - **Customer Queue TV (`/display`):** Dynamic "Preparing" vs. "Ready for Pickup" status columns with distinct audio chimes, unified across both FOH registers.

---

### System 3: Front-of-House (FOH) Dual-Till Cashier Operations
* **Dual-Till Concurrency:** Front-of-House order entry runs concurrently across two employee registers:
  * **Register 1:** Apple iPad 10.9" in countertop locking swivel stand running the Custom Web POS (`/pos`) with Link4Pay card workflow and 24V RJ12 cash drawer kick.
  * **Register 2:** Dedicated Shopify POS Hardware Terminal.
* **Hardware Transition:** Full retirement and decommissioning of the aging legacy Windows 7 touch machine.
* **Central Ingestion & Unified Sequence:**
  - The Local Windows Server PC (`192.168.1.50`) acts as the single central order ingestion engine for both registers.
  - Ingests local orders directly from Register 1 (iPad Web POS) via LAN and Register 2 (Shopify POS terminal) via local webhook / app bridge.
  - **Unified Order Sequencing:** Both registers increment a single, synchronized ticket number queue for kitchen production and Customer Pickup TV (`/display`) tracking.
* **Multi-Till Printing & Central Inventory Deduction:**
  - Orders from both the iPad and Shopify POS trigger identical split routing across the 2x LAN thermal printers (Port 9100) — Indoor Assembly and Outdoor Grill.
  - Real-time Bill of Materials (BOM) inventory deductions and rotisserie spit depletion calculate centrally on `192.168.1.50` regardless of which till originated the transaction.
* **Core POS Capabilities:**
  - Fast-tap interface with 3-step customization modal (Meat, Bread, Homemade Sauces, Extras).
  - 5-Flame Spice Meter (Level 1 Mild to Level 5 Hölle!) with customer heat disclaimer modal.
  - One-tap meal combo upsell (+€3.50 for fries and soft drink).
  - Reverse Cyprus Dual-VAT calculation (9% Food / 19% Alcohol) printed on itemized thermal receipts.
  - 24V RJ12 cash drawer pulse kick on cash sales.
  - Integrated Link4Pay card terminal transaction workflow.

---

### System 4: Kitchen Production & Dual-Station Routing
* **Hardware Target:** Station 1 & Station 2 Ethernet Thermal Printers (Port 9100) + Responsive Web KDS (`/kds/indoor`, `/kds/grill`).
* **Core Capabilities:**
  - **Station 1 (Indoor Assembly Line Printer):** Receives bread, salad, and sauce chits over raw TCP (Port 9100).
  - **Station 2 (Outdoor Charcoal Rotisserie/Grill Printer):** Receives meat type, gram portion weights (Standard 150g, Small 100g, Mini 75g), and spice levels over raw TCP (Port 9100).
  - **Dual Web KDS Views (`/kds/indoor` and `/kds/grill`):** Responsive line displays with cook claim collision locks and 3-tier color timers (🟢 <4m, 🟡 4–8m, 🔴 >8m).
  - **Future Kitchen TV Roadmap:** Architecture ready to stream to 2x Kitchen Smart TVs mounted over prep lines.

---

### System 5: Back-of-House (BOH) Master Operations Dashboard
* **Target Interface:** Store Backoffice & Owner Portal (`/admin`).
* **Core Capabilities:**
  - **Single-Pane-of-Glass Management:** Real-time operational overview across Emba and Limassol.
  - **Instant Price Overrides (<500ms):** Updating base prices or promos immediately pushes across all 4K screens and POS tills without reloading.
  - **1-Tap Sold-Out Matrix:** Instant stock availability overrides.
  - **Gram-Level BOM Tracking:** Recipe-based Bill of Materials tracking and shared rotisserie spit meat depletion.
  - **Digital HACCP Logbook (EU Reg EC 852/2004):**
    * ❄️ Chilled Storage: `0.0°C – 5.0°C` (Target: `3.0°C`)
    * 🧊 Deep Freezers: `-18.0°C – -22.0°C`
    * 🔥 Hot-Holding Rotisserie Spit Meat: `≥ 63.0°C` (Target: `65.0°C – 75.0°C`)
    * ⚠️ Danger Zone (`5.0°C – 63.0°C`): Mandatory corrective action note and instant owner push alert.
  - **Shift Scheduling & 4-Digit PIN Timeclock:** Replaces ConnectTeam with zero recurring software fees.
  - **Daily BI Sales & Cyprus Dual-VAT Accounting Export.**

---

## 5. Scope Exclusions (Zero Engineering Guarantee)

To maintain 100% focused execution on store throughput, dual-till stability, and physical line production, the following features are formally excluded from this delivery agreement:
1. **Drive-Thru Camera & License Plate OCR (M6):** Store 01 (Emba) operates exclusively as a dine-in and counter takeaway flagship with no drive-thru lane.
2. **Automated WhatsApp Supplier PO Dispatch (M4):** Vendor fulfillment requires manual telephone communication; out-of-scope for software automation.
3. **Customer Mobile Loyalty & Points App (M11):** Customer rewards are managed via standard physical/promotional discount codes at the till rather than a dedicated mobile app.

---

## 6. Commercial Structure & Structured 12-Month Payment Schedule

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 COMMERCIAL TERMS                                            │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ TOTAL CONTRACT INVESTMENT:  €12,000.00 EUR (Fixed Price Engagement)                        │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ • UPFRONT ADVANCE DEPOSIT:  €1,000.00 EUR (Due Upon Contract Execution)                     │
│ • MONTHLY INSTALLMENTS:     €1,000.00 / Month for 11 Consecutive Months                     │
│ • SETTLEMENT OPTIONS:       SEPA Bank Transfer OR Direct Cash against Signed Receipt        │
│ • INCLUDES:                 All 5 Integrated Systems, Deployments & 12-Month Dedicated SLA  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

| Payment Period | Milestone / Operational Scope | Monthly Amount (€) | Cumulative Total (€) |
|:---|:---|:---:|:---:|
| **Advance Deposit** | Kickoff, Schema Init, Windows Server Setup (`192.168.1.50`) | **€ 1,000.00** | **€ 1,000.00** |
| **Month 1** | **M1 Checklists & Digital HACCP Logbook (EU Reg EC 852/2004)** | **€ 1,000.00** | **€ 2,000.00** |
| **Month 2** | **M3 Dynamic Stock & Spit Depletion** + **Modern iPad Web POS** | **€ 1,000.00** | **€ 3,000.00** |
| **Month 3** | **M9 Executive Reporting Dashboard** + **Cyprus Dual-VAT Ledger** | **€ 1,000.00** | **€ 4,000.00** |
| **Month 4** | **M7 Staff Shift Scheduling** + **4-Digit PIN Timeclock** | **€ 1,000.00** | **€ 5,000.00** |
| **Month 5** | **M8 Visual Build Sheets** + **Assembly Training Guides** | **€ 1,000.00** | **€ 6,000.00** |
| **Month 6** | **System 2: 4x 4K Overhead Digital Menu Board CMS** | **€ 1,000.00** | **€ 7,000.00** |
| **Month 7** | **System 4: Dual-Station KDS & Raw TCP Print Spooler** | **€ 1,000.00** | **€ 8,000.00** |
| **Month 8** | **System 1: Limassol Pre-Order & Delivery Flow** + **Public App** | **€ 1,000.00** | **€ 9,000.00** |
| **Month 9** | **Store 02 Limassol Live Integration & Dual-Store Ops Scaling** | **€ 1,000.00** | **€ 10,000.00** |
| **Month 10** | **Advanced BI Analytics, Food Cost Optimization & Auditing** | **€ 1,000.00** | **€ 11,000.00** |
| **Month 11** | **Production Warranty Audit, Final Transition & Handover** | **€ 1,000.00** | **€ 12,000.00** |
| **TOTAL** | **Complete 5-System Connected Platform & 12-Month Dedicated SLA** | — | **€ 12,000.00** |

---

## 7. Immediate Action Items for Client Presentation

1. **Present 4x 4K Menu Board Designs:** Demonstrate dynamic layouts for Screens 1 through 4 with macro food photography.
2. **Execute Hardware Walkthrough:** Confirm iPad countertop stand, Windows server PC setup (`192.168.1.50`), and dual thermal printer IPs.
3. **Sign Contract Package:** Execute the Master Software Services Agreement (MSA) and Statement of Work (SOW Revision 3.1).
4. **Process Advance Invoice (€1,000.00):** Settle via SEPA Bank Transfer or Direct Cash Remittance.

---
*End of Master Product Requirements Document — MY GERMAN DÖNER Operations Control Suite Final Revision 3.3*
