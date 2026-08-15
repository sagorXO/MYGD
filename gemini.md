# MY GERMAN DÖNER — Kiosk/POS System
## Project Constitution (`gemini.md`)

> **Last Updated:** 2026-08-15T19:55:00+03:00  
> **Phase:** 3 — Full Implementation & Production Verification Complete  
> **Status:** Production Ready • Aligned with `mygermandoener.com` • Next.js Build 0 Errors

---

## 1. Product Requirements & Brand Alignment

### Mission & Client Identity
Build an enterprise-grade self-service kiosk, cashier POS, kitchen display (KDS), customer order TV board, and backoffice analytics terminal for **MY GERMAN DÖNER** fast-casual restaurants in Cyprus.

- **Official Live Website:** `https://mygermandoener.com/`
- **Slogans:** `"BITE THE HYPE"`, `"THE FIRST REAL GERMAN DOENER IN CYPRUS"`
- **Flagship Location:** `Pavlides Court, Agíou Stefánou Street 134, 8260 Emba, Paphos, Cyprus`
- **Second Location:** `Limassol Marina Commercial Promenade, Limassol`
- **Architecture Module:** Module M4 of MYGD Store Automation

### Core Brand Design Tokens
| Token | Value | Usage |
|:------|:------|:------|
| `--mygd-charcoal` | `#1F1F21` | Dark Graphite Background |
| `--mygd-surface` | `#2B2B2E` | Card & Container Surfaces |
| `--mygd-border` | `#3A3A3E` | Input borders & Dividers |
| `--mygd-magenta` | `#E50D7E` | Electric Neon Magenta (Primary CTA, Prices, Active) |
| `--mygd-cyan` | `#00FCED` | Electric Neon Cyan (Secondary Badges, Highlights) |
| `--mygd-gold` | `#E5A93C` | Popular Badges & VIP Accents |
| `--mygd-green` | `#4CAF50` | Vegetarian & Success States |
| `--mygd-red` | `#E53935` | Spicy Flame & Void Alerts |
| `--font-display` | `Oswald` | High-impact headlines, category titles, CTAs |
| `--font-body` | `Figtree` | Legible body copy, descriptions |
| `--font-mono` | `JetBrains Mono` | Receipts, order IDs, VAT calculations |

---

## 2. Curated High-Value Application Features

1. **"Döner Club" Loyalty & Voucher Engine:** Promo code redemption (`BITETHEHYPE` 10% off, `MYGD20` 20% off, `CYPRUS5` €5 off) with dynamic Cyprus 19% VAT recalculation.
2. **3-Step Visual Customizer:** Meat weights (`Standard 150g`, `Small 100g`, `Mini 75g`), bread choices, homemade sauces (up to 3 free), and €1 extras (Grilled Halloumi, Greek Feta, Fries inside).
3. **5-Flame Spice Meter:** From `Level 1: Mild` to `Level 5: Hölle!` with extreme spice alert modal.
4. **One-Tap Meal Combo Upsell:** Bundle any döner with crispy Berlin fries and 330ml drink (+€3.50).
5. **Dietary & Allergen Filter Matrix:** Instant menu filtering for `🌱 Veggie / Falafel`, `🔥 Spicy Kick`, and `⭐ Top Sellers`.
6. **Dynamic Kitchen Load & Smart Wait Estimator:** Live queue calculation (`~4-6 mins` off-peak to `~12-15 mins` peak).
7. **Digital e-Receipt & QR Pass:** Smartphone QR code on confirmation for paperless receipts.

---

## 3. Database Schema (Prisma 6.x / SQLite WAL Mode)

Source file: [`prisma/schema.prisma`](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/prisma/schema.prisma)

### 15 Enterprise Models
1. **`Location`** — Multi-store configuration (Emba, Limassol)
2. **`Terminal`** — Kiosk & POS hardware configs (Epson TM / Star Micronics)
3. **`Category`** — Localized EN/DE/GR categories (Döner, Wraps, Bowls, Pizza & Burger, Sides, Drinks)
4. **`Product`** — Sliced meats, combos, prices, badges
5. **`LocationPrice`** — Store-specific price overrides (M11)
6. **`ModifierGroup`** — Meat, bread, sauce, extra groups
7. **`Modifier`** — Individual choices with price adjustments
8. **`ProductModifierGroup`** — Join table for product customizers
9. **`Order`** — `{LOCATION}-{YYYYMMDD}-{HHmm}-{SEQ}` unique orders
10. **`OrderItem`** — Snapshot line items with spice levels & combos
11. **`OrderItemModifier`** — Modifiers snapshot
12. **`KitchenTicket`** — KDS queue & retry counts
13. **`AdminUser`** — Bcrypt-hashed staff/manager PINs
14. **`AuditLog`** — Security & price override audit trail
15. **`SyncQueue`** — Outbound cloud sync queue

---

## 4. Multi-Device Routes & Operational Runbooks

| Route | Target Device | Resolution | Role |
|:------|:--------------|:-----------|:-----|
| `/` | Portrait Touch Kiosk | 1080×1920 | Self-service ordering |
| `/pos` | Countertop Cashier Till | 1024×768 (Landscape) | Rapid counter POS |
| `/kds` | Kitchen Display Monitor | 1920×1080 (16:9) | Real-time line cooking |
| `/display` | Customer Status TV Board | 1920×1080 (16:9) | Waiting area pickup board |
| `/admin` | Store Backoffice Portal | 1440×900+ (Desktop) | Analytics, VAT & CRUD |

### Build & Verification Commands
```bash
# Seed Database with official menu
npx tsx prisma/seed.ts

# Run Unit Tests
npm test

# Production Compile (Next.js Turbopack)
npm run build

# Start Dev Server
npm run dev
```
