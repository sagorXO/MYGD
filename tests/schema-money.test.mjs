import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// PRD P.4 (exact decimal money) and M11.4 (VAT through a rate table), checked on the Prisma schema text.

const schema = readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");

function modelBody(name) {
  const m = schema.match(new RegExp(`^model ${name} \\{([\\s\\S]*?)^\\}`, "m"));
  assert.ok(m, `model ${name} must exist`);
  return m[1];
}
function fieldLine(model, field) {
  const line = modelBody(model)
    .split("\n")
    .find((l) => new RegExp(`^\\s*${field}\\s`).test(l));
  assert.ok(line, `${model}.${field} must exist`);
  return line;
}

const MONEY_FIELDS = [
  ["Product", "basePrice"],
  ["LocationPrice", "price"],
  ["Modifier", "priceAdjustment"],
  ["SupplierOrder", "totalEUR"],
  ["Order", "subtotal"],
  ["Order", "vatAmount"],
  ["Order", "totalAmount"],
  ["OrderItem", "basePrice"],
  ["OrderItem", "mealPriceAddon"],
  ["OrderItem", "totalPrice"],
  ["OrderItem", "netAmount"],
  ["OrderItem", "vatAmount"],
  ["OrderItemModifier", "priceAdjustment"],
];

test("money fields are exact decimals with 2 places", () => {
  for (const [model, field] of MONEY_FIELDS) {
    const line = fieldLine(model, field);
    assert.match(line, /\bDecimal\b/, `${model}.${field} must be Decimal, got: ${line.trim()}`);
    assert.match(line, /@db\.Decimal\(10,\s*2\)/, `${model}.${field} must be @db.Decimal(10, 2)`);
  }
});

test("ingredient unit cost keeps 4 decimal places (cost per gram or piece)", () => {
  assert.match(fieldLine("Ingredient", "costPerUnitEUR"), /@db\.Decimal\(10,\s*4\)/);
});

test("no Float field is named like money anywhere in the schema", () => {
  const offenders = [];
  let model = "";
  for (const line of schema.split("\n")) {
    const m = line.match(/^model (\w+) \{/);
    if (m) model = m[1];
    const f = line.match(/^\s+(\w+)\s+Float\b/);
    if (f && /price|amount|total|cost|subtotal|vat|fee|tip|discount/i.test(f[1])) {
      // amountUnits and amountGrams are quantities (recipe portions), not money
      if (!/^amount(Units|Grams)$/.test(f[1])) offenders.push(`${model}.${f[1]}`);
    }
  }
  assert.deepEqual(offenders, []);
});

test("VAT lives in a rate table, not on Location or Order", () => {
  assert.doesNotMatch(modelBody("Location"), /^\s*vatRate\s/m, "Location.vatRate must be removed");
  assert.doesNotMatch(modelBody("Order"), /^\s*vatRate\s/m, "Order.vatRate must be removed (VAT is per line)");

  const body = modelBody("VatRate");
  assert.match(body, /category\s+VatCategory/);
  assert.match(body, /rate\s+Decimal\s+@db\.Decimal\(5,\s*4\)/);
  assert.match(body, /validFrom\s+DateTime/);
  assert.match(body, /validTo\s+DateTime\?/);
  assert.match(body, /@@unique\(\[category,\s*validFrom\]\)/);
});

test("order lines record the VAT that was applied", () => {
  assert.match(fieldLine("OrderItem", "vatRate"), /@db\.Decimal\(5,\s*4\)/);
  assert.match(fieldLine("OrderItem", "vatCategory"), /VatCategory/);
});
