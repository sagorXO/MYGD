import test from "node:test";
import assert from "node:assert/strict";
import { Plus } from "lucide-react";
import { render } from "./helpers/render.mjs";

const { Button, buttonClasses } = await import("../src/ui/actions/Button.tsx");
const { IconButton } = await import("../src/ui/actions/IconButton.tsx");
const { ButtonGroup } = await import("../src/ui/actions/ButtonGroup.tsx");

test("primary button uses accent tokens, bold label, type=button", () => {
  const html = render(Button, { children: "Save" });
  assert.match(html, /bg-accent/);
  assert.match(html, /text-on-accent/);
  assert.match(html, /font-semibold/);
  assert.match(html, /type="button"/);
});

test("every variant renders distinct classes", () => {
  const seen = new Set(["primary", "secondary", "tertiary", "critical", "plain"].map((variant) => buttonClasses({ variant, size: "md" })));
  assert.equal(seen.size, 5);
});

test("loading button is disabled, busy, keeps its label (and width) in the DOM", () => {
  const html = render(Button, { loading: true, children: "Pay" });
  assert.match(html, /disabled=""/);
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /role="status"/);
  assert.match(html, /invisible">Pay</);
});

test("disabled button is disabled and not busy", () => {
  const html = render(Button, { disabled: true, children: "x" });
  assert.match(html, /disabled=""/);
  assert.doesNotMatch(html, /aria-busy/);
});

test("xl size respects the surface minimum hit target", () => {
  assert.match(buttonClasses({ variant: "primary", size: "xl" }), /min-h-hit/);
});

test("IconButton always has an accessible name", () => {
  const html = render(IconButton, { icon: Plus, label: "Add item" });
  assert.match(html, /aria-label="Add item"/);
  assert.match(html, /aria-hidden="true"/);
});

test("ButtonGroup groups buttons", () => {
  assert.match(render(ButtonGroup, { children: "x" }), /role="group"/);
});
