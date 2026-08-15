# Module M6: Pre-Order & Drive-Through Operations
## Functional & Technical Specification (`docs/07_M6_PRE_ORDER_AND_DRIVE_THROUGH.md`)

> **Adds:** A new digital direct-to-consumer sales channel for pickup and drive-through.  
> **Target Device:** Customer Mobile Web (`/order` on smartphone browser) and Store Drive-Through Screen.  
> **Key Value:** Customers order ahead with accurate, calculated pickup times based on actual kitchen queue depth.

---

## 1. Dynamic Kitchen Load & Wait Time Calculation

Unlike generic food delivery apps that guess static 20-minute wait times, the system computes pickup times dynamically from the live Kitchen Display (M5) queue:

$$\text{Estimated Wait Time} = \text{Base Prep Time (4 mins)} + \left( \frac{\text{Active Pending Tickets on KDS}}{\text{Active Kitchen Stations}} \times 1.5\text{ mins} \right)$$

- **Off-Peak (0–2 tickets):** Shows `~5–7 minutes`.
- **Lunch Peak (8+ tickets):** Shows `~12–15 minutes`.
- Gives customers an honest, reliable pickup window, preventing cold food sitting under heat lamps.

---

## 2. Mobile Ordering Flow

1. **Menu & Customizer:** Responsive touch mobile experience optimized for iPhone & Android browsers with quick Apple Pay / Google Pay / Card checkout.
2. **Order Pickup Mode:** Choose **`In-Store Counter Pickup`** or **`Drive-Through Lane`**.
3. **Drive-Through Vehicle Recognition / Tag:** Customer inputs their vehicle color/model or scans the arrival QR code at the drive-through lane speaker post.
4. **Live Status Tracker:** Real-time visual progress bar tracking:  
   `[ Order Confirmed ] ➔ [ Slicing & Grilling ] ➔ [ Wrapping & Packed ] ➔ [ Ready for Pickup ]`
