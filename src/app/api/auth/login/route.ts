// POST /api/auth/login — username + PIN → signed session cookie.
import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authenticate, type LoginRepository } from "@/lib/auth/login";
import { createRateLimiter } from "@/lib/auth/rate-limit";
import { createSessionToken, readSessionSecret, SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

// 5 attempts per minute per client address (TRD §Security).
const limiter = createRateLimiter({ limit: 5, windowMs: 60_000 });

const repo: LoginRepository = {
  async findUserByUsername(username) {
    return prisma.adminUser.findUnique({
      where: { username },
      select: { id: true, username: true, role: true, pinHash: true, isActive: true, failedAttempts: true, lockedUntil: true },
    });
  },
  async recordFailedAttempt(id, failedAttempts, lockedUntil) {
    await prisma.adminUser.update({ where: { id }, data: { failedAttempts, lockedUntil } });
  },
  async recordSuccess(id) {
    await prisma.adminUser.update({ where: { id }, data: { failedAttempts: 0, lockedUntil: null } });
  },
};

function clientKey(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

export async function POST(req: NextRequest) {
  let secret: string;
  try {
    secret = readSessionSecret(process.env.SESSION_SECRET);
  } catch {
    return NextResponse.json({ success: false, error: "Authentication is not configured on this server." }, { status: 503 });
  }

  const ip = clientKey(req);
  const rate = limiter.check(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many attempts. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  const body: unknown = await req.json().catch(() => null);
  const username = typeof body === "object" && body && "username" in body ? String((body as { username: unknown }).username).trim() : "";

  const result = await authenticate(body, { repo, comparePin: (pin, hash) => bcrypt.compare(pin, hash), now: () => new Date() });

  if (!result.ok) {
    if (result.reason === "INVALID_INPUT") {
      return NextResponse.json({ success: false, error: "Enter your username and a 4–8 digit PIN." }, { status: 400 });
    }
    await prisma.auditLog.create({
      data: {
        action: result.reason === "LOCKED" ? "LOGIN_REJECTED_LOCKED" : "LOGIN_FAILED",
        details: JSON.stringify({ username: username.slice(0, 64), ip }),
        ipAddress: ip,
        severity: result.reason === "LOCKED" ? "CRITICAL" : "WARN",
      },
    });
    if (result.reason === "LOCKED") {
      return NextResponse.json(
        { success: false, error: `Account locked after too many attempts. Try again in ${result.retryAfterSec}s.` },
        { status: 423, headers: { "Retry-After": String(result.retryAfterSec) } }
      );
    }
    return NextResponse.json({ success: false, error: "Incorrect username or PIN." }, { status: 401 });
  }

  await prisma.auditLog.create({
    data: {
      adminUserId: result.user.id,
      action: "LOGIN_SUCCESS",
      details: JSON.stringify({ username: result.user.username, role: result.user.role, ip }),
      ipAddress: ip,
      severity: "INFO",
    },
  });

  const token = await createSessionToken({ sub: result.user.id, usr: result.user.username, role: result.user.role }, secret);
  const res = NextResponse.json({ success: true, user: { username: result.user.username, role: result.user.role } });
  res.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}
