# Module M1: Checklists & Digital Logbook
## Functional & Technical Specification (`docs/02_M1_CHECKLISTS_AND_DIGITAL_LOGBOOK.md`)

> **Replaces:** Paper notes, shouted verbal reminders, and unverified memory.  
> **Target Device:** Wall-mounted 10" Staff Tablet (`/staff`) in food prep area.  
> **Key Value:** Automatically verifies opening tasks, shift handovers, and food safety temperature compliance, alerting owners if critical checks are missed.

---

## 1. Core Capabilities & Workflows

### 1. Shift Checklists
1. **Opening Crew Checklist (08:30–10:00):**
   - Unlock store and disarm alarm.
   - Power on rotisserie meat skewer grills (Beef/Lamb & Chicken).
   - Calibrate oil fryer temperatures (175°C).
   - Record walk-in fridge & freezer temperatures (Must be < 4°C / < -18°C).
   - Check fresh salad deliveries (tomatoes, cucumbers, red cabbage, parsley).
   - Ensure thermal receipt printer paper rolls are full in all kiosks and till.
2. **Lunch Peak Readiness (11:30):**
   - Stock prep lines with sliced pita/fladenbrot.
   - Restock squeeze bottles with homemade sauces (Kräuter, Knoblauch, Scharf).
   - Verify Ayran and drink fridge restocked.
3. **Closing Shift Checklist (22:30–23:30):**
   - Turn off rotisserie burners and deep clean skewer drip trays.
   - Filter and cover fryer oil.
   - Wipe down and sanitize cutting boards, knives, and counters.
   - Seal and label remaining food with date/time stickers.
   - Final register cash drop and Z-report printing.
   - Lock back door and arm security system.

---

## 2. Digital Food Safety & Fridge Temperature Logging

- Staff enter numerical temperature readings (e.g. `3.2°C`).
- If a temperature exceeds safe HACCP thresholds (`> 5.0°C` for raw meat fridge), the UI flashes a critical amber/red alert:
  - Prompts immediate corrective action: *"Check door seal & notify manager."*
  - Logs a warning event in the store audit log.

---

## 3. Automated Follow-Ups & Owner Visibility

- **Missed Task Detection:** If an opening task is not completed by 10:30 AM (opening time), an automatic push alert is queued for Rico, Oli, and the Store Manager.
- **Digital Audit Proof:** Every completed task logs the staff member's name/ID, timestamp, and optional photo attachment for hygiene verification.
- **HQ Template Builder (M11 Integration):** Owners can create, reorder, or edit checklist templates from their phones without developer intervention.
