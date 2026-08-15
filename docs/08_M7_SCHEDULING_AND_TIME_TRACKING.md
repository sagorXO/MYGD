# Module M7: Staff Scheduling & Time Tracking
## Functional & Technical Specification (`docs/08_M7_SCHEDULING_AND_TIME_TRACKING.md`)

> **Replaces:** ConnectTeam subscription fees and manual paper timesheets.  
> **Target Device:** Wall-Mounted Staff Tablet (`/staff`) and Manager Portal (`/admin`).  
> **Key Value:** Shift planning, shift swap requests, PIN-based terminal clock-in/out, and role-filtered task assignments.

---

## 1. Shift Planning & Management

1. **Visual Roster Grid:** Store managers and owners assign weekly shifts across roles:
   - **`SLICER` (Döner Cutter):** Rotisserie skewer management, temperature checks, meat cutting.
   - **`ASSEMBLER` (Salad & Bread):** Sandwich preparation, sauce dosing, packaging.
   - **`CASHIER` (Till / Counter):** POS operations, customer greeting, cash drops.
   - **`OPENER / CLOSER`:** Shift opening prep and end-of-night deep cleaning.
2. **Shift Swapping & Notifications:** Staff can request shift trades; managers approve with one tap.
3. **Budget & Labor Cost Forecasting:** Roster displays projected labor hours and labor cost percentage against expected revenue.

---

## 2. PIN Timeclock Terminal (`/staff`)

1. **Clock-In / Clock-Out:** Staff approach the wall tablet, enter their 4-digit PIN (e.g. `1111`), and tap `CLOCK IN` / `START BREAK` / `CLOCK OUT`.
2. **Geofenced In-Store Hardware:** Clock-ins are restricted to the store LAN network, eliminating remote buddy punching.
3. **Automatic Task Filtering:** Upon clocking in, the tablet displays only the relevant checklists and training guides for that staff member's assigned shift role (e.g. a Slicer sees the meat skewer preparation checklist).
