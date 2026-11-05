// A person identifies themselves on the shared tablet with their PIN.
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/auth/client-ip";
import { requireRole } from "@/lib/auth/guard";
import { createOperatorToken, OPERATOR_COOKIE, operatorCookie } from "@/lib/auth/operator";
import { createPinLimiter } from "@/lib/auth/rate-limit";
import { readSessionSecret } from "@/lib/auth/session";
import { verifyStaffPin } from "@/lib/auth/staff-pin";

export const dynamic = "force-dynamic";

// A signed-in tablet can try a few wrong PINs (typos at shift change), not walk through the PIN space.
const pinLimiter = createPinLimiter({ shortLimit: 5, shortWindowMs: 5 * 60_000, longLimit: 20, longWindowMs: 60 * 60_000 });

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, "STORE_STAFF");
  if (!auth.ok) return auth.response;
  try {
    const key = auth.session.sub ?? clientIp(req.headers);
    const rate = pinLimiter.isBlocked(key);
    if (rate.blocked) {
      return NextResponse.json({ success: false, error: "Too many PIN attempts. Try again shortly." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } });
    }
    const body: unknown = await req.json();
    const pin = (body as { pin?: unknown } | null)?.pin;
    const users = await prisma.adminUser.findMany({ where: { isActive: true }, select: { id: true, username: true, role: true, pinHash: true, isActive: true } });
    const result = await verifyStaffPin(pin, users, (p, h) => bcrypt.compare(p, h));
    if (!result.ok) {
      pinLimiter.recordFailure(key);
      if (pinLimiter.isBlocked(key).long) {
        console.warn("[checklists] PIN entry locked after repeated failures");
        await prisma.auditLog.create({ data: { adminUserId: auth.session.sub, action: "OPERATOR_PIN_LOCKED", severity: "CRITICAL", details: JSON.stringify({ reason: "Repeated wrong PINs" }) } });
      }
      const error = result.reason === "INVALID_INPUT" ? "Enter your 4–8 digit PIN." : result.reason === "AMBIGUOUS" ? "This PIN is shared by more than one person. Ask a manager to reset it." : "PIN not recognised.";
      return NextResponse.json({ success: false, error }, { status: result.reason === "INVALID_INPUT" ? 400 : 401 });
    }
    const { id, username, role } = result.user;
    const token = await createOperatorToken({ sub: id, usr: username, role }, readSessionSecret(process.env.SESSION_SECRET));
    const res = NextResponse.json({ success: true, operator: { id, name: username, role } });
    res.cookies.set(operatorCookie(token));
    return res;
  } catch (err) {
    if (err instanceof SyntaxError) return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
    console.error("[checklists] PIN check failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ success: false, error: "Could not check the PIN." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireRole(req, "STORE_STAFF");
  if (!auth.ok) return auth.response;
  const res = NextResponse.json({ success: true });
  res.cookies.delete(OPERATOR_COOKIE);
  return res;
}
