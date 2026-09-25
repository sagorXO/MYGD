// MY GERMAN DÖNER — Rotisserie Spit Mount & Carve Counter Service
import { prisma } from "@/lib/prisma";
import { eventBroker } from "@/lib/events";
import { SpitMountLog } from "./inventory.schema";

class SpitTrackerService {
  private activeSpits: Map<string, SpitMountLog> = new Map();

  constructor() {
    // Default initial spits for Store 01 Emba & Store 02 Limassol
    this.activeSpits.set("EMBA", {
      id: "spit-emba-01",
      locationSlug: "EMBA",
      spitNumber: 1,
      meatType: "BEEF_VEAL",
      initialWeightKg: 25.0,
      carvedGrams: 4500,
      remainingWeightKg: 20.5,
      mountedAt: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
      status: "ACTIVE",
    });

    this.activeSpits.set("LIMASSOL", {
      id: "spit-limassol-01",
      locationSlug: "LIMASSOL",
      spitNumber: 1,
      meatType: "BEEF_VEAL",
      initialWeightKg: 25.0,
      carvedGrams: 6200,
      remainingWeightKg: 18.8,
      mountedAt: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(),
      status: "ACTIVE",
    });
  }

  public getActiveSpit(locationSlug: "EMBA" | "LIMASSOL" = "EMBA"): SpitMountLog {
    return (
      this.activeSpits.get(locationSlug) || {
        id: `spit-${locationSlug.toLowerCase()}-01`,
        locationSlug,
        spitNumber: 1,
        meatType: "BEEF_VEAL",
        initialWeightKg: 25.0,
        carvedGrams: 0,
        remainingWeightKg: 25.0,
        mountedAt: new Date().toISOString(),
        status: "ACTIVE",
      }
    );
  }

  public mountNewSpit(
    locationSlug: "EMBA" | "LIMASSOL",
    initialWeightKg: number,
    meatType: "BEEF_VEAL" | "CHICKEN" = "BEEF_VEAL",
    pin?: string
  ): SpitMountLog {
    const newSpit: SpitMountLog = {
      id: `spit-${locationSlug.toLowerCase()}-${Date.now()}`,
      locationSlug,
      spitNumber: 1,
      meatType,
      initialWeightKg,
      carvedGrams: 0,
      remainingWeightKg: initialWeightKg,
      mountedAt: new Date().toISOString(),
      mountedByPin: pin,
      status: "ACTIVE",
    };

    this.activeSpits.set(locationSlug, newSpit);

    eventBroker.publish("admin", {
      type: "STOCK_CHANGED",
      message: `New ${initialWeightKg}kg ${meatType} rotisserie spit mounted for ${locationSlug}`,
      spit: newSpit,
    });

    return newSpit;
  }

  public recordMeatCarve(locationSlug: "EMBA" | "LIMASSOL", grams: number): SpitMountLog {
    const current = this.getActiveSpit(locationSlug);
    const newCarved = current.carvedGrams + grams;
    const remainingKg = Math.max(0, Number((current.initialWeightKg - newCarved / 1000).toFixed(2)));

    const updated: SpitMountLog = {
      ...current,
      carvedGrams: newCarved,
      remainingWeightKg: remainingKg,
      status: remainingKg <= 0 ? "DEPLETED" : "ACTIVE",
    };

    this.activeSpits.set(locationSlug, updated);

    // If remaining is under 3kg, trigger urgency warning
    if (remainingKg <= 3.0 && remainingKg > 0) {
      eventBroker.publish("kds", {
        type: "STOCK_CHANGED",
        severity: "WARNING",
        message: `⚠️ ROTISSERIE SPIT LOW: ${remainingKg}kg remaining at ${locationSlug}! Mount replacement cone.`,
      });
    }

    return updated;
  }
}

declare global {
  var __mygd_spit_tracker: SpitTrackerService | undefined;
}

export const spitTrackerService: SpitTrackerService =
  globalThis.__mygd_spit_tracker || (globalThis.__mygd_spit_tracker = new SpitTrackerService());
