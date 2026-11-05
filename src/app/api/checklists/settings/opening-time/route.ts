// Today's opening time. Opening deadlines follow it. Shift Leaders only.
import { NextRequest, NextResponse } from "next/server";
import { hasRole } from "@/lib/auth/roles";
import { requireOperator } from "@/lib/auth/operator-guard";
import { OpeningTimeSchema } from "@/modules/checklists/checklists.schema";
import { checklistErrorResponse, setOpeningTime } from "@/modules/checklists/checklists.service";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  const auth = await requireOperator(req);
  if (!auth.ok) return auth.response;
  if (!hasRole(auth.operator.role, "STORE_MANAGER")) {
    return NextResponse.json({ success: false, error: "Only a Shift Leader can change the opening time. Enter a Shift Leader's PIN." }, { status: 403 });
  }
  try {
    const { openingTime } = OpeningTimeSchema.parse(await req.json());
    await setOpeningTime(openingTime, auth.operator);
    return NextResponse.json({ success: true });
  } catch (err) {
    return checklistErrorResponse(err, "change the opening time");
  }
}
