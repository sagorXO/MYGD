# Module M5: Kitchen Display System (KDS)
## Functional & Technical Specification (`docs/06_M5_KITCHEN_DISPLAY_SYSTEM.md`)

> **Replaces:** Paper tickets, lost slips, and yelled kitchen instructions.  
> **Target Device:** 24"–32" Kitchen-Rated Monitors (`/kds`) at Grill, Assembly, and Fryer stations.  
> **Key Value:** Real-time multi-ticket line display, station routing, order claiming locks to prevent cook collision, and urgency timers.

---

## 1. Kitchen Station Routing

Orders pushed from the Kiosk (`/`), Counter POS (`/pos`), or Mobile Web (`/order`) are automatically parsed and displayed according to station filter tabs:

| Station Filter | Items Displayed | Target Station Location |
|:---|:---|:---|
| **ALL** | Full ticket breakdown across all items | Kitchen Expediter / Head Cook |
| **GRILL / MEAT** | Sliced meat types (Beef, Chicken, Steak) and bread toasting | Rotisserie Carving Station |
| **ASSEMBLY / SAUCES** | Salad toppings, homemade sauces, spice levels, and extras | Cold Salad Well & Wrapping Line |
| **FRYER / SIDES** | Berlin fries, chili-cheese fries, currywurst, and falafel | Deep Fryer Station |

---

## 2. Order Claiming & Collision Lock

- When a line cook taps an order to start preparation, the ticket changes status to **`IN PREPARATION`** and shows the cook's name/badge.
- **Claim Lock:** Locks the ticket so other cooks don't duplicate the same sandwich, eliminating wasted food.

---

## 3. Color-Coded Urgency Timers & Bump Logic

Tickets automatically change border and header colors as time elapses:
- **Green (`< 4:00 min`):** Freshly queued order.
- **Amber (`4:00 – 8:00 min`):** Approaching standard prep target.
- **Red & Flashing (`> 8:00 min`):** Urgent delayed ticket requiring expediter intervention.

### Actions
- **`BUMP TICKET (READY)`:** Cook taps when order is finished. Moves order to `READY` status on KDS and triggers pickup chime on the Customer TV Board (`/display`).
- **`RECALL TICKET`:** Re-opens accidentally bumped orders with a single tap.
