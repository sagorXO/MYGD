# 🥙 MY GERMAN DÖNER — Connected Operations Control System
## Canonical Technical Architecture & System Specification (v3.3)

> **Document Status:** Authoritative & Canonical Specification  
> **Last Updated:** 2026-08-24T15:00:00+03:00  
> **Lead Systems Architect:** MD. SAIED SAGAR (Sole Implementation Engineer)  
> **Client Stakeholders:** RICO & OLIVER (Founders & Managing Directors), Markus (Project Lead)  
> **Target Locations:** Emba / Paphos (Flagship Live), Limassol Marina (Delivery Hub ~80%)  
> **Official Website:** [mygermandoener.com](https://mygermandoener.com/) | **Slogans:** *"BITE THE HYPE"*, *"THE FIRST REAL GERMAN DOENER IN CYPRUS"*  
> **Commercial Terms:** €12,000 Fixed Contract Fee (€1,000 Advance + €1,000 / Month for 11 Months — 12-Month Total Active Term)  

---

## 1. Architectural Separation: Hybrid Local Edge & Cloud Tier

The architecture enforces a strict, zero-duplication division of responsibilities across cloud commerce and on-premise store execution:

```mermaid
graph TD
    subgraph "LAYER 3: CLOUD TIER (Linux VPS - Hostinger KVM / Hetzner Ubuntu Docker)"
        CLOUD_WEB["Public Web App & Pre-Order (mygermandoener.com - Next.js)"]
        CLOUD_DB["Central Cloud Sync Database (Multi-Tenant PostgreSQL)"]
        CLOUD_BI["Remote Executive BI Analytics & P&L Overhead"]
        CLOUD_DELIV["External Delivery Integration Bridges (Wolt, Foody)"]
    end

    subgraph "LAYER 2: IN-STORE EDGE SERVER (Windows PC at static 192.168.1.50)"
        EDGE_SVC["Unattended Background Windows Service (NSSM / WinSW)"]
        INGEST_ENG["Dual-Till Ingestion Engine & Unified Ticket Sequencer"]
        BOM_ENG["Central Real-Time BOM & Spit Depletion Engine"]
        LOCAL_DB["Embedded Local Database (SQLite WAL Mode <2ms Latency)"]
        LOCAL_SSE["Real-Time SSE Event Broker (<15ms Local LAN Broadcast)"]
        PRINT_HUB["Raw TCP Multi-Printer Spooler (Port 9100)"]
        SYNC_QUEUE["Outbound SyncQueue Buffer & Cloud Replay Machine"]
    end

    subgraph "LAYER 1: STORE TOUCHPOINTS & HARDWARE (Local LAN)"
        POS_REG1["FOH Reg 1: iPad 10.9\" (/pos) + Link4Pay + 24V RJ12 Drawer"]
        POS_REG2["FOH Reg 2: Dedicated Shopify POS Hardware Terminal"]
        PRN_INDOOR["Station 1: Indoor Assembly Line Thermal Printer (TCP:9100)"]
        PRN_GRILL["Station 2: Outdoor Charcoal Rotisserie Printer (TCP:9100)"]
        KDS_VIEWS["Dual KDS Responsive Web Views (/kds/indoor & /kds/grill)"]
        TV_PICKUP["Customer Pickup Status 43\" TV (/display)"]
        STAFF_TAB["Staff Station 10.1\" Tablet (/staff - HACCP, Clock, SOPs)"]
        BOARDS_4K["4x 4K Overhead Smart TVs (/boards - Zero-Reflow Vector CMS)"]
    end

    CLOUD_WEB <-->|Bidirectional SyncQueue| EDGE_SVC
    EDGE_SVC --> INGEST_ENG
    INGEST_ENG --> BOM_ENG
    BOM_ENG --> LOCAL_DB
    EDGE_SVC --> LOCAL_SSE
    EDGE_SVC --> PRINT_HUB
    POS_REG1 ===>|Direct LAN API| INGEST_ENG
    POS_REG2 ===>|Local Webhook / App Bridge| INGEST_ENG
    LOCAL_SSE <===> POS_REG1
    LOCAL_SSE <===> KDS_VIEWS
    LOCAL_SSE <===> TV_PICKUP
    LOCAL_SSE <===> STAFF_TAB
    LOCAL_SSE <===> BOARDS_4K
    PRINT_HUB -->|Raw TCP Stream| PRN_INDOOR
    PRINT_HUB -->|Raw TCP Stream| PRN_GRILL
```

### Core Separation Invariants:
1. **Local Edge Autonomy & Dual-Till Concurrency (`192.168.1.50`):** Register 1 (iPad `/pos`) and Register 2 (Shopify POS Terminal) operate concurrently. The Windows server provides central order ingestion, unified ticket sequencing, real-time BOM spit deductions, and multi-till printer routing with **zero internet dependency**.
2. **Cloud Tier Coordination:** Manages public online pre-orders, central database sync, and remote owner reporting.
3. **Statutory Cyprus Dual-Rate VAT:** Enforces 9% Reduced VAT on food/soft drinks ($\text{Net} = \frac{\text{Gross}}{1.09}$) and 19% Standard VAT on alcoholic beverages ($\text{Net} = \frac{\text{Gross}}{1.19}$).
4. **4x 4K Overhead Screen Topology:** GPU-accelerated zero-reflow vector layouts streamed locally from `192.168.1.50`.

---

## 2. Kitchen Hardware & Dual-Station KDS Scope

Store 01 currently operates with **two physical Ethernet thermal printers**:
1. **Station 1: Indoor Assembly Line ESC/POS Printer (TCP Port 9100):** Receives assembly chits (bread, salad, sauce order).
2. **Station 2: Outdoor Charcoal Rotisserie/Grill ESC/POS Printer (TCP Port 9100):** Receives meat carving chits with portion weights and spice levels.
3. **KDS Phase 1 Web Views:** Dual responsive endpoints (`/kds/indoor` and `/kds/grill`).
4. **Future Kitchen TV Roadmap:** Architecture is pre-configured for the client's planned procurement of 2x Kitchen Smart TVs mounted over prep lines.

---

## 3. Hardware Standard: Dual-Till Concurrency & iPad POS

The aging **Windows 7 touch machine is fully decommissioned and retired**. Front-of-House (FOH) ordering operates concurrently across:
- **Register 1:** Apple iPad 10.9" running the Custom Web POS (`/pos`) on a countertop swivel stand with Link4Pay and RJ12 drawer kick.
- **Register 2:** Dedicated Shopify POS Hardware Terminal.
Both registers feed into the local server engine (`192.168.1.50`) for unified sequencing and central inventory deductions.

---

## 4. Current Build State & Implementation Status

| Work Unit / Module | Description | Implementation Status | Test Suite Status |
|:---|:---|:---:|:---:|
| **Baseline Architecture Suite** | Initial tests (BOM, ESC/POS, Tax, Reorder, Pricing) | 🟢 `COMPLETE` | ✅ 100% Passing (13 tests) |
| **WU-1: Real-Time Event Hub** | SSE / WebSocket live event dispatcher across screens | 🟢 `COMPLETE` | ✅ 100% Passing (6 tests) |
| **WU-2: Order Ingestion & POS Checkout** | Dual-VAT calculations, cash drawer kick, DB write | 🟢 `COMPLETE` | ✅ 100% Passing (8 tests) |
| **WU-3: Dynamic Stock Compute (M3)** | Inventory BOM deduction setting `Product.isAvailable` | 🟢 `COMPLETE` | ✅ 100% Passing (4 tests) |
| **WU-4: Checklists & HACCP (M1)** | `tasksJson`/`logsJson` persistence & danger zone alerts| 🟢 `COMPLETE` | ✅ 100% Passing (6 tests) |
| **WU-5: 4x 4K Menu Board CMS (M10)**| 4x 4K screens live DB & SSE push | 🟢 `COMPLETE` | ✅ 100% Passing (13 tests) |
| **WU-6: Timeclock & SOP Guides (M7/M8)**| PIN timeclock (`TimeLog`) & `RecipeStep` build sheets | 🟢 `COMPLETE` | ✅ 100% Passing (17 tests) |
| **WU-7: Executive Dual-VAT Reporting (M9)**| Real-time sales, labor cost & Cyprus 9%/19% VAT | 🟢 `COMPLETE` | ✅ 100% Passing (4 tests) |
| **WU-8: Offline Sync Queue** | `SyncQueue` transaction buffer & replay machine | 🟢 `COMPLETE` | ✅ 100% Passing (2 tests) |
| **Current Test Suite Total** | **All 16 Test Suites Across System** | 🟢 **ACTIVE** | **✅ 65/65 Passing (100%)** |

---
*End of Canonical Technical Architecture Specification v3.3*
