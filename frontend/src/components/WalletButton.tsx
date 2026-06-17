import { useState, useEffect, useRef } from "react";
import { Wallet, LogOut, Loader2 } from "lucide-react";
import { useWallet } from "../lib/walletContext";
import { useI18n } from "../i18n/context";

export default function WalletButton() {
  const { t } = useI18n();
  const { address, loading, connect, disconnect } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (address) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 hover:bg-white/[0.06] transition-all cursor-pointer"
        >
          <div className="w-2 h-2 rounded-full bg-pool-green animate-pulse" />
          <span className="font-mono text-xs text-pool-text-dim">
            {address.slice(0, 4)}...{address.slice(-4)}
          </span>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 glass-panel overflow-hidden z-50 animate-slide-up">
            <div className="px-3 py-2.5 border-b border-white/[0.06]">
              <p className="font-mono text-[10px] text-pool-text-dim break-all leading-relaxed">{address}</p>
            </div>
            <button
              onClick={() => { disconnect(); setMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              {t("nav", "disconnect")}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => connect().catch(() => {})}
      disabled={loading}
      className="btn-primary py-2 px-4 text-sm inline-flex items-center gap-2"
    >
      {loading ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          {t("nav", "connecting")}
        </>
      ) : (
        <>
          <Wallet size={14} />
          {t("nav", "connectWallet")}
        </>
      )}
    </button>
  );
}