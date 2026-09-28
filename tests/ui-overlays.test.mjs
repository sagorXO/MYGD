import test from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { render } from "./helpers/render.mjs";

const { Modal } = await import("../src/ui/overlays/Modal.tsx");
const { Sheet } = await import("../src/ui/overlays/Sheet.tsx");
const { Tooltip } = await import("../src/ui/overlays/Tooltip.tsx");
const { Menu } = await import("../src/ui/overlays/Menu.tsx");
const { ToastProvider, useToast } = await import("../src/ui/overlays/Toast.tsx");

test("closed Modal renders nothing", () => {
  assert.equal(render(Modal, { open: false, onClose: () => {}, title: "T", children: "body" }), "");
});

test("open Modal is a labelled modal dialog with a close button", () => {
  const html = render(Modal, { open: true, onClose: () => {}, title: "Edit item", children: "body", footer: "f" });
  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /aria-labelledby="([^"]+)"[\s\S]*id="\1"/);
  assert.match(html, /aria-label="Close"/);
  assert.match(html, /animate-in/);
});

test("Sheet slides from the requested side", () => {
  assert.match(render(Sheet, { open: true, onClose: () => {}, title: "Cart", side: "right", children: "x" }), /right-0/);
  assert.match(render(Sheet, { open: true, onClose: () => {}, title: "Cart", children: "x" }), /bottom-0/);
});

test("Tooltip wires aria-describedby to a tooltip", () => {
  const html = render(Tooltip, { content: "Refresh data", children: h("button", null, "R") });
  const id = /aria-describedby="([^"]+)"/.exec(html)?.[1];
  assert.ok(id);
  assert.match(html, new RegExp(`role="tooltip" id="${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
});

test("Menu trigger exposes a closed menu popup", () => {
  const html = render(Menu, { label: "More actions", items: [{ id: "a", label: "Archive", onSelect: () => {} }] });
  assert.match(html, /aria-haspopup="menu"/);
  assert.match(html, /aria-expanded="false"/);
  assert.doesNotMatch(html, /role="menu"/);
});

test("ToastProvider renders a polite live region; useToast outside it throws", () => {
  const html = renderToStaticMarkup(h(ToastProvider, null, "app"));
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /app/);
  const Orphan = () => {
    useToast();
    return null;
  };
  assert.throws(() => renderToStaticMarkup(h(Orphan)), /inside <ToastProvider>/);
});
