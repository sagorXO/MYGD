import test from "node:test";
import assert from "node:assert/strict";
import { contrast } from "./helpers/contrast.mjs";
import { render } from "./helpers/render.mjs";

test("contrast: black on white is 21", () => {
  assert.equal(contrast("#000000", "#FFFFFF"), 21);
});

test("contrast: brand magenta with white is 4.48 (order independent)", () => {
  assert.equal(contrast("#FFFFFF", "#E50C7E"), 4.48);
  assert.equal(contrast("#E50C7E", "#FFFFFF"), 4.48);
});

test("contrast rejects non #RRGGBB input", () => {
  assert.throws(() => contrast("red", "#FFFFFF"), /Expected #RRGGBB/);
});

test("render: TSX component renders to static markup", async () => {
  const { Probe } = await import("./fixtures/Probe.tsx");
  assert.equal(render(Probe, { label: "Hi" }), '<span data-probe="Hi">Hi</span>');
});
