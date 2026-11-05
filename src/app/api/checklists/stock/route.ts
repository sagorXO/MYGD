// Stock count: today's counts beside the last count, with OK / LOW / OUT.
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { requireOperator } from "@/lib/auth/operator-guard";
import { StockCountSchema } from "@/modules/checklists/checklists.schema";
import { checklistErrorResponse, getStock, saveStockCount } from "@/modules/checklists/checklists.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, "STORE_STAFF");
  if (!auth.ok) return auth.response;
  try {
    return NextResponse.json({ success: true, stock: await getStock() });
  } catch (err) {
    return checklistErrorResponse(err, "load the stock list");
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireOperator(req);
  if (!auth.ok) return auth.response;
  try {
    await saveStockCount(StockCountSchema.parse(await req.json()), auth.operator);
    return NextResponse.json({ success: true });
  } catch (err) {
    return checklistErrorResponse(err, "save the count");
  }
}
