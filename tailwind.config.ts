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
        rrc: {
          black: "#080809",
          coal: "#111114",
          panel: "#1a1a1e",
          white: "#E9E5DF",
          off: "#A5A0A0",
          muted: "#5f5c58",
          bordeaux: "#4A1022",
          wine: "#701B32",
          navy: "#101D46",
          silver: "#B7BBC3",
          red: "#7e0a18",
          line: "rgba(233, 229, 223, 0.14)",
          "line-soft": "rgba(233, 229, 223, 0.07)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Unbounded", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "IBM Plex Mono", "ui-monospace", "monospace"],
      },
      fontSize: {
        micro: ["10px", { letterSpacing: "0.28em" }],
        ui: ["11px", { letterSpacing: "0.18em" }],
        label: ["12px", { letterSpacing: "0.12em" }],
      },
      spacing: {
        "sp-1": "4px",
        "sp-2": "8px",
        "sp-3": "16px",
        "sp-4": "24px",
        "sp-5": "40px",
        "sp-6": "72px",
        "sp-7": "120px",
      },
      transitionDuration: {
        fast: "180ms",
        norm: "450ms",
        slow: "900ms",
        cine: "1800ms",
      },
      zIndex: {
        base: "0",
        content: "10",
        overlay: "20",
        modal: "30",
        drawer: "40",
        toast: "50",
        max: "100",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      keyframes: {
        "liquid-ripple": {
          "0%": {
            transform: "scale(0)",
            opacity: "0.6",
          },
          "50%": {
            transform: "scale(2.5)",
            opacity: "0.3",
          },
          "100%": {
            transform: "scale(4)",
            opacity: "0",
          },
        },
        "hero-fade-in": {
          "0%": {
            opacity: "0",
            transform: "scale(1.05)",
          },
          "100%": {
            opacity: "1",
            transform: "scale(1)",
          },
        },
      },
      animation: {
        "liquid-ripple": "liquid-ripple 0.5s ease-out forwards",
        "hero-fade-in": "hero-fade-in 1s ease-out forwards",
      },
    },
  },
  plugins: [],
};
export default config;
