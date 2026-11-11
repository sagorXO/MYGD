import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ui = await import("../src/ui/index.ts");

test("barrel exports the whole kit", () => {
  const expected = [
    "SurfaceRoot", "ThemeToggle", "resolveTheme", "SURFACE_DEFAULT_THEME", "Icon", "Stack", "Inline", "Grid", "Divider", "VisuallyHidden", "Spinner", "Skeleton",
    "Button", "buttonClasses", "IconButton", "ButtonGroup", "Card", "CardHeader", "CardSection", "Badge", "Banner", "EmptyState", "ErrorState",
    "DescriptionList", "Stat", "PriceTag", "Thumbnail", "Avatar", "ProgressBar", "Kbd", "Logo",
    "TextField", "Textarea", "Select", "Checkbox", "Radio", "Switch", "SearchField", "Filters",
    "Modal", "Sheet", "Tooltip", "Menu", "ToastProvider", "useToast", "Tabs", "SegmentedControl", "IndexTable",
    "Page", "Layout", "LayoutSection", "AppShell",
  ];
  for (const name of expected) assert.ok(ui[name], `missing export ${name}`);
});


test("DESIGN.md documents the new primary and both themes", () => {
  const md = readFileSync("DESIGN.md", "utf8");
  assert.match(md, /#E50C7E/);
  assert.match(md, /### Light theme/);
  assert.match(md, /### Dark theme/);
});
