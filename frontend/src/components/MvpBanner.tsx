import { useState } from "react";
import { X, FlaskConical, ChevronDown, ChevronUp } from "lucide-react";
import { useI18n } from "../i18n/context";

const limitations = {
  es: [
    "Trusted setup local — no hubo ceremonia MPC pública",
    "View key simétrica hardcoded — cualquiera con el código puede descifrar notas",
    "ASP tree = Pool tree — producción los separaría",
    "Root updates permisionless — producción usaría relayer de confianza",
    "Monto variable entre 1–1000 XLM por depósito (testnet)",
    "Circuito sin auditoría externa de seguridad",
    "Prueba ZK ~30s single-thread (sin COEP por compatibilidad con Freighter)",
  ],
  en: [
    "Local trusted setup — no public MPC ceremony",
    "Hardcoded symmetric view key — anyone with the code can decrypt notes",
    "ASP tree = Pool tree — production would separate them",
    "Permissionless root updates — production would use trusted relayer",
    "Variable amounts 1–1000 XLM per deposit (testnet)",
    "Circuit not externally audited",
    "ZK proof ~30s single-thread (no COEP for Freighter compatibility)",
  ],
};

export default function MvpBanner() {
  const { lang } = useI18n();
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-pool-violet/8 border-b border-pool-violet/15">
      <div className="max-w-6xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <FlaskConical size={14} className="text-pool-violet-light flex-shrink-0" />
            <span className="text-xs text-pool-text-dim">
              {lang === "es"
                ? "MongliPool es un MVP para Stellar Hacks: ZK — corre en testnet, no en producción."
                : "MongliPool is an MVP for Stellar Hacks: ZK — runs on testnet, not production."}
            </span>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-pool-violet-light hover:text-pool-violet font-medium flex items-center gap-1 flex-shrink-0 cursor-pointer"
            >
              {lang === "es" ? "Ver limitaciones" : "See limitations"}
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
          <ul className="mt-2 mb-1 space-y-1 pl-6">
            {limitations[lang].map((item, i) => (
              <li key={i} className="text-xs text-pool-text-dim list-disc">{item}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}