import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("no render-blocking Google Fonts @import in globals.css", () => {
  assert.doesNotMatch(readFileSync("src/app/globals.css", "utf8"), /fonts\.googleapis\.com/);
});

test("tokens are imported first in globals.css", () => {
  assert.match(readFileSync("src/app/globals.css", "utf8"), /^@import "\.\.\/ui\/tokens\.css";/);
});

test("fonts.ts declares the three font variables via next/font", () => {
  const src = readFileSync("src/ui/fonts.ts", "utf8");
  for (const v of ["--font-display", "--font-body", "--font-mono"]) assert.match(src, new RegExp(v));
  assert.match(src, /from "next\/font\/google"/);
});

test("root layout applies font variables and keeps legacy pages dark", () => {
  const src = readFileSync("src/app/layout.tsx", "utf8");
  assert.match(src, /fontVariables/);
  assert.match(src, /data-theme="dark"/);
});
