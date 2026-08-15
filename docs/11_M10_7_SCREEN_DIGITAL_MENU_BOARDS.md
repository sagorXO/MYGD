# Module M10: 7-Screen Digital Menu Board CMS
## Functional & Technical Specification (`docs/11_M10_7_SCREEN_DIGITAL_MENU_BOARDS.md`)

> **Replaces:** Canva exports, manual USB stick swapping, and walking to individual TV screens.  
> **Target Device:** Up to 7x Overhead 4K / 1080p Displays (`/boards` with screen IDs 1 through 7).  
> **Key Value:** Instant price pushes from the master database, automated dayparting (Lunch vs Dinner), and automatic alerts if a screen goes dark.

---

## 1. 7-Screen Layout Mapping

| Screen ID | Physical Position | Content & Menu Focus |
|:---|:---|:---|
| **Screen 1** | Far Left (Above Queue) | **Hero Brand Video & "BITE THE HYPE" Promo** + Berlin Rotisserie Special |
| **Screen 2** | Center Left | **DÖNER KEBAB Selection:** Beef/Lamb, Chicken, Steak, Veggie, weights (150g, 100g, 75g) |
| **Screen 3** | Center Middle | **WRAPS & DÜRÜM:** Standard Dürüm, Falafel Halloumi Wrap, sauce options |
| **Screen 4** | Center Right | **BOWLS & BOXES:** Döner Box with fries/rice, Döner Bowl XL |
| **Screen 5** | Far Right | **PIZZA & BURGERS:** 33cm Döner Pizza, German Döner Burger |
| **Screen 6** | Above Pickup Counter | **SIDES & LOADED FRIES:** Berlin Paprika Fries, Chili-Cheese, Currywurst |
| **Screen 7** | Near Drinks Station | **DRINKS & MEAL DEALS:** Ayran, Uludağ Gazoz, Fritz-Kola + Meal Combo Promo |

---

## 2. Automated Dayparting & Price Synchronization

1. **Single Source of Truth:** If a price changes in Master Database (M11) or an item is marked `SOLD OUT`, the menu boards update **instantly over local WebSocket/REST** without rebooting the player.
2. **Automated Dayparting Schedule:**
   - **Lunch Peak (11:30–15:00):** Prominently features the **"Bite The Hype Lunch Combo (+€3.50)"** with rapid meal choices.
   - **Dinner & Late Night (18:00–Close):** Switches to loaded sharing platters, 33cm Döner Pizzas, and craft sodas.

---

## 3. Screen Health Heartbeat & Dark Screen Alerts

- Each player sends a ping heartbeat every 15 seconds to the store hub.
- If a screen disconnects or HDMI cable is unplugged, the `/admin` portal flags the issue immediately:  
  `"⚠️ Screen #3 (Wraps) in Emba went offline at 14:22. Check power & HDMI cable."`
