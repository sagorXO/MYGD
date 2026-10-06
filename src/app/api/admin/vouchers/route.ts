// Manager API for vouchers and gift cards: list, create, activate/deactivate.
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { requireRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { normaliseVoucherCode } from "@/lib/discounts/store";

export const dynamic = "force-dynamic";

const CODE = z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9_-]+$/, "Letters, digits, - and _ only");

const CreateVoucherSchema = z.object({
  code: CODE,
  kind: z.enum(["PERCENT", "FIXED", "GIFT_CARD"]),
  value: z.number().min(0).default(0),
  minSubtotal: z.number().min(0).default(0),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  maxRedemptions: z.number().int().positive().optional(),
  balance: z.number().positive().optional(),
  note: z.string().max(200).optional(),
}).superRefine((v, ctx) => {
  if (v.kind === "PERCENT" && (v.value <= 0 || v.value > 100)) ctx.addIssue({ code: "custom", path: ["value"], message: "Percent must be between 0 and 100" });
  if (v.kind === "FIXED" && v.value <= 0) ctx.addIssue({ code: "custom", path: ["value"], message: "Amount must be greater than 0" });
  if (v.kind === "GIFT_CARD" && v.balance === undefined) ctx.addIssue({ code: "custom", path: ["balance"], message: "Gift cards need a starting balance" });
  if (v.validFrom && v.validUntil && new Date(v.validFrom) >= new Date(v.validUntil)) ctx.addIssue({ code: "custom", path: ["validUntil"], message: "validUntil must be after validFrom" });
});

const ToggleSchema = z.object({ code: CODE, isActive: z.boolean() });

const fail = (err: unknown, label: string) => {
  if (err instanceof ZodError) {
    return NextResponse.json({ success: false, error: "Validation error", issues: err.issues }, { status: 400 });
  }
  console.error(`[API /api/admin/vouchers] ${label} failed:`, err);
  return NextResponse.json({ success: false, error: `Could not ${label}` }, { status: 500 });
};

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, "STORE_MANAGER");
  if (!auth.ok) return auth.response;
  try {
    const [vouchers, promotions] = await Promise.all([
      prisma.voucher.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
      prisma.promotion.findMany({ orderBy: { createdAt: "asc" } }),
    ]);
    return NextResponse.json({ success: true, vouchers, promotions });
  } catch (err) {
    return fail(err, "list vouchers");
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, "STORE_MANAGER");
  if (!auth.ok) return auth.response;
  try {
    const body = CreateVoucherSchema.parse(await req.json());
    const code = normaliseVoucherCode(body.code);
    if (await prisma.voucher.findUnique({ where: { code } })) {
      return NextResponse.json({ success: false, error: `Voucher ${code} already exists` }, { status: 409 });
    }
    const voucher = await prisma.voucher.create({
      data: {
        code,
        kind: body.kind,
        value: body.kind === "GIFT_CARD" ? 0 : body.value,
        minSubtotal: body.minSubtotal,
        validFrom: body.validFrom ? new Date(body.validFrom) : null,
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        maxRedemptions: body.maxRedemptions ?? null,
        balance: body.kind === "GIFT_CARD" ? body.balance ?? 0 : null,
        note: body.note ?? null,
      },
    });
    await prisma.auditLog.create({ data: { action: "VOUCHER_CREATED", details: JSON.stringify({ code, kind: body.kind }) } });
    return NextResponse.json({ success: true, voucher }, { status: 201 });
  } catch (err) {
    return fail(err, "create voucher");
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireRole(req, "STORE_MANAGER");
  if (!auth.ok) return auth.response;
  try {
    const body = ToggleSchema.parse(await req.json());
    const code = normaliseVoucherCode(body.code);
    const existing = await prisma.voucher.findUnique({ where: { code } });
    if (!existing) return NextResponse.json({ success: false, error: `Voucher ${code} not found` }, { status: 404 });
    const voucher = await prisma.voucher.update({ where: { code }, data: { isActive: body.isActive } });
    await prisma.auditLog.create({ data: { action: "VOUCHER_TOGGLED", details: JSON.stringify({ code, isActive: body.isActive }) } });
    return NextResponse.json({ success: true, voucher });
  } catch (err) {
    return fail(err, "update voucher");
  }
}
