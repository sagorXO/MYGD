import { ReceiptPrintJob } from "@mygd/types";
import { CASH_DRAWER_COMMANDS } from "./drawer";
import { ThermalBufferResult } from "./types";

export function generateEscPosReceipt(job: ReceiptPrintJob): ThermalBufferResult {
  const parts: Buffer[] = [];

  // Helper to push text with CR/LF
  const text = (str: string) => parts.push(Buffer.from(str + "\n", "utf-8"));
  const raw = (bytes: number[]) => parts.push(Buffer.from(bytes));

  // Initialize Printer (ESC @)
  raw([0x1B, 0x40]);

  // If kick drawer requested, prepend kick pulse
  if (job.kickCashDrawer) {
    parts.push(CASH_DRAWER_COMMANDS.EPSON_PIN2);
  }

  // Center Align (ESC a 1)
  raw([0x1B, 0x61, 0x01]);

  // Double Height & Double Width for Header (GS ! 0x11)
  raw([0x1D, 0x21, 0x11]);
  text("MY GERMAN DONER");
  
  // Normal font (GS ! 0x00)
  raw([0x1D, 0x21, 0x00]);
  text("BITE THE HYPE - CYPRUS");
  text(job.storeName);
  text(job.storeAddress);
  if (job.storePhone) text(job.storePhone);
  text("------------------------------------------");

  // Left Align (ESC a 0)
  raw([0x1B, 0x61, 0x00]);

  // Large Order Sequence & Number
  raw([0x1D, 0x21, 0x11]); // Emphasized
  text(`ORDER #${job.dailySequence} (${job.orderType})`);
  raw([0x1D, 0x21, 0x00]);
  text(`Ref: ${job.orderNumber}`);
  text(`Date: ${new Date(job.createdAt).toLocaleString("en-GB")}`);
  text("==========================================");

  // Line items
  for (const item of job.items) {
    const itemLine = `${item.quantity}x ${item.name}`;
    const priceStr = `€${item.totalPrice.toFixed(2)}`;
    const spaces = Math.max(1, 42 - itemLine.length - priceStr.length);
    text(itemLine + " ".repeat(spaces) + priceStr);

    if (item.spiceLevel && item.spiceLevel > 1) {
      text(`   [SPICE LEVEL ${item.spiceLevel}/5]`);
    }

    if (item.modifiers && item.modifiers.length > 0) {
      for (const mod of item.modifiers) {
        text(`   + ${mod}`);
      }
    }
  }

  text("------------------------------------------");

  // Totals & Cyprus 19% VAT
  const subtotalStr = `€${job.subtotal.toFixed(2)}`;
  const vatStr = `€${job.vatAmount.toFixed(2)}`;
  const totalStr = `€${job.totalAmount.toFixed(2)}`;

  const rightAlign = (label: string, val: string) => {
    const spaces = Math.max(1, 42 - label.length - val.length);
    return label + " ".repeat(spaces) + val;
  };

  text(rightAlign("Net Subtotal:", subtotalStr));
  if (job.discountAmount && job.discountAmount > 0) {
    text(rightAlign("Discount Applied:", `-€${job.discountAmount.toFixed(2)}`));
  }
  text(rightAlign(`Cyprus VAT (${(job.vatRate * 100).toFixed(0)}%):`, vatStr));
  
  // Large Grand Total
  raw([0x1D, 0x21, 0x11]);
  text(rightAlign("TOTAL PAID:", totalStr));
  raw([0x1D, 0x21, 0x00]);

  text(rightAlign("Payment Method:", job.paymentMethod));
  text("==========================================");

  // Center Align for Footer & QR Code Notice
  raw([0x1B, 0x61, 0x01]);
  text("Scan for Digital e-Receipt & Order Status:");
  text(job.qrPayloadUrl);
  text("");
  text("DANKE SCHOEN / THANK YOU!");
  text("mygermandoener.com");
  text("");
  text("");

  // Cut Paper Command (GS V 66 0 - Partial Cut with 3 feed lines)
  raw([0x1D, 0x56, 0x42, 0x03]);

  const finalBuffer = Buffer.concat(parts);
  return {
    buffer: finalBuffer,
    hexString: finalBuffer.toString("hex"),
    byteLength: finalBuffer.length,
  };
}
