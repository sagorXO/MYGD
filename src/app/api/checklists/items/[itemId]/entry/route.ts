// Tick, untick, flag an issue or add a note on one task, recorded against the person's PIN.
import { NextRequest, NextResponse } from "next/server";
import { requireOperator } from "@/lib/auth/operator-guard";
import { EntryInputSchema } from "@/modules/checklists/checklists.schema";
import { checklistErrorResponse, saveEntry } from "@/modules/checklists/checklists.service";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const auth = await requireOperator(req);
  if (!auth.ok) return auth.response;
  try {
    const input = EntryInputSchema.parse(await req.json());
    const entry = await saveEntry((await params).itemId, input, auth.operator);
    return NextResponse.json({ success: true, entry });
  } catch (err) {
    return checklistErrorResponse(err, "save the task");
  }
}
