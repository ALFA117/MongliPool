import { useState, useEffect } from "react";
import { ArrowDownToLine, Download, Copy, AlertTriangle, CheckCircle, Loader2, Wallet } from "lucide-react";
import {
  randomFieldElement,
  computeCommitment,
  encodeNote,
  encryptNote,
  toBase64,
  bigintToHex32,
  hex32ToBigint,
} from "../lib/crypto";
import { deposit, updatePoolRoot, updateAspRoot, getCommitments } from "../lib/stellar";
import { PoseidonMerkleTree } from "../lib/merkle";
import { useI18n } from "../i18n/context";
import { useWallet } from "../lib/walletContext";

type Step = "connect" | "amount" | "generating" | "confirm" | "done";

const FIXED_AMOUNT = 10_000_000n; // 10 XLM (7 decimals)

const DAO_VIEW_KEY = new Uint8Array(32).fill(1);

export default function Deposit() {
  const { t, lang } = useI18n();
  const { address, connect } = useWallet();
  const [step, setStep] = useState<Step>("connect");
  const [receipt, setReceipt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [depositPhase, setDepositPhase] = useState("");

  useEffect(() => {
    if (address && step === "connect") setStep("amount");
  }, [address, step]);

  async function handleConnect() {
    setError(null);
    try {
      await connect();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("deposit", "errorConnect"));
    }
  }

  async function handleDeposit() {
    if (!address) return;
    setLoading(true);
    setError(null);
    setStep("generating");

    try {
      const secret = randomFieldElement();
      const nullifierSecret = randomFieldElement();
      const amount = FIXED_AMOUNT;

      const commitment = await computeCommitment(secret, nullifierSecret, amount);
      const commitmentHex = bigintToHex32(commitment);

      const notePlaintext = encodeNote(secret, nullifierSecret, amount);
      const encryptedNote = encryptNote(DAO_VIEW_KEY, notePlaintext);

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
      await deposit(address, commitmentHex, encryptedNote);

      setDepositPhase("2/3");
      const rawCommitments = await getCommitments();
      const commitments = rawCommitments.map(hex32ToBigint);
      const tree = PoseidonMerkleTree.fromCommitments(commitments);
      const newRoot = bigintToHex32(tree.getRoot());
      await updatePoolRoot(address, newRoot);

      setDepositPhase("3/3");
      await updateAspRoot(address, newRoot);

      setStep("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("deposit", "errorDeposit"));
      setStep("amount");
    } finally {
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
                  ? "bg-gradient-to-br from-pool-violet to-purple-600 text-white shadow-violet animate-glow"
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

      {/* Connect */}
      {step === "connect" && (
        <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-8 animate-slide-up">
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pool-violet to-purple-600 flex items-center justify-center mx-auto mb-5 shadow-violet">
              <Wallet size={28} className="text-white" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{t("deposit", "connectTitle")}</h2>
            <p className="text-pool-text-dim text-sm mb-6 max-w-xs mx-auto">{t("deposit", "connectDesc")}</p>
            <button onClick={handleConnect} disabled={loading} className="btn-primary w-full inline-flex items-center justify-center gap-2">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Wallet size={18} />}
              {loading ? t("nav", "connecting") : t("deposit", "connectBtn")}
            </button>
          </div>
        </div>
      )}

      {/* Confirm amount */}
      {step === "amount" && (
        <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-7 animate-slide-up">
          <h2 className="text-xl font-semibold mb-5">{t("deposit", "confirmTitle")}</h2>
          <div className="bg-white/[0.03] rounded-xl p-5 mb-6 border border-white/[0.06]">
            <div className="flex justify-between items-center mb-3">
              <span className="text-pool-text-dim text-sm">{t("deposit", "fixedAmount")}</span>
              <span className="font-mono font-bold text-2xl text-pool-text">10 XLM</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-pool-text-dim text-sm">{t("deposit", "from")}</span>
              <span className="font-mono text-xs text-pool-text-dim">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </div>
          </div>
          <div className="bg-pool-violet/5 border border-pool-violet/20 rounded-xl p-4 mb-6">
            <p className="text-sm text-pool-text-dim">
              <strong className="text-pool-violet-light">{t("deposit", "important")}</strong>{" "}
              {t("deposit", "importantDesc")}
            </p>
          </div>
          <button onClick={handleDeposit} disabled={loading} className="btn-primary w-full inline-flex items-center justify-center gap-2">
            <ArrowDownToLine size={18} />
            {t("deposit", "depositBtn")}
          </button>
        </div>
      )}

      {/* Generating */}
      {step === "generating" && (
        <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-8 animate-slide-up text-center">
          <div className="w-16 h-16 border-4 border-pool-violet border-t-transparent rounded-full animate-spin mx-auto mb-5" />
          <h2 className="text-xl font-semibold mb-2">{t("deposit", "generating")}</h2>
          <p className="text-pool-text-dim text-sm mb-4">{t("deposit", "generatingDesc")}</p>
          {depositPhase && (
            <div className="inline-flex items-center gap-2 bg-pool-violet/10 border border-pool-violet/20 rounded-full px-4 py-1.5 text-xs font-medium text-pool-violet-light">
              {depositPhase === "1/3" && (lang === "es" ? "Firma 1 de 3: depositando fondos..." : "Signature 1 of 3: depositing funds...")}
              {depositPhase === "2/3" && (lang === "es" ? "Firma 2 de 3: sincronizando árbol..." : "Signature 2 of 3: syncing tree...")}
              {depositPhase === "3/3" && (lang === "es" ? "Firma 3 de 3: registrando en ASP..." : "Signature 3 of 3: registering in ASP...")}
            </div>
          )}
        </div>
      )}

      {/* Done */}
      {step === "done" && receipt && (
        <div className="animate-slide-up space-y-4">
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
                onClick={() => navigator.clipboard.writeText(receipt)}
                className="btn-secondary flex-1 text-sm py-2.5 inline-flex items-center justify-center gap-2"
              >
                <Copy size={16} />
                {t("deposit", "copy")}
              </button>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-300 text-xs">{t("deposit", "warning")}</p>
          </div>
        </div>
      )}
    </div>
  );
}