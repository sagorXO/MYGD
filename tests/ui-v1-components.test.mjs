import test from "node:test";
import assert from "node:assert/strict";

// The one domain component the checklists use: the PIN keypad.
const domain = await import("../src/ui/domain/index.ts");

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
