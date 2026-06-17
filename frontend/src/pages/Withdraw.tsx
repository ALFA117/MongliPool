import { useState } from "react";
import { fromBase64, hex32ToBigint, bigintToHex32 } from "../lib/crypto";
import { generateWithdrawProof, addressToField } from "../lib/zkproof";
import { PoseidonMerkleTree } from "../lib/merkle";
import { getCommitments, getAspRoot, withdraw as contractWithdraw } from "../lib/stellar";
import { getAddress } from "../lib/wallet";

type Step = "paste" | "prove" | "submit" | "done";

export default function Withdraw() {
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
    setError(null);
    setStep("prove");
    onProgress("Parseando recibo…", 5);

    try {
      // 1. Parse receipt
      const receiptBytes = fromBase64(receiptText.trim());
      const receiptData = JSON.parse(new TextDecoder().decode(receiptBytes));
      const { secret, nullifierSecret, amount, commitment: commitmentHex } = receiptData;

      const secretBI = hex32ToBigint(secret);
      const nullifierSecretBI = hex32ToBigint(nullifierSecret);
      const amountBI = BigInt(amount);
      const commitmentBI = hex32ToBigint(commitmentHex);

      // 2. Reconstruct pool Merkle tree from on-chain commitments
      onProgress("Reconstruyendo árbol Merkle del pool…", 15);
      const rawCommitments = await getCommitments();
      const commitments = rawCommitments.map(hex32ToBigint);
      const poolTree = PoseidonMerkleTree.fromCommitments(commitments);

      // Find leaf index
      const leafIndex = commitments.findIndex((c) => c === commitmentBI);
      if (leafIndex === -1) {
        throw new Error("El commitment no se encontró en el pool. ¿Es el recibo correcto?");
      }

      const poolProof = poolTree.generateProof(leafIndex);

      // 3. Get ASP root (we use same tree for MVP — in prod ASP has separate tree)
      onProgress("Obteniendo raíz ASP…", 25);
      const aspRootHex = await getAspRoot();
      if (!aspRootHex) throw new Error("ASP root no disponible");

      // For MVP: ASP tree = pool tree (simplification, documented in README)
      const aspProof = poolTree.generateProof(leafIndex);

      // 4. Generate ZK proof
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

      // 5. Submit proof to contract
      setStep("submit");
      onProgress("Enviando prueba al contrato…", 95);
      const senderAddress = await getAddress();
      if (!senderAddress) throw new Error("Wallet no conectada");

      await contractWithdraw(
        senderAddress,
        proofBytes,
        bigintToHex32(poolProof.root),
        aspRootHex,
        bigintToHex32(nullifierHash),
        recipientAddress,
        bigintToHex32(recipientField), // BN254 field encoding, matches what was proven
        amountBI
      );

      setTxHash("confirmed");
      setStep("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error desconocido");
      setStep("paste");
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Retirar</h1>
        <p className="text-pool-text-dim">
          Pega tu recibo privado. La prueba ZK se genera aquí — sin revelar tu identidad.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Step: Paste receipt */}
      {step === "paste" && (
        <div className="card animate-slide-up space-y-5">
          <div>
            <label className="block text-sm font-medium text-pool-text-dim mb-2">
              Recibo privado
            </label>
            <textarea
              value={receiptText}
              onChange={(e) => setReceiptText(e.target.value)}
              placeholder="Pega tu recibo privado aquí (empieza con eyJ…)"
              className="input-field h-32 resize-none"
            />
            <button
              onClick={async () => {
                const text = await navigator.clipboard.readText();
                setReceiptText(text);
              }}
              className="text-xs text-pool-violet-light hover:text-pool-violet mt-1"
            >
              Pegar desde portapapeles
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-pool-text-dim mb-2">
              Dirección de destino
            </label>
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="G… (puede ser diferente a tu wallet)"
              className="input-field"
            />
            <p className="text-xs text-pool-text-dim mt-1">
              Los fondos llegarán aquí. Puede ser cualquier dirección Stellar.
            </p>
          </div>

          <div className="bg-pool-violet/5 border border-pool-violet/20 rounded-xl p-4">
            <p className="text-sm text-pool-text-dim">
              <strong className="text-pool-violet-light">¿Cómo funciona?</strong> Tu dispositivo
              construirá una prueba matemática de que eres el dueño del depósito — sin revelar
              cuál depósito es tuyo. Esto puede tomar hasta 30 segundos.
            </p>
          </div>

          <button
            onClick={handleWithdraw}
            disabled={!receiptText.trim() || !recipientAddress.trim()}
            className="btn-primary w-full"
          >
            Generar prueba y retirar
          </button>
        </div>
      )}

      {/* Step: Proving */}
      {(step === "prove" || step === "submit") && (
        <div className="card animate-slide-up text-center py-8">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-pool-violet/20" />
            <div
              className="absolute inset-0 rounded-full border-4 border-pool-violet border-t-transparent animate-spin"
              style={{
                clipPath: `inset(0 ${100 - progressPct}% 0 0)`,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-pool-violet font-mono font-bold text-sm">{progressPct}%</span>
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {step === "submit" ? "Enviando al contrato…" : "Generando prueba ZK"}
          </h2>
          <p className="text-pool-text-dim text-sm max-w-xs mx-auto">{progressMsg}</p>
          {progressPct < 90 && (
            <p className="text-pool-text-dim text-xs mt-4">
              Estamos construyendo una prueba matemática que demuestra que eres el
              dueño del depósito, sin revelar cuál.
            </p>
          )}
        </div>
      )}

      {/* Step: Done */}
      {step === "done" && (
        <div className="card border-pool-green/30 bg-pool-green/5 text-center py-8 animate-slide-up">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-semibold text-pool-green mb-3">¡Retiro completado!</h2>
          <p className="text-pool-text-dim text-sm mb-6">
            Tu retiro fue procesado exitosamente. Nadie puede vincular esto a tu depósito.
          </p>
          <p className="text-xs text-pool-text-dim">
            Los fondos llegarán a{" "}
            <span className="font-mono text-pool-text">
              {recipientAddress.slice(0, 6)}…{recipientAddress.slice(-4)}
            </span>{" "}
            en los próximos segundos.
          </p>
        </div>
      )}
    </div>
  );
}