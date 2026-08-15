# MY GERMAN DÖNER — Customer-Facing Tablet Display Specification

> **Project ID:** `8267423676963551603`  
> **Design System:** `assets/344892017512994051`  
> **Device Type:** `TABLET` (Landscape Orientation 16:9 / 16:10)  
> **Created At:** 2026-08-15T19:35:00+03:00  

---

## 1. Visual Mockup & Screen Output

![Customer-Facing Tablet Screen](/Users/saiedsagar/.gemini/antigravity/brain/e175b8f1-3dcf-410e-be65-0eb7c00b65da/tablet_pos_display_1786811686154.jpg)

---

## 2. Screen Architecture & Visual Hierarchy

The secondary customer-facing tablet screen is mounted on the counter facing the ordering customer, synchronized in real time via SSE (Server-Sent Events) with the cashier till (`POS-01`).

### A. Left Panel (60% Width) — Live Itemized Bill
1. **Brand Header:**
   - Text: `MY GERMAN DÖNER · THE ORIGINAL BERLIN KEBAB 🇩🇪`
   - Flame icon in `#FF5722` badge
   - Live synchronization status: `Live Cashier Sync (Emba #01)` with pulsating green status indicator (`#4CAF50`).
2. **Itemized Ring-Up Feed:**
   - Real-time display of products as rung up:
     - **Classic Döner Kebap (€7.50):** Garlic Herb sauce, Mild spice, Extra Halloumi (+€1.50)
     - **Crispy Fries Large (€3.50):** Berlin Paprika Salt, Curry Mayo Dip
     - **Ayran 250ml (€2.50):** Chilled Traditional Turkish Yogurt Drink
   - Monospace quantity tags (`1×`) and right-aligned price tags in `JetBrains Mono`.
3. **Financial Summary Breakdown:**
   - **Subtotal (Net Excl. VAT):** €11.34
   - **19% Cyprus VAT (Included):** €2.16 (labeled with `CY 19%` badge)
   - **Tip / Gratuity Row:** Dynamic display based on customer tip selection (e.g. `+€2.02` for 15%).
   - **Total Due Banner:** Prominent `€13.50` (or `€15.52` with tip) in 48-52px font-extrabold signal orange (`#FF5722`) with warm glowing ambient shadow.

---

### B. Right Panel (40% Width) — Payment, Gratuity & Loyalty Club
1. **Contactless Payment Terminal Card:**
   - Title: `TAP OR INSERT CARD / PHONE`
   - Animated radar wave NFC contactless icon with glowing orange halo
   - Multi-method support badges: Apple Pay, Google Pay, VISA, Mastercard, Chip & PIN.
2. **Quick Tip Selection Matrix:**
   - 5 interactive tip pills:
     - `No Tip` (€0.00)
     - `10%` (€1.35)
     - `15%` (€2.02) — Default active state with orange border and glow
     - `20%` (€2.70)
     - `Custom`
   - Dynamic recalculation of the grand total in real-time upon selection.
3. **MYGD Döner Club Loyalty QR Box:**
   - High-contrast QR code vector graphic
   - Headline: `Scan for 10% Points`
   - Subtext: `Earn 14 Points on this order toward free döner meals.`
4. **Security Certification Footer:**
   - `PCI PTS 6.x & EMV L2 Certified` with green shield icon (`#4CAF50`).

---

## 3. Design Tokens

| Token | Hex / Value | Usage |
|:------|:------------|:------|
| `bg-primary` | `#1A1A1A` / `#101010` | Tablet canvas background |
| `bg-surface` | `#222222` | Itemized card & payment surface |
| `bg-card` | `#1F1F1F` | Payment terminal & loyalty QR box |
| `brand-orange` | `#FF5722` | Total amount, active tip button, brand logo |
| `brand-gold` | `#E5A93C` | Loyalty badges, tip highlights |
| `brand-green` | `#4CAF50` | Cyprus tax badge, live status dot, EMV security |
| `font-primary` | `Space Grotesk` | Headlines, titles, buttons |
| `font-body` | `Inter` | Descriptions, line item modifiers |
| `font-mono` | `JetBrains Mono` | Prices, totals, quantities, tax figures |

---

## 4. Deliverables & Code Artifacts

- **Interactive HTML Prototype:** [customer_facing_tablet_screen.html](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/customer_facing_tablet_screen.html)
- **Production React Component:** [CustomerFacingTabletDisplay.tsx](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/components/CustomerFacingTabletDisplay.tsx)
- **Visual Mockup Image:** [tablet_pos_display_1786811686154.jpg](file:///Users/saiedsagar/.gemini/antigravity/brain/e175b8f1-3dcf-410e-be65-0eb7c00b65da/tablet_pos_display_1786811686154.jpg)
