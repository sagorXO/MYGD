// MY GERMAN DÖNER — Dedicated Recompute Trigger Endpoint
// POST /api/admin/inventory/recompute

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recomputeLocationAvailability } from "@/lib/inventory-engine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const locationSlug = body.locationSlug || "EMBA";

    const location = await prisma.location.findUnique({
      where: { slug: locationSlug },
    });

    if (!location) {
      return NextResponse.json(
        { success: false, error: `Location '${locationSlug}' not found` },
        { status: 404 }
      );
    }

    const recomputeData = await recomputeLocationAvailability(location.id);

    return NextResponse.json({
      success: true,
      data: recomputeData,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[Inventory Recompute Error]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Recompute failed" },
      { status: 500 }
    );
  }
}
