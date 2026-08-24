/** @type {import("tailwindcss").Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        mygd: {
          charcoal: "#121214",
          surface: "#1A1A1E",
          "surface-light": "#2B2B2E",
          "surface-border": "#3A3A3E",
          magenta: "#E50D7E",
          "magenta-hover": "#C80B6E",
          cyan: "#00FCED",
          "cyan-hover": "#00D6C9",
          gold: "#E5A93C",
          orange: "#FF5722",
          "orange-hover": "#E64A19",
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
        "gold-glow": "0 0 25px rgba(229, 169, 60, 0.45)",
      },
    },
  },
};
