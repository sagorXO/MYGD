// POST /api/auth/logout — clears the session and the PIN of whoever was working.
import { NextResponse } from "next/server";
import { OPERATOR_COOKIE } from "@/lib/auth/operator";
import { SESSION_COOKIE } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set({ name: SESSION_COOKIE, value: "", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
  res.cookies.delete(OPERATOR_COOKIE);
  return res;
}
