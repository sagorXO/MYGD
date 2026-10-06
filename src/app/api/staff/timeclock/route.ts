// MY GERMAN DÖNER — Module M7 Staff Shift Scheduling & PIN Timeclock API
// GET: Returns active clocked-in staff with live elapsed hours and recent shift logs
// POST: PIN authentication, punch shift (IN/OUT/BREAK), persist to TimeLog, dispatch SSE event

import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_VAT_RATE } from "@/lib/tax";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { calculateShiftDuration } from "@/lib/timeclock-engine";
import { verifyStaffPin } from "@/lib/auth/staff-pin";
import { createFailureLimiter } from "@/lib/auth/rate-limit";
import { eventBroker } from "@/lib/events";

export const dynamic = "force-dynamic";

// Brute-force brake for the shared wall tablet: at most 10 FAILED PINs per minute per client.
const pinLimiter = createFailureLimiter({ limit: 10, windowMs: 60_000 });

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const locationSlug = (url.searchParams.get("location") || "EMBA").toUpperCase();

    // 1. Resolve Location
    let location = await prisma.location.findUnique({
      where: { slug: locationSlug },
    });

    if (!location) {
      location = await prisma.location.upsert({
        where: { slug: locationSlug },
        update: {},
        create: {
          slug: locationSlug,
          name: `MY GERMAN DÖNER — ${locationSlug} Flagship`,
          address: "Pavlides Court, Agiou Stefanou Street 134, 8260 Emba",
          currency: "EUR",
          isActive: true,
        },
      });
    }

    // 2. Fetch Open / Active TimeLogs (clockOut is null)
    const openLogs = await prisma.timeLog.findMany({
      where: {
        locationId: location.id,
        clockOut: null,
      },
      orderBy: { clockIn: "desc" },
    });

    const now = new Date();

    const activeStaff = openLogs.map((log) => {
      const duration = calculateShiftDuration(log.clockIn, null, now);
      const clockInDate = new Date(log.clockIn);
      const clockInTime = clockInDate.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });

      return {
        id: log.id,
        staffId: log.staffId,
        staffName: log.staffName,
        role: log.role,
        clockIn: log.clockIn.toISOString(),
        clockInTime,
        hoursWorked: duration.formatted,
        totalMinutes: duration.minutes,
        isApproved: log.isApproved,
      };
    });

    // 3. Fetch Recent Shift Logs (up to 30)
    const recentLogs = await prisma.timeLog.findMany({
      where: {
        locationId: location.id,
      },
      orderBy: { clockIn: "desc" },
      take: 30,
    });

    const formattedRecentLogs = recentLogs.map((log) => {
      const duration = calculateShiftDuration(log.clockIn, log.clockOut, now);
      const clockInDate = new Date(log.clockIn);
      const clockOutDate = log.clockOut ? new Date(log.clockOut) : null;

      return {
        id: log.id,
        staffId: log.staffId,
        staffName: log.staffName,
        role: log.role,
        clockIn: log.clockIn.toISOString(),
        clockOut: log.clockOut ? log.clockOut.toISOString() : null,
        clockInTime: clockInDate.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        clockOutTime: clockOutDate
          ? clockOutDate.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : null,
        totalMinutes: log.totalMinutes ?? duration.minutes,
        hoursWorked: duration.formatted,
        isApproved: log.isApproved,
      };
    });

    return NextResponse.json({
      success: true,
      location: location.slug,
      activeStaff,
      recentLogs: formattedRecentLogs,
    });
  } catch (err: any) {
    console.error("[Timeclock GET Error]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch timeclock data" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pin, action, locationSlug = "EMBA" } = body;

    // Validate Action
    const normalizedAction = typeof action === "string" ? action.toUpperCase().trim() : "";
    if (!["IN", "OUT", "BREAK"].includes(normalizedAction)) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be 'IN', 'OUT', or 'BREAK'." },
        { status: 400 }
      );
    }

    // 1. Identify the staff member by PIN against bcrypt hashes on AdminUser (no plaintext PINs).
    const clientKey = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const rate = pinLimiter.isBlocked(clientKey);
    if (rate.blocked) {
      return NextResponse.json(
        { success: false, error: "Too many PIN attempts. Try again shortly." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
      );
    }

    const users = await prisma.adminUser.findMany({
      where: { isActive: true },
      select: { id: true, username: true, role: true, pinHash: true, isActive: true },
    });
    const pinResult = await verifyStaffPin(pin, users, (p, h) => bcrypt.compare(p, h));
    if (!pinResult.ok) {
      pinLimiter.recordFailure(clientKey);
      const error =
        pinResult.reason === "INVALID_INPUT"
          ? "Enter your 4–8 digit PIN."
          : pinResult.reason === "AMBIGUOUS"
            ? "This PIN is shared by more than one person. Ask a manager to reset it."
            : "PIN not recognised.";
      return NextResponse.json({ success: false, error }, { status: pinResult.reason === "INVALID_INPUT" ? 400 : 401 });
    }

    const staff = { id: pinResult.user.id, name: pinResult.user.username, role: pinResult.user.role };
    const targetLocationSlug = String(locationSlug || "EMBA").toUpperCase();

    // 2. Resolve Location
    let location = await prisma.location.findUnique({
      where: { slug: targetLocationSlug },
    });

    if (!location) {
      location = await prisma.location.upsert({
        where: { slug: targetLocationSlug },
        update: {},
        create: {
          slug: targetLocationSlug,
          name: `MY GERMAN DÖNER — ${targetLocationSlug}`,
          address: "Pavlides Court, Agiou Stefanou Street 134, 8260 Emba",
          currency: "EUR",
          isActive: true,
        },
      });
    }

    const now = new Date();
    let resultLog: any = null;

    // 3. Process TimeLog by Action
    if (normalizedAction === "IN") {
      // Create new TimeLog record with clockIn: now
      resultLog = await prisma.timeLog.create({
        data: {
          locationId: location.id,
          staffId: staff.id,
          staffName: staff.name,
          role: staff.role,
          clockIn: now,
          clockOut: null,
          totalMinutes: null,
          isApproved: false,
        },
      });
    } else if (normalizedAction === "OUT") {
      // Find active open TimeLog for this staff member
      const activeLog = await prisma.timeLog.findFirst({
        where: {
          locationId: location.id,
          staffId: staff.id,
          clockOut: null,
        },
        orderBy: { clockIn: "desc" },
      });

      if (activeLog) {
        const duration = calculateShiftDuration(activeLog.clockIn, now);
        resultLog = await prisma.timeLog.update({
          where: { id: activeLog.id },
          data: {
            clockOut: now,
            totalMinutes: duration.minutes,
          },
        });
      } else {
        // If no open log was found, create completed historical shift
        resultLog = await prisma.timeLog.create({
          data: {
            locationId: location.id,
            staffId: staff.id,
            staffName: staff.name,
            role: staff.role,
            clockIn: new Date(now.getTime() - 60 * 60 * 1000), // Default 1 hr shift fallback
            clockOut: now,
            totalMinutes: 60,
            isApproved: false,
          },
        });
      }
    } else if (normalizedAction === "BREAK") {
      // Record break event
      const activeLog = await prisma.timeLog.findFirst({
        where: {
          locationId: location.id,
          staffId: staff.id,
          clockOut: null,
        },
        orderBy: { clockIn: "desc" },
      });

      resultLog = activeLog;
    }

    // 4. Log Audit Trail
    await prisma.auditLog.create({
      data: {
        locationId: location.id,
        action: `STAFF_TIMECLOCK_${normalizedAction}`,
        details: JSON.stringify({
          staffId: staff.id,
          staffName: staff.name,
          role: staff.role,
          action: normalizedAction,
          timestamp: now.toISOString(),
          timeLogId: resultLog?.id,
        }),
        severity: "INFO",
      },
    });

    // 5. Dispatch Real-Time Event Broker Event
    eventBroker.publish("all", {
      type: "STAFF_PUNCHED",
      staffName: staff.name,
      role: staff.role,
      action: normalizedAction,
      timestamp: now.toISOString(),
    });

    const shiftDuration = resultLog?.clockIn
      ? calculateShiftDuration(resultLog.clockIn, resultLog.clockOut, now)
      : null;

    return NextResponse.json({
      success: true,
      staff: {
        id: staff.id,
        name: staff.name,
        role: staff.role,
        locationSlug: targetLocationSlug,
      },
      action: normalizedAction,
      timeLog: resultLog
        ? {
            id: resultLog.id,
            clockIn: resultLog.clockIn?.toISOString(),
            clockOut: resultLog.clockOut?.toISOString() || null,
            totalMinutes: resultLog.totalMinutes,
            hoursWorked: shiftDuration?.formatted || "0h 0m",
          }
        : null,
      message: `Staff ${staff.name} (${staff.role}) successfully clocked ${normalizedAction}!`,
    });
  } catch (err: any) {
    console.error("[Timeclock POST Error]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process timeclock action" },
      { status: 500 }
    );
  }
}
