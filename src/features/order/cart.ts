// Pure cart logic for the mobile pre-order page. All money is integer cents.
// Catalogue prices are VAT-inclusive (see src/lib/tax.ts), so VAT is extracted, not added.

import { DEFAULT_VAT_RATE } from "../../lib/tax";

export const MENU_UPGRADE_CENTS = 300;
export const VAT_RATE = DEFAULT_VAT_RATE;
export const MIN_VEHICLE_CHARS = 3;

export interface CartLine {
  /** `${productId}` or `${productId}:menu` — a menu upgrade is its own line. */
  key: string;
  productId: string;
  name: string;
  unitCents: number;
  asMenu: boolean;
  qty: number;
}

export interface CartTotals {
  count: number;
  totalCents: number;
  netCents: number;
  vatCents: number;
}

export interface AddInput {
  productId: string;
  name: string;
  priceCents: number;
  asMenu?: boolean;
}

export function lineKey(productId: string, asMenu: boolean): string {
  return asMenu ? `${productId}:menu` : productId;
}

export function addLine(lines: CartLine[], input: AddInput): CartLine[] {
  const asMenu = input.asMenu ?? false;
  const key = lineKey(input.productId, asMenu);
  if (lines.some((l) => l.key === key)) {
    return lines.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l));
  }
  return [
    ...lines,
    {
      key,
      productId: input.productId,
      name: asMenu ? `${input.name} Menu` : input.name,
      unitCents: input.priceCents + (asMenu ? MENU_UPGRADE_CENTS : 0),
      asMenu,
      qty: 1,
    },
  ];
}

/** Sets a line's quantity; zero or less removes the line. */
export function setQty(lines: CartLine[], key: string, qty: number): CartLine[] {
  if (qty <= 0) return lines.filter((l) => l.key !== key);
  return lines.map((l) => (l.key === key ? { ...l, qty } : l));
}

export function productQty(lines: CartLine[], productId: string): number {
  return lines.filter((l) => l.productId === productId).reduce((n, l) => n + l.qty, 0);
}

export function totals(lines: CartLine[]): CartTotals {
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const totalCents = lines.reduce((n, l) => n + l.qty * l.unitCents, 0);
  const netCents = Math.round(totalCents / (1 + VAT_RATE));
  return { count, totalCents, netCents, vatCents: totalCents - netCents };
}

export function vehicleError(channel: "DRIVE_THROUGH" | "COUNTER_PICKUP", vehicle: string): string | null {
  if (channel !== "DRIVE_THROUGH") return null;
  return vehicle.trim().length >= MIN_VEHICLE_CHARS
    ? null
    : `Add your car colour, model or plate (at least ${MIN_VEHICLE_CHARS} characters) so we can find you in the lane.`;
}

export function estimatedPickupMins(activeTickets: number): number {
  return 4 + Math.round(activeTickets * 1.2);
}
