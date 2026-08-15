import { prisma } from "./prisma";

/**
 * Generates a unique, human-readable, auditable order number:
 * Format: {LOCATION}-{YYYYMMDD}-{HHmm}-{SEQ}
 * Example: EMBA-20260815-1423-047
 */
export async function generateUniqueOrderNumber(locationSlug: string): Promise<{
  orderNumber: string;
  dailySequence: number;
}> {
  const now = new Date();
  
  // Format Date: YYYYMMDD
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;

  // Format Time: HHmm
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const timeStr = `${hours}${minutes}`;

  // Start of today UTC
  const startOfDay = new Date(year, now.getMonth(), now.getDate(), 0, 0, 0);

  // Count orders for this location today to get the monotonic sequence
  const todayOrderCount = await prisma.order.count({
    where: {
      location: {
        slug: locationSlug.toUpperCase(),
      },
      createdAt: {
        gte: startOfDay,
      },
    },
  });

  const dailySequence = todayOrderCount + 1;
  const seqStr = String(dailySequence).padStart(3, "0");
  const cleanLocation = (locationSlug || "EMBA").toUpperCase().replace(/[^A-Z0-9]/g, "");

  const orderNumber = `${cleanLocation}-${dateStr}-${timeStr}-${seqStr}`;

  return {
    orderNumber,
    dailySequence,
  };
}
