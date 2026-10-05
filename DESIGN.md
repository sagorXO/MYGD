# 🎨 MY GERMAN DÖNER — Master Design System & Visual Specification
## Brand Identity, OKLCH Tokens, Typography & Multi-Device UI (`DESIGN.md`)

> **Brand Identity:** MY GERMAN DÖNER  
> **Slogans:** `"BITE THE HYPE"`, `"THE FIRST REAL GERMAN DOENER IN CYPRUS"`  
> **Official Website:** [mygermandoener.com](https://mygermandoener.com/)  
> **Self-order kiosk:** supplied by DM Soft (not built here).  
> **Aesthetic Archetype:** Berlin Industrial Neo-Brutalism & High-Contrast Fast-Casual  

---

## 1. Brand Core & Aesthetic Philosophy

MY GERMAN DÖNER combines Berlin streetwear culture, industrial graphite textures, and electric neon accents. The visual hierarchy is engineered for high ambient light visibility on overhead menu boards and in-store screens while maintaining rapid sub-second comprehension on touchscreens.

---

## 2. Color System (v2 — 2026-09-28)

**Source of truth:** `src/ui/tokens.css`. This section documents it; if they disagree, the code wins.

- **Primary:** `#E50C7E` — MYGD magenta from the official badge logo. Primary buttons, selection,
  focus ring. White labels on magenta are bold (contrast 4.48:1). Accent *text* uses `#B8095F`
  on light and `#F170B0` on dark (≥ 5.9:1).
- **Brand black:** `#000000` — logo, app top bar, brand headers (same in both themes).
- **Status:** success (green), warning (amber — replaces the old orange `#FF5722`), danger (red),
  info (cyan — formerly the brand cyan `#00FCED`), highlight (gold — bestsellers).

### Light theme
Canvas `#F4F4F5`, cards `#FFFFFF`, text `#18181B`, secondary `#52525B`, subtle `#65656D`,
borders `#D4D4D8`, input borders `#8A8A93`.

### Dark theme
Canvas `#0B0B0C`, cards `#18181B`, text `#FAFAFA`, secondary `#A1A1AA`, subtle `#8A8A93`,
borders `#333338`, input borders `#6B6B73`.

### Design language
Calm admin-dashboard language — cards on a quiet canvas, one accent per view, page-header anatomy,
scannable index tables, small line icons — expressed in MYGD's own identity. No third-party admin-kit assets
(e.g. Shopify Polaris — its licence forbids use in stand-alone apps). Icons: `lucide-react`,
1.5 stroke, 16/20/24 px.

The previous muted grey `#71717A` failed WCAG AA on cards (2.92:1) and is retired.

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

All touch-facing surfaces (POS, KDS, Staff Tablets) adhere strictly to fast-casual ergonomics:
- **Minimum Tap Target:** `48px × 48px` (WCAG 2.1 AAA Standard).
- **Primary CTAs (POS "PAY CASH", KDS "BUMP"):** `64px – 80px` height with `whileTap={{ scale: 0.96 }}` spring animation.
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
| `/` | Public website | Responsive (phone → desktop) | `390 × 844` → `1440 × 900+` |
| `/pos` | Counter Cashier | Landscape Tablet (4:3 / 16:10) | `1024 × 768` |
| `/kds` | Line Cook / Assembler | Landscape HD Monitor (16:9) | `1920 × 1080` |
| `/display` | Waiting Area Guest | Overhead 4K Display (16:9) | `1920 × 1080` |
| `/staff` | Crew & Slicers | Wall Station Tablet (16:10) | `1024 × 768` / `1280 × 800` |
| `/boards?screen=1..4` | Overhead Menu (4 screens, SOW) | 4K Commercial TVs (16:9) | `3840 × 2160` (per screen) |
| `/order` | Mobile Pre-Order | Smartphone Browser (9:19.5) | `390 × 844` |
| `/admin` | Store Manager / HQ | Desktop / Widescreen Laptop | `1440 × 900+` |

---

*Designed and standardized for MY GERMAN DÖNER Operations Control Suite.*
