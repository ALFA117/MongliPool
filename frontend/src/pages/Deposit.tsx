import { useState } from "react";
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

// Admin address = deployer; same wallet used for demo deposit + root updates.
const ADMIN_ADDRESS = import.meta.env.VITE_ADMIN_ADDRESS ?? "";

type Step = "connect" | "amount" | "generating" | "confirm" | "done";

const FIXED_AMOUNT = 10_000_000n; // 10 USDC (7 decimals)

// ─── MVP LIMITATION — VIEW KEY ───────────────────────────────────────────────
// This is a HARDCODED 32-byte symmetric key (all bytes = 1) shared between the
// depositor (who encrypts the note here) and the auditor (who decrypts it in
// Auditor.tsx). It is NOT derived from any secret and is visible in source code,
// meaning anyone who reads this file can decrypt every note.
//
// Production design (not implemented):
//   - Asymmetric: DAO publishes a NaCl box PUBLIC key embedded here.
//   - Depositor encrypts to that public key → only the DAO's private key can decrypt.
//   - Private key held offline by Mongli DAO multisig — never appears in browser.
//
// To replace for real deploy: set VITE_DAO_VIEW_KEY as a hex env var and parse it.
// ─────────────────────────────────────────────────────────────────────────────
const DAO_VIEW_KEY = new Uint8Array(32).fill(1);

export default function Deposit() {
  const [step, setStep] = useState<Step>("connect");
  const [address, setAddress] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    setLoading(true);
    setError(null);
    try {
      const { connectWallet } = await import("../lib/wallet");
      const addr = await connectWallet();
      setAddress(addr);
      setStep("amount");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al conectar wallet");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeposit() {
    if (!address) return;
    setLoading(true);
    setError(null);
    setStep("generating");

    try {
      // 1. Generate secret values locally — never leave the browser
      const secret = randomFieldElement();
      const nullifierSecret = randomFieldElement();
      const amount = FIXED_AMOUNT;

      // 2. Compute commitment
      const commitment = await computeCommitment(secret, nullifierSecret, amount);
      const commitmentHex = bigintToHex32(commitment);

      // 3. Encrypt note with DAO view key for auditor
      const notePlaintext = encodeNote(secret, nullifierSecret, amount);
      const encryptedNote = encryptNote(DAO_VIEW_KEY, notePlaintext);

      // 4. Build user receipt (base64 encoded encrypted note)
      const receiptData = {
        v: 1,
        secret: bigintToHex32(secret),
        nullifierSecret: bigintToHex32(nullifierSecret),
        amount: amount.toString(),
        commitment: commitmentHex,
      };
      const receiptB64 = toBase64(new TextEncoder().encode(JSON.stringify(receiptData)));
      setReceipt(receiptB64);

      // 5. Submit to contract
      await deposit(address, commitmentHex, encryptedNote);

      // 6. Auto-update pool root + ASP root (MVP: pool root = ASP root).
      // Only runs if the connected wallet IS the admin — a non-admin wallet
      // can't sign the admin-gated update_root / update_asp_root calls.
      if (ADMIN_ADDRESS && address === ADMIN_ADDRESS) {
        const rawCommitments = await getCommitments();
        const commitments = rawCommitments.map(hex32ToBigint);
        const tree = PoseidonMerkleTree.fromCommitments(commitments);
        const newRoot = bigintToHex32(tree.getRoot());
        await updatePoolRoot(address, newRoot);
        await updateAspRoot(address, newRoot);
      }

      setStep("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al depositar");
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

  return (
    <div className="max-w-lg mx-auto px-4 py-16 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Depositar</h1>
        <p className="text-pool-text-dim">
          Envía fondos al pool. Tu recibo privado se genera aquí — nunca sale de tu dispositivo.
        </p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        {(["connect", "amount", "generating", "confirm", "done"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s
                  ? "bg-pool-violet text-white"
                  : ["connect", "amount", "generating", "confirm", "done"].indexOf(step) > i
                  ? "bg-pool-green text-white"
                  : "bg-pool-card text-pool-muted border border-pool-border"
              }`}
            >
              {["connect", "amount", "generating", "confirm", "done"].indexOf(step) > i ? "✓" : i + 1}
            </div>
            {i < 4 && <div className="flex-1 h-px bg-pool-border min-w-4" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Step: Connect */}
      {step === "connect" && (
        <div className="card animate-slide-up">
          <div className="text-center py-4">
            <div className="text-5xl mb-4">🔗</div>
            <h2 className="text-xl font-semibold mb-2">Conecta tu wallet</h2>
            <p className="text-pool-text-dim text-sm mb-6">
              Necesitamos tu wallet Freighter para autorizar la transacción en Stellar.
              Tu dirección es pública; tu recibo permanece privado.
            </p>
            <button onClick={handleConnect} disabled={loading} className="btn-primary w-full">
              {loading ? "Conectando…" : "Conectar Freighter"}
            </button>
          </div>
        </div>
      )}

      {/* Step: Amount */}
      {step === "amount" && (
        <div className="card animate-slide-up">
          <h2 className="text-xl font-semibold mb-4">Confirmar depósito</h2>
          <div className="bg-pool-surface rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-pool-text-dim text-sm">Monto fijo</span>
              <span className="font-mono font-bold text-xl text-pool-text">10 USDC</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-pool-text-dim text-sm">Desde</span>
              <span className="font-mono text-xs text-pool-text-dim">
                {address?.slice(0, 6)}…{address?.slice(-4)}
              </span>
            </div>
          </div>
          <div className="bg-pool-violet/5 border border-pool-violet/20 rounded-xl p-4 mb-6">
            <p className="text-sm text-pool-text-dim">
              <strong className="text-pool-violet-light">Importante:</strong> Se generará un
              recibo privado. Es la única forma de retirar tus fondos.{" "}
              <strong>Guárdalo en un lugar seguro.</strong>
            </p>
          </div>
          <button onClick={handleDeposit} disabled={loading} className="btn-primary w-full">
            Depositar 10 USDC
          </button>
        </div>
      )}

      {/* Step: Generating */}
      {step === "generating" && (
        <div className="card animate-slide-up text-center py-8">
          <div className="w-16 h-16 border-4 border-pool-violet border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Preparando tu depósito</h2>
          <p className="text-pool-text-dim text-sm">
            Generando tu recibo privado y enviando la transacción a Stellar…
          </p>
        </div>
      )}

      {/* Step: Done */}
      {step === "done" && receipt && (
        <div className="animate-slide-up space-y-4">
          <div className="card border-pool-green/30 bg-pool-green/5 text-center py-6">
            <div className="text-5xl mb-3">✅</div>
            <h2 className="text-xl font-semibold text-pool-green mb-1">¡Depósito exitoso!</h2>
            <p className="text-pool-text-dim text-sm">
              Tus fondos están en el pool. Nadie puede ver quién depositó.
            </p>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-2 text-pool-violet-light">
              Tu recibo privado
            </h3>
            <p className="text-pool-text-dim text-xs mb-3">
              Este es el único modo de retirar tus fondos. Guárdalo como si fuera
              la llave de tu caja fuerte.
            </p>
            <div className="bg-pool-surface rounded-lg p-3 font-mono text-xs text-pool-text-dim break-all mb-4 max-h-32 overflow-auto">
              {receipt}
            </div>
            <div className="flex gap-3">
              <button onClick={downloadReceipt} className="btn-primary flex-1 text-sm py-2">
                Descargar recibo
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(receipt)}
                className="btn-secondary flex-1 text-sm py-2"
              >
                Copiar
              </button>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <p className="text-amber-300 text-xs">
              ⚠ Sin este recibo no podrás retirar tus fondos. No existe recuperación.
              Guárdalo en múltiples lugares seguros.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}