import { NextResponse } from "next/server";
import { BIService } from "@/modules/bi/bi.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const report = await BIService.getCrossStoreReport();
    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    console.error("[API /api/admin/reports] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to generate BI report" },
      { status: 500 }
    );
  }
}
