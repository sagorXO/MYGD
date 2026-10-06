// MY GERMAN DÖNER — POS Service
import { prisma } from "@/lib/prisma";
import { eventBroker } from "@/lib/events";
import { POSOrderTender, POSOrderTenderSchema, Link4PayTerminalResponse } from "./pos.schema";
import { tcpPrintSpooler } from "../printer/tcp-spooler";
import { ThermalChitPayload } from "../printer/printer.schema";
import { deductOrderBOMAsync } from "../inventory/bom-decrement.engine";
import { getVatRates } from "@/lib/vat-rates.db";
import { bpToRate, splitGross, type VatCategory } from "@/lib/tax";
import { centsToDecimalString, fromCents, toCents } from "@/lib/money";
import { priceCart, type CartLine } from "@/lib/discounts/engine";
import { findVoucher, loadActivePromotions, voucherToInput } from "@/lib/discounts/store";

export interface POSTenderResult {
  success: boolean;
  orderId: string;
  orderNumber: string;
  dailySequence: number;
  subtotal: number;
  discountAmount: number;
  appliedPromotions: { code: string; name: string; amount: number }[];
  voucherAmount: number;
  taxableSubtotal: number;
  vatAmount: number;
  totalAmount: number;
  changeDue?: number;
  paymentRef?: string;
  printed: boolean;
  error?: string;
}

export class POSService {
  /**
   * Process POS counter order with atomic calculations and hardware thermal dispatch
   */
  public static async tenderOrder(rawPayload: unknown): Promise<POSTenderResult> {
    const validated = POSOrderTenderSchema.parse(rawPayload);

    // 1-2. Price the cart server-side: automatic promotions -> voucher / gift card -> staff percent.
    const products = await prisma.product.findMany({
      where: { id: { in: validated.lines.map((l) => l.productId) } },
      select: { id: true, vatCategory: true, category: { select: { slug: true } } },
    });
    const sectionByProduct = new Map(products.map((p) => [p.id, p.category.slug]));
    const vatCategoryByProduct = new Map(products.map((p) => [p.id, p.vatCategory]));

    const cartLines: CartLine[] = validated.lines.map((l) => ({
      sku: l.sku,
      sectionSlug: sectionByProduct.get(l.productId) ?? "",
      unitPrice: l.unitPrice,
      quantity: l.quantity,
    }));

    const voucherRow = validated.voucherCode ? await findVoucher(prisma, validated.voucherCode) : null;
    if (validated.voucherCode && !voucherRow) {
      throw new Error(`Voucher ${validated.voucherCode.toUpperCase()} does not exist`);
    }
    const pricedDiscounts = priceCart({
      lines: cartLines,
      promotions: await loadActivePromotions(prisma),
      voucher: voucherRow ? voucherToInput(voucherRow) : undefined,
      manualPercent: validated.discountPercent,
    });
    if (pricedDiscounts.voucher?.rejectedReason) {
      throw new Error(`Voucher ${pricedDiscounts.voucher.code} cannot be used: ${pricedDiscounts.voucher.rejectedReason}`);
    }
    const grossSubtotal = pricedDiscounts.subtotal;
    const discountAmount = pricedDiscounts.discountTotal;
    const finalTotal = pricedDiscounts.total;
    const voucherAmount = pricedDiscounts.voucher?.amount ?? 0;

    // 3. Load VAT rates & calculate exact line-by-line net and VAT
    const rates = await getVatRates();
    const grossSubtotalCents = toCents(grossSubtotal);
    const totalDiscountCents = toCents(discountAmount);
    const finalTotalCents = toCents(finalTotal);

    let allocatedDiscountCents = 0;
    const pricedLines = validated.lines.map((l, index) => {
      const lineListCents = toCents(l.totalPrice);
      const isLast = index === validated.lines.length - 1;
      const lineDiscount = isLast
        ? totalDiscountCents - allocatedDiscountCents
        : Math.round((totalDiscountCents * lineListCents) / (grossSubtotalCents || 1));
      allocatedDiscountCents += lineDiscount;
      const lineGrossCents = Math.max(0, lineListCents - lineDiscount);

      const category = (vatCategoryByProduct.get(l.productId) ?? "FOOD_BEV") as VatCategory;
      const rateBp = rates[category] ?? 500;
      const split = splitGross(lineGrossCents, rateBp);

      return {
        baseUnitCents: toCents(l.basePrice),
        vatCategory: category,
        rateBp,
        grossCents: lineGrossCents,
        netCents: split.netCents,
        vatCents: split.vatCents,
      };
    });

    const totalNetCents = pricedLines.reduce((sum, l) => sum + l.netCents, 0);
    const totalVatCents = pricedLines.reduce((sum, l) => sum + l.vatCents, 0);

    // 4. Cash change calculation
    let changeDue = 0;
    if (validated.paymentMethod === "CASH" && validated.cashTendered !== undefined) {
      if (validated.cashTendered < finalTotal) {
        throw new Error(`Insufficient cash tendered: Received €${validated.cashTendered.toFixed(2)}, required €${finalTotal.toFixed(2)}`);
      }
      changeDue = Number((validated.cashTendered - finalTotal).toFixed(2));
    }

    // 5. Generate Daily Order Sequence & Order Reference
    const today = new Date();
    const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, "");

    // Find location ID
    const location = await prisma.location.findUnique({
      where: { slug: validated.locationSlug },
    });
    if (!location) {
      throw new Error(`Invalid location slug: ${validated.locationSlug}`);
    }

    // Get sequence count for today
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const todayOrdersCount = await prisma.order.count({
      where: {
        locationId: location.id,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const dailySeq = todayOrdersCount + 1;
    const orderNumber = `${validated.locationSlug}-${datePrefix}-${String(dailySeq).padStart(3, "0")}`;

    // Find or create terminal
    let terminal = await prisma.terminal.findUnique({
      where: {
        locationId_terminalCode: {
          locationId: location.id,
          terminalCode: validated.terminalCode,
        },
      },
    });

    if (!terminal) {
      terminal = await prisma.terminal.create({
        data: {
          locationId: location.id,
          terminalCode: validated.terminalCode,
          terminalType: "POS_COUNTER",
        },
      });
    }

    // 6. Persist Order, Items and the voucher redemption atomically
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          dailySequence: dailySeq,
          locationId: location.id,
          terminalId: terminal.id,
          orderType: validated.orderType,
          orderStatus: "PREPARING",
          paymentMethod: validated.paymentMethod,
          paymentStatus: "CAPTURED",
          subtotal: centsToDecimalString(totalNetCents),
          vatAmount: centsToDecimalString(totalVatCents),
          totalAmount: centsToDecimalString(finalTotalCents),
          discountAmount: centsToDecimalString(totalDiscountCents),
          voucherCode: voucherRow?.code ?? null,
          promotionCodes: pricedDiscounts.discounts.length ? JSON.stringify(pricedDiscounts.discounts.map((d) => d.code)) : null,
          customerNote: validated.customerNote,
          items: {
            create: validated.lines.map((l, index) => ({
              productId: l.productId,
              productName: l.name,
              productSku: l.sku,
              basePrice: centsToDecimalString(pricedLines[index].baseUnitCents),
              quantity: l.quantity,
              spiceLevel: l.spiceLevel,
              vatCategory: pricedLines[index].vatCategory,
              vatRate: bpToRate(pricedLines[index].rateBp),
              netAmount: centsToDecimalString(pricedLines[index].netCents),
              vatAmount: centsToDecimalString(pricedLines[index].vatCents),
              totalPrice: centsToDecimalString(pricedLines[index].grossCents),
              itemNotes: [
                l.breadType ? `Bread: ${l.breadType}` : "",
                l.selectedSauces.length ? `Sauces: ${l.selectedSauces.join(", ")}` : "",
                l.selectedAdditions.length ? `Add: ${l.selectedAdditions.map((a) => a.name).join(", ")}` : "",
                l.selectedOmissions.length ? `No: ${l.selectedOmissions.join(", ")}` : "",
                l.notes || "",
              ]
                .filter(Boolean)
                .join(" | "),
            })),
          },
          kitchenTickets: {
            create: {
              orderNumber,
              orderType: validated.orderType,
              station: "ALL",
              ticketData: JSON.stringify(validated.lines),
              ticketStatus: "QUEUED",
            },
          },
        },
        include: {
          items: true,
          kitchenTickets: true,
        },
      });

      if (voucherRow && voucherAmount > 0) {
        // Optimistic guard: only succeeds if nobody redeemed this voucher since we read it.
        const claimed = await tx.voucher.updateMany({
          where: { id: voucherRow.id, redemptions: voucherRow.redemptions },
          data: {
            redemptions: { increment: 1 },
            ...(voucherRow.kind === "GIFT_CARD" ? { balance: pricedDiscounts.voucher?.balanceAfter ?? 0 } : {}),
          },
        });
        if (claimed.count !== 1) {
          throw new Error(`Voucher ${voucherRow.code} was just used on another till — try again`);
        }
        await tx.voucherRedemption.create({
          data: { voucherId: voucherRow.id, orderId: created.id, amount: voucherAmount },
        });
      }
      return created;
    });

    // 7. Atomic BOM Inventory Decrement
    try {
      await deductOrderBOMAsync(location.id, validated.lines);
    } catch (invErr) {
      console.error("[POSService] Non-blocking BOM inventory deduction error:", invErr);
    }

    // 8. Raw TCP ESC/POS Thermal Print Dispatch (Silent, Dual-Station)
    let printSuccess = false;
    try {
      const thermalPayload: ThermalChitPayload = {
        orderNumber,
        dailySequence: dailySeq,
        orderType: validated.orderType,
        locationSlug: validated.locationSlug,
        createdAt: order.createdAt.toISOString(),
        customerNote: validated.customerNote,
        items: validated.lines.map((l) => ({
          name: l.name,
          quantity: l.quantity,
          spiceLevel: l.spiceLevel,
          breadType: l.breadType,
          additions: l.selectedAdditions.map((a) => a.name),
          omissions: l.selectedOmissions,
          sauces: l.selectedSauces,
          notes: l.notes,
          stationTarget: "BOTH",
        })),
      };

      const printRes = await tcpPrintSpooler.dispatchDualStationPrint(thermalPayload);
      printSuccess = printRes.indoorResult.success || printRes.grillResult.success;
    } catch (printErr) {
      console.error("[POSService] Background thermal print error:", printErr);
    }

    // 9. Real-Time WebSocket / SSE Broadcast (<500ms)
    eventBroker.publish("kds", {
      type: "ORDER_CREATED",
      orderId: order.id,
      orderNumber,
      orderType: validated.orderType,
      dailySequence: dailySeq,
      items: validated.lines,
      status: "PREPARING",
      createdAt: order.createdAt.toISOString(),
    });

    eventBroker.publish("display", {
      type: "ORDER_CREATED",
      orderNumber,
      dailySequence: dailySeq,
      status: "PREPARING",
    });

    return {
      success: true,
      orderId: order.id,
      orderNumber,
      dailySequence: dailySeq,
      subtotal: grossSubtotal,
      discountAmount,
      appliedPromotions: pricedDiscounts.discounts.map((d) => ({ ...d })),
      voucherAmount,
      taxableSubtotal: fromCents(totalNetCents),
      vatAmount: fromCents(totalVatCents),
      totalAmount: finalTotal,
      changeDue: changeDue > 0 ? changeDue : undefined,
      paymentRef: `LP-${Date.now().toString().slice(-6)}`,
      printed: printSuccess,
    };
  }

  /**
   * Mock Link4Pay Card Terminal Communication (Simulates NFC / Chip terminal handshake)
   */
  public static async processLink4PayPayment(amountEUR: number, orderRef: string): Promise<Link4PayTerminalResponse> {
    // Simulate ~450ms EMV terminal capture
    await new Promise((resolve) => setTimeout(resolve, 450));

    return {
      success: true,
      transactionId: `L4P-TX-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      authCode: `AUTH${Math.floor(100000 + Math.random() * 900000)}`,
      cardScheme: "CONTACTLESS_NFC",
      maskedPan: "**** **** **** 4892",
    };
  }
}
