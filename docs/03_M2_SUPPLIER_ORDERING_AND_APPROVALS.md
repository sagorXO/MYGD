# Module M2: Supplier Ordering & Spending Approvals
## Functional & Technical Specification (`docs/03_M2_SUPPLIER_ORDERING_AND_APPROVALS.md`)

> **Replaces:** Chaotic WhatsApp messages (*"we could use this... we need toilet paper"*).  
> **Key Value:** 1-Tap supplier ordering, automated duplicate detection, quantity capping, and owner spending approval thresholds.

---

## 1. Core Problem & Solution Matrix

| Legacy Pain Point | Module M2 Solution |
|:---|:---|
| Multiple staff members ordering the same item on WhatsApp | **Duplicate Order Guard:** System detects if bread or meat was already ordered in the last 12 hours. |
| Over-ordering and cash flow leaks | **Quantity Caps & Oli Spending Thresholds:** Any purchase order exceeding **€250** sends an instant approval card to Oli before dispatch. |
| Calling the baker too late after evening stock-outs | **Predictive Evening Check:** Prompts inventory check at 16:00 to place bakery orders before the 17:00 cut-off. |
| Lost supplier contact details | **Central Supplier Directory:** Direct integrations for bakery, meat purveyors, produce, packaging, and beverages. |

---

## 2. 1-Tap "We're Out of This" Reorder Workflow

1. **Staff Trigger:** On the `/staff` tablet or POS `/admin`, staff tap **"Quick Reorder"** for a specific category (e.g. *Fladenbrot Bread (100 pcs)* or *White Squeeze Bottles*).
2. **System Pre-Checks:**
   - Checks if an active purchase order is already pending.
   - Compares order value against spending thresholds.
3. **Dispatch Channel:**
   - **WhatsApp Business API:** Formats a structured text order:  
     `"Hello Paphos Bakery, MY GERMAN DÖNER (Emba) orders: 150x Turkish Fladenbrot for delivery tomorrow by 09:00. Order Ref: PO-EMBA-20260815-01"`
   - **Outbound Email:** Sends PDF purchase order to the vendor's billing inbox.
4. **Approval Escalation:** If order exceeds €250, a WhatsApp interactive button is sent to Oli: `[ APPROVE ]` / `[ REJECT ]`. Upon approval, the PO is automatically released to the supplier.
