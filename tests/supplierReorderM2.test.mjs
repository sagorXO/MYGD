import test from "node:test";
import assert from "node:assert/strict";

test("Module M2 - WhatsApp Click-to-Chat URL Encoding", () => {
  const phone = "+357 99 112233";
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const message = "MY GERMAN DÖNER - Purchase Order";
  const url = "https://wa.me/" + cleanPhone + "?text=" + encodeURIComponent(message);

  assert.equal(cleanPhone, "35799112233");
  assert.ok(url.startsWith("https://wa.me/35799112233?text="));
  assert.ok(url.includes("MY%20GERMAN%20D%C3%96NER"));
});

test("Module M2 - 15:30 Predictive Bakery Runout Alert", () => {
  function evaluateBakery(stock, avgEvening = 180) {
    const remaining = stock - avgEvening;
    if (remaining < 40) {
      const deficit = 40 - remaining;
      const orderCrates = Math.ceil(deficit / 20) * 20;
      return { alert: true, orderCrates };
    }
    return { alert: false, orderCrates: 0 };
  }

  const alertCase = evaluateBakery(90, 180); // 90 - 180 = -90 -> deficit 130 -> order 140
  assert.equal(alertCase.alert, true);
  assert.equal(alertCase.orderCrates, 140);

  const safeCase = evaluateBakery(250, 180); // 250 - 180 = 70 > 40
  assert.equal(safeCase.alert, false);
  assert.equal(safeCase.orderCrates, 0);
});
