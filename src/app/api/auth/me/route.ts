// GET /api/auth/me — the signed-in user (middleware has already required a session).
import { NextResponse, type NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, "STORE_STAFF");
  if (!auth.ok) return auth.response;
  const { usr, role, exp } = auth.session;
  return NextResponse.json({ success: true, user: { username: usr, role }, expiresAt: new Date(exp * 1000).toISOString() });
}
