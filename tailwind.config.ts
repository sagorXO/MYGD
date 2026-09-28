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
