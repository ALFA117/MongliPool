import { useState } from "react";
import { Eye, Download, AlertTriangle, Shield, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { decryptNote, decodeNote } from "../lib/crypto";
import { getDepositEvents } from "../lib/stellar";
import { useI18n } from "../i18n/context";

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

interface AuditRecord {
  commitment: string;
  amount: string;
  timestamp: number;
  status: "valid" | "error";
}

export default function Auditor() {
  const { t, lang } = useI18n();
  const [viewKeyInput, setViewKeyInput] = useState("");
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleDecrypt() {
    setError(null);
    setLoading(true);
    setDone(false);

    try {
      const trimmed = viewKeyInput.trim();
      if (!/^[0-9a-fA-F]{64}$/.test(trimmed)) {
        throw new Error(lang === "es"
          ? "La clave privada debe tener exactamente 64 caracteres hexadecimales (32 bytes)"
          : "Private key must be exactly 64 hexadecimal characters (32 bytes)");
      }
      const daoSecretKey = hexToBytes(trimmed);

      const events = await getDepositEvents();

      const results: AuditRecord[] = events.map((event) => {
        try {
          const plaintext = decryptNote(daoSecretKey, event.encryptedNote);
          if (!plaintext) {
            return {
              commitment: event.commitment,
              amount: "—",
              timestamp: event.timestamp,
              status: "error" as const,
            };
          }
          const { amount } = decodeNote(plaintext);
          return {
            commitment: event.commitment,
            amount: (Number(amount) / 1e7).toFixed(2) + " XLM",
            timestamp: event.timestamp,
            status: "valid" as const,
          };
        } catch {
          return {
            commitment: event.commitment,
            amount: "—",
            timestamp: event.timestamp,
            status: "error" as const,
          };
        }
      });

      setRecords(results);
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    const header = "Commitment,Amount,Timestamp,Status";
    const rows = records.map(
      (r) =>
        `${r.commitment},${r.amount},${new Date(r.timestamp * 1000).toISOString()},${r.status}`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "monglipool-audit.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 animate-fade-in">
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 bg-pool-violet/10 text-pool-violet-light border border-pool-violet/20 px-3 py-1 rounded-full text-xs font-medium mb-4">
          <Shield size={12} />
          {t("auditor", "badge")}
        </div>
        <h1 className="text-3xl font-bold mb-2">{t("auditor", "title")}</h1>
        <p className="text-pool-text-dim">{t("auditor", "subtitle")}</p>
      </div>

      {/* Purpose explanation */}
      <div className="bg-pool-violet/5 border border-pool-violet/15 rounded-2xl p-5 mb-6">
        <h3 className="font-semibold text-pool-violet-light text-sm mb-2">
          {lang === "es" ? "¿Por qué existe esta página?" : "Why does this page exist?"}
        </h3>
        <p className="text-pool-text-dim text-sm leading-relaxed">
          {lang === "es"
            ? "MongliPool no es un sistema de privacidad total sin control — eso facilitaría lavado de dinero. Por eso existe un Authorized Set Provider (ASP) que aprueba qué depósitos son legítimos, y esta página de Auditor permite que alguien autorizado por Mongli DAO (con la llave correcta) revise el historial cuando sea necesario por cumplimiento regulatorio — sin que el público en general pueda verlo."
            : "MongliPool is not a total privacy system without oversight — that would facilitate money laundering. That's why an Authorized Set Provider (ASP) approves which deposits are legitimate, and this Auditor page lets someone authorized by Mongli DAO (with the correct key) review the history when needed for regulatory compliance — without the general public being able to see it."}
        </p>
      </div>

      <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-7 mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Eye size={20} className="text-pool-violet-light" />
          {t("auditor", "viewKeyTitle")}
        </h2>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4 flex items-start gap-3">
          <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-amber-300 text-xs">{t("auditor", "viewKeyWarning")}</p>
        </div>
        <input
          type="password"
          value={viewKeyInput}
          onChange={(e) => setViewKeyInput(e.target.value)}
          placeholder={t("auditor", "viewKeyPlaceholder")}
          className="input-field mb-4"
        />
        <button
          onClick={handleDecrypt}
          disabled={loading || !viewKeyInput.trim()}
          className="btn-primary inline-flex items-center gap-2"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
          {loading ? t("auditor", "decrypting") : t("auditor", "decryptBtn")}
        </button>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-8 flex items-start gap-3">
        <Clock size={16} className="text-pool-muted flex-shrink-0 mt-0.5" />
        <p className="text-xs text-pool-text-dim leading-relaxed">
          {lang === "es"
            ? "Nota: por una limitación del RPC de Stellar testnet, este panel solo puede mostrar depósitos de las últimas ~24 horas. Para probarlo, deposita primero y luego vuelve aquí."
            : "Note: due to a Stellar testnet RPC limitation, this panel can only show deposits from the last ~24 hours. To test it, make a deposit first and then come back here."}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-3">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {done && (
        <div className="animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {records.length} {t("auditor", "found")}
            </h2>
            {records.length > 0 && (
              <button onClick={exportCSV} className="btn-secondary text-sm py-2 inline-flex items-center gap-2">
                <Download size={14} />
                {t("auditor", "exportCsv")}
              </button>
            )}
          </div>

          {records.length === 0 ? (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl py-8 px-6">
              <div className="flex flex-col items-center text-center gap-3">
                <Clock size={24} className="text-pool-muted" />
                <p className="text-pool-text-dim text-sm">{t("auditor", "noTx")}</p>
                <p className="text-pool-muted text-xs max-w-md leading-relaxed">
                  {lang === "es"
                    ? "El historial de auditoría cubre aproximadamente las últimas 24 horas (limitación de la infraestructura RPC de Stellar testnet). Si tu depósito es más antiguo, no aparecerá aquí — esto es esperado, no un error."
                    : "The audit history covers approximately the last 24 hours (Stellar testnet RPC infrastructure limitation). If your deposit is older, it won't appear here — this is expected, not an error."}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-pool-text-dim border-b border-white/[0.06]">
                    <th className="text-left py-3 px-4 font-medium">{t("auditor", "colCommitment")}</th>
                    <th className="text-left py-3 px-4 font-medium">{t("auditor", "colAmount")}</th>
                    <th className="text-left py-3 px-4 font-medium">{t("auditor", "colDate")}</th>
                    <th className="text-left py-3 px-4 font-medium">{t("auditor", "colStatus")}</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-pool-text-dim">
                        {r.commitment.slice(0, 8)}...{r.commitment.slice(-6)}
                      </td>
                      <td className="py-3 px-4 font-mono text-pool-text">{r.amount}</td>
                      <td className="py-3 px-4 text-pool-text-dim">
                        {new Date(r.timestamp * 1000).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        {r.status === "valid" ? (
                          <span className="inline-flex items-center gap-1 text-pool-green text-xs">
                            <CheckCircle size={12} />
                            {t("auditor", "valid")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-400 text-xs">
                            <XCircle size={12} />
                            {t("auditor", "errorDecrypt")}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}