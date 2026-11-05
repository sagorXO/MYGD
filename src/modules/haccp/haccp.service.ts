// MY GERMAN DÖNER — HACCP Compliance Service (EU Reg 852/2004)
// Timeclock lives in /api/staff/timeclock (hashed PINs via src/lib/auth/staff-pin.ts).
import { prisma } from "@/lib/prisma";
import { eventBroker } from "@/lib/events";
import {
  HACCPTargetType,
  HACCPValidationResult,
  HACCPLogRequest,
} from "./haccp.schema";
import { evaluateTemperature, HACCP_LIMITS, limitText } from "./temperature";

export class HACCPService {
  /**
   * Validates temperature readings according to statutory EU standards
   */
  public static validateTemperature(
    targetType: HACCPTargetType,
    temperature: number
  ): HACCPValidationResult {
    const { isCompliant, inDangerZone } = evaluateTemperature(targetType, temperature);
    const { minC, maxC } = HACCP_LIMITS[targetType];
    return {
      isCompliant,
      inDangerZone,
      // A one-sided limit still reports a finite range: infinity turns into null once sent as JSON.
      targetMin: minC ?? -25,
      targetMax: maxC ?? 85,
      message: isCompliant
        ? `Compliant (Target: ${limitText(targetType)}, actual: ${temperature}°C)`
        : `Non-compliant: must be ${limitText(targetType)}, actual: ${temperature}°C`,
      correctiveActionRequired: !isCompliant,
    };
  }

  /**
   * Logs HACCP temperature audit record to database with automated manager alerts
   */
  public static async logTemperature(req: HACCPLogRequest) {
    const location = await prisma.location.findUnique({
      where: { slug: req.locationSlug },
    });
    if (!location) throw new Error(`Location not found: ${req.locationSlug}`);

    const validation = this.validateTemperature(req.targetType, req.temperature);

    if (validation.correctiveActionRequired && !req.correctiveAction?.trim()) {
      throw new Error("Mandatory corrective action note is required for temperatures outside legal limits.");
    }

    const log = await prisma.haccpLog.create({
      data: {
        locationId: location.id,
        equipmentName: req.equipmentName,
        targetType: req.targetType,
        temperature: req.temperature,
        isCompliant: validation.isCompliant,
        correctiveAction: req.correctiveAction,
        loggedBy: req.loggedBy,
      },
    });

    if (!validation.isCompliant) {
      // Audit log escalation
      await prisma.auditLog.create({
        data: {
          locationId: location.id,
          action: "HACCP_DANGER_ZONE_ALERT",
          details: `Equipment '${req.equipmentName}' reached ${req.temperature}°C (${req.targetType}). Action: ${req.correctiveAction}`,
          severity: "CRITICAL",
        },
      });

      eventBroker.publish("admin", {
        type: "HEARTBEAT",
        severity: "CRITICAL",
        message: `HACCP DANGER ALERT: ${req.equipmentName} at ${req.temperature}°C`,
      });
    }

    return { success: true, log, validation };
  }
}
