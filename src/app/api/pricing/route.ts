// POST /api/pricing — prices a till cart (promotions, voucher, staff %) without creating an order.
// The till shows this; POSService.tenderOrder recomputes it server-side for the amount charged.
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { requireRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { priceCart } from "@/lib/discounts/engine";
import { findVoucher, loadActivePromotions, voucherToInput } from "@/lib/discounts/store";

export const dynamic = "force-dynamic";

const PricingRequestSchema = z.object({
  lines: z.array(z.object({
    productId: z.string().min(1),
    sku: z.string().min(1),
    unitPrice: z.number().positive(),
    quantity: z.number().int().positive(),
  })).min(1),
  voucherCode: z.string().trim().min(1).max(40).optional(),
  discountPercent: z.number().min(0).max(100).default(0),
});

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, "STORE_STAFF");
  if (!auth.ok) return auth.response;

  try {
    const body = PricingRequestSchema.parse(await req.json());
    const products = await prisma.product.findMany({
      where: { id: { in: body.lines.map((l) => l.productId) } },
      select: { id: true, category: { select: { slug: true } } },
    });
    const sectionByProduct = new Map(products.map((p) => [p.id, p.category.slug]));
    const voucherRow = body.voucherCode ? await findVoucher(prisma, body.voucherCode) : null;

    const priced = priceCart({
      lines: body.lines.map((l) => ({ sku: l.sku, sectionSlug: sectionByProduct.get(l.productId) ?? "", unitPrice: l.unitPrice, quantity: l.quantity })),
      promotions: await loadActivePromotions(prisma),
      voucher: voucherRow ? voucherToInput(voucherRow) : undefined,
      manualPercent: body.discountPercent,
    });
    const voucherUnknown = Boolean(body.voucherCode && !voucherRow);
    return NextResponse.json({ success: true, priced, voucherUnknown });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ success: false, error: "Validation error", issues: err.issues }, { status: 400 });
    }
    console.error("[API /api/pricing] failed:", err);
    return NextResponse.json({ success: false, error: "Could not price the cart" }, { status: 500 });
  }
}
