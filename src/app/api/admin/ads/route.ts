// Manager API for screen ads: overview (playlists, screens, media) and creating a playlist.
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { PlaylistCreateSchema } from "@/modules/signage/ads/ads.schema";
import { adsErrorResponse, createPlaylist, getAdminOverview } from "@/modules/signage/ads/ads.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, "STORE_MANAGER");
  if (!auth.ok) return auth.response;
  try {
    return NextResponse.json({ success: true, ...(await getAdminOverview()) });
  } catch (err) {
    return adsErrorResponse(err, "load screen ads");
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, "STORE_MANAGER");
  if (!auth.ok) return auth.response;
  try {
    const { name } = PlaylistCreateSchema.parse(await req.json());
    const playlist = await createPlaylist(name, { userId: auth.session.sub });
    return NextResponse.json({ success: true, playlist }, { status: 201 });
  } catch (err) {
    return adsErrorResponse(err, "create the playlist");
  }
}
