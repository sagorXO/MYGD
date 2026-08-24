// ESC/POS & StarPRNT Solenoid Cash Drawer Kick Commands

export const CASH_DRAWER_COMMANDS = {
  // ESC p m t1 t2 (Standard ESC/POS: Pin 2, 50ms on, 500ms off)
  EPSON_PIN2: Buffer.from([0x1B, 0x70, 0x00, 0x19, 0xFA]),
  // ESC p m t1 t2 (Pin 5)
  EPSON_PIN5: Buffer.from([0x1B, 0x70, 0x01, 0x19, 0xFA]),
  // BEL (0x07) for Star Micronics TSP100 / TSP143
  STAR_DRAWER_KICK: Buffer.from([0x07]),
};

export function getCashDrawerKickBuffer(protocol: "EPSON" | "STAR" = "EPSON"): Buffer {
  return protocol === "STAR" ? CASH_DRAWER_COMMANDS.STAR_DRAWER_KICK : CASH_DRAWER_COMMANDS.EPSON_PIN2;
}
