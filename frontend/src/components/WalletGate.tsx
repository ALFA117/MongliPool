import { Wallet, Loader2, ShieldAlert, UserCircle } from "lucide-react";
import { useWallet } from "../lib/walletContext";
import { useI18n } from "../i18n/context";

export default function WalletGate({ children }: { children: React.ReactNode }) {
  const { address, loading, isGuest, connect, connectAsGuest } = useWallet();
  const { lang } = useI18n();

  if (address) {
    return (
      <>
        {isGuest && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center">
            <p className="text-amber-300 text-xs">
              {lang === "es"
                ? "⚠ Cuenta temporal — tus fondos se perderán si cierras esta pestaña. Para seguridad real, usa Freighter."
                : "⚠ Temporary account — your funds will be lost if you close this tab. For real security, use Freighter."}
            </p>
          </div>
        )}
        {children}
      </>
    );
  }

  return (
    <div className="max-w-md mx-auto px-5 py-24 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pool-green to-pool-violet flex items-center justify-center mx-auto mb-6 shadow-violet">
        <ShieldAlert size={36} className="text-white" />
      </div>
      <h2 className="text-2xl font-bold mb-3 tracking-tight">
        {lang === "es" ? "Conecta tu wallet primero" : "Connect your wallet first"}
      </h2>
      <p className="text-pool-text-dim text-sm mb-4 max-w-xs mx-auto leading-relaxed">
        {lang === "es"
          ? "No puedes realizar ninguna acción hasta que conectes tu wallet Freighter o uses una cuenta temporal."
          : "You cannot perform any action until you connect your Freighter wallet or use a temporary account."}
      </p>
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6 max-w-xs mx-auto">
        <p className="text-amber-300 text-xs">
          {lang === "es"
            ? "Necesitas la extensión Freighter instalada y configurada en Stellar Testnet."
            : "You need the Freighter extension installed and set to Stellar Testnet."}
        </p>
      </div>
      <button
        onClick={() => connect().catch(() => {})}
        disabled={loading}
        className="btn-primary w-full max-w-xs mx-auto px-8 py-3.5 inline-flex items-center justify-center gap-2.5 text-base mb-4"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Wallet size={18} />}
        {loading
          ? (lang === "es" ? "Conectando..." : "Connecting...")
          : (lang === "es" ? "Conectar Freighter" : "Connect Freighter")}
      </button>

      <div className="flex items-center gap-3 max-w-xs mx-auto mb-4">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-xs text-pool-muted">{lang === "es" ? "o" : "or"}</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      <button
        onClick={connectAsGuest}
        className="btn-secondary w-full max-w-xs mx-auto py-3 text-sm inline-flex items-center justify-center gap-2"
      >
        <UserCircle size={16} />
        {lang === "es" ? "Probar sin wallet (cuenta temporal)" : "Try without wallet (temporary account)"}
      </button>
      <p className="text-[10px] text-pool-muted mt-2 max-w-xs mx-auto">
        {lang === "es"
          ? "La cuenta temporal se pierde al cerrar la pestaña. Solo para explorar."
          : "Temporary account is lost when you close the tab. For exploration only."}
      </p>
    </div>
  );
}
