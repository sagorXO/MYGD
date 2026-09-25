import test from "node:test";
import assert from "node:assert/strict";

test("WU-1: KDS API - Format kitchen ticket payload with modifiers and elapsed timer", async () => {
  const { formatKDSTicket } = await import("../src/lib/kds-formatter.js").catch(async () => {
    return await import("../src/lib/kds-formatter.ts");
  });

  const rawTicket = {
    id: "tkt-test-1",
    orderNumber: "EMBA-20260824-1430-001",
    orderType: "DINE_IN",
    station: "GRILL",
    ticketStatus: "IN_PREPARATION",
    createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(), // 4 minutes ago
    claimedBy: "Alex (Slicer)",
    order: {
      customerNote: "Extra toasted bread",
      items: [
        {
          productName: "Original German Döner (150g)",
          quantity: 2,
          spiceLevel: 4,
          isMealBundle: true,
          mealDrinkName: "Coca-Cola Zero",
          mealSideName: "Crispy Berlin Fries",
          modifiers: [
            { modifierName: "Chicken Rotisserie" },
            { modifierName: "Berlin Fladenbrot" },
            { modifierName: "Knoblauch + Kräuter" },
          ],
        },
      ],
    },
  };

  const formatted = formatKDSTicket(rawTicket);

  assert.equal(formatted.id, "tkt-test-1");
  assert.equal(formatted.orderNumber, "EMBA-20260824-1430-001");
  assert.equal(formatted.status, "PREPARING");
  assert.equal(formatted.items.length, 1);
  assert.equal(formatted.items[0].spiceLevel, 4);
  assert.equal(formatted.items[0].isMeal, true);
  assert.equal(formatted.items[0].modifiers.length, 3);
  assert.ok(formatted.elapsedSeconds >= 240, "Elapsed seconds should be >= 240");
});

test("WU-1: KDS API - Urgency color mapping: Green (<4m), Amber (4-8m), Red (>8m)", async () => {
  const { getTicketUrgency } = await import("../src/lib/kds-formatter.js").catch(async () => {
    return await import("../src/lib/kds-formatter.ts");
  });

  assert.equal(getTicketUrgency(120), "NORMAL", "2 mins should be NORMAL (Green)");
  assert.equal(getTicketUrgency(300), "MEDIUM", "5 mins should be MEDIUM (Amber)");
  assert.equal(getTicketUrgency(600), "URGENT", "10 mins should be URGENT (Red)");
});
