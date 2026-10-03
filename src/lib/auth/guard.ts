// Route-handler check (defence in depth behind middleware) for money/price routes.
import { NextResponse, type NextRequest } from "next/server";
import { hasRole, type Role } from "./roles";
import { readSessionSecret, verifySessionToken, SESSION_COOKIE, type SessionPayload } from "./session";

export type GuardResult = { ok: true; session: SessionPayload } | { ok: false; response: NextResponse };

export async function getSession(req: NextRequest): Promise<SessionPayload | null> {
  let secret: string;
  try {
    secret = readSessionSecret(process.env.SESSION_SECRET);
  } catch {
    return null;
  }
  return verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value, secret);
}

export async function requireRole(req: NextRequest, role: Role): Promise<GuardResult> {
  const session = await getSession(req);
  if (!session) {
    return { ok: false, response: NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 }) };
  }
  if (!hasRole(session.role, role)) {
    return { ok: false, response: NextResponse.json({ success: false, error: "Not allowed for your role." }, { status: 403 }) };
  }
  return { ok: true, session };
}
