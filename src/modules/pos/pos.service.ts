// MY GERMAN DÖNER — POS Service
import { prisma } from "@/lib/prisma";
import { eventBroker } from "@/lib/events";
import { POSOrderTender, POSOrderTenderSchema, Link4PayTerminalResponse } from "./pos.schema";
import { tcpPrintSpooler } from "../printer/tcp-spooler";
import { ThermalChitPayload } from "../printer/printer.schema";
import { deductOrderBOMAsync } from "../inventory/bom-decrement.engine";
import { priceTender } from "./pos.pricing";
import { getVatRates } from "@/lib/vat-rates.db";
import { bpToRate } from "@/lib/tax";
import { centsToDecimalString, fromCents } from "@/lib/money";

export interface POSTenderResult {
  success: boolean;
  orderId: string;
  orderNumber: string;
  dailySequence: number;
  subtotal: number;
  discountAmount: number;
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

    // 1-4. Exact pricing in integer cents: VAT category per line from the product record, rates from
    // the VatRate table (read once), discount shared per line, cash change in cents (PRD M4.3, M11.4, P.4).
    const priced = await priceTender(validated, {
      findProductCategories: (ids) =>
        prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, vatCategory: true } }),
      loadRates: () => getVatRates(),
    });
    const { totals, changeDueCents } = priced;

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
    const countToday = await prisma.order.count({
      where: {
        locationId: location.id,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });
    const dailySeq = countToday + 1;
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

    // 6. Persist Order and Items to Database
    const order = await prisma.order.create({
      data: {
        orderNumber,
        dailySequence: dailySeq,
        locationId: location.id,
        terminalId: terminal.id,
        orderType: validated.orderType,
        orderStatus: "PREPARING",
        paymentMethod: validated.paymentMethod,
        paymentStatus: "CAPTURED",
        subtotal: centsToDecimalString(totals.netCents),
        vatAmount: centsToDecimalString(totals.vatCents),
        totalAmount: centsToDecimalString(totals.totalCents),
        customerNote: validated.customerNote,
        items: {
          // Per line: totalPrice is what the customer pays for the line after its share of any discount,
          // so netAmount + vatAmount = totalPrice and the lines add up to the order total.
          create: validated.lines.map((l, index) => ({
            productId: l.productId,
            productName: l.name,
            productSku: l.sku,
            basePrice: centsToDecimalString(priced.lines[index].baseUnitCents),
            quantity: l.quantity,
            spiceLevel: l.spiceLevel,
            vatCategory: priced.lines[index].vatCategory,
            vatRate: bpToRate(priced.lines[index].rateBp),
            netAmount: centsToDecimalString(priced.lines[index].netCents),
            vatAmount: centsToDecimalString(priced.lines[index].vatCents),
            totalPrice: centsToDecimalString(priced.lines[index].grossCents),
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
      subtotal: fromCents(totals.grossSubtotalCents),
      discountAmount: fromCents(totals.discountCents),
      taxableSubtotal: fromCents(totals.netCents),
      vatAmount: fromCents(totals.vatCents),
      totalAmount: fromCents(totals.totalCents),
      changeDue: changeDueCents > 0 ? fromCents(changeDueCents) : undefined,
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
