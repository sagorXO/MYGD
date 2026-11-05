// Finishes a station's phase. Refused, with the open tasks listed, until every tick task is done.
import { NextRequest, NextResponse } from "next/server";
import { requireOperator } from "@/lib/auth/operator-guard";
import { FinishSchema } from "@/modules/checklists/checklists.schema";
import { checklistErrorResponse, finishRun } from "@/modules/checklists/checklists.service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireOperator(req);
  if (!auth.ok) return auth.response;
  try {
    const { station, phase } = FinishSchema.parse(await req.json());
    await finishRun(station, phase, auth.operator);
    return NextResponse.json({ success: true });
  } catch (err) {
    return checklistErrorResponse(err, "finish the checklist");
  }
}
