import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useI18n } from "../i18n/context";

type Theme = "dark" | "light";
const KEY = "monglipool-theme";

/** Noche ↔ día. Sin elección guardada sigue al sistema (ver script en index.html). */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { lang } = useI18n();
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);

  function flip() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* modo privado: dura esta visita */
    }
    setTheme(next);
  }

  const label = lang === "es"
    ? theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
    : theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={flip}
      aria-label={label}
      title={label}
      className={`items-center justify-center w-11 h-11 rounded-md border border-pool-border text-pool-text-dim hover:text-pool-text hover:border-pool-text/40 transition-colors duration-150 inline-flex ${className}`}
    >
      {theme === "dark" ? <Moon size={17} aria-hidden="true" /> : <Sun size={17} aria-hidden="true" />}
    </button>
  );
}
