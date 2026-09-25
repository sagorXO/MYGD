// MY GERMAN DÖNER — Kitchen Display System (KDS) API Route
// GET: Fetch live tickets from Prisma DB
// PATCH: Bump / claim / update ticket status and broadcast via SSE

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { eventBroker } from "@/lib/events";
import { formatKDSTicket } from "@/lib/kds-formatter";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const locationSlug = url.searchParams.get("location") || "EMBA";
    const station = url.searchParams.get("station") || "ALL";

    // Find location ID
    const location = await prisma.location.findUnique({
      where: { slug: locationSlug },
    });

    const whereClause: any = {
      ticketStatus: {
        in: ["QUEUED", "IN_PREPARATION", "READY"],
      },
    };

    if (location) {
      whereClause.order = { locationId: location.id };
    }

    if (station !== "ALL") {
      whereClause.station = { in: [station, "ALL"] };
    }

    const tickets = await prisma.kitchenTicket.findMany({
      where: whereClause,
      include: {
        order: {
          include: {
            items: {
              include: {
                modifiers: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const formattedTickets = tickets.map(formatKDSTicket);

    return NextResponse.json({
      success: true,
      tickets: formattedTickets,
      count: formattedTickets.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[KDS GET Error]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch KDS tickets" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { ticketId, status, claimedBy } = body;

    if (!ticketId || !status) {
      return NextResponse.json(
        { success: false, error: "ticketId and status are required" },
        { status: 400 }
      );
    }

    // Map KDS frontend status to Prisma TicketStatus enum
    let dbStatus: "QUEUED" | "IN_PREPARATION" | "READY" | "COMPLETED" | "VOIDED" = "QUEUED";
    switch (status) {
      case "NEW":
      case "QUEUED":
        dbStatus = "QUEUED";
        break;
      case "PREPARING":
      case "IN_PREPARATION":
        dbStatus = "IN_PREPARATION";
        break;
      case "READY":
        dbStatus = "READY";
        break;
      case "COMPLETED":
        dbStatus = "COMPLETED";
        break;
      case "CANCELLED":
      case "VOIDED":
        dbStatus = "VOIDED";
        break;
      default:
        dbStatus = "QUEUED";
    }

    const updateData: any = {
      ticketStatus: dbStatus,
      updatedAt: new Date(),
    };

    if (claimedBy !== undefined) {
      updateData.claimedBy = claimedBy;
    }

    const updatedTicket = await prisma.kitchenTicket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        order: {
          include: {
            items: {
              include: {
                modifiers: true,
              },
            },
          },
        },
      },
    });

    const formatted = formatKDSTicket(updatedTicket);

    // 1. Broadcast to KDS screens
    eventBroker.publish("kds", {
      type: "TICKET_UPDATED",
      ticket: formatted,
      ticketId,
      status: formatted.status,
      orderNumber: formatted.orderNumber,
    });

    // 2. Broadcast to Customer Display screens
    eventBroker.publish("display", {
      type: "TICKET_UPDATED",
      orderNumber: formatted.orderNumber,
      status: formatted.status,
      shortNumber: formatted.orderNumber.split("-").pop() || formatted.orderNumber,
    });

    return NextResponse.json({
      success: true,
      ticket: formatted,
    });
  } catch (err: any) {
    console.error("[KDS PATCH Error]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update ticket" },
      { status: 500 }
    );
  }
}
