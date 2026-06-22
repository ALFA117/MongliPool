import { Wallet, Loader2, ShieldAlert } from "lucide-react";
import { useWallet } from "../lib/walletContext";
import { useI18n } from "../i18n/context";

export default function WalletGate({ children }: { children: React.ReactNode }) {
  const { address, loading, connect } = useWallet();
  const { lang } = useI18n();

  if (address) return <>{children}</>;

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
          ? "No puedes realizar ninguna acción hasta que conectes tu wallet Freighter. Tu wallet autoriza las transacciones — tus secretos se generan localmente en tu dispositivo."
          : "You cannot perform any action until you connect your Freighter wallet. Your wallet authorizes transactions — your secrets are generated locally on your device."}
      </p>
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-8 max-w-xs mx-auto">
        <p className="text-amber-300 text-xs">
          {lang === "es"
            ? "Necesitas la extensión Freighter instalada y configurada en Stellar Testnet."
            : "You need the Freighter extension installed and set to Stellar Testnet."}
        </p>
      </div>
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
