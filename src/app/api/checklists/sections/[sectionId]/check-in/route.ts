// Confirms a during-shift section is on track.
import { NextRequest, NextResponse } from "next/server";
import { requireOperator } from "@/lib/auth/operator-guard";
import { checkIn, checklistErrorResponse } from "@/modules/checklists/checklists.service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ sectionId: string }> }) {
  const auth = await requireOperator(req);
  if (!auth.ok) return auth.response;
  try {
    await checkIn((await params).sectionId, auth.operator);
    return NextResponse.json({ success: true });
  } catch (err) {
    return checklistErrorResponse(err, "save the check-in");
  }
}
