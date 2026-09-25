// MY GERMAN DÖNER — Order & VAT Calculation Engine
// Cyprus 19% Standard VAT (EU Regulation (EC) 852/2004) & Hardware Solenoid Triggers

export interface OrderItemInput {
  productId?: string;
  name: string;
  price?: number;
  basePrice?: number;
  quantity: number;
  spiceLevel?: number;
  modifiers?: { modifierId?: string; modifierName: string; priceAdjustment?: number; groupName?: string }[];
  isMealBundle?: boolean;
  mealDrinkName?: string;
  mealSideName?: string;
  mealPriceAddon?: number;
  notes?: string;
}

export interface OrderFinancials {
  grossTotal: number;
  subtotalNet: number;
  vatAmount: number;
  vatRate: number;
}

export interface OrderValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Calculate Cyprus 19% VAT breakdown from line items
 * Net = Gross / (1 + vatRate)
 * VAT = Gross - Net
 */
export function calculateOrderFinancials(
  items: { price?: number; basePrice?: number; quantity?: number }[],
  vatRate: number = 0.19
): OrderFinancials {
  let grossTotal = 0;

  for (const item of items) {
    const itemPrice = item.price ?? item.basePrice ?? 0;
    const qty = item.quantity ?? 1;
    grossTotal += itemPrice * qty;
  }

  // Round gross to 2 decimals
  grossTotal = Math.round(grossTotal * 100) / 100;

  // Net = Gross / 1.19
  const subtotalNet = Math.round((grossTotal / (1 + vatRate)) * 100) / 100;
  const vatAmount = Math.round((grossTotal - subtotalNet) * 100) / 100;

  return {
    grossTotal,
    subtotalNet,
    vatAmount,
    vatRate,
  };
}

/**
 * Generate formatted order number: {LOCATION}-{YYYYMMDD}-{HHmm}-{SEQ}
 */
export function generateOrderNumber(
  locationSlug: string = "EMBA",
  seq: number = 1,
  date: Date = new Date()
): string {
  const pad = (n: number, len: number = 2) => String(n).padStart(len, "0");

  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const mins = pad(date.getUTCMinutes());
  const formattedSeq = pad(seq, 3);

  return `${locationSlug.toUpperCase()}-${year}${month}${day}-${hours}${mins}-${formattedSeq}`;
}

/**
 * Generate 24V RJ12 Cash Drawer Solenoid Kick Command for ESC/POS Printers
 * Command: ESC p m t1 t2 (0x1B 0x70 0x00 0x19 0xFA) -> 25ms on, 250ms off pulse
 */
export function getCashDrawerCommand(paymentMethod: "CASH" | "CARD" | string): Uint8Array | null {
  if (paymentMethod.toUpperCase() === "CASH") {
    return new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa]);
  }
  return null;
}

/**
 * Validate order payload before database persistence
 */
export function validateOrderPayload(payload: any): OrderValidationResult {
  if (!payload || typeof payload !== "object") {
    return { valid: false, error: "Invalid order payload" };
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return { valid: false, error: "Cart cannot be empty" };
  }

  for (const item of payload.items) {
    const price = item.price ?? item.basePrice;
    if (typeof price !== "number" || price < 0) {
      return { valid: false, error: `Invalid item price for ${item.name || "item"}` };
    }
    if (!item.quantity || item.quantity < 1) {
      return { valid: false, error: `Invalid item quantity for ${item.name || "item"}` };
    }
  }

  return { valid: true };
}
