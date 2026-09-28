import test from "node:test";
import assert from "node:assert/strict";
import { render } from "./helpers/render.mjs";

const f = {
  ...(await import("../src/ui/forms/TextField.tsx")),
  ...(await import("../src/ui/forms/Textarea.tsx")),
  ...(await import("../src/ui/forms/Select.tsx")),
  ...(await import("../src/ui/forms/Checkbox.tsx")),
  ...(await import("../src/ui/forms/Radio.tsx")),
  ...(await import("../src/ui/forms/Switch.tsx")),
  ...(await import("../src/ui/forms/SearchField.tsx")),
  ...(await import("../src/ui/forms/Filters.tsx")),
};

test("TextField links label, hint and error", () => {
  const html = render(f.TextField, { id: "sku", label: "SKU", hint: "Shown on receipts", error: "Required" });
  assert.match(html, /<label[^>]*for="sku"/);
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /aria-describedby="sku-hint sku-error"/);
  assert.match(html, /id="sku-error" role="alert"/);
  assert.match(html, /border-danger/);
});

test("TextField without error is not invalid and uses the input border token", () => {
  const html = render(f.TextField, { id: "name", label: "Name" });
  assert.doesNotMatch(html, /aria-invalid/);
  assert.doesNotMatch(html, /aria-describedby/);
  assert.match(html, /border-border-input/);
});

test("hidden label stays accessible", () => {
  assert.match(render(f.TextField, { id: "q", label: "Search", labelHidden: true }), /sr-only[^>]*>Search</);
});

test("Textarea and Select render with labels", () => {
  assert.match(render(f.Textarea, { id: "note", label: "Note" }), /<textarea[^>]*id="note"/);
  const sel = render(f.Select, { id: "loc", label: "Location", placeholder: "Choose", options: [{ value: "emba", label: "Emba" }] });
  assert.match(sel, /<option value="" disabled="">Choose<\/option>/);
  assert.match(sel, /<option value="emba">Emba<\/option>/);
});

test("Checkbox, Radio, Switch", () => {
  assert.match(render(f.Checkbox, { id: "c", label: "Vegan" }), /type="checkbox"/);
  assert.match(render(f.Radio, { id: "r", name: "g", label: "Large" }), /type="radio"/);
  const sw = render(f.Switch, { id: "s", label: "Open", checked: true, onChange: () => {} });
  assert.match(sw, /role="switch"/);
  assert.match(sw, /aria-checked="true"/);
});

test("SearchField shows a clear button only when there is text", () => {
  assert.doesNotMatch(render(f.SearchField, { id: "s", value: "", onChange: () => {} }), /aria-label="Clear search"/);
  assert.match(render(f.SearchField, { id: "s", value: "kebab", onChange: () => {} }), /aria-label="Clear search"/);
});

test("Filters render removable chips and nothing when empty", () => {
  const html = render(f.Filters, { chips: [{ key: "status", label: "Status: Open" }], onRemove: () => {}, onClearAll: () => {} });
  assert.match(html, /aria-label="Remove filter Status: Open"/);
  assert.match(html, /Clear all/);
  assert.equal(render(f.Filters, { chips: [], onRemove: () => {} }), "");
});
