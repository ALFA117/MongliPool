import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Download, ArrowUpFromLine, Trash2, Clock, FileKey } from "lucide-react";
import { useI18n } from "../i18n/context";
import { useWallet } from "../lib/walletContext";
import { fromBase64 } from "../lib/crypto";
import { useToast } from "../components/Toast";

interface ReceiptData {
  v: number;
  secret: string;
  nullifierSecret: string;
  amount: string;
  commitment: string;
}

interface ParsedReceipt {
  raw: string;
  data: ReceiptData | null;
  amountXLM: string;
  commitmentShort: string;
}

function parseReceipt(raw: string): ParsedReceipt {
  try {
    const bytes = fromBase64(raw);
    const data = JSON.parse(new TextDecoder().decode(bytes)) as ReceiptData;
    return {
      raw,
      data,
      amountXLM: (Number(BigInt(data.amount)) / 1e7).toFixed(2),
      commitmentShort: data.commitment.slice(0, 12) + "..." + data.commitment.slice(-8),
    };
  } catch {
    return { raw, data: null, amountXLM: "?", commitmentShort: "invalid" };
  }
}

export default function History() {
  const { lang } = useI18n();
  const { address } = useWallet();
  const toast = useToast();
  const [receipts, setReceipts] = useState<ParsedReceipt[]>([]);
  const es = lang === "es";

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("monglipool-receipts") || "[]");
      setReceipts(saved.map(parseReceipt));
    } catch { /* ignore */ }
  }, []);

  function removeReceipt(index: number) {
    const saved = JSON.parse(localStorage.getItem("monglipool-receipts") || "[]") as string[];
    saved.splice(index, 1);
    localStorage.setItem("monglipool-receipts", JSON.stringify(saved));
    setReceipts(saved.map(parseReceipt));
    toast.show(es ? "Recibo eliminado" : "Receipt removed");
  }

  function exportAll() {
    const data = JSON.stringify(receipts.map((r) => r.raw), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "monglipool-receipts-backup.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.show(es ? "Backup descargado" : "Backup downloaded");
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-20 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {es ? "Mi historial" : "My history"}
          </h1>
          <p className="text-pool-text-dim text-sm">
            {es
              ? `Recibos guardados en este navegador para ${address?.slice(0, 6)}...${address?.slice(-4)}`
              : `Receipts saved in this browser for ${address?.slice(0, 6)}...${address?.slice(-4)}`}
          </p>
        </div>
        {receipts.length > 0 && (
          <button onClick={exportAll} className="btn-secondary py-2 px-3 text-sm inline-flex items-center gap-2">
            <Download size={14} />
            {es ? "Exportar" : "Export"}
          </button>
        )}
      </div>

      {/* Privacy warning */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-8 flex items-start gap-3">
        <Clock size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-amber-300 text-xs leading-relaxed">
          {es
            ? "Este historial existe SOLO en este navegador. Si limpias el caché o cambias de dispositivo, se perderá. Descarga un backup con el botón Exportar."
            : "This history exists ONLY in this browser. If you clear cache or switch devices, it will be lost. Download a backup with the Export button."}
        </p>
      </div>

      {receipts.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <FileKey size={40} className="text-pool-muted mx-auto mb-4" />
          <p className="text-pool-text-dim mb-2">
            {es ? "Aún no tienes depósitos registrados" : "No deposits registered yet"}
          </p>
          <p className="text-pool-muted text-xs mb-6">
            {es
              ? "Cuando deposites, tu recibo se guardará aquí automáticamente."
              : "When you deposit, your receipt will be saved here automatically."}
          </p>
          <Link to="/deposit" className="btn-primary text-sm py-2 px-6 inline-flex items-center gap-2">
            {es ? "Hacer un depósito" : "Make a deposit"}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {receipts.map((r, i) => (
            <div key={i} className="glass-panel p-4 flex items-center justify-between gap-4 card-hover">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-pool-green tabular-nums">{r.amountXLM} XLM</span>
                  <span className="text-[10px] text-pool-muted">#{i}</span>
                </div>
                <p className="font-mono text-[10px] text-pool-text-dim truncate">{r.commitmentShort}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  to="/withdraw"
                  state={{ receipt: r.raw }}
                  className="text-xs text-pool-green hover:text-pool-green-light inline-flex items-center gap-1 cursor-pointer"
                >
                  <ArrowUpFromLine size={12} />
                  {es ? "Retirar" : "Withdraw"}
                </Link>
                <button
                  onClick={() => removeReceipt(i)}
                  className="text-pool-muted hover:text-red-400 cursor-pointer p-1"
                  title={es ? "Eliminar" : "Remove"}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
