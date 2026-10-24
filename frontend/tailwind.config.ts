import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: { DEFAULT: "#05342D", 900: "#03241F", 700: "#0F574C", 100: "#E6EFEE" },
        cream: "#FAF5EE",
        vanilla: { DEFAULT: "#F2E8D9", deep: "#E3CFB5" },
        mango: "#F6B820",
        strawberry: "#E5384F",
        mint: { DEFAULT: "#A8E6CF", deep: "#6CCBA6" },
        ink: "#112724",
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-rounded", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: { card: "1.5rem", pill: "999px" },
      keyframes: { marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } }, float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-14px)" } } },
      animation: { marquee: "marquee 32s linear infinite", float: "float 6s ease-in-out infinite" },
      boxShadow: {
        card: "0 1px 2px rgba(5,52,45,.06), 0 8px 24px -12px rgba(5,52,45,.18)",
        lift: "0 2px 4px rgba(5,52,45,.08), 0 18px 36px -14px rgba(5,52,45,.28)",
      },
    },
  },
  plugins: [],
};
export default config;