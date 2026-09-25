// MY GERMAN DÖNER — KDS Formatter & Urgency Utility

export interface FormattedKDSItem {
  name: string;
  quantity: number;
  spiceLevel: number;
  modifiers: string[];
  isMeal: boolean;
  mealDetails?: string;
}

export interface FormattedKDSTicket {
  id: string;
  orderNumber: string;
  orderType: "DINE_IN" | "TAKE_AWAY" | "DELIVERY";
  status: "NEW" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";
  station: string;
  createdAt: string;
  elapsedSeconds: number;
  urgency: "NORMAL" | "MEDIUM" | "URGENT";
  claimedBy?: string | null;
  customerNote?: string | null;
  items: FormattedKDSItem[];
}

/**
 * Calculate urgency level based on elapsed seconds:
 * - NORMAL (Green): < 4 minutes (< 240s)
 * - MEDIUM (Amber): 4 to 8 minutes (240s – 480s)
 * - URGENT (Red): > 8 minutes (> 480s)
 */
export function getTicketUrgency(elapsedSeconds: number): "NORMAL" | "MEDIUM" | "URGENT" {
  if (elapsedSeconds >= 480) return "URGENT";
  if (elapsedSeconds >= 240) return "MEDIUM";
  return "NORMAL";
}

/**
 * Map Prisma TicketStatus to KDS display status
 */
export function mapTicketStatus(status: string): "NEW" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED" {
  switch (status) {
    case "QUEUED":
      return "NEW";
    case "IN_PREPARATION":
      return "PREPARING";
    case "READY":
      return "READY";
    case "COMPLETED":
      return "COMPLETED";
    case "VOIDED":
    case "CANCELLED":
      return "CANCELLED";
    default:
      return "NEW";
  }
}

/**
 * Format a raw database KitchenTicket with its Order and Items into a structured KDS ticket
 */
export function formatKDSTicket(ticket: any): FormattedKDSTicket {
  const createdDate = new Date(ticket.createdAt);
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - createdDate.getTime()) / 1000));
  const urgency = getTicketUrgency(elapsedSeconds);
  const status = mapTicketStatus(ticket.ticketStatus);

  const items: FormattedKDSItem[] = (ticket.order?.items || []).map((item: any) => {
    const modifierNames: string[] = (item.modifiers || []).map(
      (m: any) => m.modifierName || m.name || ""
    );

    let mealDetails: string | undefined = undefined;
    if (item.isMealBundle) {
      const parts = [item.mealSideName, item.mealDrinkName].filter(Boolean);
      mealDetails = parts.length > 0 ? parts.join(" + ") : "Meal Bundle";
    }

    return {
      name: item.productName || item.name || "Menu Item",
      quantity: item.quantity || 1,
      spiceLevel: item.spiceLevel ?? 1,
      modifiers: modifierNames,
      isMeal: Boolean(item.isMealBundle),
      mealDetails,
    };
  });

  // If items weren't joined via order.items, parse from ticketData JSON if available
  if (items.length === 0 && ticket.ticketData) {
    try {
      const parsed = typeof ticket.ticketData === "string" ? JSON.parse(ticket.ticketData) : ticket.ticketData;
      if (Array.isArray(parsed.items)) {
        parsed.items.forEach((pItem: any) => {
          items.push({
            name: pItem.name || pItem.productName || "Item",
            quantity: pItem.quantity || 1,
            spiceLevel: pItem.spiceLevel ?? 1,
            modifiers: pItem.modifiers || [],
            isMeal: Boolean(pItem.isMeal),
            mealDetails: pItem.mealDetails,
          });
        });
      }
    } catch {
      // Ignore JSON parse fallback failure
    }
  }

  return {
    id: ticket.id,
    orderNumber: ticket.orderNumber,
    orderType: ticket.orderType || "DINE_IN",
    status,
    station: ticket.station || "ALL",
    createdAt: createdDate.toISOString(),
    elapsedSeconds,
    urgency,
    claimedBy: ticket.claimedBy || null,
    customerNote: ticket.order?.customerNote || null,
    items,
  };
}
