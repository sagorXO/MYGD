# 3-Layer Architecture & Offline Sync Engine
## Technical Specification Document (`docs/01_LAYERED_ARCHITECTURE_AND_OFFLINE_SYNC.md`)

> **Architectural Mandate:** *"If you forget to pay your internet bill, the till stops working, the printer stops working, nothing works. As long as there's power, the store must be able to take payments."* — Rico & Oli (Founders)

---

## 1. High-Level Architecture Overview

The system operates across three distinct tiers designed for **zero internet dependency** during peak service hours:

```
┌──────────────────────────────────────────────────────────────────┐
│                   LAYER 3: HQ / CONTROL CENTER                   │
│   (Cloud / Mobile Browser — Accessed by Rico, Oli, and Markus)   │
│   - Master Catalog & Price Overrides (M11)                       │
│   - Financial Analytics, Labor Costs & Net Profit (M9)           │
│   - Supplier Purchase Orders & Spending Approval Engine (M2)     │
│   - Centralized Shift Planning & ConnectTeam Replacement (M7)    │
│   - 7-Screen Menu Board Layout CMS (M10)                         │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ 30-Second Bi-Directional
                                  │ HTTP Sync Queue (Fail-Safe)
┌─────────────────────────────────▼────────────────────────────────┐
│                   LAYER 2: IN-STORE LOCAL HUB                    │
│      (Local Store Mini-PC Server on In-Store Wired/WiFi LAN)     │
│   - Embedded SQLite WAL Database (Full Local Snapshot)           │
│   - Real-Time POS Engine (100% Offline Capable)                 │
│   - Kitchen Order Queue & Display Synchronization (M5)           │
│   - Dual Thermal Printer Spoolers (Epson TM & Star Micronics)    │
│   - RJ12 Cash Drawer Solenoid Pulse Dispatcher                   │
│   - Offline Transaction Buffering & Automatic Replay Engine      │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ In-Store Low-Latency
                                  │ WebSocket / Local REST
┌─────────────────────────────────▼────────────────────────────────┐
│                      LAYER 1: STORE DEVICES                      │
│   - Self-Service Kiosks (1080x1920 Touchscreens)                 │
│   - Cashier Counter Till Tablet (1024x768 iPad/Android)          │
│   - Kitchen Line Screens (Grill, Assembly, Fryer Monitors)       │
│   - Customer Status TV Board (Waiting Area Pickup Display)       │
│   - Wall-Mounted Staff Tablet (Checklists, Timeclock, Training)  │
│   - 7x Digital Menu Boards (HDMI Media Players)                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. In-Store Local Database Engine (SQLite WAL Mode)

### Concurrency & Resilience Settings
To guarantee that high-speed kiosk writes do not block POS cashier reads, SQLite is executed with write-ahead logging (WAL):

```sql
-- Executed on database initialization in src/lib/prisma.ts
PRAGMA journal_mode = WAL;
PRAGMA busy_timeout = 5000;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;
PRAGMA cache_size = -64000; -- 64MB In-Memory Cache
```

### Key Offline Capabilities
1. **Zero Cloud Latency:** Product lookups, category switches, modifier pricing, and order creation execute locally in **<2ms**.
2. **Crash Resilience:** In case of a sudden power outage, WAL log replaying guarantees ACID atomicity with zero corrupted tickets.
3. **Continuous Operation:** Kiosks, POS tills, and KDS monitors communicate over the local store WiFi/LAN router even if the ISP fiber line is severed.

---

## 3. Bi-Directional 30-Second Sync Engine

### Data Flow Rules
1. **Downstream Flow (HQ ➡️ In-Store Hub):**
   - Price updates, new menu items, daily specials, and recipe tweaks.
   - Checklist templates and shift schedules.
   - Menu board visual layouts.
2. **Upstream Flow (In-Store Hub ➡️ HQ):**
   - Completed orders, customer payments, and tender breakdowns.
   - Clock-in/out timestamps and total labor hours worked.
   - Checklist completions, food safety temperature logs, and overdue tasks.
   - Recipe-level inventory deductions and stock-out alerts.

### Sync State Machine (`SyncQueue` Model)
```
[ PENDING ] ──(Trigger every 30s)──> [ SYNCING ] ──(200 OK)──> [ SYNCED ]
                                          │
                                     (Network Fail)
                                          │
                                          ▼
                                 [ FAILED_RETRYING ]
                              (Exponential backoff: 2s, 4s, 8s, 16s, max 60s)
```

- When the in-store internet disconnects, transactions buffer inside the local `SyncQueue` table.
- When internet reconnects, the sync engine replays the buffered queue in chronological order, eliminating duplicate tickets or lost revenue records.
