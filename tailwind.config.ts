import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./store/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0a0f17",
          900: "#111926",
          800: "#182231",
        },
        mist: {
          50: "#f8f4ed",
          100: "#efe7da",
          200: "#dcc9a8",
        },
        ember: {
          400: "#ff9c54",
          500: "#ef7f32",
          600: "#cc5f18",
        },
        mint: {
          300: "#7bdcc2",
          400: "#49c4a3",
        },
      },
      boxShadow: {
        panel: "0 24px 80px rgba(5, 9, 16, 0.42)",
        soft: "0 16px 40px rgba(10, 15, 23, 0.16)",
      },
      backgroundImage: {
        "hero-grid":
          "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
      },
    },
  },
  plugins: [],
};

export default config;
