# MY GERMAN DÖNER — Customer Order Status TV Board Specification

> **Project ID:** `8267423676963551603`  
> **Design System:** `assets/344892017512994051`  
> **Device Type:** `DESKTOP` (16:9 Landscape 1920×1080 / 4K Ultra HD Overhead Waiting Display)  
> **Created At:** 2026-08-15T19:36:00+03:00  

---

## 1. Visual Mockup & Screen Output

![Customer Order Status TV Board](/Users/saiedsagar/.gemini/antigravity/brain/7dae5430-e679-457a-b719-25eb67b0ec93/customer_tv_board_1786811752060.jpg)

---

## 2. Screen Architecture & Visual Hierarchy

The Customer Order Status TV Board is an overhead widescreen digital display mounted in the customer pickup and waiting area, designed for high-visibility readability from a distance of 5 to 10 meters.

### A. Header Bar (Full Width Top)
1. **Brand Identity (Left):**
   - Icon: Glowing flame / rotisserie döner spit badge (`#E64A19` to `#FF7043` gradient).
   - Brand Text: `'MY GERMAN DÖNER'` in bold white with brand orange `'DÖNER'` (`#FF5722`).
   - Tagline: `'The Original Berlin Kebab 🇩🇪'` in golden monospace badge (`#E5A93C`).
2. **Status Indicator (Center):**
   - Title: `'NOW SERVING / AKTUELLE BESTELLUNGEN'`
   - Live status indicator: Pulsating emerald green beacon (`#10B981`) indicating active real-time kitchen feed.
3. **Digital Clock & Store Location (Right):**
   - Time: Real-time digital clock `'14:23:45'` formatted in 24h `JetBrains Mono` bold typography.
   - Location: `'EMBA, CYPRUS'` with location pin icon.
   - Audio trigger toggle: Optional notification chime controller.

---

### B. Left Split Column (50% Width) — Preparing / In Arbeit
1. **Amber Gold Header Banner:**
   - Background: Gradient from `#F59E0B` to `#D97706`.
   - Title: `'PREPARING / IN ARBEIT'` in uppercase black font.
   - Subtitle: `'Orders being handcrafted in the kitchen'`.
   - Badge: Dynamic active queue counter (e.g. `'6 IN QUEUE'`).
2. **Order Grid (2×3 Matrix):**
   - Cards: Dark elevated cards (`#242424`) with subtle `#3A3A3A` border.
   - Order Numbers: Large crisp monospace white typography (`JetBrains Mono`, 44–48px): `'EMBA-047'`, `'EMBA-048'`, `'EMBA-049'`, `'EMBA-050'`, `'EMBA-051'`, `'EMBA-052'`.
   - Card Metadata: Kitchen prep station label (e.g. *Döner Kitchen*, *Grill & Toast*, *Fryer & Sides*) and estimated time remaining (e.g. `~2 min` with pulsating amber indicator).

---

### C. Right Split Column (50% Width) — Ready for Pickup / Abholbereit
1. **Glowing Signal Orange Header Banner:**
   - Background: Gradient from `#FF5722` via `#F4511E` to `#E64A19` with warm ambient drop shadow.
   - Title: `'READY FOR PICKUP / ABHOLBEREIT'` in bold white typography.
   - Subtitle: `'Please proceed to the designated pickup counter'`.
   - Badge: Emerald badge indicating ready count (e.g. `'3 READY'`).
2. **Giant Ready Order Cards Stack:**
   - Cards: Elevated deep dark background (`#1F1F1F`) framed with **2px solid glowing Signal Orange border (`#FF5722`)** and pulsating ambient neon glow (`box-shadow: 0 0 25px rgba(255,87,34,0.45)`).
   - Order Numbers: Massive neon signal orange numbers (`56–64px` `JetBrains Mono`): `'EMBA-044'`, `'EMBA-045'`, `'EMBA-046'`.
   - Checkmark & Status: Large emerald green checkmark icon (`#10B981`) and `'Freshly Packed · Ready Now'` indicator.
   - Pickup Station Badge: High-contrast badge: `'Pickup Counter 1'`.

---

### D. Bottom Ticker & Store Announcements (Full Width Bottom)
- **Container:** Dark footer bar (`#141414`) with `#2A2A2A` border and glowing `'NOTICE:'` badge.
- **Ticker Content:** Smooth horizontal scrolling ticker with customer guidelines:
  - *'Please have your receipt order number ready · Guten Appetit! · Fresh Berlin Rotisserie & Authentic German Döner · 100% Certified Halal Meat & Fresh Cyprus Produce · Free Customer WiFi: MYGD-Guest'*.

---

## 3. Design Tokens

| Token | Hex / Value | Application |
|:------|:------------|:------------|
| `bg-screen` | `#121212` | Main TV viewport canvas |
| `bg-column` | `#161616` / `#181818` | Left & Right column container backgrounds |
| `bg-card-prep` | `#242424` | In-prep order card surface |
| `bg-card-ready`| `#1F1F1F` | Ready-for-pickup order card surface |
| `brand-orange` | `#FF5722` | Ready orders, glowing borders, brand logo |
| `brand-amber`  | `#F59E0B` | Preparing banner, ETA badges, kitchen tags |
| `brand-green`  | `#10B981` | Checkmarks, ready status badges, live pulse |
| `brand-gold`   | `#E5A93C` | Location text, German authenticity badges |
| `text-primary` | `#FFFFFF` | Primary headers, prep order numbers |
| `text-muted`   | `#9E9E9E` | Secondary captions, timestamps |
| `font-heading` | `Space Grotesk` | Brand title, column headers, counter badges |
| `font-mono`    | `JetBrains Mono` | Giant order IDs, clock, timestamps |
| `font-body`    | `Inter` | Subtitles, ticker text, station descriptions |

---

## 4. Real-Time Integration & Audio Chimes

- **Data Channel:** Subscribes to POS / KDS WebSocket / SSE stream on channel `orders:status:emba`.
- **Audio Chime:** Dual-tone sine/triangle synthesized chime (`D5 -> A5 -> D6`) triggered whenever an order transitions from `PREPARING` to `READY`.
- **Automatic Overflow:** If more than 6 orders are in preparation or more than 4 ready, automatic vertical page paging executes every 8 seconds.

---

## 5. Deliverables & Code Artifacts

- **Interactive HTML Prototype:** [customer_order_tv_board.html](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/customer_order_tv_board.html)
- **Production React Component:** [CustomerOrderTVBoard.tsx](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/components/CustomerOrderTVBoard.tsx)
- **Visual Mockup Image:** [customer_tv_board_1786811752060.jpg](file:///Users/saiedsagar/.gemini/antigravity/brain/7dae5430-e679-457a-b719-25eb67b0ec93/customer_tv_board_1786811752060.jpg)
