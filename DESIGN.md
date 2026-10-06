# 🎨 MY GERMAN DÖNER — Master Design System Specification v1.0
## Integrated Operations Suite Visual & Architectural Standard (`DESIGN.md`)

> **Brand Identity:** MY GERMAN DÖNER (MYGD)  
> **Slogans:** `"BITE THE HYPE"`, `"THE FIRST REAL GERMAN DOENER IN CYPRUS"`  
> **Official Website:** [mygermandoener.com](https://mygermandoener.com/)  
> **Touchpoints Unified:** FOH POS (10.9" iPad), Indoor/Grill KDS, Customer Pickup Display, Staff Tablet, BOH Admin & Reporting, 4×4K Menu Boards, Public Ordering  
> **Governing Contracts:** MSA Rev 3.1, SOW Rev 3.1, Technical Prerequisites Rev 3.1  
> **Visual Archetype:** Modern Fast-Casual Operations — Clean, Bold, Touch-First, High-Contrast, Restrained Magenta  

---

## 1. Core Design Principles

1. **Fast before decorative.** Every operational interaction minimizes taps, pointer travel, and decision time.
2. **Status must be obvious.** Orders, printers, stock, payments, kitchen tickets, and synchronization state are recognizable at a glance with color + icon + text.
3. **Brand with restraint.** MYGD magenta (`#E6007E`) is strictly reserved for primary actions, active states, and strong brand moments. It never floods the interface.
4. **Touch-first.** The FOH POS is built around a 10.9-inch iPad landscape (minimum 56px touch targets, 96–136px product tiles). Kitchen and customer screens emphasize distant legibility.
5. **Offline is a first-class state.** Store architecture operates independently of cloud connectivity. Offline is an expected operating mode (`LOCAL MODE`), rendered in calm grey-blue, not alarming red.
6. **One system, different densities.**
   - **POS / Staff Tablet:** Spacious, tactile (`touch` density).
   - **Kitchen KDS:** Information-dense, oversized tickets (`operational` density).
   - **BOH Admin:** Precision data tables, KPI metrics (`compact` density).
   - **Overhead Menu Boards:** Cinematic 4K visual merchandising (`3840×2160`).

---

## 2. Brand & Neutral Foundations

### 2.1 Brand Magenta Scale
```css
:root {
  --mygd-brand-50:  #FFF0F7; /* Soft brand background / active category rail */
  --mygd-brand-100: #FFD9EB; /* Selected surfaces */
  --mygd-brand-200: #FFB3D7; /* Highlight border */
  --mygd-brand-300: #FF7EBC; /* Decorative accent */
  --mygd-brand-400: #F63A9D; /* Hover on light brand */
  --mygd-brand-500: #E6007E; /* PRIMARY MYGD BRAND — Action & Key States (calibrated from legacy #E50C7E) */
  --mygd-brand-600: #C9006E; /* Primary button hover */
  --mygd-brand-700: #A7005B; /* Pressed state */
  --mygd-brand-800: #820047; /* High-contrast text on light */
  --mygd-brand-900: #590031; /* Deep brand accent */
}
```

### Light theme
Operational canvas `neutral-50` (`#F7F7F8`), cards `white` (`#FFFFFF`), text `neutral-900` (`#171719`), secondary `neutral-600` (`#56565F`), borders `neutral-200` (`#DFDFE3`).

### Dark theme
Kitchen KDS and customer display canvas `neutral-950` (`#0B0B0D`), ticket containers `neutral-800` (`#242428`), text white (`#FFFFFF`), borders `neutral-700` (`#38383F`).


### 2.2 Neutral Surface Scale
```css
:root {
  --mygd-neutral-0:   #FFFFFF; /* Surface / Card background */
  --mygd-neutral-25:  #FCFCFD; /* App background */
  --mygd-neutral-50:  #F7F7F8; /* Secondary background / Operational canvas */
  --mygd-neutral-100: #EEEEF0; /* Dividers & hairline borders */
  --mygd-neutral-200: #DFDFE3; /* Control & card borders */
  --mygd-neutral-300: #C8C8CF; /* Disabled borders */
  --mygd-neutral-400: #9D9DA7; /* Secondary icons & placeholder text */
  --mygd-neutral-500: #73737E; /* Muted metadata text */
  --mygd-neutral-600: #56565F; /* Secondary text */
  --mygd-neutral-700: #38383F; /* Strong text / dark borders */
  --mygd-neutral-800: #242428; /* Dark surface / KDS ticket background */
  --mygd-neutral-900: #171719; /* Primary ink / Admin sidebar */
  --mygd-neutral-950: #0B0B0D; /* KDS canvas / Display black */
}
```

---

## 3. Semantic Color System (Never Color Alone)

Every semantic color is strictly paired with a label, icon, or explicit geometric shape.

| Semantic Token | Value | Background Token | Value | Meaning & Context |
|:---|---:|:---|---:|:---|
| `success` | `#16865C` | `success-bg` | `#EAF8F2` | Paid, ready, online, completed, HACCP pass |
| `warning` | `#D98216` | `warning-bg` | `#FFF4E2` | Attention, low stock, ticket approaching limit (5–8 min) |
| `danger` | `#D63C45` | `danger-bg` | `#FDECEE` | Failure, void, critical, HACCP temp out of range |
| `info` | `#2867C7` | `info-bg` | `#EBF3FF` | Information, preparing state, dispatch |
| `offline` | `#6E7580` | `offline-bg` | `#F1F3F5` | Local autonomous mode (cloud unavailable) |
| `late` | `#C23C2C` | `late-bg` | `#FCEBE9` | KDS ticket late threshold exceeded (> 8 min) |

---

## 4. Typography Hierarchy & Tabular Figures

- **Default Font Family:** `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Tabular Figures Rule:** Tabular numerals are mandatory for money, timestamps, quantities, and KPIs:
  ```css
  font-variant-numeric: tabular-nums;
  ```

| Style | Size | Weight | Line Height | Use |
|:---|---:|---:|---:|:---|
| **Display XL** | 48px | 700 | 56px | 4K Menu boards / Customer pickup display |
| **Display** | 40px | 700 | 48px | Dashboard KPIs / POS Total Due |
| **H1** | 32px | 700 | 40px | Page header title |
| **H2** | 24px | 700 | 32px | Major section title / Modal title |
| **H3** | 20px | 600 | 28px | Card title / Ticket header |
| **Body L** | 18px | 500 | 28px | POS product titles / KDS order line |
| **Body** | 16px | 400 | 24px | Standard general UI body text |
| **Body S** | 14px | 400 | 20px | Admin metadata / Table data row |
| **Label** | 14px | 600 | 20px | Form field label / Input label |
| **Caption** | 12px | 500 | 16px | Secondary metadata / Status chip text |
| **Numeric XL**| 56px | 700 | 60px | Cash change due / Link4Pay terminal prompt |
| **Numeric** | 28px | 700 | 36px | Prices / Inventory counts |

---

## 5. Spacing, Radii & Elevation

### 5.1 Spacing (4px Base Grid)
`space-1`: 4px | `space-2`: 8px | `space-3`: 12px | `space-4`: 16px | `space-5`: 20px | `space-6`: 24px | `space-8`: 32px | `space-10`: 40px | `space-12`: 48px | `space-16`: 64px | `space-20`: 80px | `space-24`: 96px.

- **Operational Screens (POS/KDS/Staff):** 12–24px interior spacing.
- **Admin Screens:** 8–20px interior spacing depending on data density.

### 5.2 Border Radii
- `radius-xs` (4px): Small controls, compact tags.
- `radius-sm` (8px): Inputs, selects, textareas.
- `radius-md` (12px): Standard buttons, table actions.
- `radius-lg` (16px): Cards, modals, side sheets.
- `radius-xl` (20px): POS product tiles.
- `radius-full` (999px): Status chips, avatar pills.

### 5.3 Elevation & Shadows
```css
:root {
  --shadow-1: 0 1px 2px rgba(0, 0, 0, 0.05);       /* Cards */
  --shadow-2: 0 4px 12px rgba(0, 0, 0, 0.08);      /* Floating panels, popovers */
  --shadow-3: 0 12px 32px rgba(0, 0, 0, 0.12);     /* Side sheets, drawers */
  --shadow-modal: 0 24px 64px rgba(0, 0, 0, 0.20); /* Modal dialogs */
}
```

---

## 6. Surfaces & Environment Theming

| Surface | Target Form Factor | Canvas Background | Card Surface | Text Primary | Text Secondary | Border Color |
|:---|:---|:---|:---|:---|:---|:---|
| **FOH POS** (`/pos`) | 10.9" iPad Landscape (1024–1366px) | `neutral-50` (`#F7F7F8`) | `neutral-0` (`#FFFFFF`) | `neutral-900` (`#171719`) | `neutral-600` (`#56565F`) | `neutral-200` (`#DFDFE3`) |
| **Kitchen KDS** (`/kds/*`) | 1080p+ Kitchen Monitor | `neutral-950` (`#0B0B0D`) | `neutral-800` (`#242428`) | `neutral-0` (`#FFFFFF`) | `neutral-300` (`#C8C8CF`) | `neutral-700` (`#38383F`) |
| **Pickup Display** (`/display`) | 1080p/4K TV | `neutral-950` (`#0B0B0D`) | `neutral-800` (`#242428`) | `neutral-0` (`#FFFFFF`) | `neutral-400` (`#9D9DA7`) | `neutral-700` (`#38383F`) |
| **Staff Tablet** (`/staff`) | 768–1024px Tablet | `neutral-50` (`#F7F7F8`) | `neutral-0` (`#FFFFFF`) | `neutral-900` (`#171719`) | `neutral-600` (`#56565F`) | `neutral-200` (`#DFDFE3`) |
| **BOH Admin** (`/admin/*`) | 1280px+ Desktop / Laptop | `neutral-50` (Sidebar `neutral-900`)| `neutral-0` (`#FFFFFF`) | `neutral-900` (`#171719`) | `neutral-600` (`#56565F`) | `neutral-200` (`#DFDFE3`) |
| **4×4K Menu Boards** (`/boards`)| 4× 3840×2160 Commercial 16:9 | Brand Custom Dark/Light | High-Res Cutouts | High-Contrast Ink | Metadata Accent | Hairline Accent |

---

## 7. Touch Ergonomics & Button Hierarchy

### 7.1 Touch Target Standards
- **POS Primary Action:** 56 px minimum.
- **POS Product Tile:** 96–136 px.
- **KDS Action (Bump/Recall):** 64 px minimum.
- **Staff Tablet Action:** 52 px minimum.
- **Admin Desktop Control:** 40 px minimum.
- **Compact Table Control:** 36 px minimum.

### 7.2 Button Hierarchy & Sizing
- **Primary:** Magenta (`#E6007E`) background, white text (`Pay €18.70`, `Save Changes`, `Start Shift`).
- **Secondary:** White/neutral surface with `neutral-200` border, `neutral-900` text (`Cancel`, `Edit`, `Back`).
- **Tertiary:** Text-only button with hover tint.
- **Success:** Solid `#16865C` (`Mark Ready`, `Complete Delivery`).
- **Destructive:** Solid `#D63C45` (`Void Order`, `Delete User`). Destructive controls never sit immediately adjacent to primary actions.

**Height Hierarchy:**
- Admin: 40–44 px
- Staff: 48–52 px
- POS: 56–64 px
- KDS: 60–72 px

---

## 8. Specific Operational Components

### 8.1 POS Product Tile
- States: `Default`, `Pressed`, `Selected`, `Sold out` (55% opacity, `SOLD OUT` badge, click disabled, not grayscale alone), `Low inventory`, `Unavailable for channel`.

### 8.2 Numeric Keypad
- Used for Cash amount, HACCP temperature, Spit weight, Staff PIN, Inventory counts.
- Minimum cell height: **72 px** on operational touchscreens.

### 8.3 KDS Ticket Progression
- Flexible columns: 280–360px wide, 16px gap.
- Urgency thresholds:
  - `0–5 min`: Normal (neutral border, pace badge).
  - `5–8 min`: Warning (`#D98216` badge and border).
  - `8+ min`: Late (`#C23C2C` badge and border, priority escalation).

### 8.4 Offline State ("LOCAL MODE")
- Dedicated calm grey-blue banner:
  > **LOCAL MODE** — Cloud sync unavailable. Sales and kitchen operations continue normally.
- Never use alarming red unless local printing or local sales fail.

### 8.5 HACCP Food Safety Reading
- Cold Storage: `0.0°C to 5.0°C` ➔ Green pass badge (`✓ Within range`).
- Cooked Meat Holding: `≥ 63.0°C` ➔ Green pass badge (`✓ Within range`).
- Danger Zone / Out of range: Red exception feedback + mandatory corrective action prompt.

### 8.6 VAT Presentation (Contractual Compliance)
- System-level property (never cashier-selected).
- **Reduced Rate (9%):** Food & non-alcoholic items.
- **Standard Rate (19%):** Alcoholic beverages.
- Reports show Gross, Net, and Tax explicitly per rate.

---

## 9. Component API & Architecture

Components expose **semantic state**, not styling decisions:

```tsx
// Correct
<StatusBadge status="online" />
<OrderTicket state="late" />
<Button intent="danger" />
<ProductTile availability="sold-out" />
<DataTable density="compact" />

// Prohibited (Anti-pattern)
<Badge color="green" />
<Ticket red />
<Button background="#D63C45" />
```

---

*Standardized for MY GERMAN DÖNER Operations Control Suite.*
