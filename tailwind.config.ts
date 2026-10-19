import type { Config } from "tailwindcss";

// Colors sampled from the official Kenzim logo.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F8F9FA",
        surface: "#FFFFFF",
        ink: "#121212",
        muted: "#5F6368",
        line: "#ECEEF0",
        primary: { DEFAULT: "#BC0000", dark: "#990000" },   // Kenya red
        accent: "#FFD300",                                   // Zimbabwe gold
        success: "#006600",                                  // logo green
      },
      borderRadius: { card: "16px", sheet: "24px" },
      boxShadow: {
        card: "0 1px 2px rgba(18,18,18,.04), 0 4px 16px rgba(18,18,18,.06)",
      },
      fontFamily: { sans: ["var(--font-jakarta)", "Inter", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
