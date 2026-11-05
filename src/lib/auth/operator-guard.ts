// Route check for actions that must be recorded against a person: staff session plus a current PIN.
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "./guard";
import { OPERATOR_COOKIE, verifyOperatorToken, type OperatorIdentity } from "./operator";
import { readSessionSecret } from "./session";
import { isRole } from "./roles";

export type OperatorResult = { ok: true; operator: OperatorIdentity } | { ok: false; response: NextResponse };

const pinNeeded = () =>
  NextResponse.json({ success: false, code: "OPERATOR_REQUIRED", error: "Enter your PIN first." }, { status: 401 });

/** The current person, re-read from the database so a removed account or changed role takes effect at once. */
export async function currentOperator(req: NextRequest): Promise<OperatorIdentity | null> {
  let secret: string;
  try {
    secret = readSessionSecret(process.env.SESSION_SECRET);
  } catch {
    return null;
  }
  const token = await verifyOperatorToken(req.cookies.get(OPERATOR_COOKIE)?.value, secret);
  if (!token) return null;
  const user = await prisma.adminUser.findUnique({ where: { id: token.id }, select: { username: true, role: true, isActive: true } });
  if (!user?.isActive || !isRole(user.role)) return null;
  return { id: token.id, name: user.username, role: user.role };
}

export async function requireOperator(req: NextRequest): Promise<OperatorResult> {
  const auth = await requireRole(req, "STORE_STAFF");
  if (!auth.ok) return auth;
  const operator = await currentOperator(req);
  return operator ? { ok: true, operator } : { ok: false, response: pinNeeded() };
}
