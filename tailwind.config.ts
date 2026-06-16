import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Fontes injetadas via next/font no layout.tsx
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        // Acento vermelho (estilo V4/Hunter)
        brand: {
          50: "#fff1f1",
          100: "#ffdfe0",
          200: "#ffc4c6",
          300: "#ff9a9e",
          400: "#ff5b62",
          500: "#f01b27",
          600: "#d10f1a",
          700: "#af0d15",
          800: "#901016",
          900: "#4f0508",
        },
        // Neutros escuros (50 = mais claro, 950 = quase preto)
        ink: {
          50: "#f7f7f8",
          100: "#ececef",
          200: "#d6d6dc",
          300: "#b2b2bb",
          400: "#85858f",
          500: "#5f5f68",
          600: "#46464d",
          700: "#33333a",
          800: "#1e1e22",
          850: "#171719",
          900: "#111113",
          950: "#0a0a0b",
        },
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgb(0 0 0 / 0.4), 0 4px 16px -4px rgb(0 0 0 / 0.5)",
        "soft-lg": "0 12px 40px -8px rgb(0 0 0 / 0.6)",
        glow: "0 0 0 1px rgb(240 27 39 / 0.25), 0 8px 30px -8px rgb(240 27 39 / 0.35)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          "0%": { opacity: "0", transform: "translateY(-12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
        "slide-down": "slide-down 0.25s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
