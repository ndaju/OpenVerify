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
        discord: {
          50: "#e8f0fe",
          100: "#c8dafc",
          200: "#92b5f9",
          300: "#5b8ef5",
          400: "#2b6bf0",
          500: "#1a5cd4",
          600: "#1449b0",
          700: "#10388c",
          800: "#0d2b6e",
          900: "#0a1f52",
        },
        surface: {
          50: "#f8f9fa",
          100: "#f1f3f5",
          200: "#e9ecef",
          300: "#dee2e6",
          400: "#ced4da",
          500: "#adb5bd",
          600: "#868e96",
          700: "#495057",
          800: "#343a40",
          900: "#212529",
          950: "#1a1d23",
          1000: "#0f1115",
        },
        vault: {
          gold: "#f0b429",
          green: "#22c55e",
          red: "#ef4444",
          blue: "#3b82f6",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-in-left": "slideInLeft 0.2s ease-out",
        "pulse-dot": "pulseDot 1.4s infinite ease-in-out",
        "bounce-in": "bounceIn 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-10px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        pulseDot: {
          "0%, 80%, 100%": { transform: "scale(0.75)" },
          "40%": { transform: "scale(1)" },
        },
        bounceIn: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "50%": { transform: "scale(1.02)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
