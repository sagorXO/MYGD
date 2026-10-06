import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

// PRD P.8 "Configuration over code": a ratchet against hard-coded business values.
// Business rates live in the VatRate table; the only place allowed to spell them out
// is the reference-data seed (production reference data) and test fixtures.

const ROOT = new URL("..", import.meta.url).pathname;
const SCAN_DIRS = ["src", "prisma"];
const EXTENSIONS = [".ts", ".tsx", ".prisma"];

// Files that may contain the literals, relative to the repo root (forward slashes).
const ALLOWED = new Set(["prisma/reference-data.ts"]);

// VAT literals: 1.19 / 0.19 / 0.09 as numbers, or a vatRate assigned a numeric literal.
const FORBIDDEN = [
  { name: "VAT divisor 1.19", re: /(?<![\d.])1\.19(?!\d)/ },
  { name: "VAT rate 0.19", re: /(?<![\d.])0?\.19(?!\d)/ },
  { name: "VAT rate 0.09", re: /(?<![\d.])0?\.09(?!\d)/ },
  { name: "vatRate set to a number", re: /vatRate\s*[:=]\s*-?\d/ },
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (EXTENSIONS.some((e) => name.endsWith(e))) out.push(full);
  }
  return out;
}

test("no hard-coded VAT rates or divisors outside the reference-data seed", () => {
  const violations = [];
  for (const dir of SCAN_DIRS) {
    for (const file of walk(join(ROOT, dir))) {
      const rel = relative(ROOT, file).split(sep).join("/");
      if (ALLOWED.has(rel)) continue;
      const lines = readFileSync(file, "utf8").split("\n");
      lines.forEach((line, i) => {
        for (const rule of FORBIDDEN) {
          if (rule.re.test(line)) violations.push(`${rel}:${i + 1}  [${rule.name}]  ${line.trim().slice(0, 100)}`);
        }
      });
    }
  }
  assert.deepEqual(violations, [], `hard-coded VAT values found:\n${violations.join("\n")}`);
});
