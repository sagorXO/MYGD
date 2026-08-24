// MY GERMAN DÖNER — Module M2 & M3 Supplier Reordering Engine
// WhatsApp API formatting, duplicate order protection, and 15:30 predictive bakery depletion alert

export interface WhatsAppOrderMessage {
  supplierPhone: string;
  encodedUrl: string;
  rawText: string;
  orderReference: string;
  estimatedTotalEUR: number;
}

export interface ReorderItemRequest {
  sku: string;
  name: string;
  unit: string;
  quantityNeeded: number;
  unitCostEUR: number;
}

export class SupplierReorderingEngine {
  /**
   * Generates a 1-tap WhatsApp Click-to-Chat dispatch URL
   * Format: https://wa.me/{phone}?text={encodedText}
   */
  generateWhatsAppDispatch(
    supplierName: string,
    supplierWhatsApp: string,
    storeLocation: string,
    items: ReorderItemRequest[]
  ): WhatsAppOrderMessage {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSeq = Math.floor(100 + Math.random() * 900);
    const orderRef = `MYGD-${storeLocation.toUpperCase()}-${todayStr}-${randomSeq}`;

    let totalEUR = 0;
    const itemLines = items.map((it) => {
      const lineCost = it.quantityNeeded * it.unitCostEUR;
      totalEUR += lineCost;
      return `• ${it.quantityNeeded} ${it.unit} ${it.name} (SKU: ${it.sku})`;
    });

    const rawText = `🥙 *MY GERMAN DÖNER — OFFICIAL PURCHASE ORDER*
━━━━━━━━━━━━━━━━━━━━━━━
📍 *Delivery Location:* ${storeLocation} Store
📋 *PO Reference:* ${orderRef}
📅 *Date:* ${new Date().toLocaleDateString("en-GB")}
👤 *Requested By:* Rico / Store Manager

📦 *ORDER ITEMS:*
${itemLines.join("\n")}

💶 *Estimated Total:* €${totalEUR.toFixed(2)}
⏰ *Required Delivery Window:* Tomorrow 08:00 - 10:30 AM

_Please reply with CONFIRMED to accept this PO._`;

    // Clean phone (remove spaces, plus, hyphens)
    const cleanPhone = supplierWhatsApp.replace(/[^0-9]/g, "");
    const encodedUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(rawText)}`;

    return {
      supplierPhone: cleanPhone,
      encodedUrl,
      rawText,
      orderReference: orderRef,
      estimatedTotalEUR: Number(totalEUR.toFixed(2)),
    };
  }

  /**
   * Duplicate Order Protection (24-Hour Cooldown)
   */
  checkDuplicateOrderCooldown(recentOrders: { orderDate: Date; supplierId: string }[], supplierId: string): { isAllowed: boolean; message?: string } {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const hasRecent = recentOrders.some(
      (o) => o.supplierId === supplierId && new Date(o.orderDate) > twentyFourHoursAgo
    );

    if (hasRecent) {
      return {
        isAllowed: false,
        message: "A purchase order was already dispatched to this supplier within the last 24 hours. Manager override required.",
      };
    }
    return { isAllowed: true };
  }

  /**
   * 15:30 Predictive Bakery Alert
   * Analyzes current bun inventory vs estimated evening peak sales
   */
  evaluate1530BakeryDepletion(currentFladenbrotStock: number, avgEveningSalesEstimate: number = 180): { alertTriggered: boolean; recommendedReorder: number; message: string } {
    const projectedRemaining = currentFladenbrotStock - avgEveningSalesEstimate;
    if (projectedRemaining < 40) {
      const deficit = 40 - projectedRemaining;
      const orderCrates = Math.ceil(deficit / 20) * 20; // Reorder in batches of 20
      return {
        alertTriggered: true,
        recommendedReorder: orderCrates,
        message: `⚠️ 15:30 BAKERY RUNOUT WARNING: Only ${currentFladenbrotStock} Fladenbrot in stock. Evening peak requires ~${avgEveningSalesEstimate}. Recommend 1-tap reorder of ${orderCrates} fresh breads before 16:00 bakery cutoff.`,
      };
    }

    return {
      alertTriggered: false,
      recommendedReorder: 0,
      message: `✅ Bakery stock adequate: ${currentFladenbrotStock} units on hand.`,
    };
  }
}

export const supplierEngine = new SupplierReorderingEngine();
