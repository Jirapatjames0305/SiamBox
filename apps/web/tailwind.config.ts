import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        maroon: {
          50: "#FBF1F1",
          100: "#F3D9D9",
          600: "#8B2D2F",
          700: "#7A2426",
          800: "#611A1C",
          900: "#4E1416",
          950: "#3A0E10",
        },
        gold: {
          300: "#E2C879",
          400: "#D4AF37",
          500: "#C8A24A",
          600: "#A8842B",
          700: "#8A6C22",
        },
        cream: {
          50: "#FCF8F1",
          100: "#F7EFE1",
          200: "#EFE2CC",
          300: "#E4D3B6",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "Cambria", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
