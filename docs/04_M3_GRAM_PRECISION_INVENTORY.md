# Module M3: Gram-Precision Inventory Management
## Functional & Technical Specification (`docs/04_M3_GRAM_PRECISION_INVENTORY.md`)

> **Replaces:** Guessing, manual eye-balling, and unexpected evening stock-outs.  
> **Key Value:** Every sale instantly deducts meat, bread, sauces, and toppings down to the gram, triggering predictive restock warnings before running out.

---

## 1. Gram-Level Recipe Consumption Engine

Every menu item in the database (M11) is linked to a precise BOM (Bill of Materials) recipe:

### Example: Original German Döner (Standard 150g)
| Ingredient | Unit Deduction per Sale | Reorder Alert Threshold |
|:---|:---:|:---:|
| **Rotisserie Sliced Meat** (Chicken or Beef) | `150 grams` | `< 15.0 kg` (approx. 100 döners left) |
| **German Fladenbrot Bread** | `1 piece` | `< 40 pieces` (prompt baker order) |
| **Homemade Kräuter Sauce** | `35 grams` | `< 2.5 kg` |
| **Homemade Knoblauch Sauce** | `35 grams` | `< 2.5 kg` |
| **Crisp Salad Blend** (Red cabbage, lettuce, tomato) | `85 grams` | `< 5.0 kg` |
| **Greek Feta Cheese** (if extra chosen) | `40 grams` | `< 1.0 kg` |
| **Cyprus Grilled Halloumi** (if extra chosen) | `50 grams` | `< 1.5 kg` |

---

## 2. Predictive Stock-Out Triggers

1. **Velocity-Based Depletion Tracking:** The system calculates real-time burn rate:  
   $$\text{Hours of Stock Remaining} = \frac{\text{Current Available Stock}}{\text{Average Sales per Hour (Past 3 Hours)}}$$
2. **Early Baker Warning (15:30 Alert):** If bread burn-rate projects stock depletion before 21:00, the system prompts the store manager at **15:30** to place a top-up bakery order before baker closing hours.
3. **Automatic Out-of-Stock Kiosk Sync:** When an ingredient hits `0.0`, the system automatically marks related products and modifiers as `SOLD OUT` across all customer touchpoints (Kiosks, POS, and Online Web).

---

## 3. Waste & Spoilage Logging

- Staff can log burnt meat, dropped bread, or expired sauce batches directly via the `/admin` or `/staff` interface with reason tags (`BURNT`, `EXPIRED`, `DROPPED`, `TASTING`).
- Feeds directly into Module M9 to accurately compute **Net Food Cost & Gross Margin**.
