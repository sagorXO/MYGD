# 🎨 MY GERMAN DÖNER — Master Design System & Visual Specification
## Brand Identity, OKLCH Tokens, Typography & Multi-Device UI (`DESIGN.md`)

> **Brand Identity:** MY GERMAN DÖNER  
> **Slogans:** `"BITE THE HYPE"`, `"THE FIRST REAL GERMAN DOENER IN CYPRUS"`  
> **Official Website:** [mygermandoener.com](https://mygermandoener.com/)  
> **Aesthetic Archetype:** Berlin Industrial Neo-Brutalism & High-Contrast Fast-Casual  

---

## 1. Brand Core & Aesthetic Philosophy

MY GERMAN DÖNER combines Berlin streetwear culture, industrial graphite textures, and electric neon accents. The visual hierarchy is engineered for high ambient light visibility on outdoor kiosks and overhead menu boards while maintaining rapid sub-second comprehension for touchscreen ordering.

---

## 2. Color System & OKLCH Token Architecture

The color system is defined in modern **OKLCH color space** for perceptual uniformity across high-gamut 4K displays and sunlight-readable kiosk screens.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CORE COLOR PALETTE                                │
├─────────────────────────┬─────────────────────────┬─────────────────────────┤
│ Dark Graphite (Canvas)  │ Card Surface            │ Border & Dividers       │
│ oklch(0.18 0.005 285)   │ oklch(0.24 0.005 285)   │ oklch(0.30 0.008 285)   │
│ HEX: #1F1F21            │ HEX: #2B2B2E            │ HEX: #3A3A3E            │
├─────────────────────────┼─────────────────────────┼─────────────────────────┤
│ Electric Neon Magenta   │ Electric Neon Cyan      │ Döner Gold              │
│ oklch(0.60 0.28 350)    │ oklch(0.88 0.16 200)    │ oklch(0.75 0.18 75)     │
│ HEX: #E50D7E (Primary)  │ HEX: #00FCED (Badges)   │ HEX: #E5A93C (Popular)  │
├─────────────────────────┼─────────────────────────┼─────────────────────────┤
│ Success / Veggie Green  │ Hazard / Hot Red        │ Pure White Text         │
│ oklch(0.65 0.18 145)    │ oklch(0.58 0.22 25)     │ oklch(0.98 0.000 0)     │
│ HEX: #4CAF50            │ HEX: #E53935            │ HEX: #FFFFFF            │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

### CSS Variables & Semantic Mapping
```css
:root {
  /* Surface Tokens */
  --mygd-canvas: oklch(0.18 0.005 285);      /* #1F1F21 */
  --mygd-surface: oklch(0.24 0.005 285);     /* #2B2B2E */
  --mygd-surface-elevated: oklch(0.28 0.006 285); /* #353539 */
  --mygd-border: oklch(0.30 0.008 285);      /* #3A3A3E */
  --mygd-border-subtle: oklch(0.25 0.006 285); /* #2E2E32 */

  /* Brand Accents */
  --mygd-magenta: oklch(0.60 0.28 350);      /* #E50D7E - Primary CTA, active states */
  --mygd-cyan: oklch(0.88 0.16 200);         /* #00FCED - Combos, Secondary pills */
  --mygd-gold: oklch(0.75 0.18 75);          /* #E5A93C - Bestsellers, VIP */
  --mygd-green: oklch(0.65 0.18 145);        /* #4CAF50 - Vegetarian, Success */
  --mygd-red: oklch(0.58 0.22 25);           /* #E53935 - Spiciness, Critical HACCP */

  /* Neutral Typography */
  --mygd-text-primary: oklch(0.98 0.000 0);  /* #FFFFFF */
  --mygd-text-secondary: oklch(0.72 0.010 285); /* #A1A1AA */
  --mygd-text-muted: oklch(0.52 0.010 285);  /* #71717A */
}
```

---

## 3. Typography Hierarchy & Rules

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            TYPOGRAPHY SYSTEM                                │
├──────────────────┬────────────────────────────┬─────────────────────────────┤
│ Headline / CTAs  │ Oswald (Google Font)       │ Uppercase, Bold (700),      │
│                  │                            │ Tracking Wide (0.05em)      │
├──────────────────┼────────────────────────────┼─────────────────────────────┤
│ Body Copy        │ Figtree (Google Font)      │ Clean, Highly Legible,      │
│                  │                            │ Regular (400) / Semi (600)  │
├──────────────────┼────────────────────────────┼─────────────────────────────┤
│ Numerical & Data │ JetBrains Mono             │ Tabular Figures, Receipts,   │
│                  │                            │ Prices, Clock, Order IDs    │
└──────────────────┴────────────────────────────┴─────────────────────────────┘
```

### Scale & Spacing
- **Display 1 (Attract Screen / Hero):** `font-display text-6xl md:text-8xl uppercase font-black tracking-tight`
- **Section Headers (Menu Categories):** `font-display text-2xl md:text-3xl uppercase font-bold tracking-wide text-white`
- **Product Title:** `font-display text-xl font-bold uppercase text-white`
- **Price Tag:** `font-mono text-xl font-black text-[#00FCED]`
- **Body & Descriptions:** `font-body text-sm leading-relaxed text-[#A1A1AA]`
- **Meta & Badges:** `font-display text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded`

---

## 4. Touch Targets & Ergonomic Guidelines

All touch-facing surfaces (Kiosks, POS, Staff Tablets) adhere strictly to fast-casual ergonomics:
- **Minimum Tap Target:** `48px × 48px` (WCAG 2.1 AAA Standard).
- **Primary CTAs (Kiosk "ADD TO ORDER", POS "PAY CASH"):** `64px – 80px` height with `whileTap={{ scale: 0.96 }}` spring animation.
- **Modifier Option Tiles:** Minimum `56px` height with prominent radio/checkbox indicator and visual border morph on selection.
- **Spacing Grid:** Multiples of 8px (`8px`, `16px`, `24px`, `32px`, `48px`, `64px`).

---

## 5. HACCP & Food-Safety Visual Standards

Food safety readings rendered on the Staff Station (`/staff`) and Store Manager Portal (`/admin`) use explicit color coding based on EU Regulation (EC) 852/2004:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     HACCP FOOD SAFETY TEMPERATURE STATES                    │
├───────────────────────┬─────────────────────────┬───────────────────────────┤
│ Target Environment    │ Temperature Range       │ Visual Indicator          │
├───────────────────────┼─────────────────────────┼───────────────────────────┤
│ Chilled Walk-in / Prep│ 0°C to 5°C              │ 🟢 Solid Green Border     │
│ Deep Freezer          │ -18°C to -22°C          │ 🟢 Solid Green Border     │
│ Cooked Meat Holding   │ ≥ 63°C                  │ 🟢 Solid Green Border     │
│ HACCP Danger Zone     │ 5.1°C to 62.9°C         │ 🔴 Flashing Red/Amber     │
│                       │                         │ (Mandatory Action Prompt) │
└───────────────────────┴─────────────────────────┴───────────────────────────┘
```

---

## 6. KDS Visual Urgency Progression

Kitchen display tickets use dynamic urgency coloring to eliminate kitchen lag:
- 🟢 **Green Badge (`< 4:00`):** Normal cooking pace.
- 🟡 **Amber Badge (`4:00 – 8:00`):** Approaching prep target.
- 🔴 **Flashing Red Border (`> 8:00`):** Delayed ticket / Manager priority escalation.

---

## 7. Multi-Device Viewport Registry

| Route | Persona | Form Factor & Aspect Ratio | Viewport Width × Height |
|:---|:---|:---:|:---:|
| `/` | Guest Self-Order | Portrait Touch Kiosk (9:16) | `1080 × 1920` |
| `/pos` | Counter Cashier | Landscape Tablet (4:3 / 16:10) | `1024 × 768` |
| `/kds` | Line Cook / Assembler | Landscape HD Monitor (16:9) | `1920 × 1080` |
| `/display` | Waiting Area Guest | Overhead 4K Display (16:9) | `1920 × 1080` |
| `/staff` | Crew & Slicers | Wall Station Tablet (16:10) | `1024 × 768` / `1280 × 800` |
| `/boards` | Overhead Menu (1–7) | Array Commercial TVs (16:9) | `1920 × 1080` (per screen) |
| `/order` | Mobile Pre-Order | Smartphone Browser (9:19.5) | `390 × 844` |
| `/admin` | Store Manager / HQ | Desktop / Widescreen Laptop | `1440 × 900+` |

---

*Designed and standardized for MY GERMAN DÖNER Operations Control Suite.*
