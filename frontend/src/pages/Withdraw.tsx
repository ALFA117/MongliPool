import { useState } from "react";
import { ClipboardPaste, AlertTriangle, CheckCircle, Sparkles, Info, ExternalLink } from "lucide-react";
import { fromBase64, hex32ToBigint, bigintToHex32 } from "../lib/crypto";
import { generateWithdrawProof, addressToField } from "../lib/zkproof";
import { PoseidonMerkleTree } from "../lib/merkle";
import { getCommitments, withdraw as contractWithdraw } from "../lib/stellar";
import { useI18n } from "../i18n/context";
import { useWallet } from "../lib/walletContext";

type Step = "paste" | "prove" | "submit" | "done";

export default function Withdraw() {
  const { t, lang } = useI18n();
  const { address: walletAddress, connect } = useWallet();
  const [step, setStep] = useState<Step>("paste");
  const [receiptText, setReceiptText] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [progressMsg, setProgressMsg] = useState("");
  const [progressPct, setProgressPct] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  function onProgress(msg: string, pct: number) {
    setProgressMsg(msg);
    setProgressPct(pct);
  }

  async function handleWithdraw() {
    // Validate address before starting the 30s proof generation
    const addr = recipientAddress.trim();
    if (!addr.startsWith("G") || addr.length !== 56) {
      setError(lang === "es"
        ? "La dirección debe empezar con G y tener 56 caracteres."
        : "Address must start with G and be 56 characters.");
      return;
    }
    setError(null);
    setStep("prove");
    onProgress("Parsing receipt…", 5);

    try {
      const receiptBytes = fromBase64(receiptText.trim());
      const receiptData = JSON.parse(new TextDecoder().decode(receiptBytes));
      const { secret, nullifierSecret, amount, commitment: commitmentHex } = receiptData;

      const secretBI = hex32ToBigint(secret);
      const nullifierSecretBI = hex32ToBigint(nullifierSecret);
      const amountBI = BigInt(amount);
      const commitmentBI = hex32ToBigint(commitmentHex);

      onProgress("Rebuilding Merkle tree…", 15);
      const rawCommitments = await getCommitments();
      const commitments = rawCommitments.map(hex32ToBigint);
      const poolTree = PoseidonMerkleTree.fromCommitments(commitments);

      const leafIndex = commitments.findIndex((c) => c === commitmentBI);
      if (leafIndex === -1) {
        throw new Error(t("withdraw", "errorNotFound"));
      }

      const poolProof = poolTree.generateProof(leafIndex);

      // MVP: ASP tree = pool tree (same commitments, same root).
      // The proof binds to aspProof.root, and we pass that same root to the contract.
      // The contract checks it against the ASP registry history before ZK verification.
      onProgress("Building ASP proof…", 25);
      const aspProof = poolTree.generateProof(leafIndex);

      const recipientField = addressToField(recipientAddress);
      const { proofBytes, nullifierHash } = await generateWithdrawProof(
        {
          secret: secretBI,
          nullifierSecret: nullifierSecretBI,
          amount: amountBI,
          poolPathElements: poolProof.pathElements,
          poolPathIndices: poolProof.pathIndices,
          aspPathElements: aspProof.pathElements,
          aspPathIndices: aspProof.pathIndices,
          poolMerkleRoot: poolProof.root,
          aspMerkleRoot: aspProof.root,
          recipient: recipientField,
          amountPub: amountBI,
        },
        onProgress
      );

      setStep("submit");
      onProgress("Submitting to contract…", 95);
      if (!walletAddress) {
        await connect();
      }
      const senderAddress = walletAddress;
      if (!senderAddress) throw new Error(t("withdraw", "errorNoWallet"));

      // Pass the SAME roots that the proof was generated with.
      // The contract validates both are in their respective on-chain histories.
      const hash = await contractWithdraw(
        senderAddress,
        proofBytes,
        bigintToHex32(poolProof.root),
        bigintToHex32(aspProof.root),
        bigintToHex32(nullifierHash),
        recipientAddress,
        bigintToHex32(recipientField),
        amountBI
      );
      setTxHash(hash);
      setStep("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setStep("paste");
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("withdraw", "title")}</h1>
        <p className="text-pool-text-dim">{t("withdraw", "subtitle")}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-3">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Paste receipt */}
      {step === "paste" && (
        <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-7 animate-slide-up space-y-5">
          <div>
            <label className="block text-sm font-medium text-pool-text-dim mb-2">
              {t("withdraw", "receiptLabel")}
            </label>
            <textarea
              value={receiptText}
              onChange={(e) => setReceiptText(e.target.value)}
              placeholder={t("withdraw", "receiptPlaceholder")}
              className="input-field h-32 resize-none"
            />
            <button
              onClick={async () => {
                const text = await navigator.clipboard.readText();
                setReceiptText(text);
              }}
              className="text-xs text-pool-violet-light hover:text-pool-violet mt-1.5 inline-flex items-center gap-1"
            >
              <ClipboardPaste size={12} />
              {t("withdraw", "paste")}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-pool-text-dim mb-2">
              {t("withdraw", "recipientLabel")}
            </label>
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder={t("withdraw", "recipientPlaceholder")}
              className="input-field"
            />
            <p className="text-xs text-pool-text-dim mt-1.5">{t("withdraw", "recipientHelp")}</p>
          </div>

          <div className="bg-pool-violet/5 border border-pool-violet/20 rounded-xl p-4 flex items-start gap-3">
            <Info size={16} className="text-pool-violet-light flex-shrink-0 mt-0.5" />
            <p className="text-sm text-pool-text-dim">
              <strong className="text-pool-violet-light">{t("withdraw", "howTitle")}</strong>{" "}
              {t("withdraw", "howDesc")}
            </p>
          </div>

          <button
            onClick={handleWithdraw}
            disabled={!receiptText.trim() || !recipientAddress.trim()}
            className="btn-primary w-full inline-flex items-center justify-center gap-2"
          >
            <Sparkles size={18} />
            {t("withdraw", "proveBtn")}
          </button>
        </div>
      )}

      {/* Proving */}
      {(step === "prove" || step === "submit") && (
        <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-8 animate-slide-up text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(124,58,237,0.15)" strokeWidth="4" />
              <circle
                cx="40" cy="40" r="36" fill="none"
                stroke="#7c3aed" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 36}`}
                strokeDashoffset={`${2 * Math.PI * 36 * (1 - progressPct / 100)}`}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-pool-violet font-mono font-bold text-sm">{progressPct}%</span>
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {step === "submit" ? t("withdraw", "submittingTitle") : t("withdraw", "provingTitle")}
          </h2>
          <p className="text-pool-text-dim text-sm max-w-xs mx-auto">{progressMsg}</p>
          {progressPct < 90 && (
            <p className="text-pool-text-dim text-xs mt-4 max-w-xs mx-auto">{t("withdraw", "provingDesc")}</p>
          )}
        </div>
      )}

      {/* Done */}
      {step === "done" && (
        <div className="animate-slide-up space-y-4">
          <div className="bg-pool-green/5 border border-pool-green/20 rounded-2xl text-center py-8 px-6">
            <div className="w-14 h-14 rounded-full bg-pool-green/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-pool-green" />
            </div>
            <h2 className="text-xl font-semibold text-pool-green mb-3">{t("withdraw", "successTitle")}</h2>
            <p className="text-pool-text-dim text-sm mb-4">{t("withdraw", "successDesc")}</p>
            <p className="text-xs text-pool-text-dim">
              {t("withdraw", "fundsTo")}{" "}
              <span className="font-mono text-pool-text">
                {recipientAddress.slice(0, 6)}...{recipientAddress.slice(-4)}
              </span>{" "}
              {t("withdraw", "fundsToSuffix")}
            </p>
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
        </div>
      )}
    </div>
  );
}