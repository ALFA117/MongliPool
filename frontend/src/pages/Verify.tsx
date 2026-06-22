import { useState } from "react";
import { ShieldCheck, AlertTriangle, CheckCircle, XCircle, Search } from "lucide-react";
import { fromBase64, hex32ToBigint } from "../lib/crypto";
import { getCommitments } from "../lib/stellar";
import { useI18n } from "../i18n/context";

interface VerifyResult {
  valid: boolean;
  commitment: string;
  amount: string;
  foundInPool: boolean;
  leafIndex: number;
}

export default function Verify() {
  const { lang } = useI18n();
  const [receiptText, setReceiptText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify() {
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const receiptBytes = fromBase64(receiptText.trim());
      const data = JSON.parse(new TextDecoder().decode(receiptBytes));

      if (!data.secret || !data.nullifierSecret || !data.amount || !data.commitment) {
        throw new Error(lang === "es" ? "Recibo incompleto o mal formado" : "Incomplete or malformed receipt");
      }

      const commitmentBI = hex32ToBigint(data.commitment);
      const amountXLM = (Number(BigInt(data.amount)) / 1e7).toFixed(2);

      const onchainCommitments = await getCommitments();
      const found = onchainCommitments.findIndex(
        (c) => hex32ToBigint(c) === commitmentBI
      );

      setResult({
        valid: true,
        commitment: data.commitment,
        amount: amountXLM,
        foundInPool: found !== -1,
        leafIndex: found,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Invalid receipt");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-5 py-20 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          {lang === "es" ? "Verificar recibo" : "Verify receipt"}
        </h1>
        <p className="text-pool-text-dim text-sm">
          {lang === "es"
            ? "Comprueba si un recibo privado es válido y si su depósito existe en el pool — sin hacer ninguna transacción."
            : "Check if a private receipt is valid and if its deposit exists in the pool — without making any transaction."}
        </p>
      </div>

      <div className="glass-panel p-6 mb-6">
        <label className="block text-sm font-medium text-pool-text-dim mb-2">
          {lang === "es" ? "Pega el recibo" : "Paste receipt"}
        </label>
        <textarea
          value={receiptText}
          onChange={(e) => setReceiptText(e.target.value)}
          placeholder="eyJ..."
          className="input-field h-28 resize-none mb-4"
        />
        <button
          onClick={handleVerify}
          disabled={loading || !receiptText.trim()}
          className="btn-primary w-full inline-flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search size={16} />
          )}
          {lang === "es" ? "Verificar" : "Verify"}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-3">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="animate-slide-up space-y-4">
          {/* Format valid */}
          <div className={`p-4 rounded-xl flex items-start gap-3 ${
            result.valid ? "bg-pool-green/5 border border-pool-green/20" : "bg-red-500/10 border border-red-500/20"
          }`}>
            {result.valid ? <CheckCircle size={18} className="text-pool-green mt-0.5" /> : <XCircle size={18} className="text-red-400 mt-0.5" />}
            <div>
              <p className={`font-semibold text-sm ${result.valid ? "text-pool-green" : "text-red-400"}`}>
                {lang === "es" ? "Formato del recibo: válido" : "Receipt format: valid"}
              </p>
              <p className="text-pool-text-dim text-xs mt-1">
                {lang === "es" ? `Monto: ${result.amount} XLM` : `Amount: ${result.amount} XLM`}
              </p>
            </div>
          </div>

          {/* Pool check */}
          <div className={`p-4 rounded-xl flex items-start gap-3 ${
            result.foundInPool ? "bg-pool-green/5 border border-pool-green/20" : "bg-amber-500/10 border border-amber-500/20"
          }`}>
            {result.foundInPool ? <ShieldCheck size={18} className="text-pool-green mt-0.5" /> : <AlertTriangle size={18} className="text-amber-400 mt-0.5" />}
            <div>
              <p className={`font-semibold text-sm ${result.foundInPool ? "text-pool-green" : "text-amber-400"}`}>
                {result.foundInPool
                  ? (lang === "es" ? `Depósito encontrado en el pool (posición #${result.leafIndex})` : `Deposit found in pool (position #${result.leafIndex})`)
                  : (lang === "es" ? "Depósito NO encontrado en el pool" : "Deposit NOT found in pool")}
              </p>
              <p className="text-pool-text-dim text-xs mt-1">
                {result.foundInPool
                  ? (lang === "es" ? "Este recibo corresponde a un depósito real on-chain." : "This receipt corresponds to a real on-chain deposit.")
                  : (lang === "es" ? "Puede ser un recibo de otro contrato, o el depósito aún no se confirmó." : "May be from another contract, or the deposit hasn't confirmed yet.")}
              </p>
            </div>
          </div>

          {/* Commitment hash */}
          <div className="glass-panel p-4">
            <p className="text-xs text-pool-text-dim mb-1">Commitment hash</p>
            <p className="font-mono text-[11px] text-pool-text break-all">{result.commitment}</p>
          </div>
        </div>
      )}
    </div>
  );
}
