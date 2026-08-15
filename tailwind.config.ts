import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
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
      fontFamily: {
        heading: ["Oswald", "sans-serif"],
        body: ["Figtree", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        "magenta-glow": "0 0 25px rgba(229, 13, 126, 0.45)",
        "cyan-glow": "0 0 25px rgba(0, 252, 237, 0.45)",
        "orange-glow": "0 0 25px rgba(255, 87, 34, 0.45)",
      },
    },
  },
  plugins: [],
};
export default config;
