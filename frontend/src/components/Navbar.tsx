import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowDownToLine, ArrowUpFromLine, Eye, Activity, Globe, Menu, X } from "lucide-react";
import { useI18n } from "../i18n/context";
import WalletButton from "./WalletButton";

const navItems = [
  { to: "/deposit", labelKey: "deposit", Icon: ArrowDownToLine },
  { to: "/withdraw", labelKey: "withdraw", Icon: ArrowUpFromLine },
  { to: "/auditor", labelKey: "auditor", Icon: Eye },
  { to: "/status", labelKey: "status", Icon: Activity },
] as const;

export default function Navbar() {
  const { pathname } = useLocation();
  const { lang, toggleLang, t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="border-b border-white/5 bg-pool-bg/60 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group" onClick={() => setMobileOpen(false)}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pool-violet to-purple-600 flex items-center justify-center shadow-violet-sm group-hover:shadow-violet transition-shadow">
            <span className="text-white font-bold text-base">M</span>
          </div>
          <span className="font-semibold text-pool-text text-lg tracking-tight">MongliPool</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map(({ to, labelKey, Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                pathname === to
                  ? "bg-pool-violet/15 text-pool-violet-light"
                  : "text-pool-text-dim hover:text-pool-text hover:bg-white/5"
              }`}
            >
              <Icon size={16} />
              {t("nav", labelKey)}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-pool-text-dim hover:text-pool-text hover:bg-white/5 transition-all"
            aria-label="Toggle language"
          >
            <Globe size={14} />
            {lang.toUpperCase()}
          </button>
          <WalletButton />
          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-pool-text-dim hover:text-pool-text hover:bg-white/5 transition-colors"
            aria-label="Menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 bg-pool-bg/95 backdrop-blur-xl animate-slide-up">
          <div className="px-4 py-3 space-y-1">
            {navItems.map(({ to, labelKey, Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  pathname === to
                    ? "bg-pool-violet/15 text-pool-violet-light"
                    : "text-pool-text-dim hover:text-pool-text hover:bg-white/5"
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