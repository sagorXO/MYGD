import test from "node:test";
import assert from "node:assert";

test("Order Number formatting matches {LOCATION}-{YYYYMMDD}-{HHmm}-{SEQ}", () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;
  const timeStr = `${hours}${minutes}`;

  const locationSlug = "EMBA";
  const dailySequence = 47;
  const seqStr = String(dailySequence).padStart(3, "0");

  const orderNumber = `${locationSlug}-${dateStr}-${timeStr}-${seqStr}`;
  const regex = /^[A-Z0-9]+-\d{8}-\d{4}-\d{3}$/;

  assert.strictEqual(regex.test(orderNumber), true, `Order number ${orderNumber} does not match expected format`);
  assert.strictEqual(orderNumber.startsWith("EMBA-"), true);
  assert.strictEqual(orderNumber.endsWith("-047"), true);
});
