import { useState, useRef, useEffect } from "react";
import { ArrowDownToLine, Download, Copy, AlertTriangle, CheckCircle, ExternalLink, Info, RotateCcw, History } from "lucide-react";
import { useToast } from "../components/Toast";
import {
  randomFieldElement,
  computeCommitment,
  encodeNote,
  encryptNote,
  DAO_PUBLIC_KEY,
  toBase64,
  bigintToHex32,
  hex32ToBigint,
} from "../lib/crypto";
import { deposit, updatePoolRoot, updateAspRoot, getCommitments } from "../lib/stellar";
import { PoseidonMerkleTree } from "../lib/merkle";
import { useI18n } from "../i18n/context";
import { useWallet } from "../lib/walletContext";

type Step = "amount" | "generating" | "done";

const MIN_XLM = 1;
const MAX_XLM = 1000;
const SUGGESTED = [10, 50, 100];

export default function Deposit() {
  const { t, lang } = useI18n();
  const { address } = useWallet();
  const toast = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<Step>("amount");
  const [amountXLM, setAmountXLM] = useState("10");
  const [receipt, setReceipt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [depositPhase, setDepositPhase] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [savedReceipts, setSavedReceipts] = useState<string[]>([]);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    if (address) {
      import("../lib/stellar").then(({ getAccountBalance }) =>
        getAccountBalance(address).then(setWalletBalance)
      );
    }
  }, [address]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("monglipool-receipts") || "[]");
      if (Array.isArray(saved)) setSavedReceipts(saved);
    } catch { /* ignore */ }
  }, []);

  async function handleDeposit() {
    if (!address) return;
    setLoading(true);
    setError(null);
    setStep("generating");
    document.documentElement.setAttribute("data-busy", "true");

    try {
      const parsedXLM = parseFloat(amountXLM);
      if (isNaN(parsedXLM) || parsedXLM < MIN_XLM || parsedXLM > MAX_XLM) {
        throw new Error(lang === "es"
          ? `Monto debe ser entre ${MIN_XLM} y ${MAX_XLM} XLM`
          : `Amount must be between ${MIN_XLM} and ${MAX_XLM} XLM`);
      }
      // Use string math to avoid float precision issues (667 * 1e7 must be exact)
      const wholePart = Math.floor(parsedXLM);
      const fracPart = Math.round((parsedXLM - wholePart) * 1e7);
      const amount = BigInt(wholePart) * 10000000n + BigInt(fracPart);

      const secret = randomFieldElement();
      const nullifierSecret = randomFieldElement();

      const commitment = await computeCommitment(secret, nullifierSecret, amount);
      const commitmentHex = bigintToHex32(commitment);

      const notePlaintext = encodeNote(secret, nullifierSecret, amount);
      const encryptedNote = encryptNote(DAO_PUBLIC_KEY, notePlaintext);

      const receiptData = {
        v: 1,
        secret: bigintToHex32(secret),
        nullifierSecret: bigintToHex32(nullifierSecret),
        amount: amount.toString(),
        commitment: commitmentHex,
      };
      const receiptB64 = toBase64(new TextEncoder().encode(JSON.stringify(receiptData)));
      setReceipt(receiptB64);

      setDepositPhase("1/3");
      const hash = await deposit(address, commitmentHex, encryptedNote, amount);
      setTxHash(hash);

      try {
        const prev = JSON.parse(localStorage.getItem("monglipool-receipts") || "[]");
        const updated = [receiptB64, ...prev].slice(0, 20);
        localStorage.setItem("monglipool-receipts", JSON.stringify(updated));
        setSavedReceipts(updated);
      } catch { /* quota */ }

      setDepositPhase("2/3");
      const rawCommitments = await getCommitments();
      const commitments = rawCommitments.map(hex32ToBigint);
      const tree = PoseidonMerkleTree.fromCommitments(commitments);
      const newRoot = bigintToHex32(tree.getRoot());
      await updatePoolRoot(address, newRoot);

      setDepositPhase("3/3");
      await updateAspRoot(address, newRoot);

      setStep("done");
      setTimeout(() => receiptRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 200);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("deposit", "errorDeposit"));
      setStep("amount");
    } finally {
      document.documentElement.removeAttribute("data-busy");
      setLoading(false);
    }
  }

  function downloadReceipt() {
    if (!receipt) return;
    const blob = new Blob([receipt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "monglipool-receipt.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  const stepIndex = ["connect", "amount", "generating", "confirm", "done"].indexOf(step);

  return (
    <div className="max-w-xl mx-auto px-5 py-20 animate-fade-in">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-3 tracking-tight">{t("deposit", "title")}</h1>
        <p className="text-pool-text-dim text-[15px] leading-relaxed">{t("deposit", "subtitle")}</p>
      </div>

      {/* Progress stepper */}
      <div className="flex items-center gap-1 mb-10">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-1 flex-1">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 flex-shrink-0 ${
                stepIndex === i
                  ? "bg-gradient-to-br from-pool-green to-pool-violet text-white shadow-violet animate-glow"
                  : stepIndex > i
                  ? "bg-pool-green text-white shadow-green"
                  : "bg-white/[0.04] text-pool-muted border border-white/[0.08]"
              }`}
            >
              {stepIndex > i ? <CheckCircle size={14} /> : i + 1}
            </div>
            {i < 4 && (
              <div className={`flex-1 h-[2px] rounded-full transition-all duration-500 ${
                stepIndex > i
                  ? "bg-gradient-to-r from-pool-green to-pool-green-light"
                  : "bg-white/[0.06]"
              }`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-3">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Choose amount + confirm */}
      {step === "amount" && (
        <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-7 animate-slide-up">
          <h2 className="text-xl font-semibold mb-5">{t("deposit", "confirmTitle")}</h2>

          {/* Amount input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-pool-text-dim mb-2">
              {lang === "es" ? "Monto a depositar" : "Amount to deposit"}
            </label>
            <div className="relative">
              <input
                type="number"
                min={MIN_XLM}
                max={MAX_XLM}
                step="1"
                value={amountXLM}
                onChange={(e) => setAmountXLM(e.target.value)}
                className="input-field pr-16 text-lg font-bold"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-pool-text-dim font-medium text-sm">XLM</span>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-xs text-pool-muted">
                {lang === "es" ? `Mín ${MIN_XLM} — Máx ${MAX_XLM} XLM` : `Min ${MIN_XLM} — Max ${MAX_XLM} XLM`}
              </p>
              {walletBalance !== null && (
                <p className="text-xs text-pool-text-dim">
                  {lang === "es" ? "Disponible:" : "Available:"}{" "}
                  <span className={parseFloat(amountXLM) > walletBalance ? "text-red-400" : "text-pool-green"}>
                    {walletBalance.toFixed(1)} XLM
                  </span>
                </p>
              )}
            </div>
            {walletBalance !== null && parseFloat(amountXLM) > walletBalance && (
              <p className="text-xs text-red-400 mt-1">
                {lang === "es" ? "Saldo insuficiente" : "Insufficient balance"}
              </p>
            )}
          </div>

          {/* Suggested amounts */}
          <div className="flex gap-2 mb-5">
            {SUGGESTED.map((v) => (
              <button
                key={v}
                onClick={() => setAmountXLM(String(v))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  amountXLM === String(v)
                    ? "bg-pool-violet/20 border border-pool-violet/40 text-pool-violet-light"
                    : "bg-white/[0.03] border border-white/[0.06] text-pool-text-dim hover:border-pool-violet/20"
                }`}
              >
                {v} XLM
              </button>
            ))}
          </div>

          <div className="bg-white/[0.03] rounded-xl p-4 mb-5 border border-white/[0.06]">
            <div className="flex justify-between items-center">
              <span className="text-pool-text-dim text-sm">{t("deposit", "from")}</span>
              <span className="font-mono text-xs text-pool-text-dim">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </div>
          </div>
          <div className="bg-pool-violet/5 border border-pool-violet/20 rounded-xl p-4 mb-4">
            <p className="text-sm text-pool-text-dim">
              <strong className="text-pool-violet-light">{t("deposit", "important")}</strong>{" "}
              {t("deposit", "importantDesc")}
            </p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-6 flex items-start gap-3">
            <Info size={16} className="text-pool-violet-light flex-shrink-0 mt-0.5" />
            <p className="text-xs text-pool-text-dim leading-relaxed">
              {lang === "es"
                ? "Verás 3 confirmaciones en tu wallet — esto es normal: 1) depositar tus fondos, 2) sincronizar el árbol de privacidad, 3) registrar en la lista de cumplimiento. No cierres esta ventana."
                : "You'll see 3 wallet confirmations — this is normal: 1) deposit your funds, 2) sync the privacy tree, 3) register in the compliance list. Don't close this window."}
            </p>
          </div>
          <button onClick={handleDeposit} disabled={loading} className="btn-primary w-full inline-flex items-center justify-center gap-2">
            <ArrowDownToLine size={18} />
            {lang === "es" ? `Depositar ${amountXLM} XLM` : `Deposit ${amountXLM} XLM`}
          </button>
        </div>
      )}

      {/* Generating */}
      {step === "generating" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="bg-pool-bg border border-pool-green/30 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-[0_0_60px_rgba(5,213,161,0.15)]">
            <div className="w-16 h-16 border-4 border-pool-green border-t-transparent rounded-full animate-spin mx-auto mb-5" />
            <h2 className="text-xl font-semibold mb-2">{t("deposit", "generating")}</h2>
            <p className="text-pool-text-dim text-sm mb-4">{t("deposit", "generatingDesc")}</p>
            {depositPhase && (
              <div className="inline-flex items-center gap-2 bg-pool-green/10 border border-pool-green/20 rounded-full px-4 py-1.5 text-xs font-medium text-pool-green">
                {depositPhase === "1/3" && (lang === "es" ? "Firma 1 de 3: depositando fondos..." : "Signature 1 of 3: depositing funds...")}
                {depositPhase === "2/3" && (lang === "es" ? "Firma 2 de 3: sincronizando árbol..." : "Signature 2 of 3: syncing tree...")}
                {depositPhase === "3/3" && (lang === "es" ? "Firma 3 de 3: registrando en ASP..." : "Signature 3 of 3: registering in ASP...")}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Done */}
      {step === "done" && receipt && (
        <div ref={receiptRef} className="animate-slide-up space-y-4">
          <div className="bg-pool-green/5 border border-pool-green/20 rounded-2xl text-center py-7 px-6">
            <div className="w-14 h-14 rounded-full bg-pool-green/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-pool-green" />
            </div>
            <h2 className="text-xl font-semibold text-pool-green mb-1">{t("deposit", "successTitle")}</h2>
            <p className="text-pool-text-dim text-sm">{t("deposit", "successDesc")}</p>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
            <h3 className="font-semibold mb-2 text-pool-violet-light">{t("deposit", "receiptTitle")}</h3>
            <p className="text-pool-text-dim text-xs mb-3">{t("deposit", "receiptDesc")}</p>
            <div className="bg-black/30 rounded-lg p-3 font-mono text-xs text-pool-text-dim break-all mb-4 max-h-32 overflow-auto border border-white/5">
              {receipt}
            </div>
            <div className="flex gap-3">
              <button onClick={downloadReceipt} className="btn-primary flex-1 text-sm py-2.5 inline-flex items-center justify-center gap-2">
                <Download size={16} />
                {t("deposit", "download")}
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(receipt);
                  toast.show(lang === "es" ? "Recibo copiado al portapapeles" : "Receipt copied to clipboard");
                }}
                className="btn-secondary flex-1 text-sm py-2.5 inline-flex items-center justify-center gap-2"
              >
                <Copy size={16} />
                {t("deposit", "copy")}
              </button>
            </div>
          </div>

          {txHash && (
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary w-full text-sm py-2.5 inline-flex items-center justify-center gap-2"
            >
              <ExternalLink size={14} />
              {lang === "es" ? "Ver transacción en Stellar Expert" : "View transaction on Stellar Expert"}
            </a>
          )}

          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 flex items-start gap-2.5">
            <Info size={14} className="text-pool-text-dim flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-pool-text-dim">
              {lang === "es"
                ? "Tu recibo también se guardó temporalmente en este navegador. Pero descárgalo o cópialo — el almacenamiento del navegador no es permanente."
                : "Your receipt was also saved temporarily in this browser. But download or copy it — browser storage is not permanent."}
            </p>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-300 text-xs">{t("deposit", "warning")}</p>
          </div>

          <button
            onClick={() => { setStep("amount"); setReceipt(null); setTxHash(null); setError(null); setDepositPhase(""); }}
            className="btn-secondary w-full text-sm py-2.5 inline-flex items-center justify-center gap-2"
          >
            <RotateCcw size={14} />
            {lang === "es" ? "Hacer otro depósito" : "Make another deposit"}
          </button>
        </div>
      )}

      {/* Saved receipts */}
      {savedReceipts.length > 0 && step === "amount" && (
        <div className="mt-10 glass-panel p-5">
          <div className="flex items-center gap-2 mb-3">
            <History size={16} className="text-pool-text-dim" />
            <h3 className="text-sm font-semibold text-pool-text-dim">
              {lang === "es" ? `${savedReceipts.length} recibo(s) guardado(s)` : `${savedReceipts.length} saved receipt(s)`}
            </h3>
          </div>
          <div className="space-y-2">
            {savedReceipts.slice(0, 3).map((r, i) => (
              <div key={i} className="flex items-center justify-between gap-3 bg-white/[0.03] rounded-lg px-3 py-2">
                <span className="font-mono text-[10px] text-pool-text-dim truncate flex-1">{r.substring(0, 40)}...</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(r); toast.show(lang === "es" ? "Recibo copiado" : "Receipt copied"); }}
                  className="text-pool-green hover:text-pool-green-light text-xs flex items-center gap-1 cursor-pointer flex-shrink-0"
                >
                  <Copy size={12} />
                  {lang === "es" ? "Copiar" : "Copy"}
                </button>
              </div>
            ))}
          </div>
          {savedReceipts.length > 3 && (
            <p className="text-[10px] text-pool-muted mt-2">
              {lang === "es" ? `+${savedReceipts.length - 3} más guardados` : `+${savedReceipts.length - 3} more saved`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}