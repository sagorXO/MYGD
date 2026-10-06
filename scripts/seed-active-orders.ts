import { prisma } from "../src/lib/prisma";

async function main() {
  const location = await prisma.location.findUnique({ where: { slug: "EMBA" } });
  const terminal = await prisma.terminal.findFirst({ where: { terminalCode: "POS-01" } });
  const products = await prisma.product.findMany({ take: 10 });

  if (!location || !terminal || products.length === 0) {
    console.error("Missing location, terminal, or products");
    return;
  }

  // Clear existing orders for demo
  await prisma.kitchenTicket.deleteMany({});
  await prisma.orderItemModifier.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});

  const sampleOrders = [
    {
      orderNumber: "EMBA-042",
      dailySequence: 42,
      orderType: "DINE_IN" as const,
      orderStatus: "READY" as const,
      ticketStatus: "READY" as const,
      station: "ALL",
      subtotal: 14.50,
      totalAmount: 14.50,
      vatAmount: 1.20,
      itemsSummary: "1x Hamburg Döner (Veal, Kräuter, Garlic), 1x Fries, 1x Ayran",
      product: products[0],
    },
    {
      orderNumber: "EMBA-043",
      dailySequence: 43,
      orderType: "TAKE_AWAY" as const,
      orderStatus: "PREPARING" as const,
      ticketStatus: "IN_PREPARATION" as const,
      station: "ASSEMBLY",
      subtotal: 21.00,
      totalAmount: 21.00,
      vatAmount: 1.73,
      itemsSummary: "2x Döner Box (Chicken, Fries, Scharf), 1x Mozzarella Sticks",
      product: products[1] || products[0],
    },
    {
      orderNumber: "EMBA-044",
      dailySequence: 44,
      orderType: "DINE_IN" as const,
      orderStatus: "PREPARING" as const,
      ticketStatus: "IN_PREPARATION" as const,
      station: "GRILL",
      subtotal: 18.50,
      totalAmount: 18.50,
      vatAmount: 1.53,
      itemsSummary: "1x Döner Teller Platter (Veal, Rice, Salad, Knoblauch)",
      product: products[2] || products[0],
    },
    {
      orderNumber: "EMBA-045",
      dailySequence: 45,
      orderType: "TAKE_AWAY" as const,
      orderStatus: "PENDING" as const,
      ticketStatus: "QUEUED" as const,
      station: "ALL",
      subtotal: 9.90,
      totalAmount: 9.90,
      vatAmount: 0.82,
      itemsSummary: "1x Dürüm Falafel Wrap (Mild, Hummus, Pickles)",
      product: products[3] || products[0],
    },
  ];

  for (const item of sampleOrders) {
    const order = await prisma.order.create({
      data: {
        orderNumber: item.orderNumber,
        dailySequence: item.dailySequence,
        locationId: location.id,
        terminalId: terminal.id,
        orderType: item.orderType,
        orderStatus: item.orderStatus,
        paymentMethod: "CARD",
        paymentStatus: "CAPTURED",
        subtotal: item.subtotal,
        vatAmount: item.vatAmount,
        totalAmount: item.totalAmount,
        items: {
          create: [
            {
              productId: item.product.id,
              productName: item.product.name,
              productSku: item.product.sku,
              basePrice: item.subtotal,
              totalPrice: item.subtotal,
              quantity: 1,
              vatRate: "0.0500",
              netAmount: Number((item.subtotal - item.vatAmount).toFixed(2)),
              vatAmount: item.vatAmount,
            },
          ],
        },
      },
    });

    await prisma.kitchenTicket.create({
      data: {
        orderId: order.id,
        orderNumber: item.orderNumber,
        orderType: item.orderType,
        station: item.station,
        ticketStatus: item.ticketStatus,
        ticketData: JSON.stringify({
          orderNumber: item.orderNumber,
          type: item.orderType,
          items: [{ name: item.itemsSummary, quantity: 1 }],
        }),
      },
    });
  }

  console.log("Successfully seeded 4 demo active orders with kitchen tickets!");
}

main().finally(() => prisma.$disconnect());
