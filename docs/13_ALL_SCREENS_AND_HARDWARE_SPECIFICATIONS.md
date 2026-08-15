# Multi-Device Hardware & Screen Specifications
## Technical Reference Document (`docs/13_ALL_SCREENS_AND_HARDWARE_SPECIFICATIONS.md`)

> **Hardware Strategy:** Standard off-the-shelf commercial hardware running modern web standards (Chrome / Edge in full-screen kiosk mode) with local peripheral support.

---

## 1. Hardware Matrix by Device Role

| Role | Physical Hardware | Resolution | Mounting / Placement | Peripherals Attached |
|:---|:---|:---:|:---|:---|
| **Self-Service Kiosk** | 21.5" or 32" Commercial Touchscreen PC / All-in-One | `1080×1920` (Portrait) | Floor Pedestal or Wall Mount in Entry | Epson TM-T88VI Thermal Printer, PAX A35 / Ingenico Card Reader, 2D Barcode Scanner |
| **Countertop POS Till** | 10.2"–13" iPad Pro or Android Touch Tablet | `1024×768` (Landscape) | Countertop Swivel Stand at Cash Desk | Star Micronics TSP143III (USB/LAN), Heavy-Duty Metal Cash Drawer (RJ12 24V), Tap-to-Pay Card Terminal |
| **Kitchen Display (KDS)** | 24"–32" Industrial VESA-Mounted HD Kitchen Display | `1920×1080` (16:9 Landscape) | Ceiling/Wall Bracket above Grill & Wrapping Station | USB Bump Bar (optional) or Direct Touch Screen |
| **Customer Status TV** | 43"–55" Commercial 4K Smart TV / HDMI Media Player | `1920×1080` (16:9 Landscape) | Overhead in Waiting / Dining Area | High-output audio chime speakers |
| **Staff & Training Hub** | 10.1" Samsung Galaxy Tab or iPad 10th Gen | `1280×800` (Landscape) | Wall-Mounted near Staff Break / Prep Zone | Front camera for optional shift clock-in photo verification |
| **Digital Menu Boards** | 7x 43"–50" Commercial Signage TVs (700 nits) | `1920×1080` / `3840×2160` | Ceiling suspended above Ordering Counter | 7x Android / Linux Micro Media Players (~€130 each) |
| **Backoffice Terminal** | Manager Laptop / Desktop PC | `1440×900+` (Widescreen) | Manager Office Desk / Mobile Phone | Office Laser/Inkjet Printer for accounting reports |

---

## 2. Thermal Printer Driver & Solenoid Pulse Specs

### Epson TM Series (ESC/POS Driver)
```typescript
// Driver protocol: ESC/POS Raw Binary
const ESC = "\x1B";
const GS = "\x1D";

// Initialize Printer
const CMD_INIT = ESC + "@";

// Auto-Cutter Pulse
const CMD_CUT = GS + "V\x00";

// RJ12 Cash Drawer Solenoid Kick (Pin 2, 50ms ON, 500ms OFF)
const CMD_DRAWER_KICK = ESC + "p\x00\x19\xFA";
```

### Star Micronics Series (StarPRNT Driver)
```typescript
// Driver protocol: StarPRNT Command Structure
const STAR_INIT = "\x1B\x40";
const STAR_CUT = "\x1B\x64\x02";
const STAR_DRAWER_KICK = "\x07"; // Bel command triggers cash drawer kick
```

---

## 3. Touch Gestures & Operating System Environment

- **Kiosk Mode Browser Flags (Chrome / Linux / Windows):**
  ```bash
  google-chrome \
    --kiosk \
    --incognito \
    --no-first-run \
    --disable-pinch \
    --overscroll-history-navigation=0 \
    --disable-features=TranslateUI \
    http://localhost:3000/
  ```
- **Inactivity Timeouts:** Kiosk automatically resets to Attract Screen after **60 seconds of inactivity** with an 8-second countdown modal.
