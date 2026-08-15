# MY GERMAN DÖNER — Payment Method Selection Screen Specification

> **Project ID:** `8267423676963551603`  
> **Design System:** `assets/344892017512994051`  
> **Device Type:** `MOBILE` (Portrait Kiosk 1080x1920)  
> **Created At:** 2026-08-15T19:18:00+03:00  

---

## 1. Visual Mockup

![Kiosk Payment Method Screen](/Users/saiedsagar/.gemini/antigravity/brain/aa83f3a4-9833-4802-ba67-47963a878899/kiosk_payment_screen_1786810672947.jpg)

---

## 2. Screen Architecture & Visual Hierarchy

### A. Header Bar
- **Left Action:** Circular back button (`#2A2A2A` background, `1px solid #3A3A3A`, white back arrow icon) with active press feedback (`whileTap={{ scale: 0.92 }}`).
- **Center Title:** `'CHOOSE PAYMENT'` in uppercase bold white text (`Space Grotesk`, `text-xl`, `tracking-wide`).
- **Right Tag:** `'STEP 4/4'` step counter pill badge in monospace `#9E9E9E`.

### B. Order Total Display Section
- **Container:** Rounded `24px` card in `#242424` with subtle `1px solid #333333` border.
- **Label:** `'TOTAL AMOUNT'` in uppercase tracking-widest muted gray (`#9E9E9E`).
- **Amount Display:** `'€25.59'` in 48-52px font-extrabold brand orange (`#FF5722`) with subtle warm drop-shadow (`0 2px 14px rgba(255, 87, 34, 0.35)`).
- **Tax Breakdown:** Cyprus 19% VAT breakdown note with green status indicator (`3 items • Incl. 19% Cyprus VAT (€4.09)`).

### C. 2x2 Payment Method Grid
Symmetrical 2x2 grid of touch targets (`160px × 160px` minimum bounding box, `20px` border radius):
1. **CASH:** Banknote icon, label `'CASH'`, subtext `'Pay at Counter'`.
2. **CARD (Selected):** Credit card icon, label `'CARD'`, subtext `'Credit / Debit'`, highlighted with `2px solid #FF5722`, orange ambient glow shadow (`0 0 25px rgba(255, 87, 34, 0.45)`), and top-right checkmark badge.
3. **CONTACTLESS:** NFC contactless wave icon, label `'CONTACTLESS'`, subtext `'Apple / Google Pay'`.
4. **QR CODE:** QR code icon, label `'QR CODE'`, subtext `'PayPal / TWINT'`.

### D. Bottom CTA Bar
- **Primary CTA:** Full-width rounded-2xl brand orange button (`#FF5722`, hover `#F4511E`) with bold white text `'CONFIRM PAYMENT'` and arrow right icon.
- **Security Indicator:** `'TERMINAL SECURE'` with green shield icon and `'Modify Order'` secondary action.

---

## 3. Design Tokens

| Token | Hex / Value | Usage |
|:------|:------------|:------|
| `bg-primary` | `#1A1A1A` | Canvas background |
| `bg-surface` | `#242424` | Total amount display container |
| `bg-card` | `#2A2A2A` | Payment method tile background |
| `brand-orange` | `#FF5722` | Selected tile border, primary CTA, total amount |
| `brand-orange-glow` | `rgba(255, 87, 34, 0.45)` | Selected tile glow |
| `brand-green` | `#4CAF50` | Status indicators & security shield |
| `border-subtle` | `#3A3A3A` | Unselected tile borders |
| `text-primary` | `#FFFFFF` | Headlines, active labels, CTA text |
| `text-muted` | `#9E9E9E` | Secondary descriptions, subtext |

---

## 4. Deliverables & Code Artifacts

- **Interactive HTML Prototype:** [payment_method_screen.html](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/payment_method_screen.html)
- **Production React Component:** [PaymentMethodScreen.tsx](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/components/PaymentMethodScreen.tsx)
- **High-Resolution Mockup:** [kiosk_payment_screen_1786810672947.jpg](file:///Users/saiedsagar/.gemini/antigravity/brain/aa83f3a4-9833-4802-ba67-47963a878899/kiosk_payment_screen_1786810672947.jpg)
