// MY GERMAN DÖNER — KDS Kitchen Ticket Service
import { prisma } from "@/lib/prisma";
import { eventBroker } from "@/lib/events";
import { KDSTicket, KDSStation, KDSTicketStatus, BumpTicketRequest } from "./kds.schema";
import { tcpPrintSpooler } from "../printer/tcp-spooler";
import { ThermalChitPayload } from "../printer/printer.schema";

export class KDSService {
  /**
   * Fetches active kitchen tickets filtered by location and prep station
   */
  public static async getActiveTickets(locationSlug: string = "EMBA", station: KDSStation = "ALL"): Promise<KDSTicket[]> {
    const location = await prisma.location.findUnique({
      where: { slug: locationSlug },
    });

    if (!location) return [];

    const dbTickets = await prisma.kitchenTicket.findMany({
      where: {
        order: { locationId: location.id },
        ticketStatus: {
          notIn: ["COMPLETED", "VOIDED", "CANCELLED"],
        },
      },
      include: {
        order: {
          include: {
            items: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const now = Date.now();

    return dbTickets
      .map((t) => {
        let items: any[] = [];
        try {
          items = JSON.parse(t.ticketData);
        } catch {
          items = t.order.items.map((i) => ({
            id: i.id,
            name: i.productName,
            quantity: i.quantity,
            spiceLevel: i.spiceLevel,
            notes: i.itemNotes || undefined,
          }));
        }

        const elapsedSeconds = Math.max(0, Math.floor((now - new Date(t.createdAt).getTime()) / 1000));

        let mappedStatus: KDSTicketStatus = "QUEUED";
        if (t.ticketStatus === "READY") mappedStatus = "READY";
        else if (t.ticketStatus === "IN_PREPARATION" || t.ticketStatus === "PRINTED" || t.ticketStatus === "DISPATCHED_TO_KDS") {
          mappedStatus = "PREPARING";
        }

        return {
          id: t.id,
          orderNumber: t.orderNumber,
          orderType: t.orderType as any,
          station: (t.station as KDSStation) || "ALL",
          status: mappedStatus,
          isRush: Boolean(t.claimedBy?.includes("RUSH")),
          claimedBy: t.claimedBy || undefined,
          items: items.map((itm: any) => ({
            id: itm.lineId || itm.id || `item-${Math.random()}`,
            name: itm.name || "Döner Item",
            quantity: itm.quantity || 1,
            spiceLevel: itm.spiceLevel ?? 1,
            meatWeightGrams: itm.meatWeightGrams,
            breadType: itm.breadType,
            sauces: itm.selectedSauces || [],
            additions: (itm.selectedAdditions || []).map((a: any) => (typeof a === "string" ? a : a.name)),
            omissions: itm.selectedOmissions || [],
            notes: itm.notes,
            station: itm.stationTarget || "BOTH",
          })),
          customerNote: t.order.customerNote || undefined,
          createdAt: t.createdAt.toISOString(),
          elapsedSeconds,
        };
      })
      .filter((t) => {
        if (station === "ALL") return true;
        if (station === "GRILL") return t.station === "GRILL" || t.station === "ALL";
        if (station === "ASSEMBLY") return t.station === "ASSEMBLY" || t.station === "ALL";
        return true;
      });
  }

  /**
   * Bumps a ticket status in database and publishes real-time WebSocket events
   */
  public static async bumpTicket(req: BumpTicketRequest): Promise<{ success: boolean; newStatus: string }> {
    let prismaStatus: any = "IN_PREPARATION";
    if (req.status === "READY") prismaStatus = "READY";
    else if (req.status === "COMPLETED") prismaStatus = "COMPLETED";
    else if (req.status === "QUEUED") prismaStatus = "QUEUED";

    const updated = await prisma.kitchenTicket.update({
      where: { id: req.ticketId },
      data: {
        ticketStatus: prismaStatus,
        claimedBy: req.claimedBy,
      },
      include: {
        order: true,
      },
    });

    // Also sync the order status if ready or completed
    if (req.status === "READY" || req.status === "COMPLETED") {
      await prisma.order.update({
        where: { id: updated.orderId },
        data: {
          orderStatus: req.status === "READY" ? "READY" : "COMPLETED",
          completedAt: req.status === "COMPLETED" ? new Date() : undefined,
        },
      });
    }

    // Broadcast event across KDS, Customer Display, and POS
    eventBroker.publish("kds", {
      type: "TICKET_UPDATED",
      ticketId: req.ticketId,
      orderNumber: updated.orderNumber,
      status: req.status,
      claimedBy: req.claimedBy,
    });

    eventBroker.publish("display", {
      type: "TICKET_UPDATED",
      orderNumber: updated.orderNumber,
      status: req.status,
    });

    return { success: true, newStatus: req.status };
  }

  /**
   * Triggers raw TCP ESC/POS thermal reprint over LAN Port 9100
   */
  public static async reprintThermalChit(ticketId: string): Promise<{ success: boolean; error?: string }> {
    const ticket = await prisma.kitchenTicket.findUnique({
      where: { id: ticketId },
      include: {
        order: {
          include: {
            location: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    let items: any[] = [];
    try {
      items = JSON.parse(ticket.ticketData);
    } catch {
      items = [];
    }

    const payload: ThermalChitPayload = {
      orderNumber: ticket.orderNumber,
      dailySequence: ticket.order.dailySequence,
      orderType: ticket.orderType as any,
      locationSlug: (ticket.order.location.slug as any) || "EMBA",
      createdAt: ticket.createdAt.toISOString(),
      customerNote: ticket.order.customerNote || undefined,
      items: items.map((l: any) => ({
        name: l.name,
        quantity: l.quantity || 1,
        spiceLevel: l.spiceLevel,
        breadType: l.breadType,
        additions: (l.selectedAdditions || []).map((a: any) => (typeof a === "string" ? a : a.name)),
        omissions: l.selectedOmissions || [],
        sauces: l.selectedSauces || [],
        notes: l.notes,
        stationTarget: "BOTH",
      })),
    };

    const res = await tcpPrintSpooler.dispatchDualStationPrint(payload);
    return {
      success: res.indoorResult.success || res.grillResult.success,
      error: res.indoorResult.error || res.grillResult.error,
    };
  }
}
