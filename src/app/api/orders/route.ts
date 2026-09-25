import { NextRequest, NextResponse } from "next/server";
import { POSService } from "@/modules/pos/pos.service";
import { ZodError } from "zod";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await POSService.tenderOrder(body);
    return NextResponse.json(result);
  } catch (err: any) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation error", issues: err.issues },
        { status: 400 }
      );
    }
    console.error("[API /api/orders] Order tender failed:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to tender order" },
      { status: 500 }
    );
  }
}
