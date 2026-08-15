# Module M9: Executive Reporting & Remote Visibility
## Functional & Technical Specification (`docs/10_M9_EXECUTIVE_REPORTING_AND_ANALYTICS.md`)

> **Solves:** Lack of visibility when owners are off-site or travelling.  
> **Target Device:** Mobile Web & Desktop Backoffice (`/admin`) accessed securely by Rico, Oli, and Markus.  
> **Key Value:** Real-time revenue, guest count, avg ticket, peak hours, net profit per day, labor cost vs COGS, and cross-location comparison (Emba vs Limassol).

---

## 1. Executive Real-Time Dashboard Metrics

1. **Today's Gross Sales & Velocity:** Real-time revenue counter with comparative benchmark against the same day last week.
2. **Order Count & Average Ticket:** Total guest transactions and average spend per customer (e.g. `€13.05 avg`).
3. **Cyprus 19% VAT Reconciliation:** Exact gross-to-net tax breakdown for accounting:
   - Gross Revenue (Tendered)
   - Net Taxable Sales (`Gross / 1.19`)
   - 19% Cyprus VAT Collected
4. **Tender Distribution:** Cash vs Visa/Mastercard vs Contactless Apple Pay vs QR payments.
5. **Kitchen Speed & Prep Time:** Average order turnaround time (Target `< 6m 00s`).

---

## 2. P&L and Net Profit Calculations

The system unites sales data (M4), recipe consumption (M3), supplier costs (M11), and labor hours (M7) to display **Estimated Daily Net Profit**:

$$\text{Net Profit} = \text{Net Revenue} - (\text{COGS Food Cost} + \text{Staff Labor Cost} + \text{Store Fixed Overhead})$$

- **Food Cost % (COGS):** Live food cost percentage based on exact ingredient consumption.
- **Labor Cost %:** Live wages incurred based on clocked-in staff hours.

---

## 3. Multi-Store Cross-Location Comparison

- Allows Rico & Oli to switch between **Emba Store (Paphos)** and **Limassol Marina** or view a consolidated **CYPRUS ALL LOCATIONS** view with side-by-side performance rankings.
