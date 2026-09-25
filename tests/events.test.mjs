import test from "node:test";
import assert from "node:assert/strict";

// Test suite for WU-1: Real-Time Event Dispatcher and Channel Hub
test("WU-1: Real-Time Event Broker - Register listener and receive dispatched event", async () => {
  // Dynamic import of the event broker to be implemented
  const { eventBroker } = await import("../src/lib/events.js").catch(async () => {
    return await import("../src/lib/events.ts");
  });

  let receivedEvent = null;
  const unsubscribe = eventBroker.subscribe("kds", (event) => {
    receivedEvent = event;
  });

  const payload = {
    type: "ORDER_CREATED",
    ticketId: "tkt-001",
    orderNumber: "EMBA-20260824-1430-001",
    station: "GRILL",
    timestamp: new Date().toISOString(),
  };

  eventBroker.publish("kds", payload);

  assert.ok(receivedEvent, "Event should be received by subscriber");
  assert.equal(receivedEvent.type, "ORDER_CREATED");
  assert.equal(receivedEvent.orderNumber, "EMBA-20260824-1430-001");

  // Cleanup
  unsubscribe();
});

test("WU-1: Real-Time Event Broker - Channel isolation", async () => {
  const { eventBroker } = await import("../src/lib/events.js").catch(async () => {
    return await import("../src/lib/events.ts");
  });

  let kdsReceived = false;
  let boardsReceived = false;

  const unsubKds = eventBroker.subscribe("kds", () => {
    kdsReceived = true;
  });
  const unsubBoards = eventBroker.subscribe("boards", () => {
    boardsReceived = true;
  });

  eventBroker.publish("kds", { type: "TICKET_UPDATED", ticketId: "tkt-123", status: "READY" });

  assert.equal(kdsReceived, true, "KDS channel should receive KDS event");
  assert.equal(boardsReceived, false, "Boards channel should NOT receive KDS event");

  unsubKds();
  unsubBoards();
});

test("WU-1: Real-Time Event Broker - SSE Formatter outputs valid text/event-stream format", async () => {
  const { formatSSEMessage } = await import("../src/lib/events.js").catch(async () => {
    return await import("../src/lib/events.ts");
  });

  const formatted = formatSSEMessage("TICKET_UPDATED", {
    ticketId: "tkt-999",
    status: "COMPLETED",
  });

  assert.ok(formatted.startsWith("event: TICKET_UPDATED\n"), "Should have event line");
  assert.ok(formatted.includes('data: {"ticketId":"tkt-999","status":"COMPLETED"}\n\n'), "Should have data line ending with double newline");
});

test("WU-1: Real-Time Event Broker - High-throughput dispatch latency under 15ms", async () => {
  const { eventBroker } = await import("../src/lib/events.js").catch(async () => {
    return await import("../src/lib/events.ts");
  });

  let counter = 0;
  const unsub = eventBroker.subscribe("benchmark", () => {
    counter++;
  });

  const startTime = performance.now();
  for (let i = 0; i < 1000; i++) {
    eventBroker.publish("benchmark", { type: "PING", seq: i });
  }
  const elapsed = performance.now() - startTime;

  assert.equal(counter, 1000, "All 1,000 events must be processed");
  assert.ok(elapsed < 15, `1,000 dispatches must take < 15ms (took ${elapsed.toFixed(2)}ms)`);

  unsub();
});
