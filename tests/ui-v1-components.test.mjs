import test from "node:test";
import assert from "node:assert/strict";

// TDD Test Suite for MYGD Design System v1.0 Domain Components
const domain = await import("../src/ui/domain/index.ts");

test("StatusBadge exposes state-driven API without color coupling", () => {
  const { StatusBadge } = domain;
  assert.ok(StatusBadge, "StatusBadge component must exist");

  const statuses = [
    "online", "ready", "paid", "preparing", "waiting",
    "low-stock", "late", "failed", "offline", "sold-out", "available"
  ];

  for (const status of statuses) {
    const markup = StatusBadge({ status });
    assert.ok(markup, `StatusBadge should render for status '${status}'`);
    assert.ok(markup.props["data-status"] === status, `Should set data-status attribute to '${status}'`);
    assert.ok(markup.props.role === "status", "StatusBadge must have role='status' for WCAG accessibility");
  }
});

test("ProductTile exposes operational states and touch ergonomics", () => {
  const { ProductTile } = domain;
  assert.ok(ProductTile, "ProductTile component must exist");

  // Normal active product
  const activeTile = ProductTile({
    title: "Classic Döner",
    price: 7.50,
    availability: "available",
  });
  assert.ok(activeTile.props["data-availability"] === "available");
  assert.equal(activeTile.props["aria-disabled"], undefined);

  // Sold out state (55% opacity, SOLD OUT badge, disabled)
  const soldOutTile = ProductTile({
    title: "Truffle Döner",
    price: 9.90,
    availability: "sold-out",
  });
  assert.ok(soldOutTile.props["data-availability"] === "sold-out");
  assert.equal(soldOutTile.props["aria-disabled"], true);
  assert.match(soldOutTile.props.className, /opacity-55|opacity-\[0\.55\]/);

  // Low stock state
  const lowStockTile = ProductTile({
    title: "Halloumi Dürüm",
    price: 7.20,
    availability: "low-stock",
    stockCount: 4,
  });
  assert.ok(lowStockTile.props["data-availability"] === "low-stock");
});

test("NumericKeypad complies with 72px operational cell standard and input logic", () => {
  const { NumericKeypad } = domain;
  assert.ok(NumericKeypad, "NumericKeypad component must exist");

  const keypad = NumericKeypad({
    onDigit: () => {},
    onBackspace: () => {},
    onClear: () => {},
    onSubmit: () => {},
  });

  assert.ok(keypad.props["data-keypad"] === "operational");
  assert.ok(keypad.props["data-cell-min"] === "72px");
});

test("OrderTicket applies dynamic timing thresholds (0-5m normal, 5-8m warning, 8+m late)", () => {
  const { OrderTicket, resolveKdsTimingState } = domain;
  assert.ok(OrderTicket, "OrderTicket component must exist");
  assert.ok(resolveKdsTimingState, "resolveKdsTimingState helper must exist");

  assert.equal(resolveKdsTimingState(120), "normal", "2 minutes is normal");
  assert.equal(resolveKdsTimingState(360), "warning", "6 minutes is warning");
  assert.equal(resolveKdsTimingState(540), "late", "9 minutes is late");

  const ticket = OrderTicket({
    orderNumber: "147",
    channel: "takeaway",
    elapsedSeconds: 150,
    items: [
      { name: "Classic Döner", quantity: 1, modifiers: ["NO ONION"] },
      { name: "Fries", quantity: 1 }
    ],
    onBump: () => {},
  });

  assert.ok(ticket.props["data-timing-state"] === "normal");
  assert.ok(ticket.props["data-bump-target"] === "64px", "KDS action must be min 64px");
});

test("OfflineBanner renders calm local mode operating state and contractual copy", () => {
  const { OfflineBanner } = domain;
  assert.ok(OfflineBanner, "OfflineBanner component must exist");

  const banner = OfflineBanner({ mode: "local-mode" });
  assert.ok(banner.props["data-mode"] === "local-mode");
  assert.ok(banner.props.role === "status");
});

test("HACCP food safety validator and reading feedback (EC 852/2004 compliance)", () => {
  const { validateHaccpTemperature, HACCPReading } = domain;
  assert.ok(validateHaccpTemperature, "validateHaccpTemperature helper must exist");
  assert.ok(HACCPReading, "HACCPReading component must exist");

  // Cold storage (0.0°C - 5.0°C)
  assert.deepEqual(validateHaccpTemperature("cold_storage", 3.2), { pass: true, label: "Within range (0–5°C)" });
  assert.deepEqual(validateHaccpTemperature("cold_storage", 7.1), { pass: false, label: "Outside permitted range — Corrective action required" });

  // Cooked meat holding (≥ 63.0°C)
  assert.deepEqual(validateHaccpTemperature("cooked_holding", 68.5), { pass: true, label: "Within range (≥63°C)" });
  assert.deepEqual(validateHaccpTemperature("cooked_holding", 58.0), { pass: false, label: "Below holding threshold — Corrective action required" });
});

test("PrinterStatus models TCP port 9100 printer health states", () => {
  const { PrinterStatus } = domain;
  assert.ok(PrinterStatus, "PrinterStatus component must exist");

  const onlinePrinter = PrinterStatus({
    name: "Indoor Kitchen Printer",
    ipAddress: "192.168.1.77",
    port: 9100,
    status: "online",
  });
  assert.ok(onlinePrinter.props["data-status"] === "online");

  const offlinePrinter = PrinterStatus({
    name: "Outdoor Grill Printer",
    ipAddress: "192.168.1.78",
    port: 9100,
    status: "offline",
  });
  assert.ok(offlinePrinter.props["data-status"] === "offline");
});
