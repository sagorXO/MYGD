// MY GERMAN DÖNER — Zero-Trust Server-Side Price & Tax Validator
// Prevents client tampering, discount abuse, and enforces Cyprus 19% VAT formulas

export interface ValidatedLineItem {
  productId: string;
  unitPrice: number;
  quantity: number;
  modifiersCost: number;
  mealAddon: number;
  lineGrossTotal: number;
}

export interface ZeroTrustValidationResult {
  isValid: boolean;
  tamperingDetected: boolean;
  computedGross: number;
  computedNet: number;
  computedVAT: number;
  error?: string;
}

export class ZeroTrustPriceValidator {
  private readonly VAT_RATE = 0.19; // Cyprus 19% Standard Rate

  /**
   * Enforces Gross = Net * 1.19 <=> Net = Gross / 1.19
   * VAT Amount = Gross - Net
   */
  calculateCyprusVAT(grossAmount: number): { net: number; vat: number; gross: number } {
    const safeGross = Math.max(0, Number(grossAmount.toFixed(2)));
    const net = Number((safeGross / (1 + this.VAT_RATE)).toFixed(2));
    const vat = Number((safeGross - net).toFixed(2));
    return { net, vat, gross: safeGross };
  }

  /**
   * Validates client submission against server pricing truth
   */
  validateOrderPayload(
    clientClaimedGross: number,
    clientClaimedVat: number,
    serverCalculatedItems: ValidatedLineItem[],
    discountPercent: number = 0
  ): ZeroTrustValidationResult {
    // 1. Calculate true gross sum
    let trueGross = serverCalculatedItems.reduce((acc, item) => {
      const lineItemTotal = (item.unitPrice + item.modifiersCost + item.mealAddon) * item.quantity;
      return acc + lineItemTotal;
    }, 0);

    trueGross = Number(trueGross.toFixed(2));

    // 2. Apply discount if valid
    const safeDiscount = Math.min(Math.max(0, discountPercent), 100);
    const discountAmount = Number(((trueGross * safeDiscount) / 100).toFixed(2));
    const finalGross = Number((trueGross - discountAmount).toFixed(2));

    const { net: computedNet, vat: computedVAT } = this.calculateCyprusVAT(finalGross);

    // 3. Compare with client claim (tolerance +/- 0.02 EUR for floating point pennies)
    const grossDiff = Math.abs(clientClaimedGross - finalGross);
    const vatDiff = Math.abs(clientClaimedVat - computedVAT);

    if (grossDiff > 0.05 || vatDiff > 0.05) {
      return {
        isValid: false,
        tamperingDetected: true,
        computedGross: finalGross,
        computedNet,
        computedVAT,
        error: `Zero-Trust Price Mismatch: Client claimed €${clientClaimedGross.toFixed(2)} (VAT €${clientClaimedVat.toFixed(2)}), but verified catalog total is €${finalGross.toFixed(2)} (VAT €${computedVAT.toFixed(2)}).`,
      };
    }

    return {
      isValid: true,
      tamperingDetected: false,
      computedGross: finalGross,
      computedNet,
      computedVAT,
    };
  }
}

export const priceValidator = new ZeroTrustPriceValidator();
