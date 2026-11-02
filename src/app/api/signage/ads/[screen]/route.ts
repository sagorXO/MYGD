// Public feed for one portrait screen: its playlist and schedule (read-only, no customer data).
// GET also records the screen's heartbeat for the admin page.
import { NextRequest, NextResponse } from "next/server";
import { ScreenNumberSchema } from "@/modules/signage/ads/ads.schema";
import { adsErrorResponse, getScreenFeed } from "@/modules/signage/ads/ads.service";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ screen: string }> }) {
  const parsed = ScreenNumberSchema.safeParse((await params).screen);
  if (!parsed.success) return NextResponse.json({ success: false, error: "Unknown screen." }, { status: 404 });
  try {
    const feed = await getScreenFeed(parsed.data);
    return NextResponse.json({ success: true, feed }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return adsErrorResponse(err, "load the screen feed");
  }
}
