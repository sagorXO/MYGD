import { Figtree, JetBrains_Mono, Oswald } from "next/font/google";

// [ADR] Context: fonts came from a render-blocking Google @import and vanish offline (kiosk, D-2).
// Decision: next/font downloads them at build time and self-hosts them.
// Consequence: `next build` needs network once; runtime needs none; no layout shift.
const display = Oswald({ subsets: ["latin", "latin-ext"], weight: ["500", "600", "700"], variable: "--font-display", display: "swap" });
// Weights 300 and 900 and italics are used by legacy screens (218x font-black); keep until they migrate.
const body = Figtree({ subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600", "700", "800", "900"], style: ["normal", "italic"], variable: "--font-body", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-mono", display: "swap" });

export const fontVariables = [display.variable, body.variable, mono.variable].join(" ");
