# Module M11: Master Product, Price & Recipe Database
## Functional & Technical Specification (`docs/12_M11_MASTER_PRODUCT_AND_PRICE_DATABASE.md`)

> **Key Architectural Principle:** *"Prices, products, and recipes live in exactly one place. Everything else — POS, menu boards, website, inventory, and training — pulls from that single source. A price change is typed once and is correct everywhere."*

---

## 1. Master Data Structure & Entities

Module M11 serves as the foundational database for the entire MY GERMAN DÖNER ecosystem:

```
[ Master Product Catalog ]
       │
       ├──► Base SKUs & Multi-lingual Names (EN / DE / GR)
       ├──► Default Selling Prices & Cyprus 19% VAT Rates
       ├──► Location-Specific Price Overrides (Emba vs Limassol)
       ├──► Modifier Groups (Meats, Breads, Sauces, Extras)
       ├──► BOM Recipes & Gram Deduction Formulas (M3)
       ├──► Visual Build Step Photos & SOP Guides (M8)
       └──► Supplier Purchase Costs & Vendor SKUs (M2)
```

---

## 2. Multi-Location Price Override Engine (`LocationPrice`)

- **Default Base Price:** Configured globally at HQ (e.g. Classic Döner = `€6.50`).
- **Store-Specific Overrides:** If Limassol Marina operates with higher rental overhead, the price can be overridden (e.g. Limassol Classic Döner = `€7.50`):
  ```typescript
  // Price resolution hierarchy in src/lib/pricing.ts
  const resolvedPrice = locationOverride?.price ?? product.basePrice;
  ```
- Kiosks and POS terminals automatically query their assigned location slug (`locationSlug = "EMBA"`) to fetch active localized price lists.

---

## 3. Propagation Engine

When an item price or recipe is updated at HQ (`/admin`):
1. Written to the Master SQLite database table.
2. An event is dispatched to the `SyncQueue`.
3. In-store kiosks, POS registers, digital menu boards, and the mobile web app refresh their active price cache within **<1 second**.
