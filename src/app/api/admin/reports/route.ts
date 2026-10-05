import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { BIService } from "@/modules/bi/bi.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, "STORE_MANAGER");
  if (!auth.ok) return auth.response;

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
