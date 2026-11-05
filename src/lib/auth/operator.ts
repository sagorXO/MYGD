// Who is working at a shared tablet right now.
// [ADR] Context: the tablet stays logged in all day, so the login session can't say who ticked a task.
// Decision: a person enters their PIN to get a short-lived signed "operator" cookie, separate from the session.
// Consequence: records carry a real person, and a forgotten name expires. The key is derived from the
// session secret, so neither token works as the other.
import { createSessionToken, verifySessionToken, type SessionIdentity } from "./session";
import type { Role } from "./roles";

export const OPERATOR_COOKIE = "mygd_operator";
// [ADR] Context: staff walk away from a shared tablet, so a long-lived PIN records the next person's work
// under the wrong name, including Shift Leader sign-offs.
// Decision: a PIN lapses after a short idle time. Each action restarts it (see the middleware).
// Consequence: someone returning after a break enters their PIN again.
export const OPERATOR_MAX_AGE_SECONDS = 5 * 60;

export interface OperatorIdentity {
  id: string;
  name: string;
  role: Role;
}

const operatorSecret = (secret: string) => `${secret}:operator`;

export function createOperatorToken(identity: SessionIdentity, secret: string, now: Date = new Date()): Promise<string> {
  return createSessionToken(identity, operatorSecret(secret), now);
}

/** A real action on the tablet. Screen refreshes don't count, or a PIN would never lapse. */
export function isOperatorActivity(pathname: string, method: string): boolean {
  if (method === "GET" || method === "HEAD") return false;
  if (pathname === "/api/checklists/operator") return false;
  return pathname.startsWith("/api/checklists/") || pathname === "/api/haccp/readings";
}

/** A new token for the same person, or null if theirs has already lapsed. */
export async function refreshOperatorToken(token: unknown, secret: string, now: Date = new Date()): Promise<string | null> {
  const operator = await verifyOperatorToken(token, secret, now);
  return operator ? createOperatorToken({ sub: operator.id, usr: operator.name, role: operator.role }, secret, now) : null;
}

export function operatorCookie(value: string) {
  return { name: OPERATOR_COOKIE, value, httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: OPERATOR_MAX_AGE_SECONDS };
}

/** The person on this token, or null for anything missing, forged or older than the limit. Never throws. */
export async function verifyOperatorToken(token: unknown, secret: string, now: Date = new Date()): Promise<OperatorIdentity | null> {
  const payload = await verifySessionToken(token, operatorSecret(secret), now);
  if (!payload) return null;
  if (Math.floor(now.getTime() / 1000) - payload.iat > OPERATOR_MAX_AGE_SECONDS) return null;
  return { id: payload.sub, name: payload.usr, role: payload.role };
}
