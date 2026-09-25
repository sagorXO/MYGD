# SCHEDULE A — STATEMENT OF WORK (SOW)
### Master Software Services Agreement • Final Revision 3.1 (Authoritative)

> **Document Type:** Schedule A to Master Software Services Agreement (MSA)  
> **Project Name:** MY GERMAN DÖNER Connected Operations Control System  
> **Lead Systems Architect:** MD. SAIED SAGAR (Sole Implementation Engineer)  
> **Client Stakeholders:** RICO & OLIVER (Founders & Managing Directors), Markus (Project Lead)  
> **Deployment Scope:**  
> 1. **Emba / Paphos Flagship:** Pavlides Court, Agíou Stefánou Street 134, 8260 Emba, Cyprus  
> 2. **Limassol Marina Hub:** Commercial Promenade, Limassol, Cyprus (~80% Delivery Volume)  
> **Effective Date:** August 24, 2026  
> **Contract Value:** €12,000.00 EUR (€1,000.00 Advance + €1,000.00 / Month for 11 Months — 12-Month Active SLA Term)  
> **Settlement Terms:** SEPA Electronic Bank Wire or Direct Cash Remittance against Signed Official Receipt  

---

## 1. Project Purpose & Hybrid Architectural Scope

This Statement of Work (SOW Revision 3.1) defines the comprehensive technical deliverables, functional requirements, and hybrid architecture for the **MY GERMAN DÖNER Operations Control Suite**. The system delivers **100% In-Store Offline Autonomy** across **5 Integrated Systems**:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                      HYBRID SYSTEM TOPOLOGY (LOCAL EDGE + CLOUD)                            │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ LAYER 3: CLOUD TIER (Linux VPS - Hostinger KVM / Hetzner Ubuntu 24.04 Docker)               │
│ • System 1: Public Web App & Pre-Order (mygermandoener.com - Next.js SSR/ISR)               │
│ • Multi-Tenant Central PostgreSQL Cloud Sync Database                                       │
│ • Remote Executive BI Analytics, P&L Overhead & Cyprus Dual-VAT Accounting Portal           │
│ • External Delivery Integration Bridges (Wolt, Foody, Delivery Hero)                        │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ LAYER 2: LOCAL IN-STORE SERVER (On-Premise Windows PC at Static LAN IP 192.168.1.50)        │
│ • Unattended Windows Service (NSSM / WinSW Daemon) hosting Local Next.js Instance           │
│ • Central Dual-Till Ingestion Engine: Direct LAN API (iPad POS) + Local Webhook (Shopify POS│
│ • Unified Sequential Ticket Queue: Single synchronized order counter for kitchen & /display │
│ • Central Real-Time BOM & Spit Depletion Engine: Unified inventory deduction on all sales   │
│ • Embedded SQLite WAL Mode Database (<2ms LAN Query Latency)                                │
│ • Local Server-Sent Events (SSE) Broker (<15ms LAN Broadcast to Store Devices)              │
│ • Raw TCP Multi-Printer Spooler (Port 9100) managing Kitchen & Till Thermal Printers       │
│ • 100% Offline Autonomy: Zero internet dependency for in-store sales, printing & KDS        │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ LAYER 1: STORE HARDWARE TOUCHPOINTS                                                         │
│ • System 3 (Dual-Till Concurrency): Register 1 (iPad 10.9" Web POS /pos + Link4Pay + RJ12   │
│   Drawer) + Register 2 (Dedicated Shopify POS Hardware Terminal)                            │
│ • System 4: Station 1 Indoor Assembly Thermal Printer (TCP:9100) & Station 2 Grill (TCP:9100│
│ • System 4: Responsive Dual-Station Web KDS (/kds/indoor & /kds/grill) ready for Future TVs │
│ • System 2: Customer Waiting Area 43" Order Status TV (/display)                            │
│ • System 5: Staff Station 10.1" Wall Tablet (/staff - HACCP, Clock, Build Sheet SOPs)       │
│ • System 2: 4x 4K Overhead Smart TVs (/boards?screen=1..4) GPU-Accelerated Vector Layouts   │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Deliverable Scope: The 5 Integrated Systems

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  THE 5 INTEGRATED SYSTEMS                                   │
├────────────────────────────────┬────────────────────────────────────────────────────────────┤
│ Integrated System              │ Detailed Technical Scope & Deliverables                    │
├────────────────────────────────┼────────────────────────────────────────────────────────────┤
│ System 1: Public Brand &       │ Next.js SSR/ISR Web App (mygermandoener.com), multi-store  │
│ Ordering Platform              │ profile routing (Emba & Limassol), dynamic queue-based ETA │
├────────────────────────────────┼────────────────────────────────────────────────────────────┤
│ System 2: Overhead 4x 4K       │ 4x 4K Overhead Smart TVs (/boards?screen=1..4), sub-500ms │
│ Signage & Customer Queue       │ Sold-Out sync, automated dayparting, /display wait board   │
├────────────────────────────────┼────────────────────────────────────────────────────────────┤
│ System 3: Front-of-House (FOH) │ Dual-Till Concurrency: Register 1 (iPad 10.9" Web POS) +   │
│ Cashier Operations             │ Register 2 (Shopify POS Terminal). Central 192.168.1.50    │
│                                │ ingestion, unified ticket queue, Link4Pay, RJ12 drawer kick│
├────────────────────────────────┼────────────────────────────────────────────────────────────┤
│ System 4: Kitchen Production   │ Station 1 & 2 Ethernet Thermal Printers on TCP Port 9100,  │
│ & Routing                      │ responsive web KDS (/kds/indoor, /kds/grill), claim locks  │
├────────────────────────────────┼────────────────────────────────────────────────────────────┤
│ System 5: Back-of-House (BOH)  │ Unified Admin Portal (/admin): <500ms instant price push,  │
│ Master Operations Dashboard    │ 1-tap Sold-Out matrix, gram BOM, HACCP logs, BI sales ledger│
└────────────────────────────────┴────────────────────────────────────────────────────────────┘
```

---

### System 1: Public Brand & Ordering Platform
* **Hosting:** Cloud Linux VPS (`mygermandoener.com`).
* **Core Deliverables:**
  - High-performance Next.js SSR/ISR storefront with localized menus (EN/DE/GR).
  - Multi-store routing for **Emba / Paphos Flagship** and **Limassol Marina Hub** (~80% delivery focus).
  - Real-time catalog and product availability synchronization with central cloud database.
  - Live Kitchen-Load Dynamic Pre-Order ETA Algorithm:
    $$\text{Estimated Delivery Time} = \text{Transit Time} + \text{Base Prep (10m)} + (\text{Active KDS Queue} \times 1.5\text{m})$$

---

### System 2: Overhead 4x 4K Digital Signage & Customer Queue
* **Display Target:** 4x 4K Overhead Smart TVs (`/boards?screen=1..4`) + 43" Customer Order Status TV (`/display`).
* **Core Deliverables:**
  - Zero-reflow, GPU-accelerated 3840×2160 vector layouts rendered locally from `192.168.1.50`.
  - **Sub-500ms Sold-Out Push:** Instant visual updates across all 4 screens via Server-Sent Events when inventory depletes.
  - **Dynamic Dayparting Engine:** Automated switching between Lunch Specials (11:00–15:00) and Evening Offers (17:00–23:00).
  - **4-Screen Category Allocation:**
    * **Screen 1:** Hero Brand & Slogan ("BITE THE HYPE", rotating spit 4K video loop).
    * **Screen 2:** Original German Döner & Platters (Veal/Beef, Chicken, Mixed).
    * **Screen 3:** Dürum Wraps & Döner Boxes.
    * **Screen 4:** Specialties, Loaded Fries, Combos (+€3.50), Homemade Sauces & Drinks.
  - **Customer Queue TV (`/display`):** Live "Preparing" vs. "Ready for Pickup" status columns with distinct audio chimes, unified across both FOH registers.

---

### System 3: Front-of-House (FOH) Dual-Till Cashier Operations
* **Dual-Till Concurrency:** Front-of-House order entry operates concurrently across two cashier terminals:
  * **Register 1:** Apple iPad 10.9" in countertop locking swivel stand running Custom Web POS (`/pos`) with Link4Pay card terminal and 24V RJ12 drawer kick.
  * **Register 2:** Dedicated Shopify POS Hardware Terminal.
* **Central Order Ingestion & Unified Sequencing:**
  - On-premise Windows Server PC (`192.168.1.50`) acts as the single central ingestion engine for both registers (direct LAN API for iPad POS; local webhook/app bridge for Shopify POS).
  - Both registers increment a single, synchronized ticket number queue for kitchen production and Customer Pickup TV (`/display`) tracking.
* **Multi-Till Printing & Central Inventory Deduction:**
  - Orders from both the iPad and Shopify POS trigger identical split routing across the 2x LAN thermal printers (Port 9100) — Indoor Assembly and Outdoor Charcoal Grill.
  - Real-time Bill of Materials (BOM) inventory deductions and rotisserie spit meat depletion calculate centrally on `192.168.1.50` regardless of which till originated the transaction.
* **Core POS Deliverables:**
  - Fast-tap interface with 3-step customization modal (Meat, Bread, Sauces, Extras).
  - 5-Flame Spice Meter (Level 1 Mild to Level 5 Hölle!) with customer disclaimer modal.
  - One-tap meal combo upsell (+€3.50 for fries and 330ml beverage).
  - Reverse Cyprus Statutory Dual-VAT calculation printed on thermal receipts:
    $$\text{Net}_{\text{Food}} = \frac{\text{Gross}_{\text{Food}}}{1.09}, \quad \text{Net}_{\text{Alcohol}} = \frac{\text{Gross}_{\text{Alcohol}}}{1.19}$$
  - 24V RJ12 cash drawer pulse kick command on cash transactions.
  - Link4Pay card terminal integration.

---

### System 4: Kitchen Production & Dual-Station Routing
* **Hardware Target:** Dual Physical Ethernet Thermal Printers on Port 9100 + Web KDS (`/kds/indoor`, `/kds/grill`).
* **Core Deliverables:**
  - **Station 1 (Indoor Assembly Line Printer):** Receives assembly chits (bread, salad, sauce order) over raw TCP Port 9100.
  - **Station 2 (Outdoor Charcoal Rotisserie/Grill Printer):** Receives meat carving chits with exact portion gram weights (150g, 100g, 75g) and spice levels over raw TCP Port 9100.
  - **Dual Web KDS Views (`/kds/indoor` and `/kds/grill`):** Responsive line displays with cook claim collision locks and 3-tier urgency timers (🟢 <4m, 🟡 4–8m, 🔴 >8m).
  - **Future Kitchen TV Rollout:** Ready to stream to 2x Kitchen Smart TVs mounted over prep lines.

---

### System 5: Back-of-House (BOH) Master Operations Dashboard
* **Target Interface:** Store Backoffice & Owner Portal (`/admin`).
* **Core Deliverables:**
  - **Single-Pane-of-Glass Management:** Real-time operational overview across Emba and Limassol.
  - **Instant Price Overrides (<500ms):** Updating base prices or promos immediately pushes across all 4K screens and POS tills without reloading.
  - **1-Tap Sold-Out Matrix:** Instant stock availability overrides.
  - **Gram-Level BOM Tracking:** Recipe-based Bill of Materials tracking and shared rotisserie spit meat depletion.
  - **Digital HACCP Logbook (EU Reg EC 852/2004):**
    * ❄️ Chilled Storage: `0.0°C – 5.0°C` (Target: `3.0°C`)
    * 🧊 Deep Freezers: `-18.0°C – -22.0°C`
    * 🔥 Hot-Holding Rotisserie Spit Meat: `≥ 63.0°C` (Target: `65.0°C – 75.0°C`)
    * ⚠️ Danger Zone (`5.0°C – 63.0°C`): Mandatory corrective action note and instant owner push alert.
  - **WhatsApp Supplier Reorders with >€250 Approval Gate:** Automatic PDF generation and dispatch; orders >€250 require PIN approval from RICO or OLIVER.
  - **Shift Scheduling & 4-Digit PIN Timeclock:** Replaces ConnectTeam with zero recurring software fees.
  - **Daily BI Sales & Cyprus Dual-VAT Accounting Export.**

---

## 3. Acceptance Testing & Quality Standards

3.1 **User Acceptance Testing (UAT):** Each system and module shall be deployed to a staging environment and tested against the functional acceptance criteria defined in Master PRD Revision 3.3.

3.2 **Review Window:** The Client shall have five (5) business days from delivery notification to verify the module against the SOW specifications.

3.3 **Sign-Off:** Upon satisfactory completion of UAT, the Client shall issue written approval or authorize the corresponding monthly milestone installment.

---

### IN WITNESS WHEREOF, the Parties have executed this Statement of Work as of the date first above written.

```
For the Contractor:                          For the Client:
MD. SAIED SAGAR                              MY GERMAN DÖNER TRADING LTD




_________________________________________    _________________________________________
MD. SAIED SAGAR                              RICO
Systems Architect & Lead Engineer            Co-Founder & Managing Director
Date: ___________________________________    Date: ___________________________________




                                             _________________________________________
                                             OLIVER
                                             Co-Founder & Managing Director
                                             Date: ___________________________________
```
