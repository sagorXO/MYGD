import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseTokens } from "./helpers/tokens.mjs";

const { default: config } = await import("../tailwind.config.ts");
const tokens = parseTokens(readFileSync("src/ui/tokens.css", "utf8"));

test("every semantic Tailwind colour points at a token defined in both themes", () => {
  const semantic = Object.entries(config.theme.extend.colors).filter(([k]) => k !== "mygd");
  assert.equal(semantic.length, 26);
  for (const [key, value] of semantic) {
    const m = /^var\((--color-[\w-]+)\)$/.exec(value);
    assert.ok(m, `${key} must be var(--color-*) but is ${value}`);
    assert.ok(tokens.light[m[1]] && tokens.dark[m[1]], `${m[1]} missing in a theme`);
  }
});

test("legacy mygd.* aliases are kept so old screens do not break", () => {
  assert.equal(config.theme.extend.colors.mygd.magenta, "#E50D7E");
});

test("dark mode is driven by data-theme and modules are scanned", () => {
  assert.deepEqual(config.darkMode, ["selector", '[data-theme="dark"]']);
  assert.ok(config.content.some((g) => g.includes("src/modules")));
  assert.ok(config.content.some((g) => g.includes("src/ui")));
  assert.ok(config.content.some((g) => g.includes("src/features")));
});
