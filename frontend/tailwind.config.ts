import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: { DEFAULT: "#0F3D2E", 900: "#0A2A20", 700: "#175A44", 100: "#DCEBE3" },
        cream: "#FBF7EE",
        vanilla: { DEFAULT: "#F3E6C4", deep: "#E8D49A" },
        mango: "#F6B820",
        strawberry: "#E5384F",
        mint: { DEFAULT: "#A8E6CF", deep: "#6CCBA6" },
        ink: "#16231D",
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-rounded", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: { card: "1.5rem", pill: "999px" },
      keyframes: { float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-14px)" } } },
      animation: { float: "float 6s ease-in-out infinite" },
      boxShadow: {
        card: "0 1px 2px rgba(15,61,46,.06), 0 8px 24px -12px rgba(15,61,46,.18)",
        lift: "0 2px 4px rgba(15,61,46,.08), 0 18px 36px -14px rgba(15,61,46,.28)",
      },
    },
  },
  plugins: [],
};
export default config;
