import { Wallet, Loader2, UserCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { useWallet } from "../lib/walletContext";
import { useI18n } from "../i18n/context";

export default function WalletGate({ children }: { children: React.ReactNode }) {
  const { address, loading, isGuest, guestLoading, guestError, connect, connectAsGuest } = useWallet();
  const { lang } = useI18n();
  const es = lang === "es";

  if (address) {
    return (
      <>
        {isGuest && (
          <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5">
            <p className="max-w-6xl mx-auto flex items-start sm:items-center justify-center gap-2 text-[14px] warn-text">
              <AlertTriangle size={15} className="flex-shrink-0 mt-0.5 sm:mt-0" />
              {es
                ? "Cuenta temporal: tus fondos de prueba se pierden si cierras esta pestaña. Para conservarlos, usa Freighter."
                : "Temporary account: your test funds are lost if you close this tab. To keep them, use Freighter."}
            </p>
          </div>
        )}
        {children}
      </>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 md:py-24 animate-fade-in">
      <span className="eyebrow">{es ? "Antes de empezar" : "Before you start"}</span>
      <h1 className="text-3xl md:text-[2.6rem] leading-tight mt-3 mb-3">
        {es ? "Elige cómo firmar" : "Choose how to sign"}
      </h1>
      <p className="text-pool-text-dim text-[17px] leading-relaxed max-w-xl mb-10">
        {es
          ? "Depositar y retirar necesita una cuenta de Stellar testnet que firme las transacciones. Tus recibos se generan en este dispositivo; la wallet solo firma."
          : "Depositing and withdrawing need a Stellar testnet account to sign transactions. Your receipts are generated on this device; the wallet only signs."}
      </p>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Opción rápida: cuenta temporal */}
        <div className="panel p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <span className="w-10 h-10 rounded-md border border-pool-border flex items-center justify-center text-pool-green">
              <UserCircle size={20} strokeWidth={1.75} />
            </span>
            <span className="font-mono text-[12px] text-pool-green border border-pool-green/40 rounded px-1.5 py-0.5">
              {es ? "1 clic" : "1 click"}
            </span>
          </div>
          <h2 className="font-sans text-lg font-semibold tracking-normal mb-2">
            {es ? "Probar sin wallet" : "Try without a wallet"}
          </h2>
          <p className="text-[15px] text-pool-text-dim leading-relaxed mb-6 flex-1">
            {es
              ? "Creamos una cuenta de testnet con 10,000 XLM de prueba (Friendbot). Se pierde al cerrar la pestaña."
              : "We create a testnet account with 10,000 test XLM (Friendbot). It's lost when you close the tab."}
          </p>
          <button
            onClick={() => connectAsGuest()}
            disabled={guestLoading || loading}
            className="btn-primary w-full gap-2"
          >
            {guestLoading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
            {guestLoading
              ? (es ? "Creando cuenta y pidiendo XLM…" : "Creating account, requesting XLM…")
              : (es ? "Usar cuenta temporal" : "Use temporary account")}
          </button>
          {guestError && (
            <p role="alert" className="text-[14px] problem-label mt-3">
              {es
                ? "Friendbot (el grifo de XLM de prueba de Stellar) no respondió. Intenta de nuevo en un momento."
                : "Friendbot (Stellar's test XLM faucet) didn't respond. Try again in a moment."}
            </p>
          )}
        </div>

        {/* Freighter */}
        <div className="panel p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <span className="w-10 h-10 rounded-md border border-pool-border flex items-center justify-center text-pool-text">
              <Wallet size={20} strokeWidth={1.75} />
            </span>
            <span className="font-mono text-[12px] text-pool-muted border border-pool-border rounded px-1.5 py-0.5">
              {es ? "extensión" : "extension"}
            </span>
          </div>
          <h2 className="font-sans text-lg font-semibold tracking-normal mb-2">
            {es ? "Conectar Freighter" : "Connect Freighter"}
          </h2>
          <p className="text-[15px] text-pool-text-dim leading-relaxed mb-6 flex-1">
            {es
              ? "Necesitas la extensión Freighter instalada y configurada en Stellar Testnet."
              : "You need the Freighter extension installed and set to Stellar Testnet."}
          </p>
          <button
            onClick={() => connect().catch(() => {})}
            disabled={loading}
            className="btn-secondary w-full gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Wallet size={18} />}
            {loading ? (es ? "Conectando…" : "Connecting…") : (es ? "Conectar Freighter" : "Connect Freighter")}
          </button>
        </div>
      </div>
    </div>
  );
}
