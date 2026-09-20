const defaultTheme = require("tailwindcss/defaultTheme");
const colors = require("tailwindcss/colors");

/**
 * Reads brand colors from CSS custom properties (defined once in app/globals.css)
 * so a future palette change is a one-file edit. The custom properties store
 * space-separated RGB channels so Tailwind's opacity modifiers (e.g. bg-ink/50)
 * keep working.
 */
function withOpacity(variableName) {
  return ({ opacityValue }) =>
    opacityValue === undefined
      ? `rgb(var(${variableName}))`
      : `rgb(var(${variableName}) / ${opacityValue})`;
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ivory: withOpacity("--color-ivory"),
        ink: withOpacity("--color-ink"),
        clay: withOpacity("--color-clay"),
        "clay-deep": withOpacity("--color-clay-deep"),
        gold: withOpacity("--color-gold"),
        blush: withOpacity("--color-blush"),
        stone: { ...colors.stone, DEFAULT: withOpacity("--color-stone") },
        white: withOpacity("--color-white"),
        // Backward-compatible aliases: every existing `bg-amanat-*` / `text-amanat-*`
        // class across the app now resolves to the new palette automatically.
        "amanat-brown": withOpacity("--color-ink"),
        "amanat-terracotta": withOpacity("--color-clay"),
        "amanat-sage": withOpacity("--color-stone"),
        "amanat-cream": withOpacity("--color-ivory"),
        "amanat-gold": withOpacity("--color-gold"),
        "amanat-sand": withOpacity("--color-blush")
      },
      fontFamily: {
        heading: ["var(--font-serif)", ...defaultTheme.fontFamily.serif],
        sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans],
        body: ["var(--font-sans)", ...defaultTheme.fontFamily.sans],
        price: ["var(--font-price)", ...defaultTheme.fontFamily.serif]
      },
      letterSpacing: {
        eyebrow: "0.2em"
      },
      boxShadow: {
        soft: "0 1px 2px rgb(var(--color-ink) / 0.04), 0 12px 32px rgb(var(--color-ink) / 0.06)"
      }
    }
  },
  plugins: []
};
