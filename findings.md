# MY GERMAN DÖNER — Research & Findings
## (`findings.md`)

> **Last Updated:** 2026-08-15T19:12:00+03:00

---

## 1. Competitor Benchmarks (14 Kiosk UI Leaders)

### Tier 1 — Direct Competitors (Döner/Kebab)
| Brand | Key Design Pattern | Takeaway for MYGD |
|:------|:-------------------|:------------------|
| **German Doner Kebab (GDK) UK** | Carbon black + neon orange, 3D food cutouts on dark bg, left category rail, waffle bread hero imagery | Direct blueprint — our closest competitor. Match quality, exceed UX |
| **Döner Shack UK** | Berlin streetwear aesthetic, industrial charcoal, neon amber, stencil fonts | Validates our German industrial direction |
| **Kebap with Attitude (Berlin)** | Hyper-modern minimalist, matte black + acid lime, monospace typography | Proves döner can carry premium artisanal branding |

### Tier 2 — Fast-Casual Leaders
| Brand | Key Design Pattern | Takeaway for MYGD |
|:------|:-------------------|:------------------|
| **McDonald's** | Golden yellow + charcoal, 3×4 tile grid, persistent bottom order bar, universal usability | Best-in-class universal UX across all ages/languages |
| **Shake Shack** | Minimalist off-black, fresh green accents, large lifestyle photography, zero clutter | Food photography quality standard to match |
| **Five Guys** | Red/white checkerboard, "All 15 free toppings" philosophy, radical clarity | Transparency in customization — no hidden fees |
| **Wingstop** | Dark mode + neon lime, interactive heat scale gauge (1-10), gamified sauce selection | Spice level UX inspiration for our flame meter |
| **Sweetgreen** | Editorial typography, dietary-first transparency, portion toggles | Ingredient badge patterns (Vegan, Gluten-Free) |
| **CAVA** | Step-by-step progress bar, real-time bowl preview, multi-selection counter | Step tracker UX for complex customization |
| **Panera Bread** | "You Pick Two" combo builder, split half-and-half graphic, nutrition tracker | Combo/bundle UX pattern for meal upgrades |
| **Taco Bell** | Electric purple + magenta dark mode, bottom ingredient swap drawer | Quick swap substitution pattern |
| **Popeyes** | Binary Spicy vs Classic toggle, macro food photography | Simple upfront decision reduces cognitive load |
| **LEON UK** | Sunshine yellow + jet black, playful badges, ingredient accordion | European fast-casual warmth and badge patterns |
| **Honest Burgers** | British racing green, butcher-block aesthetic, transparent pricing | Trust-building transparent pricing pattern |

### Key Universal Patterns Across All 14
1. **Persistent bottom cart bar** — always visible with running total
2. **Dark backgrounds** — food photography pops, reduces ambient light interference
3. **2-column portrait grids** — optimal for 1080px kiosk width
4. **Category sidebar/tabs** — horizontal or left rail, always visible
5. **Large touch targets** — minimum 48px, recommended 64-80px for primary CTAs
6. **Progressive customization** — step-by-step disclosure, not all-at-once
7. **Meal bundle upsell** — post-item-add prompt with savings display
8. **Image-dominant cards** — 60%+ image ratio on product cards

---

## 2. Developer Brief Analysis

### MYGD Control System — 11 Module Architecture
Source: [MYGD Control System Developer Brief EN.pdf](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/Requirements/MYGD%20Control%20System%20Developer%20Brief%20EN.pdf)

| Module | Name | Phase | Status for Kiosk Build |
|:-------|:-----|:------|:----------------------|
| M1 | Checklists & Logbook | Phase 1 | Out of scope |
| M2 | Ordering | Phase 2 | Out of scope |
| **M4** | **POS (Till)** | **Phase 7** | **⬅️ THIS BUILD** |
| **M5** | **Kitchen Display** | **Phase 7** | Forward-compatible hooks (ticket queue) |
| M6 | Pre-Order & Drive-Through | Phase 8 | Out of scope (requires M5) |
| **M11** | **Product & Price Database** | **Phase 2** | Schema embedded in kiosk DB |

### 3-Layer Architecture
- **Layer 3 (HQ)**: Cloud control center — out of scope, sync hooks only
- **Layer 2 (In-Store)**: Local computer with SQLite — **this is our runtime**
- **Layer 1 (Devices)**: Kiosk touchscreen + receipt printer — **our hardware target**

### Key Client Quote
> *"If you forget to pay your internet bill, the till stops working, the printer stops working, nothing works."*
> — This drives our **offline-first** architecture requirement.

---

## 3. Tech Stack Documentation (Context7)

### Next.js App Router
- Route groups `(kiosk)` and `(admin)` for isolated layouts
- Server Components for data fetching, Client Components for interactivity
- Route Handlers for API endpoints (`app/api/*/route.ts`)
- Middleware for terminal auth and kiosk lock
- `AnimatePresence` with `mode="wait"` for page transitions

### Prisma ORM + SQLite
- WAL mode for crash safety and concurrent reads
- Singleton pattern to prevent hot-reload connection leaks
- `migrate deploy` for production deployments in Docker CMD
- Composite indexes on `[locationId, status]` and `[terminalId]`

### Framer Motion
- Spring physics for all touch feedback (`stiffness: 500, damping: 30`)
- `layoutId` morphing for product card → customization modal
- `AnimatePresence` for cart item enter/exit
- `whileTap` for all interactive elements (no hover-dependent UI)

### Tailwind CSS
- Custom `mygd` color palette with semantic tokens
- Custom kiosk breakpoints: `kiosk` (portrait), `pos-landscape`, `tablet`
- Touch target utilities: `touch`, `touch-lg`, `touch-xl` spacing
- Kiosk-specific: `select-none`, `touch-pan-y`, `overflow-hidden`

---

## 4. Stitch MCP Integration

### Project
- **Title:** MY GERMAN DÖNER — Kiosk POS
- **Project ID:** `8267423676963551603`
- **Resource Name:** `projects/8267423676963551603`

### Design System
- **Asset Name:** `assets/344892017512994051`
- **Config:** DARK mode, VIBRANT color variant
- **Primary:** `#FF5722` (Signal Orange)
- **Secondary:** `#E5A93C` (Döner Gold)
- **Tertiary:** `#4CAF50` (Success Green)
- **Neutral:** `#1A1A1A` (Deep Charcoal)
- **Headlines:** Space Grotesk
- **Body:** Inter
- **Labels:** JetBrains Mono
- **Roundness:** ROUND_TWELVE (12px corners)

### Generated Screens (tracking)
| Screen | Subagent | Status |
|:-------|:---------|:-------|
| Attract/Welcome | `0a40e364` | 🔄 Running |
| Menu Catalog | `8b08fc29` | 🔄 Running |
| Customization Modal | `e6d865eb` | ✅ Spec ready (call MCP from parent) |
| Cart Review | `2487e20a` | 🔄 Running |
| Payment Selection | `aa83f3a4` | ✅ Complete ([PaymentMethodScreen.tsx](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/components/PaymentMethodScreen.tsx)) |
| Order Confirmation | `65f9b623` | 🔄 Running |

---

## 5. Cyprus-Specific Requirements

| Requirement | Value | Notes |
|:------------|:------|:------|
| VAT Rate | 19% | Standard Cyprus VAT |
| Currency | EUR (€) | Eurozone member |
| Number Format | German-style | €7,50 (comma decimal) |
| Languages | EN, DE, GR | English primary, German + Greek toggle |
| Locations | Emba/Paphos (live), Limassol (setup) | Multi-location from day one |
| Legal compliance | TBD | Receipt/invoice requirements pending client decision |
