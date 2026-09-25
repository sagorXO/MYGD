# [[01_Projects/MYGD/MYGD_Milestone1_Architecture_and_Routing]]
# 🥙 MY GERMAN DÖNER — Architecture & Routing Matrix (PRD v2.2 Realigned)

> **Project:** MY GERMAN DÖNER Connected Operations Control System  
> **Milestone:** M1 & M2 Foundation  
> **Date:** 2026-09-04  
> **Governing Spec:** Master Prompt v2.1 + PRD Amendment v2.2  

---

## 1. Physical Environment & Compute Topology (PRD v2.2)

```
┌────────────────────────────────────────────────────────────────────────┐
│                      CLOUD PRESENCE: LINUX VPS                         │
│                    (Ubuntu 24.04 LTS / Remote HQ)                      │
│   - Remote Executive Analytics, Daily Net Profit & VAT Reporting       │
│   - Multi-Store Catalog Master & Location Price Overrides              │
│   - Cloud Sync Queue & Failover Webhook Endpoint                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ 30s Bi-Directional HTTP Sync
                                    │ (Fail-Safe Offline Queue)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     IN-STORE HUB: LOCAL WINDOWS PC                     │
│                        (LAN Static IP: 192.168.1.50)                   │
│   - Local Edge Gateway Event Stream (`http://192.168.1.50:8080/events`)│
│   - Full In-Store SQLite / Postgres Edge Database                      │
│   - Dual ESC/POS Thermal Printer Spoolers (TCP 9100)                   │
│   - Local KDS WebSocket Synchronization (<100ms Latency)               │
└───────┬───────────────────────────┬────────────────────────────┬───────┘
        │                           │                            │
        ▼                           ▼                            ▼
┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐
│ FOH Cashier Till      │   │ Dual-Station KDS      │   │ Digital TV Signage    │
│ (iPad Touch Web App)  │   │ - `/kds/indoor` (Line)│   │ - `/boards` (4K Pure) │
│ - Shopify POS Card    │   │ - `/kds/grill` (Spit) │   │ - GPU Transform Scaled│
│ - Certified Fiscal Dev│   │ - TCP 9100 Dual Print │   │ - Silent Drop Hold    │
└───────────────────────┘   └───────────────────────┘   └───────────────────────┘
```

---

## 2. Hardware Roles & Fiscal Delineation

1. **FOH POS & Cashier Till:**
   - Standardized on Apple iPad Touch Web App (`/pos`).
   - Payment clearing offloaded to the incoming **Shopify POS ecosystem & client's certified fiscal payment device**.
   - Custom Operations Engine owns kitchen routing, recipe BOM depletion, order sequencing, and reverse VAT math.
2. **Fiscal & Tax Engine:**
   - EU / Cyprus reverse VAT calculations:
     * Reduced 9% rate on food, döners, wraps, bowls, sides, and non-alcoholic drinks (`VatCategory.FOOD_BEV`).
     * Standard 19% rate on German beer and alcoholic beverages (`VatCategory.ALCOHOL`).
     * All displayed customer prices are gross (VAT inclusive).
3. **M5 Kitchen Routing & Dual KDS:**
   - **Station 01 (Indoor Assembly Line):** `/kds/indoor` — dedicated TV display for sandwich assembly, fryer, sauce station, and packaging.
   - **Station 02 (Outdoor Grill Master):** `/kds/grill` — dedicated TV display for rotisserie meat carving, beef steak searing, bread grilling, and halloumi.
   - **Dual TCP 9100 ESC/POS Printers:** Raw socket dispatch to indoor and outdoor printers.
4. **M10 4K Vector Signage Guardrails:**
   - Displays governed by GPU-accelerated container scaling (`transform: scale(calc(100vw / 3840))`) and zero-reflow mutations (`opacity`, `transform: translate3d(0, 0, 0)`).
   - In-store TVs connect to the LAN Edge Gateway (`http://192.168.1.50:8080/events`) before falling back to cloud SSE.

---

## 3. Curated Per-Feature Agent Routing Map

| Feature / Work Unit | Primary Specialist(s) | Review & Verification Layer | Curated Tools & MCPs |
|:---|:---|:---|:---|
| **Base DB Schema & Tenant Isolation** | `database-optimizer`, `architect` | `security-reviewer`, `tdd-guide` | `database-patterns-suite`, `devsecops-cloud-suite`, Context7 |
| **Public Brand Web Platform** | `fullstack-architect`, `brand-visual-guardian`, `ux-architect` | `typescript-reviewer`, `test-automation-lead` | `stitch` MCP, `brand-identity-and-design-systems`, `skeleton-ui-and-responsive-webflow` |
| **M10 4K Vector Menu Boards** | `fullstack-architect`, `performance-benchmarker`, `brand-visual-guardian` | `typescript-reviewer`, `reality-checker` | `stitch` MCP, `motion-2d-3d-animation-and-video`, `memory-leak-debugging` |
| **Mobile Owner CMS & Push Pipeline** | `api-platform-engineer`, `fullstack-architect` | `security-reviewer`, `test-automation-lead` | `playwright` MCP, Context7 (SSE / streaming) |
| **M5 Dual KDS & TCP 9100 Print Routing** | `api-platform-engineer`, `embedded-firmware-engineer` | `test-automation-lead`, `debugger` | `high-performance-systems-suite`, Context7 (ESC/POS sockets) |
