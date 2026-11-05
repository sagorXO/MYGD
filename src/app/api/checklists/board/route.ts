// The whole shift for the tablet: tasks, today's progress, the opening time and who is signed in.
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { currentOperator } from "@/lib/auth/operator-guard";
import { checklistErrorResponse, getBoard } from "@/modules/checklists/checklists.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, "STORE_STAFF");
  if (!auth.ok) return auth.response;
  try {
    return NextResponse.json({ success: true, board: await getBoard(await currentOperator(req)) });
  } catch (err) {
    return checklistErrorResponse(err, "load the checklists");
  }
}
