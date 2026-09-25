import { NextRequest, NextResponse } from "next/server";
import { KDSService } from "@/modules/kds/kds.service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ticketId } = body;
    if (!ticketId) {
      return NextResponse.json({ success: false, error: "ticketId is required" }, { status: 400 });
    }

    const res = await KDSService.reprintThermalChit(ticketId);
    return NextResponse.json(res);
  } catch (err: any) {
    console.error("[API /api/terminal/print] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
