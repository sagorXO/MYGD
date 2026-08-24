import { NextResponse } from "next/server";
import { prisma, initializeDatabasePragmas } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await initializeDatabasePragmas();

    const body = await request.json().catch(() => ({}));
    const { pin } = body;

    if (!pin || typeof pin !== "string" || pin.length < 4) {
      return NextResponse.json(
        { success: false, error: "Invalid PIN format. Must be 4-6 digits." },
        { status: 400 }
      );
    }

    // Check staff & manager accounts
    const users = await prisma.adminUser.findMany({
      where: { isActive: true },
    });

    let matchedUser = null;

    for (const user of users) {
      // Check if locked out
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        const remainingSec = Math.ceil(
          (user.lockedUntil.getTime() - Date.now()) / 1000
        );
        return NextResponse.json(
          {
            success: false,
            error: `Terminal locked due to failed attempts. Try again in ${remainingSec}s.`,
            lockedUntil: user.lockedUntil.toISOString(),
          },
          { status: 423 }
        );
      }

      const isMatch = await bcrypt.compare(pin, user.pinHash);
      if (isMatch) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      // Record failed attempt on first staff user for rate-limiting
      if (users[0]) {
        const newAttempts = users[0].failedAttempts + 1;
        const lockedUntil =
          newAttempts >= 5
            ? new Date(Date.now() + 5 * 60 * 1000) // 5 min lockout
            : null;

        await prisma.adminUser.update({
          where: { id: users[0].id },
          data: {
            failedAttempts: newAttempts,
            lockedUntil,
          },
        });

        await prisma.auditLog.create({
          data: {
            action: "FAILED_ADMIN_LOGIN",
            details: JSON.stringify({ attempts: newAttempts }),
            severity: newAttempts >= 5 ? "CRITICAL" : "WARN",
          },
        });
      }

      return NextResponse.json(
        { success: false, error: "Incorrect PIN." },
        { status: 401 }
      );
    }

    // Reset failed attempts on success
    await prisma.adminUser.update({
      where: { id: matchedUser.id },
      data: { failedAttempts: 0, lockedUntil: null },
    });

    await prisma.auditLog.create({
      data: {
        adminUserId: matchedUser.id,
        action: "ADMIN_LOGIN_SUCCESS",
        details: JSON.stringify({ role: matchedUser.role, username: matchedUser.username }),
        severity: "INFO",
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        username: matchedUser.username,
        role: matchedUser.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
