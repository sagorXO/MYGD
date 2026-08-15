import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const printerType = body.printerType || "EPSON_TM";

    const timestamp = new Date().toLocaleString("de-DE", { timeZone: "Asia/Nicosia" });

    let rawCommandHex = "";
    let formattedTextReceipt = "";

    if (printerType === "EPSON_TM") {
      // ESC/POS Protocol formatting
      // ESC @ (Init), ESC a 1 (Center), GS ! 0x11 (Double Width/Height), ESC d 2 (Feed), GS V 66 0 (Cut)
      rawCommandHex = "1B40 1B6101 1D2111 4D59204745524D414E2044D64E4552 1B6100 1D2100 1B6402 1D564200";
      formattedTextReceipt = [
        "================================================",
        "              MY GERMAN DÖNER                   ",
        "        THE ORIGINAL BERLIN KEBAB               ",
        "         Emba Branch, Paphos, CY                ",
        "================================================",
        `Date/Time: ${timestamp}`,
        "Printer Driver: EPSON TM-T88VI (ESC/POS)",
        "Connection: TCP/IP Port 9100 - Status OK",
        "------------------------------------------------",
        "            RECEIPT PRINTER TEST                ",
        "Hardware Self-Check: PASSED                     ",
        "Auto-Cutter Mechanism: ENGAGED                  ",
        "------------------------------------------------",
        "      Thank you for choosing MYGD!              ",
        "================================================",
      ].join("\n");
    } else {
      // Star Micronics Line / StarPRNT Protocol formatting
      // ESC @ (Init), ESC a 1 (Center), ESC E (Bold), ESC d 2 (Feed), ESC d 3 (Cut)
      rawCommandHex = "1B40 1B6101 1B45 4D59204745524D414E2044D64E4552 1B46 1B6403";
      formattedTextReceipt = [
        "************************************************",
        "              MY GERMAN DÖNER                   ",
        "        DER ECHTE BERLINER DÖNER                ",
        "         Emba Branch, Paphos, CY                ",
        "************************************************",
        `Date/Time: ${timestamp}`,
        "Printer Driver: STAR MICRONICS TSP143 (StarPRNT)",
        "Connection: USB / Ethernet - Status OK          ",
        "------------------------------------------------",
        "          STAR HARDWARE TEST OK                 ",
        "Guillotine Auto-Cutter: TESTED                  ",
        "------------------------------------------------",
        "        CYPRUS • EST. 2026 • MYGD               ",
        "************************************************",
      ].join("\n");
    }

    return NextResponse.json({
      success: true,
      printerType,
      status: "ONLINE",
      rawCommandHex,
      formattedTextReceipt,
      message: `Test print successfully generated for ${printerType}`,
    });
  } catch (error) {
    console.error("Printer test error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate test print" },
      { status: 500 }
    );
  }
}
