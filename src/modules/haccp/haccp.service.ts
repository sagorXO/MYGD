// MY GERMAN DÖNER — HACCP Compliance Service (EU Reg 852/2004)
// Timeclock lives in /api/staff/timeclock (hashed PINs via src/lib/auth/staff-pin.ts).
import { prisma } from "@/lib/prisma";
import { eventBroker } from "@/lib/events";
import {
  HACCPTargetType,
  HACCPValidationResult,
  HACCPLogRequest,
} from "./haccp.schema";

export class HACCPService {
  /**
   * Validates temperature readings according to statutory EU standards
   */
  public static validateTemperature(
    targetType: HACCPTargetType,
    temperature: number
  ): HACCPValidationResult {
    switch (targetType) {
      case "CHILLED": {
        // Walk-in Fridges / Prep Counters: 0°C – 5°C
        const isCompliant = temperature >= 0.0 && temperature <= 5.0;
        const inDangerZone = temperature > 5.0 && temperature < 63.0;
        return {
          isCompliant,
          inDangerZone,
          targetMin: 0.0,
          targetMax: 5.0,
          message: isCompliant
            ? `Compliant (Target: 0°C–5°C, actual: ${temperature}°C)`
            : `Non-compliant: Chilled storage exceeds 5.0°C statutory threshold. Danger Zone!`,
          correctiveActionRequired: !isCompliant,
        };
      }

      case "FROZEN": {
        // Deep Freezers: -18°C or below
        const isCompliant = temperature <= -18.0;
        const inDangerZone = temperature > -18.0;
        return {
          isCompliant,
          inDangerZone,
          targetMin: -25.0,
          targetMax: -18.0,
          message: isCompliant
            ? `Compliant (Target: ≤ -18.0°C, actual: ${temperature}°C)`
            : `Non-compliant: Freezer temperature above -18.0°C limit!`,
          correctiveActionRequired: !isCompliant,
        };
      }

      case "HOT_HOLDING": {
        // Cooked Rotisserie Döner Meat: ≥ 63°C
        const isCompliant = temperature >= 63.0;
        const inDangerZone = temperature < 63.0 && temperature > 5.0;
        return {
          isCompliant,
          inDangerZone,
          targetMin: 63.0,
          targetMax: 85.0,
          message: isCompliant
            ? `Compliant (Target: ≥ 63.0°C, actual: ${temperature}°C)`
            : `CRITICAL HACCP BREACH: Hot-holding rotisserie meat below 63.0°C Danger Zone!`,
          correctiveActionRequired: !isCompliant,
        };
      }
    }
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
