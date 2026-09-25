# 🥙 MY GERMAN DÖNER — Operations Control Suite
## Staff Operations & Standard Operating Procedures (SOP) Manual (Final Release)

> **Document Status:** Authoritative Staff SOP & Training Guide  
> **Owners & Directors:** RICO & OLIVER  
> **Systems Architect & Engineer:** MD. SAIED SAGAR  
> **Locations:** Emba / Paphos (Flagship) & Limassol Marina (Delivery Hub ~80%)  
> **Official Website:** [mygermandoener.com](https://mygermandoener.com/) | **Brand Slogan:** *"BITE THE HYPE"*  

---

## 1. Overview & Operational Roles across the 5 Systems

This Standard Operating Procedure (SOP) manual establishes clear, standardized workflows for all staff members operating the **MY GERMAN DÖNER Operations Control Suite**.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 STAFF OPERATING MATRIX                                      │
├─────────────────────┬──────────────────────────┬────────────────────────────────────────────┤
│ Staff Role          │ Primary Interface        │ Core Responsibilities                      │
├─────────────────────┼──────────────────────────┼────────────────────────────────────────────┤
│ Cashier 1 / FOH     │ Countertop iPad (/pos)   │ Reg 1: Rapid order entry, Link4Pay, dual-VAT│
│ Cashier 2 / FOH     │ Shopify POS Terminal     │ Reg 2: Concurrent order entry during rush  │
│ Kitchen Line / BOH  │ Dual Thermal Prn & KDS   │ System 4: Indoor & Outdoor chits, bump bar │
│ Shift Supervisor    │ Wall Tablet (/staff)     │ System 5: HACCP temp logs, clock, build SOP│
│ Store Owners        │ Admin Portal (/admin)    │ System 5: Supplier orders, 4K CMS, Dual-VAT│
└─────────────────────┴──────────────────────────┴────────────────────────────────────────────┘
```

---

## 2. Cashier & Front-of-House (FOH) Operating Guide (System 3)

### 2.1 Dual-Till Concurrency & Unified Order Sequencing
1. **Concurrent Peak Ordering:** Two cashiers can operate concurrently during lunch and dinner rushes:
   - **Register 1:** Countertop Apple iPad 10.9" running the Custom Web POS (`/pos`).
   - **Register 2:** Dedicated Shopify POS Hardware Terminal.
2. **Central Ingestion & Unified Sequence Numbers:**
   - Both registers feed into the local on-premise Windows server (`192.168.1.50`).
   - The server maintains a single, synchronized sequential order queue (e.g. #101, #102, #103).
   - Customers receiving receipts from either register are automatically tracked on the **Customer Pickup Status TV (`/display`)**.
3. **Multi-Till Split Printing & Central BOM Deductions:**
   - Any order completed on either Register 1 or Register 2 instantly dispatches raw ESC/POS chits to **Station 1 (Indoor Assembly)** and **Station 2 (Outdoor Grill)** on TCP Port 9100.
   - Ingredient portions and rotisserie spit meat (grams) are deducted centrally on `192.168.1.50` in real time. If an item sells out, "Sold Out" badges push automatically across both registers and all 4x 4K overhead screens.

### 2.2 Placing an Order on Register 1 (`/pos`)
1. **FOH Standard:** Operating on the counter iPad running `/pos` (the aging Windows 7 touch terminal is fully retired).
2. **Category Selection:** Tap the item category on the left sidebar (*Original Döner*, *Dürum Wraps*, *Döner Boxes*, *Currywurst*, *Sides*, *Drinks*).
3. **Product Customization (3-Step Modal):**
   - **Step 1 — Meat & Bread:** Select meat type (*Veal/Beef*, *Chicken*, *Mixed*, *Falafel*) and bread choice (*Fladenbrot*, *Dürum Flatbread*).
   - **Step 2 — Sauce Selection:** Choose up to 3 homemade sauces (*Kräuter Garlic*, *Scharf Hot*, *Sesame Tahini*, etc.).
   - **Step 3 — Extras & Spice Level:** Add extras (+€1.00 for Grilled Halloumi, Greek Feta, or Fries inside). Set spice level from 1 (Mild) to 5 (Hölle!).
4. **One-Tap Meal Combo Upsell:** Tap `+€3.50 Meal Combo` to bundle Berlin Fries and a soft drink.
5. **Loyalty & Vouchers:** Apply promo codes (e.g. `BITETHEHYPE` for 10% off, `CYPRUS5` for €5.00 off). The till automatically computes statutory Cyprus dual-rate VAT (9% on food/soft drinks, 19% on beer).

### 2.3 Payment Settlement & Dual-Rate VAT Receipts
* **CASH Payments:**
  1. Tap `Cash`, enter amount tendered, and tap `Complete Sale`.
  2. The system sends a 24V pulse to open the cash drawer via the RJ12 connection.
  3. Receipt prints automatically showing itemized Cyprus Dual-Rate VAT:
     $$\text{Net}_{\text{Food}} = \frac{\text{Gross}_{\text{Food}}}{1.09}, \quad \text{Net}_{\text{Alcohol}} = \frac{\text{Gross}_{\text{Alcohol}}}{1.19}$$
* **CARD Payments (Link4Pay):**
  1. Tap `Card (Link4Pay)`.
  2. Type the gross total into the Link4Pay standalone terminal.
  3. Customer taps/inserts card. Once approved, tap `Confirm Paid` on the POS till.
* **100% Offline Autonomy:** If internet drops, the on-premise Windows server (`192.168.1.50`) processes cash sales, kicks the cash drawer, and prints kitchen chits locally without cloud interruption.

---

## 3. Kitchen Production Line & Dual-Station Printing (System 4)

### 3.1 Dual Physical Thermal Printers (TCP Port 9100)
1. **Station 1 (Indoor Assembly Line Printer):**
   - Receives assembly chits immediately upon order creation over TCP Port 9100.
   - Shows bread type (*Fladenbrot* / *Dürum*), salad inclusions, sauce order, and extra toppings.
2. **Station 2 (Outdoor Charcoal Rotisserie/Grill Printer):**
   - Receives meat carving chits over TCP Port 9100.
   - Shows meat type (*Veal/Beef*, *Chicken*, *Mixed*), portion gram weight (Standard 150g, Small 100g, Mini 75g), and spice flame level.

### 3.2 Dual KDS Responsive Web Views (`/kds/indoor` & `/kds/grill`)
1. **Viewing Orders:** Accessible on tablets/screens or the client's planned future 2x Kitchen Smart TVs.
2. **Claiming a Ticket:** Cook taps `Claim` to tag the ticket with their color, preventing coworker duplicate preparation.
3. **Urgency Indicators:** 🟢 Green (< 4m), 🟡 Amber (4–8m), 🔴 Flashing Red (> 8m).
4. **Bumping Orders:** Tap `Bump` once packaged. Automatically updates the 43" Customer Pickup TV (`/display`) to **"Ready for Pickup"**.

---

## 4. Shift Supervisor & Food Safety HACCP Guide (System 5)

### 4.1 Digital HACCP Temperature Logging (`/staff`)
* Log temperatures at scheduled intervals: **Opening (08:30)**, **Lunch Rush (11:30)**, and **Closing (23:00)**.
* **EU Regulation (EC) 852/2004 Mandatory Ranges:**
  - ❄️ **Walk-in Fridge / Prep Counter:** `0.0°C – 5.0°C` (Target: `3.0°C`).
  - 🧊 **Deep Freezers:** `-18.0°C – -22.0°C`.
  - 🔥 **Hot-Holding Rotisserie Spit Meat:** `≥ 63.0°C` (Target: `65.0°C – 75.0°C`).
* **HACCP Danger Zone Protocol (`5.0°C – 63.0°C`):**
  - If a temperature falls in the danger zone, the supervisor **must** enter a mandatory corrective action note before submission.
  - An instant escalation alert is dispatched to RICO and OLIVER.

### 4.2 Staff Timeclock & Build Sheets (`/staff`)
* **PIN Clock In/Out:** Staff enter their 4-digit PIN to punch `Clock In`, `Start Break`, `End Break`, or `Clock Out`.
* **Visual Build Sheets:** High-resolution photographic assembly guides with exact gram dosing and 45-second assembly target speed timers.

---

## 5. Store Owners (RICO & OLIVER) Operations Guide (System 5)

### 5.1 WhatsApp Supplier Reordering & >€250 Approval Gate (`/admin`)
1. Navigate to `/admin/suppliers`.
2. Review automated reorder suggestions generated by low-stock threshold triggers.
3. Tap `Generate Purchase Order`.
4. **Approval Gate:** If the order total exceeds **€250.00**, enter owner 4-digit PIN to authorize.
5. Formatted PDF purchase order dispatches automatically via WhatsApp Business API and Email.

### 5.2 4x 4K Overhead Digital Menu Board Management (`/admin`)
1. Navigate to `/admin/boards`.
2. Push live price updates, trigger dayparting (Lunch 11:00–15:00 vs. Dinner 17:00–23:00), or adjust category assignments across the 4 overhead 4K Smart TVs.
3. Monitor screen heartbeat status to ensure all 4 displays are online.

### 5.3 Sales Analytics & Cyprus Dual-Rate VAT Reporting (`/admin`)
1. Navigate to `/admin/analytics`.
2. View real-time gross/net sales, guest counts, and average order value (AOV) across Emba and Limassol.
3. Export itemized Cyprus Dual-Rate VAT reports (9% Food / 19% Alcohol) for tax accounting.

---
*End of Staff Operations & Standard Operating Procedures Manual — MY GERMAN DÖNER*
