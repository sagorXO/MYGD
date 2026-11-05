// Saves a temperature reading from the staff screen, recorded against the person's PIN.
import { NextRequest, NextResponse } from "next/server";
import { requireOperator } from "@/lib/auth/operator-guard";
import { checklistErrorResponse } from "@/modules/checklists/checklists.service";
import { HaccpReadingSchema } from "@/modules/checklists/checklists.schema";
import { HACCPService } from "@/modules/haccp/haccp.service";
import { evaluateTemperature } from "@/modules/haccp/temperature";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireOperator(req);
  if (!auth.ok) return auth.response;
  try {
    const input = HaccpReadingSchema.parse(await req.json());
    const { isCompliant } = evaluateTemperature(input.targetType, input.temperature);
    if (!isCompliant && !input.correctiveAction) {
      return NextResponse.json({ success: false, error: "That reading is out of range. Say what you did about it." }, { status: 422 });
    }
    await HACCPService.logTemperature({ locationSlug: "EMBA", ...input, loggedBy: auth.operator.name });
    return NextResponse.json({ success: true, isCompliant, recordedBy: auth.operator.name });
  } catch (err) {
    return checklistErrorResponse(err, "save the reading");
  }
}
