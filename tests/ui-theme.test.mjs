import test from "node:test";
import assert from "node:assert/strict";
import { render } from "./helpers/render.mjs";

const theme = await import("../src/ui/theme/theme.ts");
const { themeBootScript } = await import("../src/ui/theme/bootScript.ts");

test("surface defaults match the spec", () => {
  assert.deepEqual(theme.SURFACE_DEFAULT_THEME, {
    kiosk: "dark", board: "dark", display: "dark", kds: "dark",
    pos: "light", staff: "light", admin: "light", order: "system",
  });
});

test("storage key is per surface", () => {
  assert.equal(theme.storageKey("admin"), "mygd.theme.admin");
});

test("parsePreference rejects garbage", () => {
  assert.equal(theme.parsePreference("dark"), "dark");
  assert.equal(theme.parsePreference("blue"), null);
  assert.equal(theme.parsePreference(null), null);
  assert.equal(theme.parsePreference(1), null);
});

test("readStoredTheme survives a throwing or missing storage", () => {
  const throwing = { getItem() { throw new Error("SecurityError"); } };
  assert.equal(theme.readStoredTheme(throwing, "kiosk"), null);
  assert.equal(theme.readStoredTheme(undefined, "kiosk"), null);
  assert.equal(theme.readStoredTheme(null, "kiosk"), null);
  assert.equal(theme.readStoredTheme({ getItem: () => "light" }, "kiosk"), "light");
  assert.equal(theme.readStoredTheme({ getItem: () => "blue" }, "kiosk"), null);
});

test("resolveTheme handles system", () => {
  assert.equal(theme.resolveTheme("system", true), "dark");
  assert.equal(theme.resolveTheme("system", false), "light");
  assert.equal(theme.resolveTheme("light", true), "light");
});

test("initialTheme is deterministic on the server", () => {
  assert.equal(theme.initialTheme("kiosk"), "dark");
  assert.equal(theme.initialTheme("admin"), "light");
  assert.equal(theme.initialTheme("order"), "light");
});

function runBoot(surface, { stored = null, throws = false, prefersDark = false }) {
  const parent = { dataset: { theme: theme.initialTheme(surface) } };
  const localStorage = throws
    ? { getItem() { throw new Error("blocked"); } }
    : { getItem: (k) => (k === theme.storageKey(surface) ? stored : null) };
  const document = { currentScript: { parentElement: parent } };
  const matchMedia = () => ({ matches: prefersDark });
  new Function("document", "localStorage", "matchMedia", themeBootScript(surface))(document, localStorage, matchMedia);
  return parent.dataset.theme;
}

test("boot script applies stored preference before paint", () => {
  assert.equal(runBoot("kiosk", { stored: "light" }), "light");
  assert.equal(runBoot("admin", { stored: "system", prefersDark: true }), "dark");
  assert.equal(runBoot("order", { prefersDark: true }), "dark");
});

test("boot script falls back to default when storage throws or holds garbage", () => {
  assert.equal(runBoot("kiosk", { throws: true }), "dark");
  assert.equal(runBoot("admin", { stored: "blue" }), "light");
});

test("SurfaceRoot renders data attributes and the boot script", async () => {
  const { SurfaceRoot } = await import("../src/ui/theme/SurfaceRoot.tsx");
  const html = render(SurfaceRoot, { surface: "kiosk", children: "x" });
  assert.match(html, /data-surface="kiosk"/);
  assert.match(html, /data-theme="dark"/);
  assert.match(html, /<script>/);
});

test("ThemeToggle renders three labelled radios", async () => {
  const { ThemeToggle } = await import("../src/ui/theme/ThemeToggle.tsx");
  const html = render(ThemeToggle, { surface: "admin" });
  for (const label of ["Light theme", "Dark theme", "System theme"]) assert.match(html, new RegExp(`aria-label="${label}"`));
  assert.match(html, /role="radiogroup"/);
  assert.equal((html.match(/aria-checked="true"/g) ?? []).length, 1);
});
