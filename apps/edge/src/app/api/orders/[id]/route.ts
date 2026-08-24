import { NextResponse } from "next/server";
import { prisma, initializeDatabasePragmas } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabasePragmas();
    const { id } = await params;

    // Search by ID or by composite order number (e.g. EMBA-20260815-1423-047)
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        location: true,
        terminal: true,
        items: {
          include: {
            modifiers: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        dailySequence: order.dailySequence,
        orderType: order.orderType,
        orderStatus: order.orderStatus,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        paymentRef: order.paymentRef,
        subtotal: order.subtotal,
        vatRate: order.vatRate,
        vatAmount: order.vatAmount,
        totalAmount: order.totalAmount,
        customerNote: order.customerNote,
        locale: order.locale,
        createdAt: order.createdAt.toISOString(),
        paidAt: order.paidAt?.toISOString() || null,
        location: {
          name: order.location.name,
          address: order.location.address,
          city: order.location.city,
          phone: order.location.phone,
        },
        terminal: {
          code: order.terminal.terminalCode,
          printerType: order.terminal.printerType,
        },
        items: order.items.map((item) => ({
          id: item.id,
          productName: item.productName,
          sku: item.productSku,
          basePrice: item.basePrice,
          quantity: item.quantity,
          spiceLevel: item.spiceLevel,
          isMealBundle: item.isMealBundle,
          mealDrinkName: item.mealDrinkName,
          mealSideName: item.mealSideName,
          totalPrice: item.totalPrice,
          modifiers: item.modifiers.map((m) => ({
            name: m.modifierName,
            group: m.groupName,
            price: m.priceAdjustment,
          })),
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
