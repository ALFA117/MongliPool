import { useState } from "react";
import { ClipboardPaste, AlertTriangle, CheckCircle, Sparkles, Info, ExternalLink, History, X } from "lucide-react";
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
    document.documentElement.setAttribute("data-busy", "true");
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
    } finally {
      document.documentElement.removeAttribute("data-busy");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 md:py-20 animate-fade-in">
      <div className="mb-8">
        <span className="eyebrow">{lang === "es" ? "Paso 2 de 2 · salida del pool" : "Step 2 of 2 · pool exit"}</span>
        <h1 className="text-4xl md:text-5xl leading-tight mt-3 mb-3">{t("withdraw", "title")}</h1>
        <p className="text-pool-text-dim text-[17px] leading-relaxed max-w-xl">{t("withdraw", "subtitle")}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 border-l-4 border-l-red-500 rounded-md problem-label text-sm flex items-start gap-3">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Paste receipt */}
      {step === "paste" && (
        <div className="panel p-5 sm:p-7 animate-slide-up space-y-6">
          <div>
            <label htmlFor="wd-receipt" className="flex items-baseline gap-2 text-[15px] font-medium text-pool-text mb-2">
              <span className="font-mono text-[13px] text-pool-muted">1</span>
              {t("withdraw", "receiptLabel")}
            </label>
            <textarea
              id="wd-receipt"
              value={receiptText}
              onChange={(e) => setReceiptText(e.target.value)}
              placeholder={t("withdraw", "receiptPlaceholder")}
              className="input-field h-32 resize-none"
            />
            <div className="flex flex-wrap gap-x-4 mt-1">
              <button
                onClick={async () => {
                  const text = await navigator.clipboard.readText();
                  setReceiptText(text);
                }}
                className="min-h-[44px] text-[14px] text-pool-text-dim hover:text-pool-text inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ClipboardPaste size={12} />
                {t("withdraw", "paste")}
              </button>
              {(() => {
                try {
                  const saved = JSON.parse(localStorage.getItem("monglipool-receipts") || "[]");
                  if (saved.length > 0) return (
                    <button
                      onClick={() => setReceiptText(saved[0])}
                      className="min-h-[44px] text-[14px] text-pool-green hover:underline underline-offset-4 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <History size={12} />
                      {lang === "es" ? "Usar último recibo guardado" : "Use last saved receipt"}
                    </button>
                  );
                } catch { /* ignore */ }
                return null;
              })()}
            </div>
          </div>

          <div>
            <label htmlFor="wd-recipient" className="flex items-baseline gap-2 text-[15px] font-medium text-pool-text mb-2">
              <span className="font-mono text-[13px] text-pool-muted">2</span>
              {t("withdraw", "recipientLabel")}
            </label>
            <input
              id="wd-recipient"
              autoComplete="off"
              spellCheck={false}
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder={t("withdraw", "recipientPlaceholder")}
              className="input-field"
            />
            <p className="text-[14px] text-pool-text-dim mt-2">{t("withdraw", "recipientHelp")}</p>
          </div>

          <div className="border-l-2 border-pool-violet bg-pool-violet/[0.06] rounded-r-md p-4 flex items-start gap-3">
            <Info size={16} className="text-pool-violet-light flex-shrink-0 mt-1" />
            <p className="text-[15px] text-pool-text-dim leading-relaxed">
              <strong className="text-pool-violet-light">{t("withdraw", "howTitle")}</strong>{" "}
              {t("withdraw", "howDesc")}
            </p>
          </div>

          <div className="flex items-center gap-2 px-1">
            <svg className="w-4 h-4 text-pool-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="1.5"/><path d="M12 6v6l4 2" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <span className="font-mono text-[13px] text-pool-text-dim">
              {lang === "es" ? "Tiempo estimado: ~30-60 segundos (prueba ZK + firma + confirmación)" : "Estimated time: ~30-60 seconds (ZK proof + signing + confirmation)"}
            </span>
          </div>

          <button
            onClick={handleWithdraw}
            disabled={!receiptText.trim() || !recipientAddress.trim()}
            className="btn-primary w-full gap-2 text-base"
          >
            <Sparkles size={18} />
            {t("withdraw", "proveBtn")}
          </button>
        </div>
      )}

      {/* Proving */}
      {(step === "prove" || step === "submit") && (
        <div className="panel p-7 sm:p-8 animate-slide-up text-center" aria-live="polite">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="none" className="stroke-pool-border" strokeWidth="3" />
              <circle
                cx="40" cy="40" r="36" fill="none"
                className="stroke-pool-green transition-all duration-500" strokeWidth="3" strokeLinecap="butt"
                strokeDasharray={`${2 * Math.PI * 36}`}
                strokeDashoffset={`${2 * Math.PI * 36 * (1 - progressPct / 100)}`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-pool-text font-mono text-[15px] tabular-nums">{progressPct}%</span>
            </div>
          </div>
          <h2 className="font-sans text-xl font-semibold tracking-normal mb-2">
            {step === "submit" ? t("withdraw", "submittingTitle") : t("withdraw", "provingTitle")}
          </h2>
          <p className="text-pool-text-dim text-[15px] max-w-xs mx-auto font-mono">{progressMsg}</p>
          {progressPct < 90 && (
            <p className="text-pool-text-dim text-[14px] mt-4 max-w-sm mx-auto">{t("withdraw", "provingDesc")}</p>
          )}
        </div>
      )}

      {/* Done */}
      {step === "done" && (
        <div className="animate-slide-up space-y-4">
          <div className="panel border-t-4 border-t-pool-green py-6 px-5 sm:px-6">
            <CheckCircle size={28} className="text-pool-green mb-3" />
            <h2 className="font-sans text-xl font-semibold tracking-normal mb-2">{t("withdraw", "successTitle")}</h2>
            <p className="text-pool-text-dim text-[15px] mb-4">{t("withdraw", "successDesc")}</p>
            <p className="text-[14px] text-pool-text-dim border-t border-pool-border pt-3">
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
              className="btn-secondary w-full text-[15px] gap-2"
            >
              <ExternalLink size={14} />
              {lang === "es" ? "Ver transacción en Stellar Expert" : "View transaction on Stellar Expert"}
            </a>
          )}

          {/* Share */}
          <ShareSection lang={lang} />
        </div>
      )}
    </div>
  );
}

function ShareSection({ lang }: { lang: string }) {
  const [dismissed, setDismissed] = useState(false);
  const es = lang === "es";

  if (dismissed) return null;

  const tweetText = encodeURIComponent(
    es
      ? "Acabo de hacer una transacción privada verificada con pruebas ZK en @StellarOrg 🔐\n\nMis fondos se movieron sin que nadie pueda vincular el origen con el destino — con cumplimiento regulatorio integrado.\n\nMongliPool por Mongli DAO\nmongli-pool.vercel.app\n#Stellar #ZKProof #Privacy"
      : "Just made a verified private transaction with ZK proofs on @StellarOrg 🔐\n\nMy funds moved without anyone linking origin to destination — with built-in regulatory compliance.\n\nMongliPool by Mongli DAO\nmongli-pool.vercel.app\n#Stellar #ZKProof #Privacy"
  );

  const waText = encodeURIComponent(
    es
      ? "🔐 Acabo de mover fondos en blockchain con privacidad total usando MongliPool — un privacy pool con cumplimiento regulatorio en Stellar. Pruébalo: mongli-pool.vercel.app"
      : "🔐 Just moved funds on blockchain with total privacy using MongliPool — a privacy pool with regulatory compliance on Stellar. Try it: mongli-pool.vercel.app"
  );

  return (
    <div className="border border-pool-border rounded-lg p-5 relative">
      <button onClick={() => setDismissed(true)} aria-label={es ? "Cerrar" : "Close"} className="absolute top-1 right-1 w-11 h-11 flex items-center justify-center text-pool-muted hover:text-pool-text cursor-pointer">
        <X size={14} />
      </button>
      <p className="text-[15px] font-medium mb-3">{es ? "¿Quieres compartirlo?" : "Want to share?"}</p>
      <div className="flex flex-wrap gap-2">
        <a
          href={`https://twitter.com/intent/tweet?text=${tweetText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary px-4 text-[14px] gap-1.5"
        >
          X (Twitter)
        </a>
        <a
          href={`https://wa.me/?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary px-4 text-[14px] gap-1.5"
        >
          WhatsApp
        </a>
        <button
          onClick={() => {
            navigator.clipboard.writeText(
              es
                ? "Acabo de hacer una transacción privada con ZK proofs en Stellar usando MongliPool. Privacidad real + cumplimiento regulatorio. mongli-pool.vercel.app"
                : "Just made a private transaction with ZK proofs on Stellar using MongliPool. Real privacy + regulatory compliance. mongli-pool.vercel.app"
            );
          }}
          className="btn-secondary px-4 text-[14px] gap-1.5"
        >
          {es ? "Copiar mensaje" : "Copy message"}
        </button>
      </div>
    </div>
  );
}