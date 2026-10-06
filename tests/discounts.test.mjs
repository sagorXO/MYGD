// Discount engine: automatic menu promotions, vouchers and gift cards. All maths in cents.
import test from "node:test";
import assert from "node:assert/strict";

const { priceCart, validateVoucher } = await import("../src/lib/discounts/engine.ts");
const { MYGD_PROMOTIONS } = await import("../src/lib/menu/mygd-menu.ts");

const line = (sku, sectionSlug, unitPrice, quantity = 1) => ({ sku, sectionSlug, unitPrice, quantity });
const NOW = new Date("2026-10-06T12:00:00Z");
const base = { promotions: MYGD_PROMOTIONS, now: NOW };

test("no discounts: total equals subtotal", () => {
  const r = priceCart({ ...base, lines: [line("A", "wraps", 9.9, 2)] });
  assert.equal(r.subtotal, 19.8);
  assert.equal(r.discountTotal, 0);
  assert.equal(r.total, 19.8);
  assert.deepEqual(r.discounts, []);
});

test("second pizza is 20% off (cheaper of the pair)", () => {
  const r = priceCart({ ...base, lines: [line("P1", "pizza", 15.9), line("P2", "pizza", 17.5)] });
  assert.equal(r.discounts[0].code, "PIZZA-2ND-20");
  assert.equal(r.discounts[0].amount, 3.18); // 20% of 15.90
  assert.equal(r.total, 30.22);
});

test("three pizzas: only the second is discounted; four: two discounted", () => {
  const three = priceCart({ ...base, lines: [line("P1", "pizza", 15.9, 3)] });
  assert.equal(three.discountTotal, 3.18);
  const four = priceCart({ ...base, lines: [line("P1", "pizza", 15.9, 4)] });
  assert.equal(four.discountTotal, 6.36);
});

test("a single pizza gets no discount", () => {
  assert.equal(priceCart({ ...base, lines: [line("P1", "pizza", 15.9)] }).discountTotal, 0);
});

test("4 tacos for 11.90 (per group of four)", () => {
  const four = priceCart({ ...base, lines: [line("T1", "tacos", 3.5, 4)] });
  assert.equal(four.discountTotal, 2.1);
  assert.equal(four.total, 11.9);
  const mixed = priceCart({ ...base, lines: [line("T1", "tacos", 3.5, 2), line("T2", "tacos", 3.5, 2)] });
  assert.equal(mixed.total, 11.9);
  const eight = priceCart({ ...base, lines: [line("T1", "tacos", 3.5, 8)] });
  assert.equal(eight.total, 23.8);
  const three = priceCart({ ...base, lines: [line("T1", "tacos", 3.5, 3)] });
  assert.equal(three.discountTotal, 0);
});

test("bundle price never raises the price", () => {
  const cheap = [{ code: "B", name: "B", rule: { type: "BUNDLE_PRICE", sectionSlug: "tacos", quantity: 4, bundlePrice: 11.9 } }];
  const r = priceCart({ promotions: cheap, now: NOW, lines: [line("T", "tacos", 2, 4)] });
  assert.equal(r.discountTotal, 0);
});

const voucher = (over = {}) => ({
  code: "WELCOME10", kind: "PERCENT", value: 10, isActive: true,
  minSubtotal: 0, validFrom: null, validUntil: null, maxRedemptions: null, redemptions: 0, balance: null, ...over,
});

test("percent voucher applies after promotions", () => {
  const r = priceCart({ ...base, voucher: voucher(), lines: [line("T1", "tacos", 3.5, 4)] });
  assert.equal(r.discountTotal, 3.29); // 2.10 promo + 10% of 11.90 = 1.19
  assert.equal(r.voucher.amount, 1.19);
  assert.equal(r.total, 10.71);
});

test("fixed voucher is capped at the remaining total", () => {
  const r = priceCart({ ...base, voucher: voucher({ code: "FIVE", kind: "FIXED", value: 5 }), lines: [line("C", "coffee", 3)] });
  assert.equal(r.voucher.amount, 3);
  assert.equal(r.total, 0);
});

test("gift card spends its balance and reports what is left", () => {
  const r = priceCart({ ...base, voucher: voucher({ code: "GIFT", kind: "GIFT_CARD", value: 0, balance: 20 }), lines: [line("W", "wraps", 9.9)] });
  assert.equal(r.voucher.amount, 9.9);
  assert.equal(r.voucher.balanceAfter, 10.1);
  assert.equal(r.total, 0);
});

test("validateVoucher rejects unusable vouchers with a reason", () => {
  const ok = (v, subtotal = 20) => validateVoucher(v, subtotal, NOW);
  assert.equal(ok(voucher()).ok, true);
  assert.deepEqual(ok(voucher({ isActive: false })), { ok: false, reason: "INACTIVE" });
  assert.deepEqual(ok(voucher({ validFrom: "2026-11-01T00:00:00Z" })), { ok: false, reason: "NOT_YET_VALID" });
  assert.deepEqual(ok(voucher({ validUntil: "2026-10-01T00:00:00Z" })), { ok: false, reason: "EXPIRED" });
  assert.deepEqual(ok(voucher({ maxRedemptions: 5, redemptions: 5 })), { ok: false, reason: "USED_UP" });
  assert.deepEqual(ok(voucher({ minSubtotal: 25 })), { ok: false, reason: "MIN_SUBTOTAL" });
  assert.deepEqual(ok(voucher({ kind: "GIFT_CARD", balance: 0 })), { ok: false, reason: "NO_BALANCE" });
});

test("invalid voucher gives no discount and reports the reason", () => {
  const r = priceCart({ ...base, voucher: voucher({ isActive: false }), lines: [line("W", "wraps", 9.9)] });
  assert.equal(r.voucher.amount, 0);
  assert.equal(r.voucher.rejectedReason, "INACTIVE");
  assert.equal(r.total, 9.9);
});

test("staff percent discount applies last and total never goes below zero", () => {
  const r = priceCart({ ...base, manualPercent: 20, lines: [line("W", "wraps", 10)] });
  assert.equal(r.manual.amount, 2);
  assert.equal(r.total, 8);
  const over = priceCart({ ...base, manualPercent: 100, voucher: voucher({ kind: "FIXED", value: 50 }), lines: [line("W", "wraps", 10)] });
  assert.equal(over.total, 0);
  assert.ok(over.discountTotal <= over.subtotal);
});

test("promotion rules loaded from the database are validated", async () => {
  const { parsePromotionRule, normaliseVoucherCode } = await import("../src/lib/discounts/store.ts");
  assert.deepEqual(
    parsePromotionRule('{"type":"BUNDLE_PRICE","sectionSlug":"tacos","quantity":4,"bundlePrice":11.9}'),
    { type: "BUNDLE_PRICE", sectionSlug: "tacos", quantity: 4, bundlePrice: 11.9 },
  );
  assert.throws(() => parsePromotionRule('{"type":"NTH_ITEM_PERCENT","sectionSlug":"pizza","nth":2,"percent":150}'));
  assert.throws(() => parsePromotionRule('{"type":"FREE_LUNCH"}'));
  assert.equal(normaliseVoucherCode("  welcome10 "), "WELCOME10");
});
