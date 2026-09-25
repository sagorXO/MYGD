// MY GERMAN DÖNER — Module M1 Checklist Logs & HACCP Audit Trail API
// GET: Returns completed checklist logs
// POST: Validates HACCP temperatures and persists to ChecklistLog

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateHACCPTemperature } from "@/lib/haccp-validator";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const locationSlug = url.searchParams.get("location") || "EMBA";
    const shiftType = url.searchParams.get("shiftType");

    const location = await prisma.location.findUnique({
      where: { slug: locationSlug },
    });

    if (!location) {
      return NextResponse.json(
        { success: false, error: `Location '${locationSlug}' not found` },
        { status: 404 }
      );
    }

    const whereClause: any = { locationId: location.id };
    if (shiftType) whereClause.shiftType = shiftType;

    const logs = await prisma.checklistLog.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      logs: logs.map((l) => ({
        id: l.id,
        shiftType: l.shiftType,
        completedBy: l.completedBy,
        isCompliant: l.isCompliant,
        logs: JSON.parse(l.logsJson || "[]"),
        notes: l.notes,
        createdAt: l.createdAt.toISOString(),
      })),
    });
  } catch (err: any) {
    console.error("[Checklist Log GET Error]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch logs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { locationSlug = "EMBA", shiftType, completedBy, tasks = [], notes } = body;

    if (!shiftType || !completedBy) {
      return NextResponse.json(
        { success: false, error: "shiftType and completedBy are required" },
        { status: 400 }
      );
    }

    const location = await prisma.location.findUnique({
      where: { slug: locationSlug.toUpperCase() },
    });

    if (!location) {
      return NextResponse.json(
        { success: false, error: `Location '${locationSlug}' not found` },
        { status: 404 }
      );
    }

    let isCompliant = true;
    let dangerZoneTriggered = false;
    let dangerZoneDetails = "";

    // Validate temperature checks if any
    const processedTasks = tasks.map((task: any) => {
      let tempValidation = null;

      if (task.isTempCheck && typeof task.loggedTemp === "number") {
        tempValidation = validateHACCPTemperature(task.tempType || "CHILLED", task.loggedTemp);
        if (!tempValidation.isCompliant) {
          isCompliant = false;
        }
        if (tempValidation.isDangerZone) {
          dangerZoneTriggered = true;
          dangerZoneDetails += `${task.title}: ${task.loggedTemp}°C (Danger Zone). `;
        }
      }

      return {
        ...task,
        validation: tempValidation,
      };
    });

    const createdLog = await prisma.checklistLog.create({
      data: {
        locationId: location.id,
        shiftType,
        completedBy,
        isCompliant,
        logsJson: JSON.stringify(processedTasks),
        notes: notes || undefined,
      },
    });

    // If HACCP danger zone triggered, log critical audit entry
    if (dangerZoneTriggered) {
      await prisma.auditLog.create({
        data: {
          locationId: location.id,
          action: "HACCP_DANGER_ZONE_VIOLATION",
          details: JSON.stringify({
            logId: createdLog.id,
            completedBy,
            shiftType,
            details: dangerZoneDetails,
          }),
          severity: "CRITICAL",
        },
      });
    }

    return NextResponse.json({
      success: true,
      log: createdLog,
      isCompliant,
      dangerZoneTriggered,
    });
  } catch (err: any) {
    console.error("[Checklist Log POST Error]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to persist checklist log" },
      { status: 500 }
    );
  }
}
