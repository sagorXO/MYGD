# 🥙 MY GERMAN DÖNER — Operations Control Suite
## In-Store Hardware Procurement & Deployment Guide (Final Release)

> **Document Status:** Authoritative Hardware Specification  
> **Prepared For:** RICO & OLIVER (Founders & Managing Directors), Markus (Project Lead)  
> **Prepared By:** MD. SAIED SAGAR (Lead Systems Architect)  
> **Locations:** Emba / Paphos (Flagship) & Limassol Marina (Delivery Hub ~80%)  

---

## 1. Store Hardware Topology & Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                             IN-STORE HARDWARE TOPOLOGY                                      │
├───────────────────────────────┬────────────────────────────┬────────────────────────────────┤
│ Front of House (FOH - Sys 3)  │ Kitchen Production (Sys 4) │ Digital Signage & Server (S2/5)│
├───────────────────────────────┼────────────────────────────┼────────────────────────────────┤
│ • Reg 1: 1x Apple iPad 10.9"  │ • 1x Indoor Thermal ESC/POS│ • 4x 4K Overhead Smart TVs     │
│   (Web POS /pos + Swivel Stand│   (Ethernet TCP Port 9100) │ • 1x 43" Customer Pickup TV    │
│   + LAN Printer + RJ12 Drawer)│ • 1x Outdoor Grill ESC/POS │ • 1x 10.1" Staff Wall Tablet   │
│ • Reg 2: 1x Dedicated Shopify │   (Ethernet TCP Port 9100) │ • 1x On-Premise Windows Server │
│   POS Hardware Terminal       │ • Dual Web KDS Endpoints   │   PC (Static 192.168.1.50 -    │
│ • 1x Link4Pay Card Terminal   │ • (Future: 2x Kitchen TVs) │   Central Ingestion Engine)    │
│ • Retires: Legacy Win7 Touch  │                            │ • 1x Dual-WAN 4G Backup Router │
└───────────────────────────────┴────────────────────────────┴────────────────────────────────┘
```

---

## 2. Itemized Hardware Procurement Bill of Materials (BOM)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   HARDWARE PROCUREMENT MATRIX                                    │
├─────┬──────────────────────────┬─────────────────────────────────────┬─────┬─────────────────────┤
│ Ref │ Component Category       │ Recommended Model / SKU             │ Qty │ Source / Action     │
├─────┼──────────────────────────┼─────────────────────────────────────┼─────┼─────────────────────┤
│ H01 │ Local On-Premise Server  │ Dedicated Windows PC (Static .50)   │  1  │ Existing In-Store PC│
│ H02 │ FOH POS Till (Reg 1)     │ Apple iPad 10.9" (10th Gen, Wi-Fi)  │  1  │ Client-Procured     │
│ H03 │ POS Stand & Swivel Encl. │ Countertop Locking Swivel Stand     │  1  │ Shopify / Local IT  │
│ H04 │ FOH POS Till (Reg 2)     │ Dedicated Shopify POS Terminal      │  1  │ Existing / Active   │
│ H05 │ Receipt Printer (FOH)    │ Star Micronics / Epson TM (LAN/USB) │  1  │ In-Store / Verify   │
│ H06 │ Cash Drawer (Automatic)  │ APG Vasario / Star (24V RJ12)       │  1  │ In-Store / Verify   │
│ H07 │ Payment Card Terminal    │ Link4Pay Wireless / Countertop      │  1  │ Re-use Existing L4P │
│ H08 │ Indoor Kitchen Printer   │ Ethernet ESC/POS Thermal (TCP:9100) │  1  │ Active In-Store     │
│ H09 │ Outdoor Grill Printer    │ Ethernet ESC/POS Thermal (TCP:9100) │  1  │ Active In-Store     │
│ H10 │ Future Kitchen Displays  │ 2x 24"-32" Kitchen Smart TVs        │  2  │ Client Future Phase │
│ H11 │ Customer Order Status TV │ 43" Commercial 4K TV (/display)     │  1  │ Active In-Store     │
│ H12 │ Overhead Menu Boards     │ 4x 4K Overhead Smart TVs (/boards)  │  4  │ Active In-Store     │
│ H13 │ Staff Station Tablet     │ 10.1" Tablet (iPad / Lenovo Tab)    │  1  │ Active In-Store     │
│ H14 │ Dual-WAN 4G Failover Rtr │ TP-Link ER605 / Teltonika RUTX11    │  1  │ Local IT Distributor│
│ H15 │ Gigabit Ethernet Switch  │ TP-Link TL-SG108 8-Port Switch      │  1  │ Local IT Distributor│
└─────┴──────────────────────────┴─────────────────────────────────────┴─────┴─────────────────────┘
```

---

## 3. Detailed Component Specifications

### 3.1 Local In-Store Windows Server PC (`192.168.1.50`)
1. **Operating System & Role:** Dedicated Windows 10/11 Pro PC running 24/7 as an unattended background service via NSSM or WinSW.
2. **Network Address:** Configured with static LAN IP `192.168.1.50` on the local Gigabit subnet.
3. **Core Responsibilities:**
   - **Central Dual-Till Ingestion Engine:** Unifies transactions from **Register 1 (iPad Web POS `/pos`)** via direct LAN API and **Register 2 (Shopify POS Hardware Terminal)** via local webhook/app bridge.
   - **Unified Sequential Ticket Numbering:** Generates a single, synchronized order sequence across all channels (e.g. #101, #102, #103) for kitchen routing and the Customer Pickup TV (`/display`).
   - **Multi-Till Print Spooling:** Spools orders from both registers over raw TCP Port 9100 to Station 1 (Indoor Assembly) and Station 2 (Outdoor Grill).
   - **Central BOM & Spit Meat Depletion:** Calculates ingredient and spit meat deductions on `192.168.1.50` in real time, pushing automatic `Product.isAvailable = false` updates across all screens.
   - **Local Database & Offline Broker:** Embedded SQLite WAL (<2ms latency) and SSE event broker (<15ms latency).
   - **Offline Sync Queue:** Buffers offline transactions in `SyncQueue` for zero-data-loss cloud synchronization.

---

### 3.2 Front of House (FOH) Dual-Till Countertop Stations (System 3)
1. **Dual-Till Concurrency:** Cashier counter supports concurrent order entry across two dedicated hardware terminals during peak volume:
   - **Register 1:** Apple iPad 10.9" in locking countertop swivel stand running the Custom Web POS (`/pos`) in kiosk mode, connected to Link4Pay and 24V RJ12 drawer kick.
   - **Register 2:** Dedicated Shopify POS Hardware Terminal.
2. **Hardware Retirement:** The aging legacy **Windows 7 touch machine is fully decommissioned and retired**.
3. **Card Reader:** Existing Link4Pay terminal paired with cashier workflows.
4. **Cash Drawer:** Heavy-duty steel drawer triggered via 24V RJ12 pulse from the receipt printer kick port.

---

### 3.3 Kitchen Production Line & Dual Thermal Printing (System 4)
1. **Station 1 (Indoor Assembly Line Printer):** Ethernet thermal printer configured at static IP accepting raw ESC/POS chits on TCP Port 9100. Prints bread selection, salad layers, and sauce order.
2. **Station 2 (Outdoor Charcoal Rotisserie Printer):** Ethernet thermal printer configured at static IP accepting raw ESC/POS chits on TCP Port 9100. Prints meat type, portion weight (150g, 100g, 75g), and spice level.
3. **Dual Web KDS Views:** Responsive endpoints (`/kds/indoor` and `/kds/grill`) accessible via browser.
4. **Future Kitchen TV Rollout:** Ready for 2x Kitchen Smart TVs mounted above prep stations in a subsequent hardware upgrade.

---

### 3.4 4x 4K Overhead Digital Menu Boards (System 2)
1. **Displays:** 4x 4K Overhead Commercial Smart TVs mounted above the counter.
2. **Category Mapping:**
   - **Screen 1:** Hero Brand & Slogan ("BITE THE HYPE", rotating spit 4K video loop).
   - **Screen 2:** Original German Döner & Platters (Veal/Beef, Chicken, Mixed).
   - **Screen 3:** Dürum Wraps & Döner Boxes.
   - **Screen 4:** Specialties, Loaded Fries, Combos (+€3.50), Homemade Sauces & Drinks.
3. **Local Rendering:** Driven directly via local LAN from `192.168.1.50` with zero cloud bandwidth latency.

---

### 3.5 In-Store Network & 4G Failover
1. **Router:** Dual-WAN router with 4G LTE SIM backup.
2. **Ethernet Prioritization:** POS iPad, Windows Server PC (`192.168.1.50`), and both thermal printers hardwired via Cat6 Ethernet.

---
*End of In-Store Hardware Procurement & Deployment Guide*
