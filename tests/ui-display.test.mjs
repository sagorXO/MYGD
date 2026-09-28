import test from "node:test";
import assert from "node:assert/strict";
import { Inbox } from "lucide-react";
import { render } from "./helpers/render.mjs";

const d = {
  ...(await import("../src/ui/display/Card.tsx")),
  ...(await import("../src/ui/display/Badge.tsx")),
  ...(await import("../src/ui/display/Banner.tsx")),
  ...(await import("../src/ui/display/EmptyState.tsx")),
  ...(await import("../src/ui/display/ErrorState.tsx")),
  ...(await import("../src/ui/display/DescriptionList.tsx")),
  ...(await import("../src/ui/display/Stat.tsx")),
  ...(await import("../src/ui/display/PriceTag.tsx")),
  ...(await import("../src/ui/display/Thumbnail.tsx")),
  ...(await import("../src/ui/display/Avatar.tsx")),
  ...(await import("../src/ui/display/ProgressBar.tsx")),
  ...(await import("../src/ui/display/Kbd.tsx")),
  ...(await import("../src/ui/display/Logo.tsx")),
};

test("Card uses surface + card shadow; interactive/selected states", () => {
  assert.match(render(d.Card, { children: "x" }), /bg-surface[^"]*shadow-card/);
  assert.match(render(d.Card, { interactive: true, children: "x" }), /hover:bg-surface-hover/);
  assert.match(render(d.Card, { selected: true, children: "x" }), /ring-accent/);
  assert.match(render(d.CardHeader, { title: "Orders", actions: "a" }), /<h2[^>]*>Orders<\/h2>/);
});

test("Badge tones use subtle backgrounds", () => {
  assert.match(render(d.Badge, { tone: "success", children: "Paid" }), /bg-success-subtle text-success/);
  assert.match(render(d.Badge, { tone: "accent", children: "New" }), /bg-accent-subtle text-accent-text/);
});

test("Banner is announced and dismissible", () => {
  assert.match(render(d.Banner, { tone: "critical", title: "Printer offline" }), /role="alert"/);
  const info = render(d.Banner, { tone: "info", title: "Heads up", onDismiss: () => {} });
  assert.match(info, /role="status"/);
  assert.match(info, /aria-label="Dismiss"/);
});

test("EmptyState and ErrorState", () => {
  assert.match(render(d.EmptyState, { icon: Inbox, title: "No orders yet" }), /No orders yet/);
  const err = render(d.ErrorState, { onRetry: () => {} });
  assert.match(err, /Something went wrong/);
  assert.match(err, /Try again/);
  assert.match(err, /role="alert"/);
  assert.doesNotMatch(render(d.ErrorState, {}), /Try again/);
});

test("DescriptionList renders dt/dd pairs", () => {
  const html = render(d.DescriptionList, { items: [{ term: "Table", description: "12" }] });
  assert.match(html, /<dt[^>]*>Table<\/dt><dd[^>]*>12<\/dd>/);
});

test("Stat shows trend colour", () => {
  assert.match(render(d.Stat, { label: "Revenue", value: "€1,200", delta: { value: "+8%", trend: "up" } }), /text-success/);
  assert.match(render(d.Stat, { label: "Waste", value: "3kg", delta: { value: "+1kg", trend: "down" } }), /text-danger/);
});

test("PriceTag formats per locale with tabular numbers", () => {
  assert.match(render(d.PriceTag, { amount: 6.5, locale: "en" }), /€6\.50/);
  assert.match(render(d.PriceTag, { amount: 6.5, locale: "de" }), /6,50\s?€/);
  assert.match(render(d.PriceTag, { amount: 6.5 }), /tabular-nums/);
  assert.match(render(d.PriceTag, { amount: 6.5, strike: true }), /<del/);
});

test("PriceTag handles negative and non-finite amounts", () => {
  assert.match(render(d.PriceTag, { amount: -2 }), /-€2\.00|−€2\.00|€-2\.00/);
  const bad = render(d.PriceTag, { amount: Number.NaN });
  assert.doesNotMatch(bad, /NaN/);
  assert.match(bad, /—/);
  assert.doesNotMatch(render(d.PriceTag, { amount: Infinity }), /∞/);
});

test("Thumbnail, Avatar, Kbd, ProgressBar, Logo", () => {
  assert.match(render(d.Thumbnail, { alt: "Döner", src: "/x.png" }), /alt="Döner"/);
  assert.match(render(d.Thumbnail, { alt: "Empty" }), /aria-label="Empty"/);
  assert.match(render(d.Avatar, { name: "Rico Meyer" }), />RM</);
  assert.equal(d.initials("   "), "?");
  assert.match(render(d.Kbd, { children: "Esc" }), /<kbd/);
  const bar = render(d.ProgressBar, { value: 140, label: "Upload" });
  assert.match(bar, /aria-valuenow="100"/);
  assert.match(bar, /role="progressbar"/);
  assert.match(render(d.ProgressBar, { value: Number.NaN, label: "x" }), /aria-valuenow="0"/);
  const logo = render(d.Logo, { size: 48 });
  assert.match(logo, /\/assets\/brand\/logo-badge\.webp/);
  assert.match(logo, /alt="My German Doener — Bite the Hype"/);
  assert.match(logo, /width="48"/);
});
