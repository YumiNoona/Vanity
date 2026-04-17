/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx}",
    "./index.html"
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        background: "#0A0A0A",
        foreground: "#FAFAFA",
        card: {
          DEFAULT: "#1A1A1A",
          foreground: "#FAFAFA",
        },
        popover: {
          DEFAULT: "#1A1A1A",
          foreground: "#FAFAFA",
        },
        primary: {
          DEFAULT: "#F59E0B",
          foreground: "#111111",
        },
        secondary: {
          DEFAULT: "#27272A",
          foreground: "#FAFAFA",
        },
        muted: {
          DEFAULT: "#27272A",
          foreground: "#A1A1AA",
        },
        accent: {
          DEFAULT: "#FCD34D",
          foreground: "#111111",
        },
        destructive: {
          DEFAULT: "#7F1D1D",
          foreground: "#FAFAFA",
        },
        border: "rgba(255, 255, 255, 0.05)",
        input: "rgba(255, 255, 255, 0.1)",
        ring: "#F59E0B",
      },
      fontFamily: {
        syne: ["Syne", "sans-serif"],
        sans: ["DM Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
}
