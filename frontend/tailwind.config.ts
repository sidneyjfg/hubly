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
        panel: "hsl(235 53% 10%)",
        panelAlt: "hsl(232 44% 13%)",
        primary: {
          DEFAULT: "#6F3FF5",
          foreground: "hsl(210 40% 98%)"
        },
        secondary: "#3A8CFF",
        success: "hsl(155 72% 42%)",
        warning: "hsl(42 95% 58%)",
        danger: "hsl(0 75% 60%)"
      },
      boxShadow: {
        soft: "0 18px 44px rgba(11, 15, 35, 0.34)",
        glow: "0 0 0 1px rgba(111, 63, 245, 0.22), 0 18px 50px rgba(58, 140, 255, 0.18)"
      },
      backgroundImage: {
        "grid-radial":
          "radial-gradient(circle at top, rgba(111,63,245,0.16), transparent 34%), linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)"
      },
      backgroundSize: {
        "grid-radial": "auto, 32px 32px, 32px 32px"
      },
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
