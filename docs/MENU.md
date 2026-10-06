# Menu, offers and vouchers

## One source for the menu

The official MYGD menu lives in **one file**: [`src/lib/menu/mygd-menu.ts`](../src/lib/menu/mygd-menu.ts) —
sections, items, prices, VAT category, ingredients, options (sauces, "Make it a menu", kids meal), the
automatic offers and the five menu-board screens.

```
mygd-menu.ts ──► prisma/seed-menu.ts ──► database ──► /api/menu ──► site, /order, POS till
                                                  └──► /api/menuboards ──► /boards screens
        └──► offline copies (derived, never typed by hand): catalog-data.ts, boards.ts, menu-assets.ts
```

**Change a price or add an item**

1. Edit `src/lib/menu/mygd-menu.ts`.
2. `npm test` (the tests pin every price and fail if an old item or a duplicate copy appears).
3. `npm run db:seed` — safe to re-run. It updates the database, **deletes** products that are no longer on the menu,
   and **hides** (never deletes) any that appear in past orders so sales history stays intact. Sold-out flags set by staff are kept.

A guard test (`tests/menu-single-source.test.mjs`) fails the build if an old item name comes back or a new item
name is typed anywhere else in `src/` or `prisma/`.

## Make it a menu

A guest picks a size — **Regular +€3.00, Medium +€3.50, Large +€4.50** — then **fries or white rice** and a
**0.4L drink** (postmix). Available on döner burgers, wraps, Big's and MYGD burgers. The till shows the side and drink choices only after a size is chosen.

## Offers (automatic) and vouchers

| Kind | What it does | Where |
|---|---|---|
| Automatic offer | **Second pizza 20% off** (cheaper of each pair); **4 tacos €11.90** (per group of four) | defined in `mygd-menu.ts`, stored in `Promotion`, applied at the till and shown on `/order` |
| Percent voucher | e.g. 10% off what is left after offers | `/admin/vouchers` |
| Euro voucher | e.g. €5 off, capped at the remaining total | `/admin/vouchers` |
| Gift card | spends its balance across several orders | `/admin/vouchers` |
| Staff % (10% VIP / 20% staff) | applied last | till buttons |

Order of application: **offers → voucher / gift card → staff %**. A total never goes below €0.
Vouchers can have a minimum spend, a start/end date and a maximum number of uses, and can be switched off.
The till shows the breakdown; the **server recomputes it when the order is charged** (`POSService.tenderOrder`),
so a tampered client cannot change the price. Redemptions are logged (`VoucherRedemption`) and a gift card's balance is reduced in the same database transaction as the order.

Code: `src/lib/discounts/engine.ts` (pure maths, in cents), `src/lib/discounts/store.ts` (database),
`POST /api/pricing` (till preview), `/api/admin/vouchers` (managers).

## Open items to confirm

- **VAT is 5% on everything** (confirmed by the owner). The rate is written once, in `src/lib/tax.ts`. Beer and wine keep their own `ALCOHOL` category (also 5%) so a different rate would be a one-line change there.
- **Portion sizes** in the bill of materials (`prisma/seed-menu.ts`) were carried over / estimated for stock deduction; check them against the kitchen's real portions.
- **Product photos** are stock placeholders (one per section) until real photography is delivered.
