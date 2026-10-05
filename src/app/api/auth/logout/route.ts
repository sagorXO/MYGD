// POST /api/auth/logout — clears the session cookie.
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set({ name: SESSION_COOKIE, value: "", httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}
