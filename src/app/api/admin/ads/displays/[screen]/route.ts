// Manager API: choose which playlist a screen plays (null = none) and its orientation.
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { DisplayAssignSchema, ScreenNumberSchema } from "@/modules/signage/ads/ads.schema";
import { adsErrorResponse, assignDisplay } from "@/modules/signage/ads/ads.service";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ screen: string }> }) {
  const auth = await requireRole(req, "STORE_MANAGER");
  if (!auth.ok) return auth.response;
  const screen = ScreenNumberSchema.safeParse((await params).screen);
  if (!screen.success) return NextResponse.json({ success: false, error: "Unknown screen." }, { status: 404 });
  try {
    const body = DisplayAssignSchema.parse(await req.json());
    const display = await assignDisplay(screen.data, body, { userId: auth.session.sub });
    return NextResponse.json({ success: true, display });
  } catch (err) {
    return adsErrorResponse(err, "assign the screen");
  }
}
