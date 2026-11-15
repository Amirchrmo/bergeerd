import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
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
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Custom burger shop colors
        "burger-red": {
          DEFAULT: "hsl(var(--burger-red))",
          dark: "hsl(var(--burger-red-dark))",
          light: "hsl(var(--burger-red-light))",
        },
        gold: {
          DEFAULT: "hsl(var(--gold))",
          soft: "hsl(var(--gold-soft))",
        },
        ember: "hsl(var(--ember))",
        brand: "#d2080b",
        cream: "hsl(var(--cream))",
        ink: "hsl(var(--ink))",
      },
      fontFamily: {
        sans: ['Rezvan', 'sans-serif'],
        persian: ['Rezvan', 'sans-serif'],
        display: ['Rezvan', 'Vazirmatn', 'sans-serif'],
        body: ['Vazirmatn', 'Rezvan', 'sans-serif'],
      },
      boxShadow: {
        card: "var(--shadow-card)",
        float: "var(--shadow-float)",
        glow: "var(--shadow-glow)",
      },
    },
  },
  plugins: [],
} satisfies Config;
