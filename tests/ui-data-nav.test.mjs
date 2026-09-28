import test from "node:test";
import assert from "node:assert/strict";
import { render } from "./helpers/render.mjs";

const { Tabs } = await import("../src/ui/navigation/Tabs.tsx");
const { SegmentedControl } = await import("../src/ui/navigation/SegmentedControl.tsx");
const { IndexTable } = await import("../src/ui/data/IndexTable.tsx");

const rows = [{ id: "o1", total: 12.5 }, { id: "o2", total: 8 }];
const columns = [
  { id: "id", header: "Order", cell: (r) => r.id, sortable: true },
  { id: "total", header: "Total", cell: (r) => `€${r.total}`, align: "end" },
];

test("Tabs: roving tabindex and selection", () => {
  const html = render(Tabs, { label: "Order status", tabs: [{ id: "open", label: "Open" }, { id: "done", label: "Done" }], selected: "done", onSelect: () => {} });
  assert.match(html, /role="tablist"/);
  assert.match(html, /id="tab-done" type="button" role="tab" aria-selected="true" aria-controls="tabpanel-done" tabindex="0"/);
  assert.match(html, /id="tab-open" type="button" role="tab" aria-selected="false" aria-controls="tabpanel-open" tabindex="-1"/);
});

test("SegmentedControl is a radiogroup", () => {
  const html = render(SegmentedControl, { label: "Size", options: [{ value: "s", label: "S" }, { value: "l", label: "L" }], value: "l", onChange: () => {} });
  assert.match(html, /role="radiogroup"/);
  assert.match(html, /aria-checked="true"[^>]*>L</);
});

test("IndexTable renders header, rows and right-aligned numbers", () => {
  const html = render(IndexTable, { label: "Orders", rows, columns, rowKey: (r) => r.id });
  assert.match(html, /<table[^>]*aria-label="Orders"/);
  assert.equal((html.match(/<tr/g) ?? []).length, 3);
  assert.match(html, /text-right tabular-nums">€12.5/);
});

test("IndexTable sortable header exposes aria-sort", () => {
  const html = render(IndexTable, { label: "Orders", rows, columns, rowKey: (r) => r.id, sort: { columnId: "id", direction: "asc" }, onSortChange: () => {} });
  assert.match(html, /aria-sort="ascending"/);
});

test("IndexTable selection shows bulk action bar", () => {
  const html = render(IndexTable, { label: "Orders", rows, columns, rowKey: (r) => r.id, selectable: true, selected: new Set(["o1"]), onSelectionChange: () => {}, bulkActions: "Archive" });
  assert.match(html, /1 selected/);
  assert.match(html, /aria-label="Select all"/);
  assert.match(html, /<input[^>]*aria-label="Select row o1"[^>]*checked=""/);
  assert.doesNotMatch(html, /<input[^>]*aria-label="Select row o2"[^>]*checked=""/);
});

test("IndexTable loading and empty states", () => {
  assert.match(render(IndexTable, { label: "Orders", rows: [], columns, rowKey: (r) => r.id, loading: true }), /aria-busy="true"/);
  assert.match(render(IndexTable, { label: "Orders", rows: [], columns, rowKey: (r) => r.id, empty: "No orders" }), /No orders/);
});
