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
