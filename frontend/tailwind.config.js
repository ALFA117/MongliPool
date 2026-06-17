/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // MongliPool brand palette
        pool: {
          bg: "#0d0d1a",
          surface: "#12122b",
          card: "#1a1a3a",
          border: "#2a2a5a",
          violet: "#7c3aed",
          "violet-light": "#a855f7",
          "violet-dim": "#4c1d95",
          green: "#10b981",
          "green-light": "#34d399",
          muted: "#6b7280",
          text: "#e2e8f0",
          "text-dim": "#94a3b8",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "pool-gradient":
          "linear-gradient(135deg, #0d0d1a 0%, #12122b 50%, #0d0d1a 100%)",
        "violet-glow":
          "radial-gradient(ellipse at center, rgba(124,58,237,0.15) 0%, transparent 70%)",
      },
      animation: {
        "spin-slow": "spin 3s linear infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      boxShadow: {
        violet: "0 0 30px rgba(124,58,237,0.3)",
        "violet-sm": "0 0 15px rgba(124,58,237,0.2)",
        green: "0 0 20px rgba(16,185,129,0.3)",
      },
    },
  },
  plugins: [],
};