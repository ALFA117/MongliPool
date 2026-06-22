/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        pool: {
          bg: "#0A1128",
          surface: "#0d1a3a",
          card: "#111f44",
          border: "#1a2d5a",
          violet: "#0066FF",
          "violet-light": "#3399FF",
          "violet-dim": "#003d99",
          green: "#05D5A1",
          "green-light": "#00F5D4",
          accent: "#00F5D4",
          muted: "#4a5e80",
          text: "#FFFFFF",
          "text-dim": "#94a3b8",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "pool-gradient":
          "linear-gradient(135deg, #0A1128 0%, #0d1a3a 50%, #0A1128 100%)",
        "violet-glow":
          "radial-gradient(ellipse at center, rgba(5,213,161,0.08) 0%, rgba(0,102,255,0.04) 40%, transparent 70%)",
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
        violet: "0 0 30px rgba(0,102,255,0.25), 0 0 60px rgba(5,213,161,0.1)",
        "violet-sm": "0 0 15px rgba(0,102,255,0.2)",
        "violet-lg": "0 0 50px rgba(0,102,255,0.35), 0 8px 32px rgba(0,0,0,0.4)",
        green: "0 0 20px rgba(5,213,161,0.3)",
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