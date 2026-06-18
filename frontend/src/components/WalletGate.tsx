import { Wallet, Loader2 } from "lucide-react";
import { useWallet } from "../lib/walletContext";
import { useI18n } from "../i18n/context";

export default function WalletGate({ children }: { children: React.ReactNode }) {
  const { address, loading, connect } = useWallet();
  const { lang } = useI18n();

  if (address) return <>{children}</>;

  return (
    <div className="max-w-md mx-auto px-5 py-32 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pool-violet to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-violet">
        <Wallet size={36} className="text-white" />
      </div>
      <h2 className="text-2xl font-bold mb-3 tracking-tight">
        {lang === "es" ? "Conecta tu wallet" : "Connect your wallet"}
      </h2>
      <p className="text-pool-text-dim text-sm mb-8 max-w-xs mx-auto leading-relaxed">
        {lang === "es"
          ? "Necesitas conectar Freighter para acceder a esta función. Tu wallet autoriza las transacciones — tus secretos se generan localmente."
          : "You need to connect Freighter to access this feature. Your wallet authorizes transactions — your secrets are generated locally."}
      </p>
      <button
        onClick={() => connect().catch(() => {})}
        disabled={loading}
        className="btn-primary px-8 py-3.5 inline-flex items-center gap-2.5 text-base"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Wallet size={18} />}
        {loading
          ? (lang === "es" ? "Conectando..." : "Connecting...")
          : (lang === "es" ? "Conectar Freighter" : "Connect Freighter")}
      </button>
    </div>
  );
}