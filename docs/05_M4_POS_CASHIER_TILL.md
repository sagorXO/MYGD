# Module M4: POS (Cashier Counter Till)
## Functional & Technical Specification (`docs/05_M4_POS_CASHIER_TILL.md`)

> **Replaces:** Legacy Windows 2000-era electronic cash register (ECR).  
> **Target Device:** 10"–13" Tablet on Countertop Stand (`/pos`) with Star/Epson printer and RJ12 cash drawer.  
> **Key Value:** High-speed order entry, split payments, automated card terminal pass-through, and 100% offline capability without internet.

---

## 1. UI & Ergonomics Layout (Landscape 1024×768)

1. **Left Navigation Bar (80px):** Fast-switch icons for primary categories: `DÖNER`, `WRAPS`, `BOWLS`, `PIZZA & BURGER`, `SIDES`, `DRINKS`.
2. **Center Product Grid:** High-contrast touch buttons displaying product name, price, and current stock level.
3. **Right Order Ticket Panel (350px):**
   - Active line item list with quantity steppers (`-`, `+`) and modifier breakdowns.
   - Quick discount pills: `10% DISC`, `20% STAFF`, `COMP VIP`.
   - Action keys: `SPLIT BILL`, `HOLD TICKET`, `CLEAR ORDER`.
   - Subtotal, Cyprus 19% VAT, and Big Charge CTA.

---

## 2. Payment & Tender Handling

- **Card Terminal Integration:** Payment amount is transmitted directly to the card terminal via local LAN/USB API, eliminating double-entry errors.
- **Cash Payments:** Cashier inputs cash tendered (e.g. `€20.00`), system calculates change (e.g. `€6.50`), records the cash transaction, and sends an electric pulse down the RJ12 pin to kick open the cash drawer.
- **Split Billing:** Allows splitting an order into equal parts (e.g. 50/50) or split by individual line items.

---

## 3. Offline Resilience & Fiscal Integrity

- **Offline Mode:** The till operates strictly against the local SQLite database on Layer 2. If the internet fails, cashiers continue ringing up orders without slowdown.
- **Cyprus Fiscal Receipt Generation:** Prints compliant thermal receipts with unique sequential invoice numbers, store VAT registration, tax rate breakdown, and timestamp.
