import { useState } from "react";
import { X, FlaskConical, ChevronDown, ChevronUp } from "lucide-react";
import { useI18n } from "../i18n/context";

const limitations = {
  es: [
    "Trusted setup local — las claves criptográficas se generaron en una sola máquina. En producción, múltiples participantes independientes garantizarían que nadie puede comprometerlas solo.",
    "View key compartida — la llave del auditor es la misma para todos en esta demo. En producción, sería una llave repartida entre varios miembros del DAO (multisig).",
    "ASP tree = Pool tree — en esta demo comparten el mismo árbol. En producción, el ASP gestionaría su propia lista de direcciones autorizadas por separado.",
    "Root updates abiertos — cualquier usuario puede sincronizar el árbol. En producción, solo un relayer de confianza o el propio contrato lo haría automáticamente.",
    "Circuito sin auditoría externa — el código ZK no ha sido revisado por terceros. Necesario antes de usar con fondos reales.",
    "Prueba ZK ~30s — se genera en un solo hilo del navegador por compatibilidad con Freighter. Con optimización bajaría a ~5s.",
  ],
  en: [
    "Local trusted setup — cryptographic keys were generated on a single machine. In production, multiple independent participants would ensure no one can compromise them alone.",
    "Shared view key — the auditor key is the same for everyone in this demo. In production, it would be split among multiple DAO members (multisig).",
    "ASP tree = Pool tree — in this demo they share the same tree. In production, the ASP would manage its own authorized address list separately.",
    "Open root updates — any user can sync the tree. In production, only a trusted relayer or the contract itself would do this automatically.",
    "Circuit not externally audited — the ZK code hasn't been reviewed by third parties. Required before using with real funds.",
    "ZK proof ~30s — generated in a single browser thread for Freighter compatibility. With optimization it would drop to ~5s.",
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