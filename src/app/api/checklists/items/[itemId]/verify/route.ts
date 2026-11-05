// Shift Leader sign-off of a critical task. The role is checked against the PIN, in rules.ts.
import { NextRequest, NextResponse } from "next/server";
import { requireOperator } from "@/lib/auth/operator-guard";
import { checklistErrorResponse, verifyItem } from "@/modules/checklists/checklists.service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const auth = await requireOperator(req);
  if (!auth.ok) return auth.response;
  try {
    return NextResponse.json({ success: true, entry: await verifyItem((await params).itemId, auth.operator) });
  } catch (err) {
    return checklistErrorResponse(err, "sign off the task");
  }
}
