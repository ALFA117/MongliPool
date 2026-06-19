import { useState } from "react";
import { X, FlaskConical, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { useI18n } from "../i18n/context";

interface Item { now: string; prod: string; }

const items: Record<string, Item[]> = {
  es: [
    { now: "Setup criptográfico local (1 máquina)", prod: "Ceremonia MPC pública con múltiples participantes" },
    { now: "Una clave privada del DAO (Curve25519)", prod: "View key multisig del DAO (3-de-5)" },
    { now: "ASP tree = Pool tree (simplificado)", prod: "Árboles separados e independientes" },
    { now: "Sincronización de raíces abierta", prod: "Relayer de confianza o cálculo on-chain" },
    { now: "Sin auditoría externa del circuito", prod: "Auditoría profesional antes de mainnet" },
    { now: "Prueba ZK ~30s (un hilo)", prod: "~5s con WebWorkers multi-hilo" },
  ],
  en: [
    { now: "Local cryptographic setup (1 machine)", prod: "Public MPC ceremony with multiple participants" },
    { now: "Single DAO private key (Curve25519)", prod: "DAO multisig view key (3-of-5)" },
    { now: "ASP tree = Pool tree (simplified)", prod: "Separate independent trees" },
    { now: "Open root synchronization", prod: "Trusted relayer or on-chain computation" },
    { now: "No external circuit audit", prod: "Professional audit before mainnet" },
    { now: "ZK proof ~30s (single thread)", prod: "~5s with multi-threaded WebWorkers" },
  ],
};

export default function MvpBanner() {
  const { lang } = useI18n();
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-pool-violet/[0.06] border-b border-pool-violet/10">
      <div className="max-w-6xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <FlaskConical size={14} className="text-pool-violet-light flex-shrink-0" />
            <span className="text-xs text-pool-text-dim">
              {lang === "es"
                ? "MongliPool — prototipo MVP en Stellar testnet para Stellar Hacks: ZK"
                : "MongliPool — MVP prototype on Stellar testnet for Stellar Hacks: ZK"}
            </span>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-pool-violet-light hover:text-pool-violet font-medium flex items-center gap-1 flex-shrink-0 cursor-pointer"
            >
              {lang === "es" ? "Transparencia técnica" : "Technical transparency"}
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-pool-muted hover:text-pool-text-dim p-1 cursor-pointer flex-shrink-0"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
        {expanded && (
          <div className="mt-3 mb-2">
            <div className="grid grid-cols-[1fr_auto_1fr] gap-x-3 gap-y-1.5 text-xs">
              <div className="font-medium text-pool-text-dim pb-1 border-b border-white/[0.06]">
                {lang === "es" ? "En esta versión" : "Current version"}
              </div>
              <div className="pb-1 border-b border-white/[0.06]" />
              <div className="font-medium text-pool-green pb-1 border-b border-white/[0.06]">
                {lang === "es" ? "En producción" : "Production"}
              </div>
              {items[lang].map((item, i) => (
                <div key={i} className="contents">
                  <span className="text-pool-text-dim py-0.5">{item.now}</span>
                  <ArrowRight size={10} className="text-pool-muted self-center" />
                  <span className="text-pool-green/80 py-0.5">{item.prod}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
