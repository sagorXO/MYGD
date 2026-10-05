import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement as h } from "react";
import { LayoutDashboard, Plus } from "lucide-react";
import { render } from "./helpers/render.mjs";

const stack = await import("../src/ui/overlays/dialogStack.ts");

test("F1: only the top dialog handles keys; closed dialogs leave the stack", () => {
  const a = Symbol("a"), b = Symbol("b");
  stack.pushDialog(a);
  stack.pushDialog(b);
  assert.equal(stack.shouldHandleKey({ defaultPrevented: false }, a), false);
  assert.equal(stack.shouldHandleKey({ defaultPrevented: false }, b), true);
  stack.popDialog(b);
  assert.equal(stack.shouldHandleKey({ defaultPrevented: false }, a), true);
  stack.popDialog(a);
});

test("F2: a key already handled by a nested menu/tooltip is ignored by the dialog", () => {
  const a = Symbol("a");
  stack.pushDialog(a);
  assert.equal(stack.shouldHandleKey({ defaultPrevented: true }, a), false);
  stack.popDialog(a);
});

test("F1: scroll lock is reference-counted and restores the original value", () => {
  const style = { overflow: "auto" };
  stack.lockScroll(style);
  stack.lockScroll(style);
  stack.unlockScroll(style);
  assert.equal(style.overflow, "hidden");
  stack.unlockScroll(style);
  assert.equal(style.overflow, "auto");
  stack.unlockScroll(style);
  assert.equal(style.overflow, "auto");
});

test("F2: Menu and Tooltip mark Escape as handled", () => {
  for (const f of ["src/ui/overlays/Menu.tsx", "src/ui/overlays/Tooltip.tsx"]) {
    assert.match(readFileSync(f, "utf8"), /Escape"[\s\S]{0,120}preventDefault\(\)/, f);
  }
});

test("F3: every button size and icon button meets the surface hit minimum", async () => {
  const { buttonClasses } = await import("../src/ui/actions/Button.tsx");
  const { IconButton } = await import("../src/ui/actions/IconButton.tsx");
  for (const size of ["sm", "md", "lg", "xl"]) assert.match(buttonClasses({ variant: "primary", size }), /min-h-hit/, size);
  assert.match(render(IconButton, { icon: Plus, label: "Add", size: "sm" }), /min-w-hit/);
});

test("F3: choice controls, switch and small dismiss/remove buttons meet the hit minimum", async () => {
  const { Checkbox } = await import("../src/ui/forms/Checkbox.tsx");
  const { Switch } = await import("../src/ui/forms/Switch.tsx");
  const { Filters } = await import("../src/ui/forms/Filters.tsx");
  const { Banner } = await import("../src/ui/display/Banner.tsx");
  assert.match(render(Checkbox, { id: "c", label: "Vegan" }), /min-h-hit/);
  assert.match(render(Switch, { id: "s", label: "Open", checked: false, onChange: () => {} }), /min-h-hit/);
  assert.match(render(Filters, { chips: [{ key: "k", label: "K" }], onRemove: () => {} }), /aria-label="Remove filter K"[^>]*min-(h|w)-hit|min-(h|w)-hit[^>]*aria-label="Remove filter K"/);
  assert.match(render(Banner, { title: "x", onDismiss: () => {} }), /min-(h|w)-hit[^>]*aria-label="Dismiss"|aria-label="Dismiss"[^>]*min-(h|w)-hit/);
  assert.match(readFileSync("src/ui/overlays/Toast.tsx", "utf8"), /Dismiss notification"[\s\S]{0,200}min-h-hit/);
});

test("F4: AppShell offers navigation below md", async () => {
  const { AppShell } = await import("../src/ui/layout/AppShell.tsx");
  const html = render(AppShell, { surface: "admin", nav: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }], children: "c" });
  assert.match(html, /aria-label="Open navigation"/);
  assert.match(html, /md:hidden/);
});

test("F5: clickable IndexTable rows are keyboard reachable", async () => {
  const { IndexTable } = await import("../src/ui/data/IndexTable.tsx");
  const html = render(IndexTable, { label: "Orders", rows: [{ id: "o1" }], rowKey: (r) => r.id, columns: [{ id: "id", header: "Order", cell: (r) => r.id }], onRowClick: () => {} });
  assert.match(html, /<tr[^>]*tabindex="0"/);
  const plain = render(IndexTable, { label: "Orders", rows: [{ id: "o1" }], rowKey: (r) => r.id, columns: [{ id: "id", header: "Order", cell: (r) => r.id }] });
  assert.doesNotMatch(plain, /<tr[^>]*tabindex="0"/);
});

test("F6: legacy Figtree weights 300/900 and italics are still loaded", () => {
  const src = readFileSync("src/ui/fonts.ts", "utf8");
  assert.match(src, /Figtree\(\{[^}]*"300"[^}]*"900"/);
  assert.match(src, /Figtree\(\{[^}]*style: \["normal", "italic"\]/);
});
