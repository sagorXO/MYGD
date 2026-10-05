# MYGD UI Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the shared design foundation (tokens for light + dark, surface density, theme switching, self-hosted fonts, a Shopify-grade component kit in `src/ui/`, and a `/dev/ui` gallery) without changing how existing screens look.

**Architecture:** One CSS token file (`src/ui/tokens.css`) defines primitives, semantic tokens per theme and density per surface. Tailwind maps only to semantic CSS variables, so components never need `dark:` classes. A server `SurfaceRoot` wrapper sets `data-surface` + `data-theme` (with an inline no-flash script); components are small typed files in `src/ui/`, tested by server-rendering them in `node:test`.

**Tech Stack:** Next.js 15.2 (App Router), React 19, TypeScript 5.7 strict, Tailwind 3.4, `clsx` + `tailwind-merge` (`@/lib/cn`), `lucide-react`, `next/font/google`, `node:test` via `tsx`, `playwright` 1.62 (library).

**Spec:** `docs/superpowers/specs/2026-09-28-ui-foundation-design.md` (v2)

## Global Constraints

- Primary colour is exactly `#E50C7E` (`--mygd-magenta-500`).
- No `@shopify/*` package, icon or copied asset. Icons: `lucide-react` only.
- Zero hex / `rgb(` literals in `src/ui/**/*.ts(x)`; hex literals in `src/**/*.tsx` outside `src/ui` may never exceed the recorded baseline.
- Components use semantic Tailwind colours only (`bg-surface`, `text-text`, `bg-accent` …); no `dark:` classes; no opacity modifiers on semantic colours (`bg-accent/10` does not work with CSS variables — use the `-subtle` tokens). Arbitrary values may reference tokens (`bg-[var(--brand-black)]`), never literals.
- TypeScript strict, zero `any`, every component accepts `className`.
- Only stateful components carry `"use client"`.
- Presentation-only: do not modify stores, API routes, `src/lib/*` business logic, Prisma.
- Existing screens must look unchanged (legacy `mygd.*` Tailwind keys and legacy CSS classes stay).
- Themes: `light | dark | system`; storage key `mygd.theme.<surface>`; surface defaults: kiosk/board/display/kds = dark, pos/staff/admin = light, order = system.
- Density (base font / min hit): kiosk 20/64, order 16/44, board 32/0, display 28/0, pos·kds·staff 17/52, admin 14/32 (px); text selection on for admin + order.
- WCAG: text, secondary, subtle, accent-text ≥ 4.5:1 on canvas and surface; text + secondary also on hover; status text ≥ 4.5:1 on its subtle bg; input border + focus ≥ 3:1 on surface; white on accent ≥ 4.4:1 and labels on accent are `font-semibold`.
- Tests run with `tsx --tsconfig tsconfig.test.json` on the Mac (node_modules are darwin-only).

## Review Focus

1. **Broken or blocked `localStorage`** (private mode, kiosk lockdown) → theme falls back to the surface default without throwing. Pinned in Task 5 (`readStoredTheme` + boot-script tests with a throwing storage).
2. **Garbage stored theme value** (e.g. `"blue"` from an old build) → treated as unset. Pinned in Task 5.
3. **Button in `loading` state** → must be `disabled`, `aria-busy`, keep its width and its label in the DOM. Pinned in Task 7.
4. **`IconButton` without an accessible name** → `label` is a required prop and renders `aria-label`. Pinned in Task 7.
5. **`PriceTag` with a negative or non-finite amount** (refund lines, bad data) → negative shows a minus sign; `NaN`/`Infinity` renders an em dash, never "€NaN". Pinned in Task 8.

---

## File structure

| File | Responsibility |
|---|---|
| `tsconfig.test.json` | test-only TS config (`jsx: react-jsx`) so node tests can render `.tsx` (default `jsx: preserve` throws `ReferenceError` — verified 2026-09-28) |
| `tests/helpers/contrast.mjs` | WCAG contrast maths |
| `tests/helpers/tokens.mjs` | parse `tokens.css` into resolved maps |
| `tests/helpers/render.mjs` | `render(Component, props)` → static HTML |
| `tests/fixtures/ui-hex-baseline.json` | recorded hex count outside `src/ui` |
| `src/ui/tokens.css` | primitives, semantic tokens ×2 themes, density, motion, pop-in animation |
| `src/ui/fonts.ts` | `next/font` instances → `fontVariables` |
| `src/ui/theme/theme.ts` | pure theme types and functions |
| `src/ui/theme/bootScript.ts` | inline no-flash script source |
| `src/ui/theme/SurfaceRoot.tsx` | wrapper with `data-surface`/`data-theme` + boot script |
| `src/ui/theme/ThemeToggle.tsx` | client toggle (light / dark / system) |
| `src/ui/primitives/*.tsx` | Icon, Stack/Inline/Grid, Divider, VisuallyHidden, Spinner, Skeleton |
| `src/ui/actions/*.tsx` | Button, IconButton, ButtonGroup |
| `src/ui/display/*.tsx` | Card, Badge, Banner, EmptyState, ErrorState, DescriptionList, Stat, PriceTag, Thumbnail, Avatar, ProgressBar, Kbd, Logo |
| `src/ui/forms/*.tsx` | Field, TextField, Textarea, Select, Checkbox, Radio, Switch, SearchField, Filters |
| `src/ui/overlays/*` | useDialog, Modal, Sheet, Tooltip, Menu, Toast |
| `src/ui/navigation/*.tsx` | Tabs, SegmentedControl |
| `src/ui/data/IndexTable.tsx` | index table |
| `src/ui/layout/*.tsx` | Page, Layout, AppShell |
| `src/ui/index.ts` | barrel |
| `src/app/dev/ui/*` | gallery |
| `scripts/ui-gallery-smoke.mjs` | Playwright smoke + screenshots |

---

### Task 1: Test harness for rendering TSX + contrast helper

**Files:**
- Create: `tsconfig.test.json`, `tests/helpers/contrast.mjs`, `tests/helpers/render.mjs`, `tests/fixtures/Probe.tsx`, `tests/ui-harness.test.mjs`
- Modify: `package.json` (scripts `test`, `test:all`)

**Interfaces:**
- Produces: `contrast(fgHex: string, bgHex: string): number` (ratio rounded to 2 decimals); `luminance(hex: string): number`; `render(Component, props?): string`.

- [ ] **Step 1: Write the failing test** — `tests/ui-harness.test.mjs`

```js
import test from "node:test";
import assert from "node:assert/strict";
import { contrast } from "./helpers/contrast.mjs";
import { render } from "./helpers/render.mjs";

test("contrast: black on white is 21", () => {
  assert.equal(contrast("#000000", "#FFFFFF"), 21);
});

test("contrast: brand magenta with white is 4.48 (order independent)", () => {
  assert.equal(contrast("#FFFFFF", "#E50C7E"), 4.48);
  assert.equal(contrast("#E50C7E", "#FFFFFF"), 4.48);
});

test("contrast rejects non #RRGGBB input", () => {
  assert.throws(() => contrast("red", "#FFFFFF"), /Expected #RRGGBB/);
});

test("render: TSX component renders to static markup", async () => {
  const { Probe } = await import("./fixtures/Probe.tsx");
  assert.equal(render(Probe, { label: "Hi" }), '<span data-probe="Hi">Hi</span>');
});
```

`tests/fixtures/Probe.tsx`:

```tsx
export function Probe({ label }: { label: string }) {
  return <span data-probe={label}>{label}</span>;
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx tsx --test tests/ui-harness.test.mjs`
Expected: FAIL — `Cannot find module './helpers/contrast.mjs'`.

- [ ] **Step 3: Implement**

`tsconfig.test.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "jsx": "react-jsx" }
}
```

`tests/helpers/contrast.mjs`:

```js
function channel(v) {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex) {
  const h = String(hex).replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`Expected #RRGGBB, got ${hex}`);
  const [r, g, b] = [0, 2, 4].map((i) => channel(parseInt(h.slice(i, i + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(fg, bg) {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}
```

`tests/helpers/render.mjs`:

```js
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

export function render(Component, props = {}) {
  return renderToStaticMarkup(createElement(Component, props));
}
```

`package.json` — replace the two script lines:

```json
"test": "tsx --tsconfig tsconfig.test.json --test tests/*.test.mjs",
"test:all": "tsx --tsconfig tsconfig.test.json --test tests/*.test.mjs",
```

- [ ] **Step 4: Run tests**

First record the legacy baseline: `git stash -u && npm test 2>&1 | grep -E "^# (pass|fail)"; git stash pop`.
Run: `npx tsx --tsconfig tsconfig.test.json --test tests/ui-harness.test.mjs` → 4 pass.
Run: `npm test` → legacy pass/fail counts unchanged, plus 4 new passes.

- [ ] **Step 5: Commit**

```bash
git add tsconfig.test.json tests/helpers tests/fixtures/Probe.tsx tests/ui-harness.test.mjs package.json
git commit -m "test(ui): tsx render harness and WCAG contrast helper"
```

---

### Task 2: Design tokens (both themes, density, motion) + token tests

**Files:**
- Create: `src/ui/tokens.css`, `tests/helpers/tokens.mjs`, `tests/ui-tokens.test.mjs`, `tests/fixtures/ui-hex-baseline.json`
- Modify: `src/app/globals.css` (import tokens)

**Interfaces:**
- Consumes: `contrast()` (Task 1).
- Produces: CSS variables `--color-<name>` for the 26 names listed in `SEMANTIC` below; `--radius-{sm,md,lg,pill}`, `--shadow-{card,2,3}`, `--dur-{fast,base,slow}`, `--ease-out`, `--text-base`, `--hit-min`, `--brand-black`, `--brand-whatsapp`, `--mygd-gray-0`; `parseTokens(css) → { root, light, dark, surfaces }` (colour values resolved to upper-case `#RRGGBB`).

- [ ] **Step 1: Write the failing test** — `tests/ui-tokens.test.mjs`

```js
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx tsx --tsconfig tsconfig.test.json --test tests/ui-tokens.test.mjs`
Expected: FAIL — `ENOENT ... src/ui/tokens.css`.

- [ ] **Step 3: Implement `tests/helpers/tokens.mjs`**

```js
// Parses src/ui/tokens.css. Innermost blocks are keyed by their selector:
//   ":root"                          -> primitives, scales (reduced-motion @media block merges here)
//   ":root, [data-theme=\"light\"]"  -> light semantic tokens
//   "[data-theme=\"dark\"]"          -> dark semantic tokens
//   "[data-surface=\"<name>\"]"      -> density per surface
export function parseTokens(css) {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const blocks = {};
  for (const m of stripped.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = m[1].trim().replace(/\s+/g, " ");
    const vars = blocks[selector] ?? {};
    for (const d of m[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) vars[d[1]] = d[2].trim();
    blocks[selector] = vars;
  }
  const root = blocks[":root"] ?? {};
  const resolve = (scope, value, depth = 0) => {
    const ref = /^var\((--[\w-]+)\)$/.exec(value);
    if (!ref) return value;
    if (depth > 10) throw new Error(`var() cycle at ${value}`);
    const next = scope[ref[1]] ?? root[ref[1]];
    if (next === undefined) throw new Error(`Unresolved ${ref[1]}`);
    return resolve(scope, next, depth + 1);
  };
  const normalise = (v) => (/^#[0-9a-fA-F]{6}$/.test(v) ? v.toUpperCase() : v);
  const resolveAll = (scope) => Object.fromEntries(Object.entries(scope).map(([k, v]) => [k, normalise(resolve(scope, v))]));
  const surfaces = {};
  for (const [sel, vars] of Object.entries(blocks)) {
    const s = /^\[data-surface="(\w+)"\]$/.exec(sel);
    if (s) surfaces[s[1]] = vars;
  }
  return {
    root: resolveAll(root),
    light: resolveAll(blocks[':root, [data-theme="light"]'] ?? {}),
    dark: resolveAll(blocks['[data-theme="dark"]'] ?? {}),
    surfaces,
  };
}
```

- [ ] **Step 4: Implement `src/ui/tokens.css`**

```css
/* MYGD design tokens — single source of truth.
   Spec: docs/superpowers/specs/2026-09-28-ui-foundation-design.md
   Components use the semantic --color-* tokens (via Tailwind), never the primitives. */

:root {
  /* Magenta ramp — 500 is the brand primary from the badge logo */
  --mygd-magenta-50: #FDE7F2;
  --mygd-magenta-100: #FBCFE5;
  --mygd-magenta-200: #F7A0CB;
  --mygd-magenta-300: #F170B0;
  --mygd-magenta-400: #EC4096;
  --mygd-magenta-500: #E50C7E;
  --mygd-magenta-600: #C20A6A;
  --mygd-magenta-700: #B8095F;
  --mygd-magenta-800: #8F074A;
  --mygd-magenta-900: #5E0431;
  --mygd-magenta-950: #33021B;

  /* Neutral ramp — 1000 is logo black */
  --mygd-gray-0: #FFFFFF;
  --mygd-gray-25: #FAFAFA;
  --mygd-gray-50: #F4F4F5;
  --mygd-gray-100: #EBEBED;
  --mygd-gray-150: #E3E3E6;
  --mygd-gray-200: #D4D4D8;
  --mygd-gray-400: #A1A1AA;
  --mygd-gray-500: #8A8A93;
  --mygd-gray-550: #6B6B73;
  --mygd-gray-600: #65656D;
  --mygd-gray-650: #52525B;
  --mygd-gray-750: #333338;
  --mygd-gray-800: #27272A;
  --mygd-gray-850: #202023;
  --mygd-gray-900: #18181B;
  --mygd-gray-950: #0B0B0C;
  --mygd-gray-1000: #000000;

  /* Status hues */
  --mygd-green-100: #DCFCE7;
  --mygd-green-300: #86EFAC;
  --mygd-green-700: #15803D;
  --mygd-green-900: #14532D;
  --mygd-amber-100: #FEF3C7;
  --mygd-amber-300: #FCD34D;
  --mygd-amber-700: #B45309;
  --mygd-amber-900: #78350F;
  --mygd-red-100: #FEE2E2;
  --mygd-red-300: #FCA5A5;
  --mygd-red-700: #B91C1C;
  --mygd-red-900: #7F1D1D;
  --mygd-cyan-100: #CFFAFE;
  --mygd-cyan-300: #67E8F9;
  --mygd-cyan-700: #0E7490;
  --mygd-cyan-900: #164E63;
  --mygd-gold-100: #FEF9C3;
  --mygd-gold-300: #FDE047;
  --mygd-gold-700: #A16207;
  --mygd-gold-900: #713F12;

  /* Theme-independent brand constants */
  --brand-black: #000000;
  --brand-whatsapp: #25D366;

  /* Scales */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-pill: 999px;
  --dur-fast: 120ms;
  --dur-base: 200ms;
  --dur-slow: 320ms;
  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);

  /* Density defaults (overridden per [data-surface]) */
  --text-base: 16px;
  --hit-min: 44px;
}

:root, [data-theme="light"] {
  --color-canvas: var(--mygd-gray-50);
  --color-surface: var(--mygd-gray-0);
  --color-surface-raised: var(--mygd-gray-0);
  --color-surface-hover: var(--mygd-gray-100);
  --color-border: var(--mygd-gray-200);
  --color-border-subtle: var(--mygd-gray-150);
  --color-border-input: var(--mygd-gray-500);
  --color-text: var(--mygd-gray-900);
  --color-text-secondary: var(--mygd-gray-650);
  --color-text-subtle: var(--mygd-gray-600);
  --color-accent: var(--mygd-magenta-500);
  --color-accent-hover: var(--mygd-magenta-600);
  --color-on-accent: var(--mygd-gray-0);
  --color-accent-text: var(--mygd-magenta-700);
  --color-accent-subtle: var(--mygd-magenta-50);
  --color-success: var(--mygd-green-700);
  --color-success-subtle: var(--mygd-green-100);
  --color-warning: var(--mygd-amber-700);
  --color-warning-subtle: var(--mygd-amber-100);
  --color-danger: var(--mygd-red-700);
  --color-danger-subtle: var(--mygd-red-100);
  --color-info: var(--mygd-cyan-700);
  --color-info-subtle: var(--mygd-cyan-100);
  --color-highlight: var(--mygd-gold-700);
  --color-highlight-subtle: var(--mygd-gold-100);
  --color-focus: var(--mygd-magenta-500);
  --shadow-card: 0 0 0 1px var(--mygd-gray-150), 0 1px 2px 0 color-mix(in srgb, var(--mygd-gray-1000) 8%, transparent);
  --shadow-2: 0 4px 12px -2px color-mix(in srgb, var(--mygd-gray-1000) 12%, transparent);
  --shadow-3: 0 16px 40px -8px color-mix(in srgb, var(--mygd-gray-1000) 22%, transparent);
  color-scheme: light;
}

[data-theme="dark"] {
  --color-canvas: var(--mygd-gray-950);
  --color-surface: var(--mygd-gray-900);
  --color-surface-raised: var(--mygd-gray-850);
  --color-surface-hover: var(--mygd-gray-800);
  --color-border: var(--mygd-gray-750);
  --color-border-subtle: var(--mygd-gray-800);
  --color-border-input: var(--mygd-gray-550);
  --color-text: var(--mygd-gray-25);
  --color-text-secondary: var(--mygd-gray-400);
  --color-text-subtle: var(--mygd-gray-500);
  --color-accent: var(--mygd-magenta-500);
  --color-accent-hover: var(--mygd-magenta-600);
  --color-on-accent: var(--mygd-gray-0);
  --color-accent-text: var(--mygd-magenta-300);
  --color-accent-subtle: var(--mygd-magenta-950);
  --color-success: var(--mygd-green-300);
  --color-success-subtle: var(--mygd-green-900);
  --color-warning: var(--mygd-amber-300);
  --color-warning-subtle: var(--mygd-amber-900);
  --color-danger: var(--mygd-red-300);
  --color-danger-subtle: var(--mygd-red-900);
  --color-info: var(--mygd-cyan-300);
  --color-info-subtle: var(--mygd-cyan-900);
  --color-highlight: var(--mygd-gold-300);
  --color-highlight-subtle: var(--mygd-gold-900);
  --color-focus: var(--mygd-magenta-500);
  --shadow-card: 0 0 0 1px var(--mygd-gray-750);
  --shadow-2: 0 0 0 1px var(--mygd-gray-750), 0 8px 24px -4px color-mix(in srgb, var(--mygd-gray-1000) 60%, transparent);
  --shadow-3: 0 0 0 1px var(--mygd-gray-750), 0 24px 48px -8px color-mix(in srgb, var(--mygd-gray-1000) 70%, transparent);
  color-scheme: dark;
}

[data-surface="kiosk"] { --text-base: 20px; --hit-min: 64px; }
[data-surface="order"] { --text-base: 16px; --hit-min: 44px; }
[data-surface="board"] { --text-base: 32px; --hit-min: 0px; }
[data-surface="display"] { --text-base: 28px; --hit-min: 0px; }
[data-surface="pos"] { --text-base: 17px; --hit-min: 52px; }
[data-surface="kds"] { --text-base: 17px; --hit-min: 52px; }
[data-surface="staff"] { --text-base: 17px; --hit-min: 52px; }
[data-surface="admin"] { --text-base: 14px; --hit-min: 32px; }

[data-surface] {
  font-size: var(--text-base);
  background-color: var(--color-canvas);
  color: var(--color-text);
}

[data-surface="admin"], [data-surface="order"] {
  user-select: text;
  -webkit-user-select: text;
}

@keyframes mygd-pop-in {
  from { opacity: 0; transform: translateY(4px) scale(0.98); }
  to { opacity: 1; transform: none; }
}

.animate-in {
  animation: mygd-pop-in var(--dur-base) var(--ease-out);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --dur-fast: 0ms;
    --dur-base: 0ms;
    --dur-slow: 0ms;
  }
  .animate-in { animation: none; }
}
```

- [ ] **Step 5: Wire into globals** — in `src/app/globals.css`, insert directly below the existing Google Fonts `@import url(...)` line (line 1):

```css
@import "../ui/tokens.css";
```

(`@import` must precede all other rules. Task 4 deletes the Google line, leaving this as line 1.)

- [ ] **Step 6: Record the hex baseline**

```bash
node -e 'const fs=require("fs"),p=require("path");const w=d=>fs.readdirSync(d).flatMap(f=>{const q=p.join(d,f);return fs.statSync(q).isDirectory()?w(q):q.endsWith(".tsx")?[q]:[]});const n=w("src").filter(f=>!f.startsWith(p.join("src","ui"))).reduce((a,f)=>a+(fs.readFileSync(f,"utf8").match(/#[0-9a-fA-F]{3,8}\b/g)||[]).length,0);fs.writeFileSync("tests/fixtures/ui-hex-baseline.json",JSON.stringify({max:n,recorded:"2026-09-28"},null,2)+"\n");console.log(n)'
```

Expected: prints roughly 1,100–1,400 and writes the fixture.

- [ ] **Step 7: Run tests**

Run: `npx tsx --tsconfig tsconfig.test.json --test tests/ui-tokens.test.mjs` → all pass.
If a contrast assertion fails, change the **token mapping** to a darker/lighter primitive; never lower a threshold.

- [ ] **Step 8: Commit**

```bash
git add src/ui/tokens.css src/app/globals.css tests/helpers/tokens.mjs tests/ui-tokens.test.mjs tests/fixtures/ui-hex-baseline.json
git commit -m "feat(ui): light/dark design tokens with #E50C7E primary, density and motion scales"
```

---

### Task 3: Tailwind maps to semantic tokens

**Files:**
- Modify: `tailwind.config.ts`
- Test: `tests/ui-tailwind.test.mjs`

**Interfaces:**
- Consumes: token names (Task 2).
- Produces: Tailwind colour keys = the 26 `SEMANTIC` names (e.g. `bg-surface`, `text-text-secondary`, `ring-focus`, `border-border-input`); radii `rounded-{sm,md,lg,pill}`; shadows `shadow-{card,2,3}`; `duration-{fast,base,slow}`; `ease-out`; `min-h-hit`, `min-w-hit`; fonts `font-{display,heading,body,mono}`.

- [ ] **Step 1: Write the failing test** — `tests/ui-tailwind.test.mjs`

```js
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
});
```

- [ ] **Step 2: Run to verify it fails** — `npx tsx --tsconfig tsconfig.test.json --test tests/ui-tailwind.test.mjs` → FAIL.

- [ ] **Step 3: Implement** — replace `tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

// [ADR] Context: 1,100+ hard-coded hex colours drifted from DESIGN.md; the mygd.* keys were never used.
// Decision: Tailwind colours map only to semantic CSS variables (src/ui/tokens.css) that switch per
// [data-theme]; legacy mygd.* keys stay as aliases until every surface has migrated.
// Consequence: components need no `dark:` classes; opacity modifiers (bg-accent/10) do not work on
// semantic colours — use the *-subtle tokens instead.
const semantic = [
  "canvas", "surface", "surface-raised", "surface-hover", "border", "border-subtle", "border-input",
  "text", "text-secondary", "text-subtle",
  "accent", "accent-hover", "on-accent", "accent-text", "accent-subtle",
  "success", "success-subtle", "warning", "warning-subtle", "danger", "danger-subtle",
  "info", "info-subtle", "highlight", "highlight-subtle", "focus",
] as const;

const semanticColors = Object.fromEntries(semantic.map((name) => [name, `var(--color-${name})`]));

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/ui/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ...semanticColors,
        mygd: {
          charcoal: "#1F1F21",
          surface: "#2B2B2E",
          "surface-light": "#38383C",
          magenta: "#E50D7E",
          "magenta-hover": "#C80B6E",
          cyan: "#00FCED",
          "cyan-hover": "#00D6C9",
          orange: "#FF5722",
          gold: "#E5A93C",
          success: "#4CAF50",
          danger: "#E53935",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        2: "var(--shadow-2)",
        3: "var(--shadow-3)",
        "magenta-glow": "0 0 25px rgba(229, 13, 126, 0.45)",
        "cyan-glow": "0 0 25px rgba(0, 252, 237, 0.45)",
        "orange-glow": "0 0 25px rgba(255, 87, 34, 0.45)",
      },
      transitionDuration: {
        fast: "var(--dur-fast)",
        base: "var(--dur-base)",
        slow: "var(--dur-slow)",
      },
      transitionTimingFunction: { out: "var(--ease-out)" },
      minHeight: { hit: "var(--hit-min)" },
      minWidth: { hit: "var(--hit-min)" },
      fontFamily: {
        display: ["var(--font-display)", "Oswald", "sans-serif"],
        heading: ["var(--font-display)", "Oswald", "sans-serif"],
        body: ["var(--font-body)", "Figtree", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
```

Note: `./src/modules/**` was missing from `content`; module components' classes were only generated when the same class appeared elsewhere. Adding it can only add CSS, not remove it.

- [ ] **Step 4: Verify nothing broke**

Run: `npx tsx --tsconfig tsconfig.test.json --test tests/ui-tailwind.test.mjs` → pass.
Run: `grep -rln "dark:" src` → one legacy file. Open it: its `dark:` styles previously followed the OS setting (`darkMode` default `media`). After Task 4 the root has `data-theme="dark"`, so they always apply — the intended dark look. Note the file name in the commit body.
Run: `npx tsc --noEmit` → no new errors.

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.ts tests/ui-tailwind.test.mjs
git commit -m "feat(ui): map Tailwind to semantic tokens, keep legacy mygd aliases"
```

---

### Task 4: Self-hosted fonts + root layout

**Files:**
- Create: `src/ui/fonts.ts`
- Modify: `src/app/layout.tsx`, `src/app/globals.css`
- Test: `tests/ui-fonts.test.mjs`

**Interfaces:**
- Produces: `fontVariables: string` (class names that define `--font-display`, `--font-body`, `--font-mono`).

- [ ] **Step 1: Write the failing test** — `tests/ui-fonts.test.mjs`

```js
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
```

- [ ] **Step 2: Run to verify it fails** — `npx tsx --tsconfig tsconfig.test.json --test tests/ui-fonts.test.mjs` → FAIL.

- [ ] **Step 3: Implement `src/ui/fonts.ts`**

```ts
import { Figtree, JetBrains_Mono, Oswald } from "next/font/google";

// [ADR] Context: fonts came from a render-blocking Google @import and vanish offline (kiosk, D-2).
// Decision: next/font downloads them at build time and self-hosts them.
// Consequence: `next build` needs network once; runtime needs none; no layout shift.
const display = Oswald({ subsets: ["latin", "latin-ext"], weight: ["500", "600", "700"], variable: "--font-display", display: "swap" });
const body = Figtree({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700", "800"], variable: "--font-body", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-mono", display: "swap" });

export const fontVariables = [display.variable, body.variable, mono.variable].join(" ");
```

(Figtree has no Greek glyphs; Greek text falls back to the system sans in the `font-body` stack. Flag this in the kiosk spec.)

- [ ] **Step 4: Update `src/app/globals.css`**

1. Delete the Google Fonts `@import url('https://fonts.googleapis.com/...')` line so `@import "../ui/tokens.css";` is line 1.
2. Replace the `.font-display, .font-heading`, `.font-body` and `.font-mono` blocks with:

```css
.font-display,
.font-heading {
  font-family: var(--font-display), 'Oswald', sans-serif;
  letter-spacing: 0.02em;
}

.font-body {
  font-family: var(--font-body), 'Figtree', sans-serif;
}

.font-mono {
  font-family: var(--font-mono), 'JetBrains Mono', monospace;
}
```

3. In the `html, body` rule change `font-family: 'Figtree', sans-serif;` to `font-family: var(--font-body), 'Figtree', sans-serif;`.

- [ ] **Step 5: Update `src/app/layout.tsx`**

Add the import below the `ClickToComponent` import:

```tsx
import { fontVariables } from "@/ui/fonts";
```

Replace the `<html …>` opening tag with:

```tsx
    <html lang="en" data-theme="dark" className={`dark ${fontVariables} bg-[#1A1A1A] text-white`}>
```

(Legacy pages have no `SurfaceRoot`; `data-theme="dark"` on `<html>` keeps them identical. Migrated surfaces override it on their own `SurfaceRoot`. The `#1A1A1A` literals already existed and are counted in the baseline.)

- [ ] **Step 6: Verify**

Run: `npx tsx --tsconfig tsconfig.test.json --test tests/ui-fonts.test.mjs` → pass.
Run: `npm run build` → succeeds (downloads fonts once).
Run: `npm run dev`, open `http://localhost:3000/` → kiosk looks as before; DevTools → Network shows no request to `fonts.googleapis.com`.

- [ ] **Step 7: Commit**

```bash
git add src/ui/fonts.ts src/app/layout.tsx src/app/globals.css tests/ui-fonts.test.mjs
git commit -m "feat(ui): self-host Oswald, Figtree and JetBrains Mono via next/font"
```

---

### Task 5: Theme model, SurfaceRoot and ThemeToggle

**Files:**
- Create: `src/ui/theme/theme.ts`, `src/ui/theme/bootScript.ts`, `src/ui/theme/SurfaceRoot.tsx`, `src/ui/theme/ThemeToggle.tsx`
- Test: `tests/ui-theme.test.mjs`

**Interfaces:**
- Produces:
  - `type Surface = "kiosk" | "order" | "board" | "display" | "pos" | "kds" | "staff" | "admin"`
  - `type ThemePreference = "light" | "dark" | "system"`; `type ResolvedTheme = "light" | "dark"`
  - `SURFACE_DEFAULT_THEME: Record<Surface, ThemePreference>`
  - `storageKey(surface: Surface): string`
  - `parsePreference(value: unknown): ThemePreference | null`
  - `readStoredTheme(storage: Pick<Storage, "getItem"> | null | undefined, surface: Surface): ThemePreference | null` (never throws)
  - `resolveTheme(pref: ThemePreference, systemPrefersDark: boolean): ResolvedTheme`
  - `initialTheme(surface: Surface): ResolvedTheme`
  - `themeBootScript(surface: Surface): string`
  - `SurfaceRoot({ surface: Surface; className?: string; children: ReactNode })`
  - `ThemeToggle({ surface: Surface; className?: string })` (client)

- [ ] **Step 1: Write the failing test** — `tests/ui-theme.test.mjs`

```js
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
```

- [ ] **Step 2: Run to verify it fails** — `npx tsx --tsconfig tsconfig.test.json --test tests/ui-theme.test.mjs` → FAIL.

- [ ] **Step 3: Implement `src/ui/theme/theme.ts`**

```ts
export type Surface = "kiosk" | "order" | "board" | "display" | "pos" | "kds" | "staff" | "admin";
export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const SURFACE_DEFAULT_THEME: Record<Surface, ThemePreference> = {
  kiosk: "dark",
  board: "dark",
  display: "dark",
  kds: "dark",
  pos: "light",
  staff: "light",
  admin: "light",
  order: "system",
};

export function storageKey(surface: Surface): string {
  return `mygd.theme.${surface}`;
}

export function parsePreference(value: unknown): ThemePreference | null {
  return value === "light" || value === "dark" || value === "system" ? value : null;
}

export function readStoredTheme(storage: Pick<Storage, "getItem"> | null | undefined, surface: Surface): ThemePreference | null {
  if (!storage) return null;
  try {
    return parsePreference(storage.getItem(storageKey(surface)));
  } catch {
    return null;
  }
}

export function resolveTheme(pref: ThemePreference, systemPrefersDark: boolean): ResolvedTheme {
  if (pref === "system") return systemPrefersDark ? "dark" : "light";
  return pref;
}

/** Server-side default: no storage or media query available, so "system" renders light. */
export function initialTheme(surface: Surface): ResolvedTheme {
  return resolveTheme(SURFACE_DEFAULT_THEME[surface], false);
}
```

- [ ] **Step 4: Implement `src/ui/theme/bootScript.ts`**

```ts
import { SURFACE_DEFAULT_THEME, storageKey, type Surface } from "./theme";

/**
 * Inline script placed as the first child of a SurfaceRoot. It runs while the HTML is parsed,
 * before the surface paints, so a stored theme never flashes the default first.
 * Only uses the globals `document`, `localStorage` and `matchMedia` (injected in tests).
 */
export function themeBootScript(surface: Surface): string {
  const key = JSON.stringify(storageKey(surface));
  const fallback = JSON.stringify(SURFACE_DEFAULT_THEME[surface]);
  return `(function(){var el=document.currentScript&&document.currentScript.parentElement;if(!el)return;var p=null;try{p=localStorage.getItem(${key});}catch(e){}if(p!=="light"&&p!=="dark"&&p!=="system")p=${fallback};var dark=false;try{dark=matchMedia("(prefers-color-scheme: dark)").matches;}catch(e){}el.dataset.theme=p==="system"?(dark?"dark":"light"):p;})();`;
}
```

- [ ] **Step 5: Implement `src/ui/theme/SurfaceRoot.tsx`**

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { initialTheme, type Surface } from "./theme";
import { themeBootScript } from "./bootScript";

interface SurfaceRootProps {
  surface: Surface;
  className?: string;
  children: ReactNode;
}

/** Wraps one surface (route group): sets density and theme tokens for everything inside. */
export function SurfaceRoot({ surface, className, children }: SurfaceRootProps) {
  return (
    <div
      data-surface={surface}
      data-theme={initialTheme(surface)}
      suppressHydrationWarning
      className={cn("min-h-screen font-body antialiased", className)}
    >
      <script dangerouslySetInnerHTML={{ __html: themeBootScript(surface) }} />
      {children}
    </div>
  );
}
```

(`suppressHydrationWarning` is needed because the boot script may change `data-theme` before React hydrates.)

- [ ] **Step 6: Implement `src/ui/theme/ThemeToggle.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { SURFACE_DEFAULT_THEME, readStoredTheme, resolveTheme, storageKey, type Surface, type ThemePreference } from "./theme";

const OPTIONS: { value: ThemePreference; label: string; Icon: LucideIcon }[] = [
  { value: "light", label: "Light theme", Icon: Sun },
  { value: "dark", label: "Dark theme", Icon: Moon },
  { value: "system", label: "System theme", Icon: Monitor },
];

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function ThemeToggle({ surface, className }: { surface: Surface; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pref, setPref] = useState<ThemePreference>(SURFACE_DEFAULT_THEME[surface]);

  useEffect(() => {
    setPref(readStoredTheme(safeStorage(), surface) ?? SURFACE_DEFAULT_THEME[surface]);
  }, [surface]);

  useEffect(() => {
    const root = ref.current?.closest<HTMLElement>("[data-surface]");
    if (!root) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      root.dataset.theme = resolveTheme(pref, media.matches);
    };
    apply();
    if (pref !== "system") return;
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [pref]);

  const choose = (value: ThemePreference) => {
    setPref(value);
    try {
      safeStorage()?.setItem(storageKey(surface), value);
    } catch {
      // Storage blocked (private mode / kiosk lockdown): the theme still applies for this session.
    }
  };

  return (
    <div ref={ref} role="radiogroup" aria-label="Theme" className={cn("inline-flex items-center gap-0.5 rounded-md border border-border bg-surface p-0.5", className)}>
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={pref === value}
          aria-label={label}
          title={label}
          onClick={() => choose(value)}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-sm text-text-secondary transition-colors duration-fast",
            "hover:bg-surface-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
            pref === value && "bg-accent-subtle text-accent-text",
          )}
        >
          <Icon aria-hidden width={16} height={16} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 7: Run tests** — `npx tsx --tsconfig tsconfig.test.json --test tests/ui-theme.test.mjs` → all pass.

- [ ] **Step 8: Commit**

```bash
git add src/ui/theme tests/ui-theme.test.mjs
git commit -m "feat(ui): per-surface theme model, no-flash SurfaceRoot and ThemeToggle"
```

---

### Task 6: Layout and feedback primitives

**Files:**
- Create: `src/ui/primitives/Icon.tsx`, `Stack.tsx`, `Divider.tsx`, `VisuallyHidden.tsx`, `Spinner.tsx`, `Skeleton.tsx`
- Test: `tests/ui-primitives.test.mjs`

**Interfaces:**
- Produces:
  - `Icon({ icon: LucideIcon; size?: 16 | 20 | 24; label?: string; className? })`
  - `type Gap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8`
  - `Stack({ gap?: Gap; align?: "start"|"center"|"end"|"stretch"; as?: "div"|"section"|"ul"|"ol"; className?; children })`
  - `Inline({ …Stack props; justify?: "start"|"center"|"end"|"between"; wrap?: boolean })`
  - `Grid({ columns?: 1|2|3|4; gap?; as?; className?; children })`
  - `Divider({ className? })`, `VisuallyHidden({ children })`
  - `Spinner({ size?: "sm"|"md"|"lg"; label?: string; className? })` (default label "Loading")
  - `Skeleton({ variant?: "text"|"block"|"card"|"table-row"; lines?: number; className? })`

- [ ] **Step 1: Write the failing test** — `tests/ui-primitives.test.mjs`

```js
import test from "node:test";
import assert from "node:assert/strict";
import { Star } from "lucide-react";
import { render } from "./helpers/render.mjs";

const { Icon } = await import("../src/ui/primitives/Icon.tsx");
const { Stack, Inline, Grid } = await import("../src/ui/primitives/Stack.tsx");
const { Divider } = await import("../src/ui/primitives/Divider.tsx");
const { VisuallyHidden } = await import("../src/ui/primitives/VisuallyHidden.tsx");
const { Spinner } = await import("../src/ui/primitives/Spinner.tsx");
const { Skeleton } = await import("../src/ui/primitives/Skeleton.tsx");

test("Icon is decorative by default and labelled when asked", () => {
  assert.match(render(Icon, { icon: Star }), /aria-hidden="true"/);
  const labelled = render(Icon, { icon: Star, label: "Favourite", size: 24 });
  assert.match(labelled, /aria-label="Favourite"/);
  assert.match(labelled, /role="img"/);
  assert.match(labelled, /width="24"/);
});

test("Stack/Inline/Grid map props to classes", () => {
  assert.match(render(Stack, { gap: 4, children: "a" }), /flex flex-col gap-4/);
  assert.match(render(Inline, { gap: 2, justify: "between", wrap: true, children: "a" }), /justify-between[^"]*flex-wrap/);
  assert.match(render(Grid, { columns: 3, children: "a" }), /md:grid-cols-3/);
  assert.match(render(Stack, { as: "ul", children: "a" }), /^<ul/);
});

test("Divider is a separator", () => {
  assert.match(render(Divider), /role="separator"/);
});

test("VisuallyHidden keeps text for screen readers", () => {
  assert.match(render(VisuallyHidden, { children: "Hidden" }), /class="sr-only">Hidden</);
});

test("Spinner announces status", () => {
  const html = render(Spinner, { label: "Saving" });
  assert.match(html, /role="status"/);
  assert.match(html, /Saving/);
  assert.match(html, /motion-reduce:animate-none/);
});

test("Skeleton renders requested lines, hidden from AT, clamps bad input", () => {
  const html = render(Skeleton, { variant: "text", lines: 3 });
  assert.equal((html.match(/data-skeleton-line/g) ?? []).length, 3);
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /motion-safe:animate-pulse/);
  assert.equal((render(Skeleton, { lines: 0 }).match(/data-skeleton-line/g) ?? []).length, 1);
});
```

- [ ] **Step 2: Run to verify it fails** — `npx tsx --tsconfig tsconfig.test.json --test tests/ui-primitives.test.mjs` → FAIL.

- [ ] **Step 3: Implement**

`src/ui/primitives/Icon.tsx`:

```tsx
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type IconSize = 16 | 20 | 24;

interface IconProps {
  icon: LucideIcon;
  size?: IconSize;
  /** Provide only when the icon carries meaning on its own. */
  label?: string;
  className?: string;
}

export function Icon({ icon: Glyph, size = 20, label, className }: IconProps) {
  return (
    <Glyph
      width={size}
      height={size}
      strokeWidth={1.5}
      className={cn("shrink-0", className)}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    />
  );
}
```

`src/ui/primitives/Stack.tsx`:

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Gap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8;
const GAP: Record<Gap, string> = { 0: "gap-0", 1: "gap-1", 2: "gap-2", 3: "gap-3", 4: "gap-4", 5: "gap-5", 6: "gap-6", 8: "gap-8" };
const ALIGN = { start: "items-start", center: "items-center", end: "items-end", stretch: "items-stretch" } as const;
const JUSTIFY = { start: "justify-start", center: "justify-center", end: "justify-end", between: "justify-between" } as const;
const COLS = { 1: "grid-cols-1", 2: "grid-cols-1 md:grid-cols-2", 3: "grid-cols-1 md:grid-cols-3", 4: "grid-cols-2 md:grid-cols-4" } as const;

type Tag = "div" | "section" | "ul" | "ol";

interface StackProps {
  gap?: Gap;
  align?: keyof typeof ALIGN;
  as?: Tag;
  className?: string;
  children: ReactNode;
}

export function Stack({ gap = 4, align = "stretch", as: Tag = "div", className, children }: StackProps) {
  return <Tag className={cn("flex flex-col", GAP[gap], ALIGN[align], className)}>{children}</Tag>;
}

interface InlineProps extends StackProps {
  justify?: keyof typeof JUSTIFY;
  wrap?: boolean;
}

export function Inline({ gap = 2, align = "center", justify = "start", wrap = false, as: Tag = "div", className, children }: InlineProps) {
  return <Tag className={cn("flex", GAP[gap], ALIGN[align], JUSTIFY[justify], wrap && "flex-wrap", className)}>{children}</Tag>;
}

interface GridProps extends Omit<StackProps, "align"> {
  columns?: keyof typeof COLS;
}

export function Grid({ columns = 2, gap = 4, as: Tag = "div", className, children }: GridProps) {
  return <Tag className={cn("grid", COLS[columns], GAP[gap], className)}>{children}</Tag>;
}
```

`src/ui/primitives/Divider.tsx`:

```tsx
import { cn } from "@/lib/cn";

export function Divider({ className }: { className?: string }) {
  return <hr role="separator" className={cn("border-0 border-t border-border-subtle", className)} />;
}
```

`src/ui/primitives/VisuallyHidden.tsx`:

```tsx
import type { ReactNode } from "react";

export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
```

`src/ui/primitives/Spinner.tsx`:

```tsx
import { cn } from "@/lib/cn";

const SIZE = { sm: "h-4 w-4 border-2", md: "h-5 w-5 border-2", lg: "h-8 w-8 border-[3px]" } as const;

interface SpinnerProps {
  size?: keyof typeof SIZE;
  label?: string;
  className?: string;
}

export function Spinner({ size = "md", label = "Loading", className }: SpinnerProps) {
  return (
    <span role="status" className={cn("inline-flex items-center", className)}>
      <span aria-hidden className={cn("inline-block animate-spin rounded-pill border-current border-t-transparent motion-reduce:animate-none", SIZE[size])} />
      <span className="sr-only">{label}</span>
    </span>
  );
}
```

`src/ui/primitives/Skeleton.tsx`:

```tsx
import { cn } from "@/lib/cn";

type Variant = "text" | "block" | "card" | "table-row";
const BASE = "rounded-sm bg-surface-hover motion-safe:animate-pulse";

interface SkeletonProps {
  variant?: Variant;
  lines?: number;
  className?: string;
}

export function Skeleton({ variant = "text", lines = 1, className }: SkeletonProps) {
  if (variant === "block") return <div aria-hidden="true" className={cn(BASE, "h-24 w-full rounded-md", className)} />;
  if (variant === "card") {
    return (
      <div aria-hidden="true" className={cn("space-y-3 rounded-lg bg-surface p-4 shadow-card", className)}>
        <div data-skeleton-line className={cn(BASE, "h-4 w-1/3")} />
        <div data-skeleton-line className={cn(BASE, "h-3 w-full")} />
        <div data-skeleton-line className={cn(BASE, "h-3 w-5/6")} />
      </div>
    );
  }
  if (variant === "table-row") {
    return (
      <div aria-hidden="true" className={cn("flex items-center gap-4 border-b border-border-subtle px-4 py-3", className)}>
        <div data-skeleton-line className={cn(BASE, "h-4 w-4")} />
        <div data-skeleton-line className={cn(BASE, "h-3 flex-1")} />
        <div data-skeleton-line className={cn(BASE, "h-3 w-20")} />
      </div>
    );
  }
  const count = Number.isFinite(lines) ? Math.max(1, Math.floor(lines)) : 1;
  return (
    <div aria-hidden="true" className={cn("space-y-2", className)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} data-skeleton-line className={cn(BASE, "h-3", count > 1 && i === count - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run tests** — `npx tsx --tsconfig tsconfig.test.json --test tests/ui-primitives.test.mjs` → pass.

- [ ] **Step 5: Commit**

```bash
git add src/ui/primitives tests/ui-primitives.test.mjs
git commit -m "feat(ui): layout, icon, spinner and skeleton primitives"
```

---

### Task 7: Button, IconButton, ButtonGroup

**Files:**
- Create: `src/ui/actions/Button.tsx`, `src/ui/actions/IconButton.tsx`, `src/ui/actions/ButtonGroup.tsx`
- Test: `tests/ui-actions.test.mjs`

**Interfaces:**
- Consumes: `Spinner` (Task 6).
- Produces:
  - `type ButtonVariant = "primary" | "secondary" | "tertiary" | "critical" | "plain"`; `type ButtonSize = "sm" | "md" | "lg" | "xl"`
  - `buttonClasses({ variant: ButtonVariant; size: ButtonSize; fullWidth?: boolean }): string`
  - `Button(ButtonHTMLAttributes<HTMLButtonElement> & { variant?; size?; loading?: boolean; icon?: LucideIcon; iconPosition?: "start" | "end"; fullWidth?: boolean })`
  - `IconButton(Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & { icon: LucideIcon; label: string; variant?; size? })` (default variant `tertiary`)
  - `ButtonGroup({ attached?: boolean; className?; children })`

- [ ] **Step 1: Write the failing test** — `tests/ui-actions.test.mjs`

```js
import test from "node:test";
import assert from "node:assert/strict";
import { Plus } from "lucide-react";
import { render } from "./helpers/render.mjs";

const { Button, buttonClasses } = await import("../src/ui/actions/Button.tsx");
const { IconButton } = await import("../src/ui/actions/IconButton.tsx");
const { ButtonGroup } = await import("../src/ui/actions/ButtonGroup.tsx");

test("primary button uses accent tokens, bold label, type=button", () => {
  const html = render(Button, { children: "Save" });
  assert.match(html, /bg-accent/);
  assert.match(html, /text-on-accent/);
  assert.match(html, /font-semibold/);
  assert.match(html, /type="button"/);
});

test("every variant renders distinct classes", () => {
  const seen = new Set(["primary", "secondary", "tertiary", "critical", "plain"].map((variant) => buttonClasses({ variant, size: "md" })));
  assert.equal(seen.size, 5);
});

test("loading button is disabled, busy, keeps its label (and width) in the DOM", () => {
  const html = render(Button, { loading: true, children: "Pay" });
  assert.match(html, /disabled=""/);
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /role="status"/);
  assert.match(html, /invisible">Pay</);
});

test("disabled button is disabled and not busy", () => {
  const html = render(Button, { disabled: true, children: "x" });
  assert.match(html, /disabled=""/);
  assert.doesNotMatch(html, /aria-busy/);
});

test("xl size respects the surface minimum hit target", () => {
  assert.match(buttonClasses({ variant: "primary", size: "xl" }), /min-h-hit/);
});

test("IconButton always has an accessible name", () => {
  const html = render(IconButton, { icon: Plus, label: "Add item" });
  assert.match(html, /aria-label="Add item"/);
  assert.match(html, /aria-hidden="true"/);
});

test("ButtonGroup groups buttons", () => {
  assert.match(render(ButtonGroup, { children: "x" }), /role="group"/);
});
```

- [ ] **Step 2: Run to verify it fails** — `npx tsx --tsconfig tsconfig.test.json --test tests/ui-actions.test.mjs` → FAIL.

- [ ] **Step 3: Implement**

`src/ui/actions/Button.tsx`:

```tsx
import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Spinner } from "@/ui/primitives/Spinner";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "critical" | "plain";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-accent text-on-accent font-semibold shadow-card hover:bg-accent-hover",
  secondary: "bg-surface text-text font-medium shadow-card hover:bg-surface-hover",
  tertiary: "bg-transparent text-text font-medium hover:bg-surface-hover",
  critical: "bg-danger text-surface font-semibold hover:opacity-90",
  plain: "bg-transparent text-accent-text font-medium underline-offset-4 hover:underline !px-0",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm rounded-md",
  md: "h-9 px-4 text-sm rounded-md",
  lg: "h-11 px-5 text-base rounded-md",
  xl: "min-h-hit px-6 text-lg rounded-lg",
};

const ICON_SIZE: Record<ButtonSize, number> = { sm: 16, md: 16, lg: 20, xl: 24 };

export function buttonClasses({ variant, size, fullWidth = false }: { variant: ButtonVariant; size: ButtonSize; fullWidth?: boolean }) {
  return cn(
    "relative inline-flex select-none items-center justify-center whitespace-nowrap transition-colors duration-fast ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
    "disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-px",
    VARIANT[variant],
    SIZE[size],
    fullWidth && "w-full",
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: "start" | "end";
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon: Glyph,
  iconPosition = "start",
  fullWidth = false,
  disabled,
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  const glyph = Glyph ? <Glyph aria-hidden width={ICON_SIZE[size]} height={ICON_SIZE[size]} strokeWidth={1.5} /> : null;
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonClasses({ variant, size, fullWidth }), className)}
      {...rest}
    >
      <span className={cn("inline-flex items-center gap-2", loading && "invisible")}>
        {iconPosition === "start" && glyph}
        {children}
        {iconPosition === "end" && glyph}
      </span>
      {loading && <Spinner size="sm" label="Loading" className="absolute" />}
    </button>
  );
}
```

`src/ui/actions/IconButton.tsx`:

```tsx
import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "./Button";

const SQUARE: Record<ButtonSize, string> = { sm: "w-8 px-0", md: "w-9 px-0", lg: "w-11 px-0", xl: "min-w-hit px-0" };
const ICON: Record<ButtonSize, number> = { sm: 16, md: 16, lg: 20, xl: 24 };

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  icon: LucideIcon;
  /** Required accessible name (also shown as the native tooltip). */
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function IconButton({ icon: Glyph, label, variant = "tertiary", size = "md", type = "button", className, ...rest }: IconButtonProps) {
  return (
    <button type={type} aria-label={label} title={label} className={cn(buttonClasses({ variant, size }), SQUARE[size], className)} {...rest}>
      <Glyph aria-hidden width={ICON[size]} height={ICON[size]} strokeWidth={1.5} />
    </button>
  );
}
```

`src/ui/actions/ButtonGroup.tsx`:

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function ButtonGroup({ attached = false, className, children }: { attached?: boolean; className?: string; children: ReactNode }) {
  return (
    <div
      role="group"
      className={cn(
        "inline-flex items-center",
        attached ? "[&>*+*]:-ml-px [&>*:not(:first-child)]:rounded-l-none [&>*:not(:last-child)]:rounded-r-none" : "gap-2",
        className,
      )}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Run tests** — `npx tsx --tsconfig tsconfig.test.json --test tests/ui-actions.test.mjs` → pass; `npx tsc --noEmit` → no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/ui/actions tests/ui-actions.test.mjs
git commit -m "feat(ui): Button, IconButton and ButtonGroup with loading and a11y states"
```

---

### Task 8: Display components

**Files:**
- Create in `src/ui/display/`: `Card.tsx`, `Badge.tsx`, `Banner.tsx`, `EmptyState.tsx`, `ErrorState.tsx`, `DescriptionList.tsx`, `Stat.tsx`, `PriceTag.tsx`, `Thumbnail.tsx`, `Avatar.tsx`, `ProgressBar.tsx`, `Kbd.tsx`, `Logo.tsx`
- Test: `tests/ui-display.test.mjs`

**Interfaces:**
- Consumes: `Button` (Task 7); `formatEuro(amount: number, locale?: Locale): string` from `@/lib/i18n` (amount in **euros**); `Locale = "en" | "de" | "gr"` from `@/types`.
- Produces:
  - `Card({ as?: "div"|"section"|"article"; interactive?; selected?; padding?: "none"|"sm"|"md"; className?; children })`, `CardHeader({ title; description?; actions? })`, `CardSection({ subdued?; className?; children })`
  - `type Tone = "neutral" | "info" | "success" | "warning" | "critical" | "highlight" | "accent"`; `TONE_CLASSES: Record<Tone, string>`; `Badge({ tone?; size?: "sm"|"md"; dot?; icon?: LucideIcon; className?; children })`
  - `Banner({ tone?: "info"|"success"|"warning"|"critical"; title: string; children?; action?; onDismiss?: () => void; className? })`
  - `EmptyState({ icon?: LucideIcon; title: string; description?: string; action?: ReactNode; className? })`
  - `ErrorState({ title?: string; description?: string; onRetry?: () => void; retryLabel?: string; className? })`
  - `DescriptionList({ items: { term: ReactNode; description: ReactNode }[]; className? })`
  - `Stat({ label: string; value: ReactNode; delta?: { value: string; trend: "up"|"down"|"flat" }; className? })`
  - `PriceTag({ amount: number; locale?: Locale; size?: "sm"|"md"|"lg"|"xl"; strike?: boolean; className? })`
  - `Thumbnail({ src?: string; alt: string; size?: "sm"|"md"|"lg"; className? })`
  - `initials(name: string): string`; `Avatar({ name: string; src?: string; size?: "sm"|"md"; className? })`
  - `ProgressBar({ value: number; label: string; tone?: "accent"|"success"|"warning"|"critical"; className? })`
  - `Kbd({ children })`
  - `LOGO_ALT = "My German Doener — Bite the Hype"`; `Logo({ size?: number; className? })`

- [ ] **Step 1: Write the failing test** — `tests/ui-display.test.mjs`

```js
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
```

- [ ] **Step 2: Run to verify it fails** — `npx tsx --tsconfig tsconfig.test.json --test tests/ui-display.test.mjs` → FAIL.

- [ ] **Step 3: Implement**

`src/ui/display/Card.tsx`:

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const PADDING = { none: "", sm: "p-3", md: "p-4 md:p-5" } as const;

interface CardProps {
  as?: "div" | "section" | "article";
  interactive?: boolean;
  selected?: boolean;
  padding?: keyof typeof PADDING;
  className?: string;
  children: ReactNode;
}

export function Card({ as: Tag = "div", interactive = false, selected = false, padding = "md", className, children }: CardProps) {
  return (
    <Tag
      className={cn(
        "rounded-lg bg-surface text-text shadow-card",
        PADDING[padding],
        interactive && "cursor-pointer transition-colors duration-fast hover:bg-surface-hover",
        selected && "ring-2 ring-accent",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-text">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-text-secondary">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardSection({ subdued = false, className, children }: { subdued?: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={cn("-mx-4 border-t border-border-subtle px-4 py-3 md:-mx-5 md:px-5", subdued && "bg-canvas", className)}>
      {children}
    </div>
  );
}
```

`src/ui/display/Badge.tsx`:

```tsx
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type Tone = "neutral" | "info" | "success" | "warning" | "critical" | "highlight" | "accent";

export const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-surface-hover text-text-secondary",
  info: "bg-info-subtle text-info",
  success: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
  critical: "bg-danger-subtle text-danger",
  highlight: "bg-highlight-subtle text-highlight",
  accent: "bg-accent-subtle text-accent-text",
};

const SIZE = { sm: "h-5 px-1.5 text-xs gap-1", md: "h-6 px-2 text-sm gap-1.5" } as const;

interface BadgeProps {
  tone?: Tone;
  size?: keyof typeof SIZE;
  dot?: boolean;
  icon?: LucideIcon;
  className?: string;
  children: ReactNode;
}

export function Badge({ tone = "neutral", size = "sm", dot = false, icon: Glyph, className, children }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-pill font-medium", TONE_CLASSES[tone], SIZE[size], className)}>
      {dot && <span aria-hidden className="h-1.5 w-1.5 rounded-pill bg-current" />}
      {Glyph && <Glyph aria-hidden width={12} height={12} strokeWidth={2} />}
      {children}
    </span>
  );
}
```

`src/ui/display/Banner.tsx`:

```tsx
import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type BannerTone = "info" | "success" | "warning" | "critical";

const STYLE: Record<BannerTone, { box: string; icon: LucideIcon }> = {
  info: { box: "bg-info-subtle text-info", icon: Info },
  success: { box: "bg-success-subtle text-success", icon: CheckCircle2 },
  warning: { box: "bg-warning-subtle text-warning", icon: AlertTriangle },
  critical: { box: "bg-danger-subtle text-danger", icon: XCircle },
};

interface BannerProps {
  tone?: BannerTone;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export function Banner({ tone = "info", title, children, action, onDismiss, className }: BannerProps) {
  const { box, icon: Glyph } = STYLE[tone];
  return (
    <div role={tone === "critical" || tone === "warning" ? "alert" : "status"} className={cn("flex gap-3 rounded-lg p-3", box, className)}>
      <Glyph aria-hidden width={20} height={20} strokeWidth={1.5} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        {children && <div className="mt-1 text-sm">{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <X aria-hidden width={16} height={16} />
        </button>
      )}
    </div>
  );
}
```

`src/ui/display/EmptyState.tsx`:

```tsx
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Glyph, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-12 text-center", className)}>
      {Glyph && (
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-pill bg-surface-hover text-text-secondary">
          <Glyph aria-hidden width={24} height={24} strokeWidth={1.5} />
        </span>
      )}
      <h3 className="text-base font-semibold text-text">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-text-secondary">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

`src/ui/display/ErrorState.tsx`:

```tsx
import { AlertOctagon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/actions/Button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({ title = "Something went wrong", description, onRetry, retryLabel = "Try again", className }: ErrorStateProps) {
  return (
    <div role="alert" className={cn("flex flex-col items-center px-6 py-12 text-center", className)}>
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-pill bg-danger-subtle text-danger">
        <AlertOctagon aria-hidden width={24} height={24} strokeWidth={1.5} />
      </span>
      <h3 className="text-base font-semibold text-text">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-text-secondary">{description}</p>}
      {onRetry && (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
```

`src/ui/display/DescriptionList.tsx`:

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface DescriptionListProps {
  items: { term: ReactNode; description: ReactNode }[];
  className?: string;
}

export function DescriptionList({ items, className }: DescriptionListProps) {
  return (
    <dl className={cn("divide-y divide-border-subtle", className)}>
      {items.map((item, i) => (
        <div key={i} className="grid grid-cols-3 gap-4 py-2">
          <dt className="text-sm text-text-secondary">{item.term}</dt>
          <dd className="col-span-2 text-sm text-text">{item.description}</dd>
        </div>
      ))}
    </dl>
  );
}
```

`src/ui/display/Stat.tsx`:

```tsx
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";

type Trend = "up" | "down" | "flat";

const TREND = {
  up: { cls: "text-success", Glyph: ArrowUpRight },
  down: { cls: "text-danger", Glyph: ArrowDownRight },
  flat: { cls: "text-text-secondary", Glyph: ArrowRight },
} as const;

interface StatProps {
  label: string;
  value: ReactNode;
  delta?: { value: string; trend: Trend };
  className?: string;
}

export function Stat({ label, value, delta, className }: StatProps) {
  const trend = delta ? TREND[delta.trend] : null;
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="text-2xl font-semibold tabular-nums text-text">{value}</p>
      {delta && trend && (
        <p className={cn("inline-flex items-center gap-1 text-sm font-medium", trend.cls)}>
          <trend.Glyph aria-hidden width={16} height={16} />
          {delta.value}
        </p>
      )}
    </div>
  );
}
```

`src/ui/display/PriceTag.tsx`:

```tsx
import { cn } from "@/lib/cn";
import { formatEuro } from "@/lib/i18n";
import type { Locale } from "@/types";

const SIZE = { sm: "text-sm", md: "text-base", lg: "text-xl font-semibold", xl: "text-3xl font-bold" } as const;

interface PriceTagProps {
  /** Amount in euros — the unit used by formatEuro and the menu data. */
  amount: number;
  locale?: Locale;
  size?: keyof typeof SIZE;
  strike?: boolean;
  className?: string;
}

export function PriceTag({ amount, locale = "en", size = "md", strike = false, className }: PriceTagProps) {
  const text = Number.isFinite(amount) ? formatEuro(amount, locale) : "—";
  const cls = cn("tabular-nums", SIZE[size], strike && "text-text-subtle", className);
  return strike ? <del className={cls}>{text}</del> : <span className={cls}>{text}</span>;
}
```

`src/ui/display/Thumbnail.tsx`:

```tsx
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/cn";

const SIZE = { sm: "h-10 w-10", md: "h-14 w-14", lg: "h-20 w-20" } as const;

interface ThumbnailProps {
  src?: string;
  alt: string;
  size?: keyof typeof SIZE;
  className?: string;
}

export function Thumbnail({ src, alt, size = "md", className }: ThumbnailProps) {
  const box = cn("shrink-0 overflow-hidden rounded-md border border-border-subtle bg-surface-hover", SIZE[size], className);
  if (!src) {
    return (
      <span role="img" aria-label={alt} className={cn(box, "flex items-center justify-center text-text-subtle")}>
        <ImageOff aria-hidden width={16} height={16} />
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- small local product images; next/image would need host config per surface
  return <img src={src} alt={alt} loading="lazy" className={cn(box, "object-cover")} />;
}
```

`src/ui/display/Avatar.tsx`:

```tsx
import { cn } from "@/lib/cn";

const SIZE = { sm: "h-7 w-7 text-xs", md: "h-9 w-9 text-sm" } as const;

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

interface AvatarProps {
  name: string;
  src?: string;
  size?: keyof typeof SIZE;
  className?: string;
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const box = cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-pill bg-accent-subtle font-semibold text-accent-text", SIZE[size], className);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- small local staff photos
    return <img src={src} alt={name} className={cn(box, "object-cover")} />;
  }
  return (
    <span role="img" aria-label={name} className={box}>
      {initials(name)}
    </span>
  );
}
```

`src/ui/display/ProgressBar.tsx`:

```tsx
import { cn } from "@/lib/cn";

const TONE = { accent: "bg-accent", success: "bg-success", warning: "bg-warning", critical: "bg-danger" } as const;

interface ProgressBarProps {
  value: number;
  label: string;
  tone?: keyof typeof TONE;
  className?: string;
}

export function ProgressBar({ value, label, tone = "accent", className }: ProgressBarProps) {
  const pct = Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : 0;
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className={cn("h-2 w-full overflow-hidden rounded-pill bg-surface-hover", className)}>
      <div className={cn("h-full rounded-pill transition-[width] duration-base", TONE[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}
```

`src/ui/display/Kbd.tsx`:

```tsx
import type { ReactNode } from "react";

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-sm border border-border bg-surface px-1 font-mono text-xs text-text-secondary">
      {children}
    </kbd>
  );
}
```

`src/ui/display/Logo.tsx`:

```tsx
import { cn } from "@/lib/cn";

export const LOGO_ALT = "My German Doener — Bite the Hype";
const LOGO_SRC = "/assets/brand/logo-badge.webp";

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 40, className }: LogoProps) {
  // eslint-disable-next-line @next/next/no-img-element -- static brand asset; plain img keeps the kit renderable outside Next (tests, gallery)
  return <img src={LOGO_SRC} alt={LOGO_ALT} width={size} height={size} decoding="async" className={cn("shrink-0 rounded-pill", className)} />;
}
```

- [ ] **Step 4: Run tests** — `npx tsx --tsconfig tsconfig.test.json --test tests/ui-display.test.mjs` → pass; `npx tsc --noEmit` → no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/ui/display tests/ui-display.test.mjs
git commit -m "feat(ui): cards, badges, banners, states, stats, price tag and logo"
```

---

### Task 9: Form controls

**Files:**
- Create in `src/ui/forms/`: `Field.tsx`, `TextField.tsx`, `Textarea.tsx`, `Select.tsx`, `Checkbox.tsx`, `Radio.tsx`, `Switch.tsx`, `SearchField.tsx`, `Filters.tsx`
- Test: `tests/ui-forms.test.mjs`

**Interfaces:**
- Produces:
  - `interface FieldA11y { id: string; "aria-describedby"?: string; "aria-invalid"?: true }`
  - `Field({ id; label; hint?; error?; required?; labelHidden?; className?; children: (a11y: FieldA11y) => ReactNode })`
  - `inputClasses(invalid: boolean): string`
  - `TextField(Omit<InputHTMLAttributes, "id"|"prefix"> & { id: string; label: string; hint?; error?; labelHidden?; prefix?: ReactNode; suffix?: ReactNode })`
  - `Textarea(Omit<TextareaHTMLAttributes, "id"> & { id; label; hint?; error? })`
  - `interface SelectOption { value: string; label: string; disabled?: boolean }`; `Select(Omit<SelectHTMLAttributes, "id"> & { id; label; hint?; error?; options: SelectOption[]; placeholder?: string })`
  - `interface ChoiceProps extends Omit<InputHTMLAttributes, "id"|"type"> { id: string; label: string; hint?: string }`; `choiceClasses(round: boolean): string`; `Checkbox(ChoiceProps)`, `Radio(ChoiceProps)`
  - `Switch({ id; label; checked: boolean; onChange: (next: boolean) => void; disabled?; className? })` (client)
  - `SearchField({ id; label?: string; value: string; onChange: (v: string) => void; placeholder?; className? })` (client)
  - `Filters({ chips: { key: string; label: string }[]; onRemove: (key: string) => void; onClearAll?: () => void; className? })`

- [ ] **Step 1: Write the failing test** — `tests/ui-forms.test.mjs`

```js
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
```

- [ ] **Step 2: Run to verify it fails** — `npx tsx --tsconfig tsconfig.test.json --test tests/ui-forms.test.mjs` → FAIL.

- [ ] **Step 3: Implement**

`src/ui/forms/Field.tsx`:

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface FieldA11y {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
}

export interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  labelHidden?: boolean;
  className?: string;
  children: (a11y: FieldA11y) => ReactNode;
}

export function inputClasses(invalid: boolean) {
  return cn(
    "w-full rounded-md border bg-surface px-3 text-text placeholder:text-text-subtle",
    "transition-colors duration-fast focus:outline-none focus-visible:ring-2 focus-visible:ring-focus",
    "disabled:cursor-not-allowed disabled:bg-surface-hover disabled:text-text-subtle",
    invalid ? "border-danger" : "border-border-input",
  );
}

export function Field({ id, label, hint, error, required, labelHidden = false, className, children }: FieldProps) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  const a11y: FieldA11y = { id, ...(describedBy ? { "aria-describedby": describedBy } : {}), ...(error ? { "aria-invalid": true as const } : {}) };
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className={cn("block text-sm font-medium text-text", labelHidden && "sr-only")}>
        {label}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden>
            *
          </span>
        )}
      </label>
      {children(a11y)}
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-text-secondary">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
```

`src/ui/forms/TextField.tsx`:

```tsx
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Field, inputClasses } from "./Field";

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "prefix"> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  labelHidden?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

export function TextField({ id, label, hint, error, labelHidden, prefix, suffix, required, className, type = "text", ...rest }: TextFieldProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} labelHidden={labelHidden} className={className}>
      {(a11y) => (
        <div className="relative flex items-center">
          {prefix && <span className="pointer-events-none absolute left-3 text-text-subtle">{prefix}</span>}
          <input {...rest} {...a11y} type={type} required={required} className={cn(inputClasses(Boolean(error)), "h-9 min-h-hit", prefix && "pl-9", suffix && "pr-9")} />
          {suffix && <span className="absolute right-3 text-text-subtle">{suffix}</span>}
        </div>
      )}
    </Field>
  );
}
```

`src/ui/forms/Textarea.tsx`:

```tsx
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Field, inputClasses } from "./Field";

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
}

export function Textarea({ id, label, hint, error, required, className, rows = 4, ...rest }: TextareaProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} className={className}>
      {(a11y) => <textarea {...rest} {...a11y} rows={rows} required={required} className={cn(inputClasses(Boolean(error)), "py-2")} />}
    </Field>
  );
}
```

`src/ui/forms/Select.tsx`:

```tsx
import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { Field, inputClasses } from "./Field";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({ id, label, hint, error, options, placeholder, required, className, ...rest }: SelectProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} className={className}>
      {(a11y) => (
        <div className="relative">
          <select {...rest} {...a11y} required={required} className={cn(inputClasses(Boolean(error)), "h-9 min-h-hit appearance-none pr-9")}>
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((o) => (
              <option key={o.value} value={o.value} disabled={o.disabled}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden width={16} height={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-subtle" />
        </div>
      )}
    </Field>
  );
}
```

`src/ui/forms/Checkbox.tsx`:

```tsx
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface ChoiceProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type"> {
  id: string;
  label: string;
  hint?: string;
}

export function choiceClasses(round: boolean) {
  return cn(
    "mt-0.5 h-4 w-4 shrink-0 border border-border-input bg-surface accent-[var(--color-accent)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
    round ? "rounded-pill" : "rounded-sm",
  );
}

export function Checkbox({ id, label, hint, className, ...rest }: ChoiceProps) {
  return (
    <div className={cn("flex items-start gap-2", className)}>
      <input {...rest} id={id} type="checkbox" aria-describedby={hint ? `${id}-hint` : undefined} className={choiceClasses(false)} />
      <label htmlFor={id} className="text-sm text-text">
        {label}
        {hint && (
          <span id={`${id}-hint`} className="block text-text-secondary">
            {hint}
          </span>
        )}
      </label>
    </div>
  );
}
```

`src/ui/forms/Radio.tsx`:

```tsx
import { cn } from "@/lib/cn";
import { choiceClasses, type ChoiceProps } from "./Checkbox";

export function Radio({ id, label, hint, className, ...rest }: ChoiceProps) {
  return (
    <div className={cn("flex items-start gap-2", className)}>
      <input {...rest} id={id} type="radio" aria-describedby={hint ? `${id}-hint` : undefined} className={choiceClasses(true)} />
      <label htmlFor={id} className="text-sm text-text">
        {label}
        {hint && (
          <span id={`${id}-hint`} className="block text-text-secondary">
            {hint}
          </span>
        )}
      </label>
    </div>
  );
}
```

`src/ui/forms/Switch.tsx`:

```tsx
"use client";

import { cn } from "@/lib/cn";

interface SwitchProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Switch({ id, label, checked, onChange, disabled = false, className }: SwitchProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-pill transition-colors duration-fast",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-accent" : "bg-border-input",
        )}
      >
        <span className={cn("inline-block h-5 w-5 rounded-pill bg-surface shadow-card transition-transform duration-fast", checked ? "translate-x-5" : "translate-x-0.5")} />
      </button>
      <label htmlFor={id} className="text-sm text-text">
        {label}
      </label>
    </div>
  );
}
```

`src/ui/forms/SearchField.tsx`:

```tsx
"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { inputClasses } from "./Field";

interface SearchFieldProps {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchField({ id, label = "Search", value, onChange, placeholder, className }: SearchFieldProps) {
  return (
    <div className={cn("relative flex items-center", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search aria-hidden width={16} height={16} className="pointer-events-none absolute left-3 text-text-subtle" />
      <input
        id={id}
        type="search"
        value={value}
        placeholder={placeholder ?? label}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClasses(false), "h-9 min-h-hit pl-9 pr-9")}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="absolute right-2 flex h-6 w-6 items-center justify-center rounded-sm text-text-subtle hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <X aria-hidden width={14} height={14} />
        </button>
      )}
    </div>
  );
}
```

`src/ui/forms/Filters.tsx`:

```tsx
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

interface FiltersProps {
  chips: { key: string; label: string }[];
  onRemove: (key: string) => void;
  onClearAll?: () => void;
  className?: string;
}

export function Filters({ chips, onRemove, onClearAll, className }: FiltersProps) {
  if (chips.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {chips.map((chip) => (
        <span key={chip.key} className="inline-flex h-7 items-center gap-1 rounded-pill border border-border bg-surface pl-3 pr-1 text-sm text-text">
          {chip.label}
          <button
            type="button"
            aria-label={`Remove filter ${chip.label}`}
            onClick={() => onRemove(chip.key)}
            className="flex h-5 w-5 items-center justify-center rounded-pill text-text-subtle hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <X aria-hidden width={12} height={12} />
          </button>
        </span>
      ))}
      {onClearAll && (
        <button type="button" onClick={onClearAll} className="text-sm font-medium text-accent-text hover:underline">
          Clear all
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests** — `npx tsx --tsconfig tsconfig.test.json --test tests/ui-forms.test.mjs` → pass; `npx tsc --noEmit` → clean.

- [ ] **Step 5: Commit**

```bash
git add src/ui/forms tests/ui-forms.test.mjs
git commit -m "feat(ui): accessible form controls, search and filter chips"
```

---

### Task 10: Overlays — Modal, Sheet, Tooltip, Menu, Toast

**Files:**
- Create in `src/ui/overlays/`: `useDialog.ts`, `Modal.tsx`, `Sheet.tsx`, `Tooltip.tsx`, `Menu.tsx`, `Toast.tsx`
- Test: `tests/ui-overlays.test.mjs`

**Interfaces:**
- Consumes: `IconButton`, `Button` (Task 7); `.animate-in` class (Task 2 tokens).
- Produces:
  - `useDialog(open: boolean, onClose: () => void): RefObject<HTMLDivElement | null>` — Esc closes; focus moves into the panel on open and back to the opener on close; Tab trapped; body scroll locked.
  - `Modal({ open: boolean; onClose: () => void; title: string; size?: "sm"|"md"|"lg"; footer?: ReactNode; children })`
  - `Sheet({ open; onClose; title; side?: "bottom"|"right"; footer?; children })`
  - `Tooltip({ content: string; children: ReactElement })`
  - `interface MenuItem { id: string; label: string; icon?: LucideIcon; critical?: boolean; onSelect: () => void }`; `Menu({ label: string; items: MenuItem[]; trigger?: "button"|"icon" })`
  - `ToastProvider({ children })`; `useToast(): { show(t: { tone?: "info"|"success"|"warning"|"critical"; message: string; durationMs?: number }): void }`

- [ ] **Step 1: Write the failing test** — `tests/ui-overlays.test.mjs`

```js
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
```

- [ ] **Step 2: Run to verify it fails** — `npx tsx --tsconfig tsconfig.test.json --test tests/ui-overlays.test.mjs` → FAIL.

- [ ] **Step 3: Implement**

`src/ui/overlays/useDialog.ts`:

```ts
"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function useDialog(open: boolean, onClose: () => void): RefObject<HTMLDivElement | null> {
  const panel = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const first = panel.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel.current)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const head = items[0];
      const tail = items[items.length - 1];
      if (e.shiftKey && document.activeElement === head) {
        e.preventDefault();
        tail.focus();
      } else if (!e.shiftKey && document.activeElement === tail) {
        e.preventDefault();
        head.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open]);

  return panel;
}
```

`src/ui/overlays/Modal.tsx`:

```tsx
"use client";

import { useId, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { IconButton } from "@/ui/actions/IconButton";
import { useDialog } from "./useDialog";

const SIZE = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-3xl" } as const;

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: keyof typeof SIZE;
  footer?: ReactNode;
  children: ReactNode;
}

export function Modal({ open, onClose, title, size = "md", footer, children }: ModalProps) {
  const titleId = useId();
  const panel = useDialog(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div aria-hidden className="absolute inset-0 bg-[var(--brand-black)] opacity-50" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn("animate-in relative flex max-h-[90vh] w-full flex-col rounded-lg bg-surface-raised text-text shadow-3 focus:outline-none", SIZE[size])}
      >
        <header className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-3">
          <h2 id={titleId} className="text-base font-semibold">
            {title}
          </h2>
          <IconButton icon={X} label="Close" size="sm" onClick={onClose} />
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-border-subtle px-5 py-3">{footer}</footer>}
      </div>
    </div>
  );
}
```

`src/ui/overlays/Sheet.tsx`:

```tsx
"use client";

import { useId, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { IconButton } from "@/ui/actions/IconButton";
import { useDialog } from "./useDialog";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: "bottom" | "right";
  footer?: ReactNode;
  children: ReactNode;
}

export function Sheet({ open, onClose, title, side = "bottom", footer, children }: SheetProps) {
  const titleId = useId();
  const panel = useDialog(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div aria-hidden className="absolute inset-0 bg-[var(--brand-black)] opacity-50" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "animate-in absolute flex flex-col bg-surface-raised text-text shadow-3 focus:outline-none",
          side === "right" ? "right-0 top-0 h-full w-full max-w-md" : "bottom-0 left-0 max-h-[85vh] w-full rounded-t-lg",
        )}
      >
        <header className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-3">
          <h2 id={titleId} className="text-base font-semibold">
            {title}
          </h2>
          <IconButton icon={X} label="Close" size="sm" onClick={onClose} />
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-border-subtle px-5 py-3">{footer}</footer>}
      </div>
    </div>
  );
}
```

`src/ui/overlays/Tooltip.tsx`:

```tsx
"use client";

import { cloneElement, useId, useState, type ReactElement } from "react";
import { cn } from "@/lib/cn";

interface TooltipProps {
  content: string;
  children: ReactElement<{ "aria-describedby"?: string }>;
}

export function Tooltip({ content, children }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      {cloneElement(children, { "aria-describedby": id })}
      <span
        role="tooltip"
        id={id}
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-sm bg-text px-2 py-1 text-xs text-surface shadow-2",
          open ? "block" : "sr-only",
        )}
      >
        {content}
      </span>
    </span>
  );
}
```

`src/ui/overlays/Menu.tsx`:

```tsx
"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/actions/Button";
import { IconButton } from "@/ui/actions/IconButton";

export interface MenuItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  critical?: boolean;
  onSelect: () => void;
}

interface MenuProps {
  label: string;
  items: MenuItem[];
  trigger?: "button" | "icon";
}

export function Menu({ label, items, trigger = "icon" }: MenuProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const nodes = Array.from(root.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    const i = nodes.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") setOpen(false);
    if (e.key === "ArrowDown" && nodes.length) {
      e.preventDefault();
      nodes[(i + 1) % nodes.length].focus();
    }
    if (e.key === "ArrowUp" && nodes.length) {
      e.preventDefault();
      nodes[(i - 1 + nodes.length) % nodes.length].focus();
    }
  };

  const triggerProps = {
    "aria-haspopup": "menu" as const,
    "aria-expanded": open,
    "aria-controls": open ? menuId : undefined,
    onClick: () => setOpen((v) => !v),
  };

  return (
    <div ref={root} className="relative inline-block" onKeyDown={onKeyDown}>
      {trigger === "icon" ? (
        <IconButton icon={MoreHorizontal} label={label} variant="secondary" {...triggerProps} />
      ) : (
        <Button variant="secondary" {...triggerProps}>
          {label}
        </Button>
      )}
      {open && (
        <div id={menuId} role="menu" aria-label={label} className="animate-in absolute right-0 z-40 mt-1 min-w-48 rounded-md bg-surface-raised p-1 shadow-2">
          {items.map(({ id, label: itemLabel, icon: Glyph, critical, onSelect }) => (
            <button
              key={id}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                onSelect();
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-surface-hover focus:bg-surface-hover focus:outline-none",
                critical ? "text-danger" : "text-text",
              )}
            >
              {Glyph && <Glyph aria-hidden width={16} height={16} strokeWidth={1.5} />}
              {itemLabel}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

`src/ui/overlays/Toast.tsx`:

```tsx
"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastTone = "info" | "success" | "warning" | "critical";

interface ToastInput {
  tone?: ToastTone;
  message: string;
  durationMs?: number;
}

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

const TONE: Record<ToastTone, string> = {
  info: "border-l-info",
  success: "border-l-success",
  warning: "border-l-warning",
  critical: "border-l-danger",
};

const MAX_VISIBLE = 3;
const ToastContext = createContext<{ show: (t: ToastInput) => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setItems((all) => all.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const show = useCallback(
    ({ tone = "info", message, durationMs = 5000 }: ToastInput) => {
      const id = nextId.current++;
      setItems((all) => [...all.slice(-(MAX_VISIBLE - 1)), { id, tone, message }]);
      if (durationMs > 0) timers.current.set(id, setTimeout(() => dismiss(id), durationMs));
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((timer) => clearTimeout(timer));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
        {items.map((t) => (
          <div
            key={t.id}
            role={t.tone === "critical" ? "alert" : "status"}
            className={cn("animate-in pointer-events-auto flex items-start gap-3 rounded-md border-l-4 bg-surface-raised px-4 py-3 text-sm text-text shadow-3", TONE[t.tone])}
          >
            <p className="flex-1">{t.message}</p>
            <button type="button" aria-label="Dismiss notification" onClick={() => dismiss(t.id)} className="text-text-subtle hover:text-text">
              <X aria-hidden width={16} height={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
```

- [ ] **Step 4: Run tests** — `npx tsx --tsconfig tsconfig.test.json --test tests/ui-overlays.test.mjs` → pass; `npx tsc --noEmit` → clean.

- [ ] **Step 5: Commit**

```bash
git add src/ui/overlays tests/ui-overlays.test.mjs
git commit -m "feat(ui): modal, sheet, tooltip, menu and toast with focus management"
```

---

### Task 11: Tabs, SegmentedControl and IndexTable

**Files:**
- Create: `src/ui/navigation/Tabs.tsx`, `src/ui/navigation/SegmentedControl.tsx`, `src/ui/data/IndexTable.tsx`
- Test: `tests/ui-data-nav.test.mjs`

**Interfaces:**
- Consumes: `choiceClasses` (Task 9), `Skeleton` (Task 6).
- Produces:
  - `Tabs({ label: string; tabs: { id: string; label: string; badge?: ReactNode }[]; selected: string; onSelect: (id: string) => void; className? })` — tablist only; each tab is `id="tab-<id>"`, `aria-controls="tabpanel-<id>"`; the caller renders `role="tabpanel" id="tabpanel-<id>" aria-labelledby="tab-<id>"`.
  - `SegmentedControl<T extends string>({ label: string; options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; className? })`
  - `interface Column<Row> { id: string; header: string; cell: (row: Row) => ReactNode; align?: "start" | "end"; sortable?: boolean; width?: string }`
  - `type SortState = { columnId: string; direction: "asc" | "desc" }`
  - `IndexTable<Row>({ label; rows: Row[]; rowKey: (r: Row) => string; columns: Column<Row>[]; selectable?; selected?: Set<string>; onSelectionChange?: (next: Set<string>) => void; bulkActions?: ReactNode; sort?: SortState; onSortChange?: (s: SortState) => void; loading?: boolean; empty?: ReactNode; onRowClick?: (r: Row) => void; className? })`

- [ ] **Step 1: Write the failing test** — `tests/ui-data-nav.test.mjs`

```js
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
  assert.match(html, /aria-label="Select row o1" checked=""/);
});

test("IndexTable loading and empty states", () => {
  assert.match(render(IndexTable, { label: "Orders", rows: [], columns, rowKey: (r) => r.id, loading: true }), /aria-busy="true"/);
  assert.match(render(IndexTable, { label: "Orders", rows: [], columns, rowKey: (r) => r.id, empty: "No orders" }), /No orders/);
});
```

- [ ] **Step 2: Run to verify it fails** — `npx tsx --tsconfig tsconfig.test.json --test tests/ui-data-nav.test.mjs` → FAIL.

- [ ] **Step 3: Implement**

`src/ui/navigation/Tabs.tsx`:

```tsx
"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface TabsProps {
  label: string;
  tabs: { id: string; label: string; badge?: ReactNode }[];
  selected: string;
  onSelect: (id: string) => void;
  className?: string;
}

export function Tabs({ label, tabs, selected, onSelect, className }: TabsProps) {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = tabs.findIndex((t) => t.id === selected);
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!delta || i < 0) return;
    e.preventDefault();
    const next = tabs[(i + delta + tabs.length) % tabs.length];
    onSelect(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  };
  return (
    <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className={cn("flex gap-1 overflow-x-auto border-b border-border", className)}>
      {tabs.map((t) => {
        const active = t.id === selected;
        return (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={`tabpanel-${t.id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onSelect(t.id)}
            className={cn(
              "-mb-px inline-flex h-10 min-h-hit items-center gap-2 whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors duration-fast",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
              active ? "border-accent text-text" : "border-transparent text-text-secondary hover:text-text",
            )}
          >
            {t.label}
            {t.badge}
          </button>
        );
      })}
    </div>
  );
}
```

`src/ui/navigation/SegmentedControl.tsx`:

```tsx
"use client";

import { cn } from "@/lib/cn";

interface SegmentedControlProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({ label, options, value, onChange, className }: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex rounded-md bg-surface-hover p-0.5", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-8 min-h-hit rounded-sm px-3 text-sm font-medium transition-colors duration-fast",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
            o.value === value ? "bg-surface text-text shadow-card" : "text-text-secondary hover:text-text",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
```

`src/ui/data/IndexTable.tsx`:

```tsx
"use client";

import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { choiceClasses } from "@/ui/forms/Checkbox";
import { Skeleton } from "@/ui/primitives/Skeleton";

export interface Column<Row> {
  id: string;
  header: string;
  cell: (row: Row) => ReactNode;
  align?: "start" | "end";
  sortable?: boolean;
  width?: string;
}

export type SortState = { columnId: string; direction: "asc" | "desc" };

interface IndexTableProps<Row> {
  label: string;
  rows: Row[];
  rowKey: (row: Row) => string;
  columns: Column<Row>[];
  selectable?: boolean;
  selected?: Set<string>;
  onSelectionChange?: (next: Set<string>) => void;
  bulkActions?: ReactNode;
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  loading?: boolean;
  empty?: ReactNode;
  onRowClick?: (row: Row) => void;
  className?: string;
}

const LOADING_ROWS = 5;
const NO_SELECTION: ReadonlySet<string> = new Set();

export function IndexTable<Row>({
  label,
  rows,
  rowKey,
  columns,
  selectable = false,
  selected = NO_SELECTION as Set<string>,
  onSelectionChange,
  bulkActions,
  sort,
  onSortChange,
  loading = false,
  empty,
  onRowClick,
  className,
}: IndexTableProps<Row>) {
  const keys = rows.map(rowKey);
  const allSelected = keys.length > 0 && keys.every((k) => selected.has(k));
  const toggleAll = () => onSelectionChange?.(allSelected ? new Set() : new Set(keys));
  const toggle = (k: string) => {
    const next = new Set(selected);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    onSelectionChange?.(next);
  };
  const colSpan = columns.length + (selectable ? 1 : 0);

  return (
    <div className={cn("overflow-hidden rounded-lg bg-surface shadow-card", className)}>
      {selectable && selected.size > 0 && (
        <div className="flex items-center gap-3 border-b border-border-subtle bg-accent-subtle px-4 py-2 text-sm">
          <span className="font-medium text-accent-text">{selected.size} selected</span>
          {bulkActions}
        </div>
      )}
      <div className="overflow-x-auto">
        <table aria-label={label} aria-busy={loading || undefined} className="w-full border-collapse text-sm">
          <thead className="bg-canvas text-left text-text-secondary">
            <tr>
              {selectable && (
                <th scope="col" className="w-10 px-4 py-2">
                  <input type="checkbox" aria-label="Select all" checked={allSelected} onChange={toggleAll} className={choiceClasses(false)} />
                </th>
              )}
              {columns.map((c) => {
                const active = sort?.columnId === c.id;
                const ariaSort = active ? (sort?.direction === "asc" ? "ascending" : "descending") : undefined;
                const SortIcon = active ? (sort?.direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
                return (
                  <th
                    key={c.id}
                    scope="col"
                    aria-sort={ariaSort}
                    style={c.width ? { width: c.width } : undefined}
                    className={cn("px-4 py-2 font-medium", c.align === "end" && "text-right")}
                  >
                    {c.sortable && onSortChange ? (
                      <button
                        type="button"
                        onClick={() => onSortChange({ columnId: c.id, direction: active && sort?.direction === "asc" ? "desc" : "asc" })}
                        className="inline-flex items-center gap-1 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                      >
                        {c.header}
                        <SortIcon aria-hidden width={14} height={14} />
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: LOADING_ROWS }, (_, i) => (
                <tr key={`loading-${i}`}>
                  <td colSpan={colSpan} className="p-0">
                    <Skeleton variant="table-row" />
                  </td>
                </tr>
              ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="px-4 py-10 text-center text-text-secondary">
                  {empty ?? "Nothing to show"}
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((row) => {
                const k = rowKey(row);
                const isSelected = selected.has(k);
                return (
                  <tr
                    key={k}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn("border-t border-border-subtle", onRowClick && "cursor-pointer hover:bg-surface-hover", isSelected && "bg-accent-subtle")}
                  >
                    {selectable && (
                      <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" aria-label={`Select row ${k}`} checked={isSelected} onChange={() => toggle(k)} className={choiceClasses(false)} />
                      </td>
                    )}
                    {columns.map((c) => (
                      <td key={c.id} className={cn("px-4 py-2 text-text", c.align === "end" && "text-right tabular-nums")}>
                        {c.cell(row)}
                      </td>
                    ))}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests** — `npx tsx --tsconfig tsconfig.test.json --test tests/ui-data-nav.test.mjs` → pass; `npx tsc --noEmit` → clean.

- [ ] **Step 5: Commit**

```bash
git add src/ui/navigation src/ui/data tests/ui-data-nav.test.mjs
git commit -m "feat(ui): tabs, segmented control and index table with sort, selection and states"
```

---

### Task 12: Page, Layout and AppShell

**Files:**
- Create: `src/ui/layout/Page.tsx`, `src/ui/layout/Layout.tsx`, `src/ui/layout/AppShell.tsx`
- Test: `tests/ui-layout.test.mjs`

**Interfaces:**
- Consumes: `Logo` (Task 8), `ThemeToggle` + `Surface` (Task 5).
- Produces:
  - `Page({ title: string; subtitle?: string; backHref?: string; backLabel?: string; badges?: ReactNode; primaryAction?: ReactNode; secondaryActions?: ReactNode; width?: "default"|"narrow"|"full"; className?; children })`
  - `Layout({ className?; children })`, `LayoutSection({ variant?: "main"|"aside"; className?; children })`
  - `interface NavItem { href: string; label: string; icon: LucideIcon; active?: boolean }`
  - `AppShell({ surface: Surface; nav?: NavItem[]; topBarSlot?: ReactNode; user?: ReactNode; fullBleed?: boolean; children })`

- [ ] **Step 1: Write the failing test** — `tests/ui-layout.test.mjs`

```js
import test from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { LayoutDashboard } from "lucide-react";
import { render } from "./helpers/render.mjs";

const { Page } = await import("../src/ui/layout/Page.tsx");
const { Layout, LayoutSection } = await import("../src/ui/layout/Layout.tsx");
const { AppShell } = await import("../src/ui/layout/AppShell.tsx");

test("Page renders a single h1, back link and actions", () => {
  const html = render(Page, { title: "Suppliers", backHref: "/admin", primaryAction: "Add", children: "body" });
  assert.equal((html.match(/<h1/g) ?? []).length, 1);
  assert.match(html, /href="\/admin"/);
  assert.match(html, /aria-label="Back"/);
  assert.match(html, /Add/);
});

test("Layout splits main and aside", () => {
  const html = render(Layout, { children: [h(LayoutSection, { key: "m", children: "a" }), h(LayoutSection, { key: "s", variant: "aside", children: "b" })] });
  assert.match(html, /lg:grid-cols-3/);
  assert.match(html, /lg:col-span-2/);
  assert.match(html, /lg:col-span-1/);
});

test("AppShell: skip link, nav with current page, theme toggle, logo, main landmark", () => {
  const html = render(AppShell, {
    surface: "admin",
    nav: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, active: true }],
    children: "content",
  });
  assert.match(html, /href="#main"[^>]*>Skip to content/);
  assert.match(html, /aria-current="page"/);
  assert.match(html, /role="radiogroup"/);
  assert.match(html, /logo-badge\.webp/);
  assert.match(html, /<main id="main"/);
});

test("AppShell fullBleed has no chrome", () => {
  const html = render(AppShell, { surface: "kiosk", fullBleed: true, children: "k" });
  assert.doesNotMatch(html, /<nav/);
  assert.doesNotMatch(html, /<header/);
  assert.match(html, /<main id="main"/);
});
```

- [ ] **Step 2: Run to verify it fails** — `npx tsx --tsconfig tsconfig.test.json --test tests/ui-layout.test.mjs` → FAIL.

- [ ] **Step 3: Implement**

`src/ui/layout/Page.tsx`:

```tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";

const WIDTH = { default: "max-w-6xl", narrow: "max-w-3xl", full: "max-w-none" } as const;

interface PageProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  badges?: ReactNode;
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
  width?: keyof typeof WIDTH;
  className?: string;
  children: ReactNode;
}

export function Page({ title, subtitle, backHref, backLabel = "Back", badges, primaryAction, secondaryActions, width = "default", className, children }: PageProps) {
  return (
    <div className={cn("mx-auto w-full px-4 py-6 md:px-6", WIDTH[width], className)}>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-2">
          {backHref && (
            <Link
              href={backHref}
              aria-label={backLabel}
              className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              <ArrowLeft aria-hidden width={18} height={18} strokeWidth={1.5} />
            </Link>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-semibold text-text">{title}</h1>
              {badges}
            </div>
            {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
          </div>
        </div>
        {(primaryAction || secondaryActions) && (
          <div className="flex items-center gap-2">
            {secondaryActions}
            {primaryAction}
          </div>
        )}
      </header>
      {children}
    </div>
  );
}
```

`src/ui/layout/Layout.tsx`:

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Layout({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("grid grid-cols-1 gap-4 lg:grid-cols-3", className)}>{children}</div>;
}

export function LayoutSection({ variant = "main", className, children }: { variant?: "main" | "aside"; className?: string; children: ReactNode }) {
  return <div className={cn("space-y-4", variant === "main" ? "lg:col-span-2" : "lg:col-span-1", className)}>{children}</div>;
}
```

`src/ui/layout/AppShell.tsx`:

```tsx
import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "@/ui/display/Logo";
import { ThemeToggle } from "@/ui/theme/ThemeToggle";
import type { Surface } from "@/ui/theme/theme";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
}

interface AppShellProps {
  surface: Surface;
  nav?: NavItem[];
  topBarSlot?: ReactNode;
  user?: ReactNode;
  fullBleed?: boolean;
  children: ReactNode;
}

export function AppShell({ surface, nav = [], topBarSlot, user, fullBleed = false, children }: AppShellProps) {
  if (fullBleed) {
    return (
      <main id="main" className="min-h-screen">
        {children}
      </main>
    );
  }
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[70] focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-text focus:shadow-3"
      >
        Skip to content
      </a>
      {/* Brand moment: the top bar is logo-black in both themes (spec §4.1, principle 7). */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 bg-[var(--brand-black)] px-4 text-[var(--mygd-gray-0)]">
        <Logo size={36} />
        <span className="font-display text-lg uppercase tracking-wide">My German Doener</span>
        <div className="ml-auto flex items-center gap-3">
          {topBarSlot}
          <ThemeToggle surface={surface} />
          {user}
        </div>
      </header>
      <div className="flex flex-1">
        {nav.length > 0 && (
          <nav aria-label="Main" className="hidden w-60 shrink-0 border-r border-border bg-surface p-3 md:block">
            <ul className="space-y-0.5">
              {nav.map(({ href, label, icon: Glyph, active }) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors duration-fast",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
                      active ? "bg-accent-subtle text-accent-text" : "text-text-secondary hover:bg-surface-hover hover:text-text",
                    )}
                  >
                    <Glyph aria-hidden width={18} height={18} strokeWidth={1.5} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <main id="main" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
```

Fallback: if Step 4 fails with a router-context error from `next/link` (it can need the App Router context outside Next), replace `Link` with a plain `<a>` in `Page.tsx` and `AppShell.tsx`, keeping the same props and classes, and re-run. Do not change the test.

- [ ] **Step 4: Run tests** — `npx tsx --tsconfig tsconfig.test.json --test tests/ui-layout.test.mjs` → pass; `npx tsc --noEmit` → clean.

- [ ] **Step 5: Commit**

```bash
git add src/ui/layout tests/ui-layout.test.mjs
git commit -m "feat(ui): page header, two-column layout and branded app shell"
```

---

### Task 13: Barrel export, `/dev/ui` gallery, smoke script, DESIGN.md

**Files:**
- Create: `src/ui/index.ts`, `src/app/dev/ui/page.tsx`, `src/app/dev/ui/Gallery.tsx`, `scripts/ui-gallery-smoke.mjs`
- Modify: `DESIGN.md` (section 2), `package.json` (script `ui:smoke`), `.gitignore` (`artifacts/`)
- Test: `tests/ui-barrel.test.mjs`

**Interfaces:**
- Consumes: everything above.
- Produces: `@/ui` barrel; route `/dev/ui` (404 in production); `npm run ui:smoke`.

- [ ] **Step 1: Write the failing test** — `tests/ui-barrel.test.mjs`

```js
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

test("gallery 404s in production", () => {
  const src = readFileSync("src/app/dev/ui/page.tsx", "utf8");
  assert.match(src, /process\.env\.NODE_ENV === "production"/);
  assert.match(src, /notFound\(\)/);
});

test("DESIGN.md documents the new primary and both themes", () => {
  const md = readFileSync("DESIGN.md", "utf8");
  assert.match(md, /#E50C7E/);
  assert.match(md, /### Light theme/);
  assert.match(md, /### Dark theme/);
});
```

- [ ] **Step 2: Run to verify it fails** — `npx tsx --tsconfig tsconfig.test.json --test tests/ui-barrel.test.mjs` → FAIL.

- [ ] **Step 3: Implement `src/ui/index.ts`**

```ts
export * from "./theme/theme";
export { themeBootScript } from "./theme/bootScript";
export { SurfaceRoot } from "./theme/SurfaceRoot";
export { ThemeToggle } from "./theme/ThemeToggle";
export { Icon, type IconSize } from "./primitives/Icon";
export { Stack, Inline, Grid, type Gap } from "./primitives/Stack";
export { Divider } from "./primitives/Divider";
export { VisuallyHidden } from "./primitives/VisuallyHidden";
export { Spinner } from "./primitives/Spinner";
export { Skeleton } from "./primitives/Skeleton";
export { Button, buttonClasses, type ButtonProps, type ButtonSize, type ButtonVariant } from "./actions/Button";
export { IconButton, type IconButtonProps } from "./actions/IconButton";
export { ButtonGroup } from "./actions/ButtonGroup";
export { Card, CardHeader, CardSection } from "./display/Card";
export { Badge, TONE_CLASSES, type Tone } from "./display/Badge";
export { Banner } from "./display/Banner";
export { EmptyState } from "./display/EmptyState";
export { ErrorState } from "./display/ErrorState";
export { DescriptionList } from "./display/DescriptionList";
export { Stat } from "./display/Stat";
export { PriceTag } from "./display/PriceTag";
export { Thumbnail } from "./display/Thumbnail";
export { Avatar, initials } from "./display/Avatar";
export { ProgressBar } from "./display/ProgressBar";
export { Kbd } from "./display/Kbd";
export { Logo, LOGO_ALT } from "./display/Logo";
export { Field, inputClasses, type FieldA11y } from "./forms/Field";
export { TextField } from "./forms/TextField";
export { Textarea } from "./forms/Textarea";
export { Select, type SelectOption } from "./forms/Select";
export { Checkbox, choiceClasses, type ChoiceProps } from "./forms/Checkbox";
export { Radio } from "./forms/Radio";
export { Switch } from "./forms/Switch";
export { SearchField } from "./forms/SearchField";
export { Filters } from "./forms/Filters";
export { useDialog } from "./overlays/useDialog";
export { Modal } from "./overlays/Modal";
export { Sheet } from "./overlays/Sheet";
export { Tooltip } from "./overlays/Tooltip";
export { Menu, type MenuItem } from "./overlays/Menu";
export { ToastProvider, useToast } from "./overlays/Toast";
export { Tabs } from "./navigation/Tabs";
export { SegmentedControl } from "./navigation/SegmentedControl";
export { IndexTable, type Column, type SortState } from "./data/IndexTable";
export { Page } from "./layout/Page";
export { Layout, LayoutSection } from "./layout/Layout";
export { AppShell, type NavItem } from "./layout/AppShell";
```

- [ ] **Step 4: Implement the gallery**

`src/app/dev/ui/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { Gallery } from "./Gallery";

export const metadata = { title: "UI kit — MYGD" };

export default function DevUiPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Gallery />;
}
```

`src/app/dev/ui/Gallery.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Archive, Bell, ClipboardList, Flame, Inbox, LayoutDashboard, Leaf, Plus, Printer, Trash2 } from "lucide-react";
import {
  AppShell, Avatar, Badge, Banner, Button, ButtonGroup, Card, CardHeader, CardSection, Checkbox, DescriptionList, EmptyState,
  ErrorState, Filters, IconButton, IndexTable, Kbd, Layout, LayoutSection, Menu, Modal, Page, PriceTag, ProgressBar, Radio,
  SearchField, SegmentedControl, Select, Sheet, Skeleton, Spinner, Stat, SurfaceRoot, Switch, Tabs, TextField, Textarea,
  Thumbnail, ToastProvider, Tooltip, useToast, type Column, type SortState, type Surface, type Tone,
} from "@/ui";

const SURFACES: Surface[] = ["admin", "pos", "staff", "kds", "order", "kiosk", "display", "board"];
const TONES: Tone[] = ["neutral", "info", "success", "warning", "critical", "highlight", "accent"];

interface OrderRow {
  id: string;
  customer: string;
  status: "Open" | "Ready" | "Done";
  total: number;
}

const ORDERS: OrderRow[] = [
  { id: "EMBA-0412", customer: "Walk-in", status: "Open", total: 14.5 },
  { id: "EMBA-0413", customer: "Shopify #1042", status: "Ready", total: 22 },
  { id: "EMBA-0414", customer: "Walk-in", status: "Done", total: 7.9 },
];

const STATUS_TONE: Record<OrderRow["status"], Tone> = { Open: "warning", Ready: "success", Done: "neutral" };

const COLUMNS: Column<OrderRow>[] = [
  { id: "id", header: "Order", cell: (r) => <span className="font-mono">{r.id}</span>, sortable: true },
  { id: "customer", header: "Customer", cell: (r) => r.customer },
  { id: "status", header: "Status", cell: (r) => <Badge tone={STATUS_TONE[r.status]} dot>{r.status}</Badge> },
  { id: "total", header: "Total", cell: (r) => <PriceTag amount={r.total} />, align: "end", sortable: true },
];

function sortOrders(rows: OrderRow[], sort: SortState): OrderRow[] {
  const dir = sort.direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (sort.columnId === "total") return (a.total - b.total) * dir;
    return a.id.localeCompare(b.id) * dir;
  });
}

function ToastDemo() {
  const { show } = useToast();
  return (
    <ButtonGroup>
      <Button variant="secondary" onClick={() => show({ tone: "success", message: "Order EMBA-0413 marked ready" })}>
        Success toast
      </Button>
      <Button variant="secondary" onClick={() => show({ tone: "critical", message: "Kitchen printer offline" })}>
        Critical toast
      </Button>
    </ButtonGroup>
  );
}

function Showcase() {
  const [tab, setTab] = useState("open");
  const [size, setSize] = useState<"s" | "m" | "l">("m");
  const [query, setQuery] = useState("");
  const [storeOpen, setStoreOpen] = useState(true);
  const [modal, setModal] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortState>({ columnId: "id", direction: "asc" });
  const [loadingTable, setLoadingTable] = useState(false);

  const visible = sortOrders(ORDERS.filter((o) => o.id.toLowerCase().includes(query.toLowerCase())), sort);

  return (
    <Page
      title="UI kit"
      subtitle="Every component, variant and state — switch theme in the top bar and density in the selector."
      badges={<Badge tone="accent">Dev only</Badge>}
      primaryAction={<Button icon={Plus}>Primary action</Button>}
      secondaryActions={
        <Menu
          label="More actions"
          items={[
            { id: "archive", label: "Archive", icon: Archive, onSelect: () => {} },
            { id: "delete", label: "Delete", icon: Trash2, critical: true, onSelect: () => {} },
          ]}
        />
      }
    >
      <Layout>
        <LayoutSection>
          <Card>
            <CardHeader title="Buttons" description="Variants, sizes and states" />
            <div className="flex flex-wrap gap-2">
              {(["primary", "secondary", "tertiary", "critical", "plain"] as const).map((v) => (
                <Button key={v} variant={v}>
                  {v}
                </Button>
              ))}
            </div>
            <CardSection className="mt-4">
              <div className="flex flex-wrap items-center gap-2">
                {(["sm", "md", "lg", "xl"] as const).map((s) => (
                  <Button key={s} size={s} variant="secondary">
                    Size {s}
                  </Button>
                ))}
                <Button loading>Paying</Button>
                <Button disabled>Disabled</Button>
                <Tooltip content="Reprint kitchen ticket">
                  <IconButton icon={Printer} label="Reprint" variant="secondary" />
                </Tooltip>
              </div>
            </CardSection>
          </Card>

          <Card padding="none">
            <div className="px-4 pt-4">
              <CardHeader
                title="Orders"
                actions={
                  <Button size="sm" variant="secondary" onClick={() => setLoadingTable((v) => !v)}>
                    Toggle loading
                  </Button>
                }
              />
              <Tabs label="Order status" selected={tab} onSelect={setTab} tabs={[{ id: "open", label: "Open", badge: <Badge>2</Badge> }, { id: "done", label: "Done" }]} />
            </div>
            <div id={`tabpanel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <SearchField id="order-search" value={query} onChange={setQuery} className="w-64" />
                <Filters chips={query ? [{ key: "q", label: `Search: ${query}` }] : []} onRemove={() => setQuery("")} onClearAll={() => setQuery("")} />
              </div>
              <IndexTable
                label="Orders"
                rows={visible}
                rowKey={(r) => r.id}
                columns={COLUMNS}
                selectable
                selected={selected}
                onSelectionChange={setSelected}
                bulkActions={<Button size="sm" variant="secondary" icon={Archive}>Archive</Button>}
                sort={sort}
                onSortChange={setSort}
                loading={loadingTable}
                empty={<EmptyState icon={Inbox} title="No matching orders" description="Try a different search." />}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Forms" />
            <div className="grid gap-4 md:grid-cols-2">
              <TextField id="g-name" label="Product name" placeholder="Classic Döner" hint="Shown on the menu board" />
              <TextField id="g-price" label="Price" prefix="€" error="Price is required" />
              <Select id="g-loc" label="Location" placeholder="Choose a location" defaultValue="" options={[{ value: "emba", label: "Emba" }, { value: "paphos", label: "Paphos" }]} />
              <Textarea id="g-note" label="Kitchen note" />
              <div className="space-y-2">
                <Checkbox id="g-veg" label="Vegetarian" hint="Adds the leaf badge" />
                <Radio id="g-r1" name="g-size" label="Regular" defaultChecked />
                <Radio id="g-r2" name="g-size" label="Large" />
              </div>
              <div className="space-y-3">
                <Switch id="g-open" label="Store open" checked={storeOpen} onChange={setStoreOpen} />
                <SegmentedControl label="Portion" value={size} onChange={setSize} options={[{ value: "s", label: "S" }, { value: "m", label: "M" }, { value: "l", label: "L" }]} />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="States" />
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton variant="card" />
              <Skeleton variant="text" lines={4} />
              <EmptyState icon={ClipboardList} title="No checklists due" description="Opening checks appear here at 09:00." />
              <ErrorState description="The supplier list could not be loaded." onRetry={() => {}} />
            </div>
          </Card>
        </LayoutSection>

        <LayoutSection variant="aside">
          <Card>
            <CardHeader title="Badges" />
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <Badge key={t} tone={t}>
                  {t}
                </Badge>
              ))}
              <Badge tone="success" icon={Leaf}>Veggie</Badge>
              <Badge tone="critical" icon={Flame}>Spicy</Badge>
            </div>
          </Card>
          <Banner tone="warning" title="Low stock: lamb" action={<Button size="sm" variant="secondary">Reorder</Button>}>
            2.4 kg left — below par level.
          </Banner>
          <Banner tone="info" title="New Shopify order" onDismiss={() => {}} />
          <Card>
            <CardHeader title="Today" />
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Revenue" value={<PriceTag amount={1284.5} size="lg" />} delta={{ value: "+8%", trend: "up" }} />
              <Stat label="Avg ticket" value="4:12" delta={{ value: "-12s", trend: "down" }} />
            </div>
            <CardSection className="mt-4">
              <ProgressBar value={72} label="Daily target" />
            </CardSection>
          </Card>
          <Card>
            <CardHeader title="Details" />
            <DescriptionList
              items={[
                { term: "Price", description: <PriceTag amount={9.5} /> },
                { term: "Was", description: <PriceTag amount={11} strike /> },
                { term: "Shortcut", description: <Kbd>Esc</Kbd> },
              ]}
            />
            <CardSection className="mt-2">
              <div className="flex items-center gap-3">
                <Thumbnail alt="Döner box" />
                <Avatar name="Rico Meyer" />
                <Spinner label="Syncing" />
              </div>
            </CardSection>
          </Card>
          <Card>
            <CardHeader title="Overlays" />
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setModal(true)}>
                Open modal
              </Button>
              <Button variant="secondary" onClick={() => setSheet(true)}>
                Open sheet
              </Button>
              <ToastDemo />
            </div>
          </Card>
        </LayoutSection>
      </Layout>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Edit item"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => setModal(false)}>Save</Button>
          </>
        }
      >
        <TextField id="m-name" label="Name" defaultValue="Classic Döner" />
      </Modal>
      <Sheet open={sheet} side="right" onClose={() => setSheet(false)} title="Cart">
        <EmptyState icon={Bell} title="Your cart is empty" />
      </Sheet>
    </Page>
  );
}

export function Gallery() {
  const [surface, setSurface] = useState<Surface>("admin");
  return (
    <SurfaceRoot key={surface} surface={surface}>
      <ToastProvider>
        <AppShell
          surface={surface}
          nav={[
            { href: "/dev/ui", label: "UI kit", icon: LayoutDashboard, active: true },
            { href: "/admin", label: "Admin", icon: ClipboardList },
          ]}
          topBarSlot={
            <label className="flex items-center gap-2 text-sm">
              <span>Density</span>
              <select aria-label="Density" value={surface} onChange={(e) => setSurface(e.target.value as Surface)} className="h-8 rounded-md bg-surface px-2 text-text">
                {SURFACES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          }
        >
          <Showcase />
        </AppShell>
      </ToastProvider>
    </SurfaceRoot>
  );
}
```

(When `SurfaceRoot` remounts client-side via `key`, React does not run its inline script; `ThemeToggle` re-applies the stored theme for the new surface on mount.)

- [ ] **Step 5: Smoke script** — `scripts/ui-gallery-smoke.mjs`

```js
// Usage: `npm run dev` (port 3000) in one terminal, then `npm run ui:smoke`.
// Loads /dev/ui in light and dark, fails on console errors or a wrong data-theme,
// and writes full-page screenshots to artifacts/ui-gallery/.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.UI_SMOKE_URL ?? "http://localhost:3000/dev/ui";
mkdirSync("artifacts/ui-gallery", { recursive: true });

const browser = await chromium.launch();
let failed = false;
try {
  for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: theme });
    await context.addInitScript((t) => window.localStorage.setItem("mygd.theme.admin", t), theme);
    const page = await context.newPage();
    const errors = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(BASE, { waitUntil: "networkidle" });
    const applied = await page.getAttribute("[data-surface]", "data-theme");
    if (applied !== theme) {
      failed = true;
      console.error(`✗ ${theme}: data-theme is "${applied}"`);
    }
    await page.screenshot({ path: `artifacts/ui-gallery/admin-${theme}.png`, fullPage: true });
    if (errors.length) {
      failed = true;
      console.error(`✗ ${theme}: console errors\n  ${errors.join("\n  ")}`);
    } else {
      console.log(`✓ ${theme}: no console errors, screenshot saved`);
    }
    await context.close();
  }
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
```

`package.json` → add to `scripts`: `"ui:smoke": "node scripts/ui-gallery-smoke.mjs",`
`.gitignore` → add a line `artifacts/`.

- [ ] **Step 6: Update `DESIGN.md`** — replace section `## 2. Color System & OKLCH Token Architecture` (everything from that heading up to the next `## ` heading) with:

```markdown
## 2. Color System (v2 — 2026-09-28)

**Source of truth:** `src/ui/tokens.css`. This section documents it; if they disagree, the code wins.

- **Primary:** `#E50C7E` — MYGD magenta from the official badge logo. Primary buttons, selection,
  focus ring. White labels on magenta are bold (contrast 4.48:1). Accent *text* uses `#B8095F`
  on light and `#F170B0` on dark (≥ 5.9:1).
- **Brand black:** `#000000` — logo, app top bar, brand headers (same in both themes).
- **Status:** success (green), warning (amber — replaces the old orange `#FF5722`), danger (red),
  info (cyan — formerly the brand cyan `#00FCED`), highlight (gold — bestsellers).

### Light theme
Canvas `#F4F4F5`, cards `#FFFFFF`, text `#18181B`, secondary `#52525B`, subtle `#65656D`,
borders `#D4D4D8`, input borders `#8A8A93`.

### Dark theme
Canvas `#0B0B0C`, cards `#18181B`, text `#FAFAFA`, secondary `#A1A1AA`, subtle `#8A8A93`,
borders `#333338`, input borders `#6B6B73`.

### Design language
Shopify-admin-grade calm — cards on a quiet canvas, one accent per view, page-header anatomy,
scannable index tables, small line icons — expressed in MYGD's own identity. No Shopify assets,
code or icons (their licence forbids look-alike stand-alone apps). Icons: `lucide-react`,
1.5 stroke, 16/20/24 px.

The previous muted grey `#71717A` failed WCAG AA on cards (2.92:1) and is retired.
```

- [ ] **Step 7: Verify everything**

Run: `npx tsx --tsconfig tsconfig.test.json --test tests/ui-barrel.test.mjs` → pass.
Run: `npm test` → every `ui-*` test passes; legacy results unchanged from Task 1's baseline.
Run: `npx tsc --noEmit` → no new errors. Run: `npm run lint` → no new errors in `src/ui` or `src/app/dev`.
Run: `npm run build` → succeeds.
Run: `npm run dev`, then in another terminal `npm run ui:smoke` → `✓ light` and `✓ dark`. Open `artifacts/ui-gallery/admin-light.png` and `admin-dark.png`: magenta primary buttons, black top bar with the badge logo, readable text in both.
Manual keyboard check at `http://localhost:3000/dev/ui`: first Tab shows "Skip to content"; open the modal → Tab cycles inside it → Esc closes it and focus returns to "Open modal"; switch Density to `kiosk` → `xl` button and inputs grow to 64px.
Manual regression check: `/`, `/pos`, `/admin` look exactly as before.

- [ ] **Step 8: Commit**

```bash
git add src/ui/index.ts src/app/dev scripts/ui-gallery-smoke.mjs package.json .gitignore DESIGN.md tests/ui-barrel.test.mjs
git commit -m "feat(ui): kit barrel, /dev/ui gallery, Playwright smoke and DESIGN.md v2"
```

---

## After this plan

Sub-projects 2–9 (kiosk → web order → menu boards → wait display → POS → KDS → staff → admin). Each: Stitch mockups in light and dark using these tokens → approval → its own spec and plan → migrate that surface onto `SurfaceRoot` + `@/ui`, lowering `tests/fixtures/ui-hex-baseline.json` in the same PR.
