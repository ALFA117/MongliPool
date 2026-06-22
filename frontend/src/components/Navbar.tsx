import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowDownToLine, ArrowUpFromLine, Eye, Activity, BarChart3, Globe, Menu, X, Home } from "lucide-react";
import { useI18n } from "../i18n/context";
import WalletButton from "./WalletButton";

const navItems = [
  { to: "/", labelKey: "home", Icon: Home },
  { to: "/deposit", labelKey: "deposit", Icon: ArrowDownToLine },
  { to: "/withdraw", labelKey: "withdraw", Icon: ArrowUpFromLine },
  { to: "/auditor", labelKey: "auditor", Icon: Eye },
  { to: "/stats", labelKey: "stats", Icon: BarChart3 },
  { to: "/status", labelKey: "status", Icon: Activity },
] as const;

export default function Navbar({ onStartTour }: { onStartTour?: () => void }) {
  const { pathname } = useLocation();
  const { lang, toggleLang, t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="border-b border-white/[0.04] bg-pool-bg/70 backdrop-blur-2xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group" onClick={() => setMobileOpen(false)}>
          <img src="/logo.svg" alt="MongliPool" className="w-9 h-9 group-hover:drop-shadow-[0_0_8px_rgba(5,213,161,0.5)] transition-all duration-300" />
          <span className="text-[17px] tracking-tight bg-gradient-to-r from-pool-green to-pool-violet bg-clip-text text-transparent">
            <span className="font-bold">Mongli</span><span className="font-light">Pool</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-0.5">
          {navItems.map(({ to, labelKey, Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                pathname === to
                  ? "bg-pool-violet/12 text-pool-violet-light shadow-inner-glow"
                  : "text-pool-text-dim hover:text-pool-text hover:bg-white/[0.04]"
              }`}
            >
              <Icon size={15} />
              {t("nav", labelKey)}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold text-pool-text-dim hover:text-pool-text hover:bg-white/[0.04] transition-all tracking-wider uppercase"
            aria-label="Toggle language"
          >
            <Globe size={13} />
            {lang}
          </button>
          <WalletButton />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2.5 rounded-lg text-pool-text-dim hover:text-pool-text hover:bg-white/[0.04] transition-colors"
            aria-label="Menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/[0.04] bg-pool-bg/95 backdrop-blur-2xl animate-slide-up">
          <div className="px-4 py-3 space-y-1">
            {navItems.map(({ to, labelKey, Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${
                  pathname === to
                    ? "bg-pool-violet/12 text-pool-violet-light"
                    : "text-pool-text-dim hover:text-pool-text hover:bg-white/[0.04]"
                }`}
              >
                <Icon size={18} />
                {t("nav", labelKey)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}