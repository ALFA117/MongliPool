const c = (v) => `rgb(var(${v}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Tokens RGB en src/index.css (noche y día); Tailwind aplica la opacidad.
        // "violet" se conserva como nombre por compatibilidad, pero ahora es el azul pizarra (info).
        ink: c("--ink"),
        pool: {
          bg: c("--pool-bg"),
          surface: c("--pool-surface"),
          card: c("--pool-card"),
          border: c("--pool-border"),
          violet: c("--pool-violet"),
          "violet-light": c("--pool-violet-light"),
          "violet-dim": c("--pool-violet-dim"),
          green: c("--pool-green"),
          "green-light": c("--pool-green-light"),
          accent: c("--pool-green-light"),
          muted: c("--pool-muted"),
          text: c("--pool-text"),
          "text-dim": c("--pool-text-dim"),
          "on-accent": c("--pool-on-accent"),
        },
      },
      fontSize: {
        xs: ["0.8125rem", { lineHeight: "1.25rem" }],
        sm: ["0.9375rem", { lineHeight: "1.5rem" }],
      },
      fontFamily: {
        sans: ["Geist", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ["Newsreader", "Georgia", "serif"],
        mono: ["Geist Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      animation: {
        "spin-slow": "spin 3s linear infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
        "slide-up": "slideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
        glow: "none",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      boxShadow: {
        // Sombras duras y discretas (sin desenfoque): brutalismo moderado.
        violet: "3px 3px 0 0 rgb(var(--hard))",
        "violet-sm": "2px 2px 0 0 rgb(var(--hard))",
        "violet-lg": "4px 4px 0 0 rgb(var(--hard))",
        green: "3px 3px 0 0 rgb(var(--hard))",
        "inner-glow": "none",
        card: "none",
        hard: "4px 4px 0 0 rgb(var(--hard))",
        "hard-sm": "2px 2px 0 0 rgb(var(--hard))",
      },
      borderRadius: {
        xl: "0.5rem",
        "2xl": "0.625rem",
        "3xl": "0.75rem",
      },
    },
  },
  plugins: [],
};
