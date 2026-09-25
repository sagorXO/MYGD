// MY GERMAN DÖNER — ESC/POS Binary Encoder (Station 1 Indoor vs Station 2 Grill)
import { ThermalChitPayload, ThermalChitItem } from "./printer.schema";

export class EscPosEncoder {
  private buffers: Buffer[] = [];

  constructor() {
    this.init();
  }

  init(): this {
    this.buffers.push(Buffer.from([0x1b, 0x40])); // ESC @ (Initialize)
    return this;
  }

  alignCenter(): this {
    this.buffers.push(Buffer.from([0x1b, 0x61, 0x01])); // ESC a 1
    return this;
  }

  alignLeft(): this {
    this.buffers.push(Buffer.from([0x1b, 0x61, 0x00])); // ESC a 0
    return this;
  }

  alignRight(): this {
    this.buffers.push(Buffer.from([0x1b, 0x61, 0x02])); // ESC a 2
    return this;
  }

  bold(enable: boolean = true): this {
    this.buffers.push(Buffer.from([0x1b, 0x45, enable ? 0x01 : 0x00])); // ESC E n
    return this;
  }

  doubleSize(): this {
    this.buffers.push(Buffer.from([0x1d, 0x21, 0x11])); // GS ! 0x11 (2x width, 2x height)
    return this;
  }

  doubleHeight(): this {
    this.buffers.push(Buffer.from([0x1d, 0x21, 0x01])); // GS ! 0x01 (2x height)
    return this;
  }

  normalSize(): this {
    this.buffers.push(Buffer.from([0x1d, 0x21, 0x00])); // GS ! 0x00
    return this;
  }

  invert(enable: boolean = true): this {
    this.buffers.push(Buffer.from([0x1d, 0x42, enable ? 0x01 : 0x00])); // GS B n (Black/White reverse)
    return this;
  }

  line(text: string = ""): this {
    this.buffers.push(Buffer.from(text + "\n", "utf-8"));
    return this;
  }

  divider(char: string = "-", length: number = 42): this {
    this.buffers.push(Buffer.from(char.repeat(length) + "\n", "utf-8"));
    return this;
  }

  feedAndCut(): Buffer {
    this.buffers.push(Buffer.from([0x1b, 0x64, 0x03])); // ESC d 3 (Feed 3 lines)
    this.buffers.push(Buffer.from([0x1d, 0x56, 0x42, 0x00])); // GS V 66 0 (Partial cut)
    return Buffer.concat(this.buffers);
  }
}

/**
 * Builds ESC/POS buffer for Station 1 (Indoor Assembly Line)
 * Focus: Bread types, additions, omissions, sauces, side packaging, drinks
 */
export function buildIndoorChit(payload: ThermalChitPayload, items: ThermalChitItem[]): Buffer {
  const enc = new EscPosEncoder();
  const dateStr = new Date(payload.createdAt).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  enc
    .alignCenter()
    .bold(true)
    .doubleHeight()
    .line("MY GERMAN DÖNER")
    .normalSize()
    .invert(true)
    .line(" STATION 1: INDOOR ASSEMBLY LINE ")
    .invert(false)
    .bold(false)
    .line(`Store: ${payload.locationSlug} · Ref: ${payload.orderNumber}`)
    .bold(true)
    .doubleSize()
    .line(`ORDER #${payload.dailySequence}`)
    .normalSize()
    .line(`Type: ${payload.orderType} · Time: ${dateStr}`)
    .divider("=")
    .alignLeft();

  for (const item of items) {
    enc
      .bold(true)
      .line(`${item.quantity}x ${item.name.toUpperCase()}`)
      .bold(false);

    if (item.breadType) {
      enc.line(`   BREAD: ${item.breadType}`);
    }

    if (item.sauces && item.sauces.length > 0) {
      enc.line(`   SAUCES: ${item.sauces.join(", ")}`);
    }

    // Bold Green Additions representation on monochrome thermal
    if (item.additions && item.additions.length > 0) {
      enc.bold(true);
      for (const add of item.additions) {
        enc.line(`   [+] ${add}`);
      }
      enc.bold(false);
    }

    // Bold Red Omissions representation on monochrome thermal
    if (item.omissions && item.omissions.length > 0) {
      enc.invert(true);
      for (const omit of item.omissions) {
        enc.line(`   [-] NO ${omit.toUpperCase()} `);
      }
      enc.invert(false);
    }

    if (item.notes) {
      enc.line(`   NOTE: ${item.notes}`);
    }

    enc.line("");
  }

  if (payload.customerNote) {
    enc
      .divider("-")
      .bold(true)
      .line(`SPECIAL INSTRUCTIONS: ${payload.customerNote}`)
      .bold(false);
  }

  enc.divider("=");
  return enc.feedAndCut();
}

/**
 * Builds ESC/POS buffer for Station 2 (Outdoor Charcoal Rotisserie Grill)
 * Focus: Meat types, gram portion weights, 5-level spice scales, searing urgency
 */
export function buildGrillChit(payload: ThermalChitPayload, items: ThermalChitItem[]): Buffer {
  const enc = new EscPosEncoder();
  const dateStr = new Date(payload.createdAt).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  enc
    .alignCenter()
    .bold(true)
    .doubleHeight()
    .line("MY GERMAN DÖNER")
    .normalSize()
    .invert(true)
    .line(" STATION 2: CHARCOAL ROTISSERIE GRILL ")
    .invert(false)
    .bold(true)
    .doubleSize()
    .line(`ORDER #${payload.dailySequence}`)
    .normalSize()
    .line(`[${payload.orderType}] · Store: ${payload.locationSlug}`)
    .line(`Ticket Ref: ${payload.orderNumber} · Time: ${dateStr}`)
    .divider("=")
    .alignLeft();

  for (const item of items) {
    const weightGrams =
      !item.meatWeightGrams || item.meatWeightGrams === 150
        ? "150g (Standard)"
        : `${item.meatWeightGrams}g`;

    enc
      .bold(true)
      .doubleHeight()
      .line(`${item.quantity}x ${item.name} [${weightGrams}]`)
      .normalSize()
      .bold(false);

    if (item.spiceLevel !== undefined) {
      const flames = "★".repeat(item.spiceLevel);
      enc.bold(true).line(`   SPICE LEVEL: ${item.spiceLevel}/5 [${flames}]`);
      if (item.spiceLevel >= 4) {
        enc.invert(true).line("   *** WARNING: EXTRA HOT CARVING (HÖLLE) ***   ").invert(false);
      }
      enc.bold(false);
    }

    // Highlight meat additions (e.g. Extra 100g Meat)
    if (item.additions && item.additions.some((a) => a.toLowerCase().includes("meat") || a.toLowerCase().includes("fleisch"))) {
      enc.bold(true);
      item.additions
        .filter((a) => a.toLowerCase().includes("meat") || a.toLowerCase().includes("fleisch"))
        .forEach((add) => enc.line(`   >>> ${add.toUpperCase()}`));
      enc.bold(false);
    }

    enc.line("");
  }

  enc.divider("=");
  return enc.feedAndCut();
}
