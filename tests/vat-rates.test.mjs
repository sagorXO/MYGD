import test from "node:test";
import assert from "node:assert/strict";
import { selectEffectiveRates, loadVatRates } from "../src/lib/vat-rates.ts";

const d = (iso) => new Date(iso);

// Synthetic fixture rows (not business data): shape of the VatRate table.
const rows = [
  { category: "FOOD_BEV", rate: "0.0900", validFrom: d("2026-01-01T00:00:00Z"), validTo: null },
  { category: "ALCOHOL", rate: "0.1900", validFrom: d("2026-01-01T00:00:00Z"), validTo: null },
  { category: "ZERO", rate: "0.0000", validFrom: d("2026-01-01T00:00:00Z"), validTo: null },
];

test("selectEffectiveRates returns basis points per category for the given date", () => {
  const rates = selectEffectiveRates(rows, d("2026-06-01T12:00:00Z"));
  assert.deepEqual(rates, { FOOD_BEV: 900, ALCOHOL: 1900, ZERO: 0 });
});

test("selectEffectiveRates uses the newest rate whose validFrom has passed", () => {
  const changed = [
    ...rows,
    { category: "FOOD_BEV", rate: "0.1000", validFrom: d("2027-01-01T00:00:00Z"), validTo: null },
  ];
  assert.equal(selectEffectiveRates(changed, d("2026-12-31T23:59:59Z")).FOOD_BEV, 900);
  assert.equal(selectEffectiveRates(changed, d("2027-01-01T00:00:00Z")).FOOD_BEV, 1000);
});

test("selectEffectiveRates ignores rates that expired", () => {
  const expired = [
    { category: "FOOD_BEV", rate: "0.0900", validFrom: d("2026-01-01T00:00:00Z"), validTo: d("2026-06-01T00:00:00Z") },
    { category: "ALCOHOL", rate: "0.1900", validFrom: d("2026-01-01T00:00:00Z"), validTo: null },
    { category: "ZERO", rate: "0.0000", validFrom: d("2026-01-01T00:00:00Z"), validTo: null },
  ];
  assert.throws(() => selectEffectiveRates(expired, d("2026-07-01T00:00:00Z")), /FOOD_BEV/);
});

test("selectEffectiveRates fails visibly when a category has no rate, never defaulting", () => {
  const missing = rows.filter((r) => r.category !== "ALCOHOL");
  assert.throws(() => selectEffectiveRates(missing, d("2026-06-01T00:00:00Z")), /ALCOHOL/);
});

test("selectEffectiveRates fails when the date is before every rate", () => {
  assert.throws(() => selectEffectiveRates(rows, d("2025-12-31T23:59:59Z")), /FOOD_BEV/);
});

test("selectEffectiveRates refuses a malformed rate (more than 4 decimals or out of range)", () => {
  const bad = [{ ...rows[0], rate: "0.09001" }, rows[1], rows[2]];
  assert.throws(() => selectEffectiveRates(bad, d("2026-06-01T00:00:00Z")), RangeError);
  const over = [{ ...rows[0], rate: "1.5000" }, rows[1], rows[2]];
  assert.throws(() => selectEffectiveRates(over, d("2026-06-01T00:00:00Z")), RangeError);
});

test("loadVatRates reads the table through the injected client and applies the same selection", async () => {
  let asked;
  const fakeDb = {
    vatRate: {
      findMany: async (args) => {
        asked = args;
        return rows;
      },
    },
  };
  const rates = await loadVatRates(fakeDb, d("2026-06-01T00:00:00Z"));
  assert.deepEqual(rates, { FOOD_BEV: 900, ALCOHOL: 1900, ZERO: 0 });
  assert.ok(asked, "the client must be queried");
});
