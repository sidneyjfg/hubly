import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./store/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(215 33% 8%)",
        foreground: "hsl(210 20% 98%)",
        muted: "hsl(215 20% 17%)",
        border: "hsl(214 20% 20%)",
        panel: "hsl(222 29% 11%)",
        panelAlt: "hsl(217 32% 14%)",
        primary: {
          DEFAULT: "hsl(212 100% 60%)",
          foreground: "hsl(210 40% 98%)"
        },
        success: "hsl(155 72% 42%)",
        warning: "hsl(42 95% 58%)",
        danger: "hsl(0 75% 60%)"
      },
      boxShadow: {
        soft: "0 16px 40px rgba(15, 23, 42, 0.25)",
        glow: "0 0 0 1px rgba(96, 165, 250, 0.18), 0 18px 50px rgba(37, 99, 235, 0.18)"
      },
      backgroundImage: {
        "grid-radial":
          "radial-gradient(circle at top, rgba(59,130,246,0.14), transparent 34%), linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)"
      },
      backgroundSize: {
        "grid-radial": "auto, 32px 32px, 32px 32px"
      },
      fontFamily: {
        sans: ["Satoshi", "General Sans", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
