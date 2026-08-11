import type { Config } from "tailwindcss";

/**
 * v2.1 visual facelift design system — Maxpromo Digital visual language.
 * White-background light system, single orange accent, monospace for
 * system/`//` labels. Supersedes the 2026-05-29 dark-premium lock in full
 * (ADR-002). Tokens are intentionally few so the brand stays consistent
 * and reviewable.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./config/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // v2.1 light system — see docs/visual-facelift-v2.1.md §3.
        surface: {
          DEFAULT: "#FFFFFF", // page background
          subtle: "#F8F9FA", // section background
        },
        footer: {
          DEFAULT: "#161A1D", // footer stays dark by spec §13
          text: "#D6D8DB",
        },

        // Single accent: Maxpromo orange (v2.1 §3 — shared across old + new surfaces)
        accent: {
          DEFAULT: "#F97316",
          hover: "#FB8B3D",
          soft: "#F9731614", // ~8% alpha for tints/fills
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      maxWidth: {
        content: "1500px", // v2.1 §5 — was 1120px under the dark-premium lock
      },
      fontSize: {
        // v2.1 §4 typography scale. Fluid via clamp() so 76-84/52-56/26-30
        // ranges hold from mobile to desktop without separate breakpoint utilities.
        hero: [
          "clamp(2.75rem, 2rem + 3.2vw, 5.25rem)", // 44px -> 84px, target 76-84 desktop
          { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "800" },
        ],
        "section-title": [
          "clamp(2rem, 1.5rem + 2vw, 3.5rem)", // 32px -> 56px, target 52-56 desktop
          { lineHeight: "1.15", letterSpacing: "-0.01em", fontWeight: "700" },
        ],
        "card-title": [
          "1.625rem", // 26px
          { lineHeight: "1.3", fontWeight: "600" },
        ],
        body: ["1.25rem", { lineHeight: "1.7" }], // 20px / 1.7 per §4
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        ticker: "ticker 40s linear infinite",
        "fade-up": "fade-up 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
