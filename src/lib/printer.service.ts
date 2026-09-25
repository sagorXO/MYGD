// MY GERMAN DÖNER — Kitchen Thermal Print Spooler Service
// Dual-Station LAN Print Dispatcher (TCP Port 9100)
// - Station 1 (Indoor Assembly Line): Bread, Salads, Sauces, Sides, Drinks
// - Station 2 (Outdoor Charcoal Grill): Meat Types, Gram Weights (150g/100g/75g), Spice Levels (1-5)

import net from "node:net";

export type PrinterStation = "INDOOR" | "GRILL";

export interface PrinterConfig {
  host: string;
  port: number;
  timeoutMs?: number;
}

export interface PrintJobResult {
  success: boolean;
  station: PrinterStation;
  bytesWritten: number;
  error?: string;
  simulated?: boolean;
}

export interface SplitOrderItem {
  name: string;
  quantity: number;
  spiceLevel?: number;
  meatWeightGrams?: number;
  breadType?: string;
  sauces?: string[];
  modifiers?: string[];
  notes?: string;
  isMealBundle?: boolean;
  stationTarget: "INDOOR" | "GRILL" | "BOTH";
}

export interface OrderChitPayload {
  orderNumber: string;
  dailySequence: number;
  orderType: "DINE_IN" | "TAKE_AWAY" | "DELIVERY";
  createdAt: string;
  customerNote?: string;
  items: SplitOrderItem[];
}

export const DEFAULT_PRINTER_CONFIGS: Record<PrinterStation, PrinterConfig> = {
  INDOOR: {
    host: process.env.PRINTER_INDOOR_IP || "192.168.1.101",
    port: parseInt(process.env.PRINTER_INDOOR_PORT || "9100", 10),
    timeoutMs: 3000,
  },
  GRILL: {
    host: process.env.PRINTER_GRILL_IP || "192.168.1.102",
    port: parseInt(process.env.PRINTER_GRILL_PORT || "9100", 10),
    timeoutMs: 3000,
  },
};

/**
 * Categorizes an order item and determines station routing:
 * - Meat portion weights and spice levels go to GRILL
 * - Bread, salad, sauce, drinks, and sides go to INDOOR
 */
export function classifyItemStation(item: Partial<SplitOrderItem>): "INDOOR" | "GRILL" | "BOTH" {
  const name = (item.name || "").toLowerCase();

  // Döner sandwiches, boxes, and dürüm wraps require BOTH:
  // Grill carves the meat & applies spice; Indoor warms bread, adds salads and sauces
  if (
    name.includes("döner") ||
    name.includes("doner") ||
    name.includes("dürüm") ||
    name.includes("durum") ||
    name.includes("box") ||
    item.meatWeightGrams !== undefined ||
    (item.spiceLevel !== undefined && item.spiceLevel > 1)
  ) {
    return "BOTH";
  }

  // Pure sides / drinks go solely to indoor
  if (
    name.includes("fries") ||
    name.includes("currywurst") ||
    name.includes("coke") ||
    name.includes("water") ||
    name.includes("beer") ||
    name.includes("pilsner") ||
    name.includes("ayran")
  ) {
    return "INDOOR";
  }

  return "INDOOR";
}

/**
 * Splits an incoming order into station-specific item subsets
 */
export function splitOrderForStations(order: OrderChitPayload): {
  indoorItems: SplitOrderItem[];
  grillItems: SplitOrderItem[];
} {
  const indoorItems: SplitOrderItem[] = [];
  const grillItems: SplitOrderItem[] = [];

  for (const item of order.items) {
    const route = classifyItemStation(item);

    if (route === "GRILL" || route === "BOTH") {
      grillItems.push({
        ...item,
        stationTarget: "GRILL",
      });
    }

    if (route === "INDOOR" || route === "BOTH") {
      indoorItems.push({
        ...item,
        stationTarget: "INDOOR",
      });
    }
  }

  return { indoorItems, grillItems };
}

/**
 * Generates an ESC/POS binary buffer for Station 1 (Indoor Assembly Line)
 */
export function generateIndoorChitBuffer(order: OrderChitPayload, items: SplitOrderItem[]): Buffer {
  const parts: Buffer[] = [];
  const text = (str: string) => parts.push(Buffer.from(str + "\n", "utf-8"));
  const raw = (bytes: number[]) => parts.push(Buffer.from(bytes));

  // Initialize printer
  raw([0x1b, 0x40]);
  // Center align
  raw([0x1b, 0x61, 0x01]);
  // Emphasize double-height/width
  raw([0x1d, 0x21, 0x11]);
  text("STATION 1: INDOOR ASSEMBLY");
  raw([0x1d, 0x21, 0x00]);
  text(`ORDER #${order.dailySequence} (${order.orderType})`);
  text(`Ref: ${order.orderNumber}`);
  text(new Date(order.createdAt).toLocaleTimeString("en-GB"));
  text("------------------------------------------");

  // Left align
  raw([0x1b, 0x61, 0x00]);
  for (const item of items) {
    text(`${item.quantity}x ${item.name.toUpperCase()}`);
    if (item.breadType) text(`   BREAD: ${item.breadType}`);
    if (item.sauces && item.sauces.length > 0) text(`   SAUCES: ${item.sauces.join(", ")}`);
    if (item.modifiers && item.modifiers.length > 0) {
      for (const m of item.modifiers) text(`   + ${m}`);
    }
    if (item.notes) text(`   NOTE: ${item.notes}`);
    text("");
  }

  if (order.customerNote) {
    text("------------------------------------------");
    text(`CUSTOMER NOTE: ${order.customerNote}`);
  }

  // Feed & Partial Cut
  raw([0x1b, 0x64, 0x03]);
  raw([0x1d, 0x56, 0x42, 0x00]);

  return Buffer.concat(parts);
}

/**
 * Generates an ESC/POS binary buffer for Station 2 (Outdoor Charcoal Rotisserie Grill)
 */
export function generateGrillChitBuffer(order: OrderChitPayload, items: SplitOrderItem[]): Buffer {
  const parts: Buffer[] = [];
  const text = (str: string) => parts.push(Buffer.from(str + "\n", "utf-8"));
  const raw = (bytes: number[]) => parts.push(Buffer.from(bytes));

  // Initialize printer
  raw([0x1b, 0x40]);
  // Center align
  raw([0x1b, 0x61, 0x01]);
  // Emphasize double-height/width
  raw([0x1d, 0x21, 0x11]);
  text("STATION 2: ROTISSERIE GRILL");
  raw([0x1d, 0x21, 0x00]);
  text(`ORDER #${order.dailySequence} · ${order.orderType}`);
  text(`Ticket: ${order.orderNumber}`);
  text(new Date(order.createdAt).toLocaleTimeString("en-GB"));
  text("==========================================");

  // Left align
  raw([0x1b, 0x61, 0x00]);
  for (const item of items) {
    const weight = item.meatWeightGrams ? `${item.meatWeightGrams}g` : "150g (Standard)";
    raw([0x1d, 0x21, 0x01]); // Double height
    text(`${item.quantity}x ${item.name} [${weight}]`);
    raw([0x1d, 0x21, 0x00]);

    if (item.spiceLevel !== undefined) {
      const flames = "🔥".repeat(item.spiceLevel);
      text(`   SPICE LEVEL: ${item.spiceLevel}/5 ${flames}`);
      if (item.spiceLevel >= 4) {
        text(`   *** WARNING: EXTRA HOT CARVING ***`);
      }
    }
    text("");
  }

  // Feed & Partial Cut
  raw([0x1b, 0x64, 0x03]);
  raw([0x1d, 0x56, 0x42, 0x00]);

  return Buffer.concat(parts);
}

/**
 * Sends a raw ESC/POS buffer over TCP Port 9100 with strict timeout and error guards.
 * If the printer is offline or drops connection, it handles the error gracefully
 * without throwing unhandled exceptions or crashing the Node process.
 */
export async function sendRawTcpPrint(
  buffer: Buffer,
  config: PrinterConfig,
  station: PrinterStation
): Promise<PrintJobResult> {
  const { host, port, timeoutMs = 3000 } = config;

  return new Promise<PrintJobResult>((resolve) => {
    let hasResolved = false;
    let bytesWritten = 0;

    const safeResolve = (result: PrintJobResult) => {
      if (!hasResolved) {
        hasResolved = true;
        resolve(result);
      }
    };

    const socket = new net.Socket();

    socket.setTimeout(timeoutMs);

    socket.on("connect", () => {
      bytesWritten = buffer.length;
      socket.write(buffer, () => {
        socket.end();
      });
    });

    socket.on("close", () => {
      safeResolve({
        success: true,
        station,
        bytesWritten,
      });
    });

    socket.on("timeout", () => {
      socket.destroy();
      safeResolve({
        success: false,
        station,
        bytesWritten: 0,
        error: `TCP Port 9100 timeout after ${timeoutMs}ms connecting to ${host}:${port}`,
      });
    });

    socket.on("error", (err) => {
      socket.destroy();
      safeResolve({
        success: false,
        station,
        bytesWritten: 0,
        error: `Printer connection error on ${host}:${port} (${err.message})`,
      });
    });

    try {
      socket.connect(port, host);
    } catch (err: any) {
      safeResolve({
        success: false,
        station,
        bytesWritten: 0,
        error: `Immediate socket connection failure: ${err?.message || err}`,
      });
    }
  });
}

/**
 * Dispatches split chits to both Station 1 (Indoor) and Station 2 (Grill) simultaneously.
 */
export async function dispatchSplitOrderPrint(
  order: OrderChitPayload,
  configs: Record<PrinterStation, PrinterConfig> = DEFAULT_PRINTER_CONFIGS
): Promise<{
  indoorResult: PrintJobResult;
  grillResult: PrintJobResult;
}> {
  const { indoorItems, grillItems } = splitOrderForStations(order);

  const indoorBuffer = generateIndoorChitBuffer(order, indoorItems);
  const grillBuffer = generateGrillChitBuffer(order, grillItems);

  const [indoorResult, grillResult] = await Promise.all([
    sendRawTcpPrint(indoorBuffer, configs.INDOOR, "INDOOR"),
    sendRawTcpPrint(grillBuffer, configs.GRILL, "GRILL"),
  ]);

  return { indoorResult, grillResult };
}
