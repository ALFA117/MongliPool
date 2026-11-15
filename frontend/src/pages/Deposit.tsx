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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 md:py-20 animate-fade-in">
      <div className="mb-8">
        <span className="eyebrow">{lang === "es" ? "Paso 1 de 2 · entrada al pool" : "Step 1 of 2 · pool entry"}</span>
        <h1 className="text-4xl md:text-5xl leading-tight mt-3 mb-3">{t("deposit", "title")}</h1>
        <p className="text-pool-text-dim text-[17px] leading-relaxed max-w-xl">{t("deposit", "subtitle")}</p>
      </div>

      {/* Progress stepper */}
      <ol className="grid grid-cols-3 border border-pool-border rounded-md overflow-hidden mb-8 text-[13px] font-mono" aria-label={lang === "es" ? "Progreso" : "Progress"}>
        {[
          { label: lang === "es" ? "Monto" : "Amount", idx: 1 },
          { label: lang === "es" ? "Firmas" : "Signing", idx: 2 },
          { label: lang === "es" ? "Recibo" : "Receipt", idx: 4 },
        ].map(({ label, idx }, i) => {
          const done = stepIndex > idx;
          const current = stepIndex === idx || (idx === 2 && stepIndex === 3);
          return (
            <li
              key={label}
              aria-current={current ? "step" : undefined}
              className={`flex items-center gap-2 px-3 py-3 min-w-0 ${i > 0 ? "border-l border-pool-border" : ""} ${
                current ? "bg-pool-text text-pool-bg" : done ? "text-pool-green" : "text-pool-muted"
              }`}
            >
              <span className={`w-5 h-5 flex-shrink-0 rounded-sm border flex items-center justify-center text-[11px] ${current ? "border-pool-bg" : done ? "border-pool-green" : "border-pool-border"}`}>
                {done ? <CheckCircle size={12} /> : i + 1}
              </span>
              <span className="truncate">{label}</span>
            </li>
          );
        })}
      </ol>

      {error && (
        <div role="alert" className="mb-6 p-4 bg-red-500/10 border border-red-500/30 border-l-4 border-l-red-500 rounded-md problem-label text-[15px] flex items-start gap-3">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Choose amount + confirm */}
      {step === "amount" && (
        <div className="panel p-5 sm:p-7 animate-slide-up">
          <h2 className="font-sans text-xl font-semibold tracking-normal mb-5">{t("deposit", "confirmTitle")}</h2>

          {/* Amount input */}
          <div className="mb-4">
            <label htmlFor="dep-amount" className="block text-[15px] font-medium text-pool-text mb-2">
              {lang === "es" ? "Monto a depositar" : "Amount to deposit"}
            </label>
            <div className="relative">
              <input
                id="dep-amount"
                type="number"
                inputMode="decimal"
                autoComplete="off"
                min={MIN_XLM}
                max={MAX_XLM}
                step="1"
                value={amountXLM}
                onChange={(e) => setAmountXLM(e.target.value)}
                className="input-field pr-16 text-xl font-medium tabular-nums"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-pool-muted font-mono text-sm">XLM</span>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[13px] font-mono text-pool-muted">
                {lang === "es" ? `Mín ${MIN_XLM} — Máx ${MAX_XLM} XLM` : `Min ${MIN_XLM} — Max ${MAX_XLM} XLM`}
              </p>
              {walletBalance !== null && (
                <p className="text-[13px] font-mono text-pool-text-dim">
                  {lang === "es" ? "Disponible:" : "Available:"}{" "}
                  <span className={parseFloat(amountXLM) > walletBalance ? "problem-label" : "text-pool-green"}>
                    {walletBalance.toFixed(1)} XLM
                  </span>
                </p>
              )}
            </div>
            {walletBalance !== null && parseFloat(amountXLM) > walletBalance && (
              <p className="text-xs problem-label mt-1">
                {lang === "es" ? "Saldo insuficiente" : "Insufficient balance"}
              </p>
            )}
          </div>

          {/* Suggested amounts */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {SUGGESTED.map((v) => (
              <button
                key={v}
                onClick={() => setAmountXLM(String(v))}
                aria-pressed={amountXLM === String(v)}
                className={`min-h-[44px] rounded-md font-mono text-[14px] transition-colors cursor-pointer border ${
                  amountXLM === String(v)
                    ? "bg-pool-text text-pool-bg border-pool-text"
                    : "bg-pool-bg border-pool-border text-pool-text-dim hover:border-pool-text/40"
                }`}
              >
                {v} XLM
              </button>
            ))}
          </div>

          <div className="border-y border-pool-border py-3 mb-5">
            <div className="flex justify-between items-center">
              <span className="text-pool-text-dim text-[15px]">{t("deposit", "from")}</span>
              <span className="font-mono text-[14px] text-pool-text">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </div>
          </div>
          <div className="border-l-2 border-pool-violet bg-pool-violet/[0.06] rounded-r-md p-4 mb-4">
            <p className="text-[15px] text-pool-text-dim leading-relaxed">
              <strong className="text-pool-violet-light">{t("deposit", "important")}</strong>{" "}
              {t("deposit", "importantDesc")}
            </p>
          </div>
          <div className="flex items-start gap-3 mb-6 px-1">
            <Info size={16} className="text-pool-violet-light flex-shrink-0 mt-1" />
            <p className="text-[14px] text-pool-text-dim leading-relaxed">
              {lang === "es"
                ? "Verás 3 confirmaciones en tu wallet — esto es normal: 1) depositar tus fondos, 2) sincronizar el árbol de privacidad, 3) registrar en la lista de cumplimiento. No cierres esta ventana."
                : "You'll see 3 wallet confirmations — this is normal: 1) deposit your funds, 2) sync the privacy tree, 3) register in the compliance list. Don't close this window."}
            </p>
          </div>
          <button onClick={handleDeposit} disabled={loading} className="btn-primary w-full gap-2 text-base">
            <ArrowDownToLine size={18} />
            {lang === "es" ? `Depositar ${amountXLM} XLM` : `Deposit ${amountXLM} XLM`}
          </button>
        </div>
      )}

      {/* Generating */}
      {step === "generating" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4" role="dialog" aria-live="polite">
          <div className="panel bg-pool-bg p-7 max-w-sm w-full text-center">
            <div className="w-12 h-12 border-[3px] border-pool-border border-t-pool-green rounded-full animate-spin mx-auto mb-5" />
            <h2 className="font-sans text-xl font-semibold tracking-normal mb-2">{t("deposit", "generating")}</h2>
            <p className="text-pool-text-dim text-[15px] mb-5">{t("deposit", "generatingDesc")}</p>
            {depositPhase && (
              <div className="inline-flex items-center gap-2 border border-pool-green/40 rounded px-3 py-1.5 font-mono text-[13px] text-pool-green">
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
          <div className="panel border-t-4 border-t-pool-green py-6 px-5 sm:px-6 flex items-start gap-4">
            <CheckCircle size={28} className="text-pool-green flex-shrink-0" />
            <div>
            <h2 className="font-sans text-xl font-semibold tracking-normal mb-1">{t("deposit", "successTitle")}</h2>
            <p className="text-pool-text-dim text-[15px]">{t("deposit", "successDesc")}</p>
            </div>
          </div>

          <div className="panel p-5 sm:p-6">
            <h3 className="font-semibold mb-2 text-pool-text">{t("deposit", "receiptTitle")}</h3>
            <p className="text-pool-text-dim text-[15px] mb-3">{t("deposit", "receiptDesc")}</p>
            <div className="bg-pool-bg rounded-md p-3 font-mono text-[13px] text-pool-text break-all mb-4 max-h-32 overflow-auto border border-pool-border">
              {receipt}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={downloadReceipt} className="btn-primary flex-1 text-[15px] gap-2">
                <Download size={16} />
                {t("deposit", "download")}
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(receipt);
                  toast.show(lang === "es" ? "Recibo copiado al portapapeles" : "Receipt copied to clipboard");
                }}
                className="btn-secondary flex-1 text-[15px] gap-2"
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
              className="btn-secondary w-full text-[15px] gap-2"
            >
              <ExternalLink size={14} />
              {lang === "es" ? "Ver transacción en Stellar Expert" : "View transaction on Stellar Expert"}
            </a>
          )}

          <div className="flex items-start gap-2.5 px-1">
            <Info size={15} className="text-pool-text-dim flex-shrink-0 mt-1" />
            <p className="text-[14px] text-pool-text-dim">
              {lang === "es"
                ? "Tu recibo también se guardó temporalmente en este navegador. Pero descárgalo o cópialo — el almacenamiento del navegador no es permanente."
                : "Your receipt was also saved temporarily in this browser. But download or copy it — browser storage is not permanent."}
            </p>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 border-l-4 border-l-amber-500 rounded-md p-4 flex items-start gap-3">
            <AlertTriangle size={16} className="warn-text flex-shrink-0 mt-0.5" />
            <p className="warn-text text-[14px]">{t("deposit", "warning")}</p>
          </div>

          <button
            onClick={() => { setStep("amount"); setReceipt(null); setTxHash(null); setError(null); setDepositPhase(""); }}
            className="btn-secondary w-full text-[15px] gap-2"
          >
            <RotateCcw size={14} />
            {lang === "es" ? "Hacer otro depósito" : "Make another deposit"}
          </button>
        </div>
      )}

      {/* Saved receipts */}
      {savedReceipts.length > 0 && step === "amount" && (
        <div className="mt-10 border border-pool-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <History size={16} className="text-pool-text-dim" />
            <h3 className="text-[15px] font-semibold text-pool-text">
              {lang === "es" ? `${savedReceipts.length} recibo(s) guardado(s)` : `${savedReceipts.length} saved receipt(s)`}
            </h3>
          </div>
          <div className="space-y-2">
            {savedReceipts.slice(0, 3).map((r, i) => (
              <div key={i} className="flex items-center justify-between gap-3 border-t border-pool-border pt-2">
                <span className="font-mono text-xs text-pool-text-dim truncate flex-1">{r.substring(0, 40)}...</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(r); toast.show(lang === "es" ? "Recibo copiado" : "Receipt copied"); }}
                  className="text-pool-green text-[14px] min-h-[44px] px-2 flex items-center gap-1.5 cursor-pointer flex-shrink-0 hover:underline"
                >
                  <Copy size={12} />
                  {lang === "es" ? "Copiar" : "Copy"}
                </button>
              </div>
            ))}
          </div>
          {savedReceipts.length > 3 && (
            <p className="text-xs text-pool-muted mt-2">
              {lang === "es" ? `+${savedReceipts.length - 3} más guardados` : `+${savedReceipts.length - 3} more saved`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}