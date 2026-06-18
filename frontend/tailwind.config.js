/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        pool: {
          bg: "#080816",
          surface: "#0e0e24",
          card: "#141432",
          border: "#1e1e4a",
          violet: "#7c3aed",
          "violet-light": "#a78bfa",
          "violet-dim": "#4c1d95",
          green: "#10b981",
          "green-light": "#34d399",
          muted: "#525280",
          text: "#eef0f6",
          "text-dim": "#8b8db0",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "pool-gradient":
          "linear-gradient(135deg, #080816 0%, #0e0e24 50%, #080816 100%)",
        "violet-glow":
          "radial-gradient(ellipse at center, rgba(124,58,237,0.12) 0%, transparent 70%)",
        "glass-shine":
          "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%, rgba(255,255,255,0.02) 100%)",
      },
      animation: {
        "spin-slow": "spin 3s linear infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
        "slide-up": "slideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
        shimmer: "shimmer 2s linear infinite",
        glow: "glow 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", filter: "blur(4px)" },
          "100%": { opacity: "1", filter: "blur(0)" },
        },
        slideUp: {
          "0%": { transform: "translateY(24px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(124,58,237,0.15)" },
          "50%": { boxShadow: "0 0 40px rgba(124,58,237,0.3)" },
        },
        drift: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "25%": { transform: "translate(30px, -20px)" },
          "50%": { transform: "translate(-20px, 30px)" },
          "75%": { transform: "translate(20px, 10px)" },
        },
        "count-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "shimmer-btn": {
          "0%": { left: "-100%" },
          "100%": { left: "200%" },
        },
      },
      boxShadow: {
        violet: "0 0 30px rgba(124,58,237,0.25), 0 0 60px rgba(124,58,237,0.1)",
        "violet-sm": "0 0 15px rgba(124,58,237,0.2)",
        "violet-lg": "0 0 50px rgba(124,58,237,0.35), 0 8px 32px rgba(0,0,0,0.4)",
        green: "0 0 20px rgba(16,185,129,0.25)",
        "inner-glow": "inset 0 1px 0 0 rgba(255,255,255,0.05)",
        card: "0 4px 24px rgba(0,0,0,0.3), 0 0 1px rgba(255,255,255,0.05)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
    },
  },
  plugins: [],
};