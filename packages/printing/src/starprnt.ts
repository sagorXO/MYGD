import { ReceiptPrintJob } from "@mygd/types";
import { CASH_DRAWER_COMMANDS } from "./drawer";
import { ThermalBufferResult } from "./types";

export function generateStarPrntReceipt(job: ReceiptPrintJob): ThermalBufferResult {
  const parts: Buffer[] = [];
  const text = (str: string) => parts.push(Buffer.from(str + "\n", "utf-8"));
  const raw = (bytes: number[]) => parts.push(Buffer.from(bytes));

  // Initialize Star Line Mode (ESC @)
  raw([0x1B, 0x40]);

  if (job.kickCashDrawer) {
    parts.push(CASH_DRAWER_COMMANDS.STAR_DRAWER_KICK);
  }

  // Center Alignment (ESC a 1)
  raw([0x1B, 0x61, 0x31]);
  text("*** MY GERMAN DONER ***");
  text("THE FIRST REAL GERMAN DOENER IN CYPRUS");
  text(job.storeName);
  text(job.storeAddress);
  text("------------------------------------------");

  // Left Alignment (ESC a 0)
  raw([0x1B, 0x61, 0x30]);
  text(`ORDER #${job.dailySequence} (${job.orderType})`);
  text(`Ref: ${job.orderNumber}`);
  text(`Time: ${new Date(job.createdAt).toLocaleTimeString("en-GB")}`);
  text("==========================================");

  for (const item of job.items) {
    const itemLine = `${item.quantity}x ${item.name}`;
    const priceStr = `€${item.totalPrice.toFixed(2)}`;
    const spaces = Math.max(1, 42 - itemLine.length - priceStr.length);
    text(itemLine + " ".repeat(spaces) + priceStr);
    if (item.modifiers) {
      for (const m of item.modifiers) text(`  * ${m}`);
    }
  }

  text("------------------------------------------");
  text(`Cyprus VAT (19%): €${job.vatAmount.toFixed(2)}`);
  text(`TOTAL DUE: €${job.totalAmount.toFixed(2)}`);
  text("==========================================");

  // Star Partial Cut (ESC d 3)
  raw([0x1B, 0x64, 0x03]);

  const finalBuffer = Buffer.concat(parts);
  return {
    buffer: finalBuffer,
    hexString: finalBuffer.toString("hex"),
    byteLength: finalBuffer.length,
  };
}
