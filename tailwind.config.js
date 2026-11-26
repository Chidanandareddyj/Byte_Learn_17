/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: ".5625rem", /* 9px */
        md: ".375rem", /* 6px */
        sm: ".1875rem", /* 3px */
      },
      colors: {
        /* Chalk & Slate palette */
        slate: "rgb(var(--slate-rgb) / <alpha-value>)",
        board: "rgb(var(--board-rgb) / <alpha-value>)",
        line: "rgb(var(--line-rgb) / <alpha-value>)",
        chalk: "rgb(var(--chalk-rgb) / <alpha-value>)",
        muted: {
          DEFAULT: "rgb(var(--muted-rgb) / <alpha-value>)",
          foreground: "rgb(var(--muted-rgb) / <alpha-value>)",
          border: "rgb(var(--line-rgb) / <alpha-value>)",
        },
        yellow: "rgb(var(--yellow-rgb) / <alpha-value>)",
        "yellow-bright": "var(--yellow-bright)",
        pink: "rgb(var(--pink-rgb) / <alpha-value>)",
        blue: "rgb(var(--blue-rgb) / <alpha-value>)",
        green: "rgb(var(--green-rgb) / <alpha-value>)",
        wood: "rgb(var(--wood-rgb) / <alpha-value>)",
        paper: {
          DEFAULT: "rgb(var(--paper-rgb) / <alpha-value>)",
          rule: "rgb(var(--paper-rule-rgb) / <alpha-value>)",
        },
        pen: "rgb(var(--pen-rgb) / <alpha-value>)",

        /* Semantic aliases used by shadcn-style components */
        background: "rgb(var(--slate-rgb) / <alpha-value>)",
        foreground: "rgb(var(--chalk-rgb) / <alpha-value>)",
        border: "rgb(var(--line-rgb) / <alpha-value>)",
        input: "rgb(var(--line-rgb) / <alpha-value>)",
        card: {
          DEFAULT: "rgb(var(--board-rgb) / <alpha-value>)",
          foreground: "rgb(var(--chalk-rgb) / <alpha-value>)",
          border: "rgb(var(--line-rgb) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "rgb(var(--board-rgb) / <alpha-value>)",
          foreground: "rgb(var(--chalk-rgb) / <alpha-value>)",
          border: "rgb(var(--line-rgb) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "rgb(var(--yellow-rgb) / <alpha-value>)",
          foreground: "rgb(var(--slate-rgb) / <alpha-value>)",
          border: "rgb(var(--yellow-rgb) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--board-rgb) / <alpha-value>)",
          foreground: "rgb(var(--chalk-rgb) / <alpha-value>)",
          border: "rgb(var(--line-rgb) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--line-rgb) / <alpha-value>)",
          foreground: "rgb(var(--chalk-rgb) / <alpha-value>)",
          border: "rgb(var(--line-rgb) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--pink-rgb) / <alpha-value>)",
          foreground: "rgb(var(--slate-rgb) / <alpha-value>)",
          border: "rgb(var(--pink-rgb) / <alpha-value>)",
        },
        ring: "rgb(var(--yellow-rgb) / <alpha-value>)",
        chart: {
          1: "rgb(var(--yellow-rgb) / <alpha-value>)",
          2: "rgb(var(--green-rgb) / <alpha-value>)",
          3: "rgb(var(--blue-rgb) / <alpha-value>)",
          4: "rgb(var(--pink-rgb) / <alpha-value>)",
          5: "rgb(var(--chalk-rgb) / <alpha-value>)",
        },
        sidebar: {
          ring: "rgb(var(--yellow-rgb) / <alpha-value>)",
          DEFAULT: "rgb(var(--board-rgb) / <alpha-value>)",
          foreground: "rgb(var(--chalk-rgb) / <alpha-value>)",
          border: "rgb(var(--line-rgb) / <alpha-value>)",
        },
        "sidebar-primary": {
          DEFAULT: "rgb(var(--yellow-rgb) / <alpha-value>)",
          foreground: "rgb(var(--slate-rgb) / <alpha-value>)",
          border: "rgb(var(--yellow-rgb) / <alpha-value>)",
        },
        "sidebar-accent": {
          DEFAULT: "rgb(var(--line-rgb) / <alpha-value>)",
          foreground: "rgb(var(--chalk-rgb) / <alpha-value>)",
          border: "rgb(var(--line-rgb) / <alpha-value>)",
        },
        status: {
          online: "rgb(var(--green-rgb) / <alpha-value>)",
          away: "rgb(var(--yellow-rgb) / <alpha-value>)",
          busy: "rgb(var(--pink-rgb) / <alpha-value>)",
          offline: "rgb(var(--muted-rgb) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-atkinson)", '"Noto Sans Devanagari"', '"Noto Sans Telugu"', '"Noto Sans Tamil"', '"Noto Sans Kannada"', '"Noto Sans Malayalam"', '"Noto Sans Bengali"', '"Noto Sans Gujarati"', "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-fraunces)", "Georgia", "Times New Roman", "serif"],
        mono: ["var(--font-space-mono)", '"Noto Sans Devanagari"', '"Noto Sans Telugu"', '"Noto Sans Tamil"', '"Noto Sans Kannada"', '"Noto Sans Malayalam"', '"Noto Sans Bengali"', '"Noto Sans Gujarati"', "ui-monospace", "SFMono-Regular", "monospace"],
        hand: ["var(--font-caveat)", "Segoe Script", "cursive"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        gradient: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        grid: {
          "0%": { transform: "translateY(-50%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      animation: {
        gradient: "gradient 8s linear infinite",
        grid: "grid 15s linear infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("tailwindcss-animate"),
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@tailwindcss/typography"),
  ],
}
