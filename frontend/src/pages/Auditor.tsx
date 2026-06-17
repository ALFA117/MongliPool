import { useState } from "react";
import { fromBase64, decryptNote, decodeNote } from "../lib/crypto";
import { getDepositEvents } from "../lib/stellar";

interface AuditRecord {
  commitment: string;
  amount: string;
  timestamp: number;
  status: "valid" | "error";
}

export default function Auditor() {
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
      // Decode view key from hex or base64
      let viewKey: Uint8Array;
      const trimmed = viewKeyInput.trim();
      if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
        viewKey = Uint8Array.from(Buffer.from(trimmed, "hex"));
      } else {
        viewKey = fromBase64(trimmed);
      }
      if (viewKey.length !== 32) {
        throw new Error("La llave de vista debe tener 32 bytes (64 hex chars o base64)");
      }

      // Fetch deposit events from on-chain
      const events = await getDepositEvents();

      const results: AuditRecord[] = events.map((event) => {
        try {
          const plaintext = decryptNote(viewKey, event.encryptedNote);
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
            amount: (Number(amount) / 1e7).toFixed(2) + " USDC",
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
      setError(e instanceof Error ? e.message : "Error desconocido");
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
        <div className="badge-verified mb-4 w-fit">Solo Auditor Autorizado</div>
        <h1 className="text-3xl font-bold mb-2">Panel de Auditoría</h1>
        <p className="text-pool-text-dim">
          Con la llave de vista de Mongli DAO puedes reconstruir el historial
          completo de transacciones del pool para cumplimiento regulatorio.
        </p>
      </div>

      <div className="card mb-8">
        <h2 className="text-lg font-semibold mb-4">Llave de vista</h2>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
          <p className="text-amber-300 text-xs">
            ⚠ Solo el auditor autorizado de Mongli DAO tiene esta llave. Mantenla
            confidencial. Esta página no la transmite a ningún servidor.
          </p>
        </div>
        <input
          type="password"
          value={viewKeyInput}
          onChange={(e) => setViewKeyInput(e.target.value)}
          placeholder="Llave de vista (hex 64 chars o base64)"
          className="input-field mb-4"
        />
        <button onClick={handleDecrypt} disabled={loading || !viewKeyInput.trim()} className="btn-primary">
          {loading ? "Descifrando…" : "Descifrar transacciones"}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {done && (
        <div className="animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {records.length} transacciones encontradas
            </h2>
            <button onClick={exportCSV} className="btn-secondary text-sm py-2">
              Exportar CSV
            </button>
          </div>

          {records.length === 0 ? (
            <div className="card text-center py-8 text-pool-text-dim">
              No hay transacciones en el pool todavía.
            </div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-pool-text-dim border-b border-pool-border">
                    <th className="text-left py-3 pr-4 font-medium">Commitment</th>
                    <th className="text-left py-3 pr-4 font-medium">Monto</th>
                    <th className="text-left py-3 pr-4 font-medium">Fecha</th>
                    <th className="text-left py-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={i} className="border-b border-pool-border/50 hover:bg-pool-surface/50">
                      <td className="py-3 pr-4 font-mono text-xs text-pool-text-dim">
                        {r.commitment.slice(0, 8)}…{r.commitment.slice(-6)}
                      </td>
                      <td className="py-3 pr-4 font-mono text-pool-text">{r.amount}</td>
                      <td className="py-3 pr-4 text-pool-text-dim">
                        {new Date(r.timestamp * 1000).toLocaleString("es-ES")}
                      </td>
                      <td className="py-3">
                        {r.status === "valid" ? (
                          <span className="badge-verified">Válido</span>
                        ) : (
                          <span className="badge-pending">Error descifrado</span>
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