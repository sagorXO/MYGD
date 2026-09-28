import test from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { LayoutDashboard } from "lucide-react";
import { render } from "./helpers/render.mjs";

const { Page } = await import("../src/ui/layout/Page.tsx");
const { Layout, LayoutSection } = await import("../src/ui/layout/Layout.tsx");
const { AppShell } = await import("../src/ui/layout/AppShell.tsx");

test("Page renders a single h1, back link and actions", () => {
  const html = render(Page, { title: "Suppliers", backHref: "/admin", primaryAction: "Add", children: "body" });
  assert.equal((html.match(/<h1/g) ?? []).length, 1);
  assert.match(html, /href="\/admin"/);
  assert.match(html, /aria-label="Back"/);
  assert.match(html, /Add/);
});

test("Layout splits main and aside", () => {
  const html = render(Layout, { children: [h(LayoutSection, { key: "m", children: "a" }), h(LayoutSection, { key: "s", variant: "aside", children: "b" })] });
  assert.match(html, /lg:grid-cols-3/);
  assert.match(html, /lg:col-span-2/);
  assert.match(html, /lg:col-span-1/);
});

test("AppShell: skip link, nav with current page, theme toggle, logo, main landmark", () => {
  const html = render(AppShell, {
    surface: "admin",
    nav: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, active: true }],
    children: "content",
  });
  assert.match(html, /href="#main"[^>]*>Skip to content/);
  assert.match(html, /aria-current="page"/);
  assert.match(html, /role="radiogroup"/);
  assert.match(html, /logo-badge\.webp/);
  assert.match(html, /<main id="main"/);
});

test("AppShell fullBleed has no chrome", () => {
  const html = render(AppShell, { surface: "kiosk", fullBleed: true, children: "k" });
  assert.doesNotMatch(html, /<nav/);
  assert.doesNotMatch(html, /<header/);
  assert.match(html, /<main id="main"/);
});
