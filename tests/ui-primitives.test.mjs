import test from "node:test";
import assert from "node:assert/strict";
import { Star } from "lucide-react";
import { render } from "./helpers/render.mjs";

const { Icon } = await import("../src/ui/primitives/Icon.tsx");
const { Stack, Inline, Grid } = await import("../src/ui/primitives/Stack.tsx");
const { Divider } = await import("../src/ui/primitives/Divider.tsx");
const { VisuallyHidden } = await import("../src/ui/primitives/VisuallyHidden.tsx");
const { Spinner } = await import("../src/ui/primitives/Spinner.tsx");
const { Skeleton } = await import("../src/ui/primitives/Skeleton.tsx");

test("Icon is decorative by default and labelled when asked", () => {
  assert.match(render(Icon, { icon: Star }), /aria-hidden="true"/);
  const labelled = render(Icon, { icon: Star, label: "Favourite", size: 24 });
  assert.match(labelled, /aria-label="Favourite"/);
  assert.match(labelled, /role="img"/);
  assert.match(labelled, /width="24"/);
});

test("Stack/Inline/Grid map props to classes", () => {
  assert.match(render(Stack, { gap: 4, children: "a" }), /flex flex-col gap-4/);
  assert.match(render(Inline, { gap: 2, justify: "between", wrap: true, children: "a" }), /justify-between[^"]*flex-wrap/);
  assert.match(render(Grid, { columns: 3, children: "a" }), /md:grid-cols-3/);
  assert.match(render(Stack, { as: "ul", children: "a" }), /^<ul/);
});

test("Divider is a separator", () => {
  assert.match(render(Divider), /role="separator"/);
});

test("VisuallyHidden keeps text for screen readers", () => {
  assert.match(render(VisuallyHidden, { children: "Hidden" }), /class="sr-only">Hidden</);
});

test("Spinner announces status", () => {
  const html = render(Spinner, { label: "Saving" });
  assert.match(html, /role="status"/);
  assert.match(html, /Saving/);
  assert.match(html, /motion-reduce:animate-none/);
});

test("Skeleton renders requested lines, hidden from AT, clamps bad input", () => {
  const html = render(Skeleton, { variant: "text", lines: 3 });
  assert.equal((html.match(/data-skeleton-line/g) ?? []).length, 3);
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /motion-safe:animate-pulse/);
  assert.equal((render(Skeleton, { lines: 0 }).match(/data-skeleton-line/g) ?? []).length, 1);
});
