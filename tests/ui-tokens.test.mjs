import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { parseTokens } from "./helpers/tokens.mjs";
import { contrast } from "./helpers/contrast.mjs";

const t = parseTokens(readFileSync("src/ui/tokens.css", "utf8"));

export const SEMANTIC = [
  "canvas", "surface", "surface-raised", "surface-hover", "border", "border-subtle", "border-input",
  "text", "text-secondary", "text-subtle",
  "accent", "accent-hover", "on-accent", "accent-text", "accent-subtle",
  "success", "success-subtle", "warning", "warning-subtle", "danger", "danger-subtle",
  "info", "info-subtle", "highlight", "highlight-subtle", "focus",
];

test("primary colour is exactly #E50C7E", () => {
  assert.equal(t.root["--mygd-magenta-500"], "#E50C7E");
  assert.equal(t.light["--color-accent"], "#E50C7E");
  assert.equal(t.dark["--color-accent"], "#E50C7E");
});

test("every semantic token exists in light and dark", () => {
  for (const name of SEMANTIC) {
    assert.match(t.light[`--color-${name}`] ?? "", /^#[0-9A-F]{6}$/, `light --color-${name}`);
    assert.match(t.dark[`--color-${name}`] ?? "", /^#[0-9A-F]{6}$/, `dark --color-${name}`);
  }
});

for (const theme of ["light", "dark"]) {
  const c = (n) => t[theme][`--color-${n}`];
  const atLeast = (fg, bg, min) => {
    const r = contrast(c(fg), c(bg));
    assert.ok(r >= min, `${theme}: ${fg} on ${bg} = ${r} (< ${min})`);
  };
  test(`${theme}: body text contrast`, () => {
    for (const fg of ["text", "text-secondary"]) for (const bg of ["canvas", "surface", "surface-hover"]) atLeast(fg, bg, 4.5);
    for (const fg of ["text-subtle", "accent-text"]) for (const bg of ["canvas", "surface"]) atLeast(fg, bg, 4.5);
  });
  test(`${theme}: status text on its subtle background`, () => {
    for (const s of ["success", "warning", "danger", "info", "highlight"]) atLeast(s, `${s}-subtle`, 4.5);
    atLeast("accent-text", "accent-subtle", 4.5);
  });
  test(`${theme}: UI contrast (input border, focus, on-accent)`, () => {
    atLeast("border-input", "surface", 3);
    atLeast("focus", "surface", 3);
    atLeast("on-accent", "accent", 4.4);
    atLeast("on-accent", "accent-hover", 4.4);
  });
}

test("density tokens per surface", () => {
  const expected = {
    kiosk: ["20px", "64px"], order: ["16px", "44px"], board: ["32px", "0px"], display: ["28px", "0px"],
    pos: ["17px", "52px"], kds: ["17px", "52px"], staff: ["17px", "52px"], admin: ["14px", "32px"],
  };
  for (const [surface, [text, hit]] of Object.entries(expected)) {
    assert.equal(t.surfaces[surface]?.["--text-base"], text, `${surface} --text-base`);
    assert.equal(t.surfaces[surface]?.["--hit-min"], hit, `${surface} --hit-min`);
  }
});

function walk(dir, exts) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return walk(p, exts);
    return exts.some((e) => p.endsWith(e)) ? [p] : [];
  });
}
const HEX_ONE = /#[0-9a-fA-F]{3,8}\b/;
const HEX_ALL = /#[0-9a-fA-F]{3,8}\b/g;

test("no hex or rgb() literals inside src/ui components", () => {
  const offenders = walk("src/ui", [".ts", ".tsx"]).filter((f) => {
    const s = readFileSync(f, "utf8");
    return HEX_ONE.test(s) || /rgba?\(/.test(s);
  });
  assert.deepEqual(offenders, []);
});

test("hex literal count outside src/ui does not grow (ratchet)", () => {
  const { max } = JSON.parse(readFileSync("tests/fixtures/ui-hex-baseline.json", "utf8"));
  const count = walk("src", [".tsx"])
    .filter((f) => !f.startsWith(join("src", "ui")))
    .reduce((n, f) => n + (readFileSync(f, "utf8").match(HEX_ALL) ?? []).length, 0);
  assert.ok(count <= max, `hex literals rose to ${count} (baseline ${max}) — use tokens`);
});
