import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useI18n } from "../i18n/context";
import WalletButton from "./WalletButton";
import ThemeToggle from "./ThemeToggle";

const navItems = [
  { to: "/deposit", labelKey: "deposit" },
  { to: "/withdraw", labelKey: "withdraw" },
  { to: "/auditor", labelKey: "auditor" },
  { to: "/stats", labelKey: "stats" },
  { to: "/status", labelKey: "status" },
] as const;

function LangSwitch() {
  const { lang, toggleLang } = useI18n();
  return (
    <button
      onClick={toggleLang}
      className="inline-flex items-center h-11 rounded-md border border-pool-border overflow-hidden font-mono text-[13px] cursor-pointer"
      aria-label={lang === "es" ? "Cambiar idioma a inglés" : "Switch language to Spanish"}
    >
      <span className={`px-2.5 h-full inline-flex items-center ${lang === "es" ? "bg-pool-text text-pool-bg" : "text-pool-muted"}`}>ES</span>
      <span className={`px-2.5 h-full inline-flex items-center ${lang === "en" ? "bg-pool-text text-pool-bg" : "text-pool-muted"}`}>EN</span>
    </button>
  );
}

export default function Navbar(_props: { onStartTour?: () => void }) {
  const { pathname } = useLocation();
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="border-b border-pool-border bg-pool-bg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 xl:px-0 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 min-h-[44px]" onClick={() => setMobileOpen(false)}>
          <img src="/logo.svg" alt="" className="w-8 h-8" />
          <span className="text-[17px] tracking-tight text-pool-text">
            <span className="font-semibold">Mongli</span><span className="font-normal text-pool-text-dim">Pool</span>
          </span>
          <span className="hidden lg:inline-flex font-mono text-[11px] text-pool-muted border border-pool-border rounded px-1.5 py-0.5 ml-1">testnet</span>
        </Link>

        <div className="hidden md:flex items-center gap-1 h-full">
          {navItems.map(({ to, labelKey }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? "page" : undefined}
                className={`relative h-full inline-flex items-center px-3 text-[15px] transition-colors ${
                  active ? "text-pool-text" : "text-pool-text-dim hover:text-pool-text"
                }`}
              >
                {t("nav", labelKey)}
                {active && <span className="absolute left-3 right-3 bottom-0 h-[2px] bg-pool-green" />}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden md:inline-flex" />
          <div className="hidden md:block"><LangSwitch /></div>
          <div className="hidden md:block"><WalletButton /></div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden inline-flex w-11 h-11 items-center justify-center rounded-md border border-pool-border text-pool-text"
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-pool-border bg-pool-bg animate-fade-in">
          <div className="px-4 py-3">
            {[{ to: "/", labelKey: "home" as const }, ...navItems].map(({ to, labelKey }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                aria-current={pathname === to ? "page" : undefined}
                className={`flex items-center justify-between min-h-[48px] border-b border-pool-border text-base ${
                  pathname === to ? "text-pool-text font-medium" : "text-pool-text-dim"
                }`}
              >
                {t("nav", labelKey)}
                {pathname === to && <span className="w-1.5 h-1.5 rounded-full bg-pool-green" />}
              </Link>
            ))}
            <div className="flex flex-wrap items-center gap-2 pt-4 pb-1">
              <WalletButton />
              <ThemeToggle />
              <LangSwitch />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
