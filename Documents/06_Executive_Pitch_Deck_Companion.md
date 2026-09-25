# 🥙 MY GERMAN DÖNER — Operations Control Suite
## Executive Pitch Deck & Client Presentation Companion (Final Release)

> **Presentation Date:** Monday Walkthrough Meeting  
> **Audience:** RICO & OLIVER (Founders & Managing Directors), Markus (Project Lead)  
> **Presenter:** MD. SAIED SAGAR (Lead Systems Architect & Sole Implementation Engineer)  
> **Brand Website:** [mygermandoener.com](https://mygermandoener.com/) | **Slogans:** *"BITE THE HYPE"* • *"THE FIRST REAL GERMAN DOENER IN CYPRUS"*  
> **Locations:** Emba / Paphos (Flagship) & Limassol Marina (Delivery Hub ~80%)  

---

## 1. Executive Summary: The 5 Integrated Systems

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                          FROM FRAGMENTED TOOLS TO 5 INTEGRATED SYSTEMS                      │
├───────────────────────────────────────────────┬─────────────────────────────────────────────┤
│ THE OLD WAY (CHAOS & GUESSWORK)               │ THE NEW WAY (CONNECTED OPS CONTROL)         │
├───────────────────────────────────────────────┼─────────────────────────────────────────────┤
│ • Chaotic WhatsApp ordering threads           │ • System 5: 1-Tap POs with >€250 Approval   │
│ • Late-night stock-outs ("out of bread")      │ • System 5: Real-time dynamic BOM & alerts  │
│ • Zero remote visibility for absent owners    │ • System 5: Live sales & Cyprus Dual-VAT BI │
│ • USB flash sticks walked to TVs manually     │ • System 2: 4x 4K Overhead Smart TV CMS     │
│ • Paper HACCP sheets & missed fridge checks   │ • System 5: Digital HACCP tablet logs       │
│ • Aging Windows 7 touch machine & paper chits │ • System 3 & 4: iPad POS + Dual Thermal KDS │
└───────────────────────────────────────────────┴─────────────────────────────────────────────┘
```

---

## 2. Hybrid Compute Foundation: 100% In-Store Offline Autonomy

```mermaid
graph TD
    subgraph "CLOUD TIER (Linux VPS - Hostinger/Hetzner Ubuntu Docker)"
        CLOUD_WEB["System 1: Public Web App & Pre-Order (mygermandoener.com)"]
        CLOUD_DB["Central Cloud Sync Database (PostgreSQL)"]
        CLOUD_BI["System 5: Remote Executive BI Analytics & P&L Reporting"]
    end

    subgraph "LOCAL IN-STORE SERVER (Windows PC at static 192.168.1.50)"
        LOCAL_SRV["Unattended Background Windows Service (NSSM / WinSW)"]
        LOCAL_DB["Embedded Local SQLite WAL Mode (<2ms LAN Latency)"]
        LOCAL_SSE["Real-Time SSE Event Broker (<15ms Local Broadcast)"]
        PRINT_SPOOL["System 4: Raw TCP Multi-Printer Spooler (Port 9100)"]
    end

    subgraph "IN-STORE HARDWARE TOUCHPOINTS"
        POS["System 3: FOH iPad 10.9\" (/pos) + Link4Pay + Cash Drawer"]
        PRN_IN["System 4: Indoor Assembly Thermal Printer (TCP:9100)"]
        PRN_OUT["System 4: Outdoor Charcoal Grill Printer (TCP:9100)"]
        KDS_WEB["System 4: Dual KDS Responsive Web Views (/kds/indoor, /kds/grill)"]
        TV_PICK["System 2: Customer Pickup Status 43\" TV (/display)"]
        STAFF_TAB["System 5: Staff Station Tablet (/staff)"]
        BOARDS_4K["System 2: 4x 4K Overhead Smart TVs (/boards?screen=1..4)"]
    end

    CLOUD_WEB <-->|Bidirectional SyncQueue| LOCAL_SRV
    LOCAL_SRV --> LOCAL_DB
    LOCAL_SRV --> LOCAL_SSE
    LOCAL_SRV --> PRINT_SPOOL
    LOCAL_SSE <===> POS
    LOCAL_SSE <===> KDS_WEB
    LOCAL_SSE <===> TV_PICK
    LOCAL_SSE <===> STAFF_TAB
    LOCAL_SSE <===> BOARDS_4K
    PRINT_SPOOL -->|Raw TCP Stream| PRN_IN
    PRINT_SPOOL -->|Raw TCP Stream| PRN_OUT
```

---

## 3. Overview of the 5 Core Systems

### System 1: Public Brand & Ordering Platform
* Public customer portal at `mygermandoener.com` (Next.js SSR/ISR on Cloud Linux VPS).
* Multi-location routing for **Emba Flagship** and **Limassol Marina** (~80% delivery focus).
* Dynamic queue-based live wait time calculation.

### System 2: Overhead 4x 4K Digital Signage & Customer Queue
* 4 overhead 4K Smart TVs displaying zero-reflow, GPU-accelerated vector layouts driven locally from `192.168.1.50`:
  - **Screen 1:** Hero Brand & Slogan ("BITE THE HYPE", rotating spit 4K video loop).
  - **Screen 2:** Original German Döner & Platters (Veal/Beef, Chicken, Mixed).
  - **Screen 3:** Dürum Wraps & Döner Boxes.
  - **Screen 4:** Specialties, Loaded Fries, Combos (+€3.50), Homemade Sauces & Drinks.
* Sub-500ms Sold-Out sync and automated dayparting.
* 43" Customer Order Status TV (`/display`) with dynamic pickup columns and audio chimes.

### System 3: Front-of-House (FOH) Dual-Till Cashier Operations
* **Dual-Till Concurrency:** Front-of-House operates concurrently across **Register 1 (iPad 10.9" Custom Web POS `/pos`)** and **Register 2 (Dedicated Shopify POS Terminal)** during peak rushes.
* Full retirement and decommissioning of the aging Windows 7 machine.
* **Central 192.168.1.50 Ingestion & Unified Sequence:** Direct LAN API + Shopify webhook bridge feeding a single synchronized ticket queue for kitchen routing and Customer Pickup TV (`/display`).
* **Multi-Till Printing & BOM Spit Depletion:** Both tills trigger automatic split printing across Indoor Assembly and Outdoor Grill thermal printers (Port 9100) and central real-time BOM inventory depletion.
* 3-step customization, 5-flame spice meter, and one-tap combo upgrade (+€3.50).
* Reverse Cyprus Dual-VAT (9% Food / 19% Alcohol) printed on thermal receipts.
* 24V RJ12 cash drawer pulse kick on cash sales and Link4Pay card terminal integration.

### System 4: Kitchen Production & Dual-Station Routing
* Dual physical Ethernet thermal printers on TCP Port 9100:
  - **Station 1 (Indoor Assembly Line Printer):** Assembly chits (bread, salad, sauce order).
  - **Station 2 (Outdoor Charcoal Rotisserie/Grill Printer):** Meat carving chits with gram weights (150g, 100g, 75g) and spice levels.
* Responsive web KDS views (`/kds/indoor` and `/kds/grill`), ready for 2x future Kitchen Smart TVs.

### System 5: Back-of-House (BOH) Master Operations Dashboard
* Single-pane-of-glass management portal at `/admin`.
* Instant price push in <500ms and 1-tap Sold-Out matrix.
* Gram-level Bill of Materials (BOM) tracking and shared spit depletion.
* Digital HACCP temperature logging (0-5°C, -18 to -22°C, ≥63°C) with danger zone corrective actions.
* WhatsApp supplier reorders with >€250 approval gate (RICO / OLIVER PIN).
* Staff shift scheduling and 4-digit PIN timeclock (replaces ConnectTeam).
* Daily gross/net sales reporting with Cyprus Dual-Rate VAT exports.

---

## 4. Cyprus Dual-Rate Statutory VAT Compliance

Strict adherence to Cyprus Value Added Tax Law (Law 95(I)/2000 as amended):
* **9% Reduced VAT:** Automatically calculated on all food items, dine-in meals, takeaways, and non-alcoholic beverages ($\text{Net} = \frac{\text{Gross}}{1.09}$).
* **19% Standard VAT:** Strictly isolated and applied to alcoholic beverages (German Pilsner Beer, Keo Beer) ($\text{Net} = \frac{\text{Gross}}{1.19}$).

---

## 5. Commercial Investment & Payment Terms

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 COMMERCIAL PROPOSAL                                         │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ TOTAL CONTRACT INVESTMENT:  €12,000.00 EUR (Fixed Price Scope)                              │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ • UPFRONT ADVANCE DEPOSIT:  €1,000.00 EUR (Due Upon Contract Execution)                     │
│ • MONTHLY INSTALLMENTS:     €1,000.00 / Month for 11 Consecutive Months                     │
│ • SETTLEMENT METHODS:       SEPA Electronic Bank Wire OR Direct Cash against Signed Receipt │
│ • INCLUDES:                 All 5 Systems, Multi-Store Rollout & 12-Month Dedicated SLA     │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Next Steps for Today's Meeting

1. **Review & Sign Contract Suite:** Execute Master Software Services Agreement (MSA) and Statement of Work (SOW Revision 3.1).
2. **Approve Hardware Setup:** Confirm iPad countertop stand, Windows server PC setup (`192.168.1.50`), and dual thermal printer IPs.
3. **Process Advance Invoice (€1,000.00):** Settle via SEPA Bank Transfer or Direct Cash Remittance.

---
*MY GERMAN DÖNER Operations Control Suite — Presentation Companion*
