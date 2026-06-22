import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { useI18n } from "../i18n/context";

const POOL_ID = import.meta.env.VITE_POOL_CONTRACT_ID ?? "";
const ASP_ID = import.meta.env.VITE_ASP_CONTRACT_ID ?? "";
const VERIFIER_ID = import.meta.env.VITE_VERIFIER_CONTRACT_ID ?? "";

export default function Footer() {
  const { lang } = useI18n();

  return (
    <footer className="border-t border-white/[0.04] bg-pool-bg/80 mt-auto">
      <div className="max-w-6xl mx-auto px-5 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          {/* Brand + Team */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pool-green to-pool-violet flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="font-semibold text-pool-text">
                Mongli<span className="text-pool-violet-light">Pool</span>
              </span>
            </div>
            <p className="text-pool-text-dim text-sm leading-relaxed mb-3 max-w-sm">
              {lang === "es"
                ? "Pool de privacidad ZK en Stellar con cumplimiento regulatorio. Construido por Mongli DAO para Stellar Hacks: ZK."
                : "ZK privacy pool on Stellar with regulatory compliance. Built by Mongli DAO for Stellar Hacks: ZK."}
            </p>
            <div className="space-y-1 text-sm">
              <p className="text-pool-text font-medium">- A L F A -</p>
              <p className="text-pool-text-dim text-xs">Mongli DAO</p>
              <a
                href="https://instagram.com/ALFA_EDG_"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-pool-violet-light hover:text-pool-violet transition-colors"
              >
                <ExternalLink size={10} />
                @ALFA_EDG_
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-xs font-semibold text-pool-text uppercase tracking-wider mb-3">
              {lang === "es" ? "Navegación" : "Navigation"}
            </h3>
            <div className="space-y-2">
              {[
                { to: "/deposit", label: lang === "es" ? "Depositar" : "Deposit" },
                { to: "/withdraw", label: lang === "es" ? "Retirar" : "Withdraw" },
                { to: "/auditor", label: "Auditor" },
                { to: "/history", label: lang === "es" ? "Historial" : "History" },
                { to: "/explorer", label: lang === "es" ? "Explorador" : "Explorer" },
                { to: "/verify", label: lang === "es" ? "Verificar" : "Verify" },
                { to: "/stats", label: lang === "es" ? "Métricas" : "Metrics" },
                { to: "/business", label: lang === "es" ? "Modelo" : "Business" },
                { to: "/status", label: "Status" },
              ].map(({ to, label }) => (
                <Link key={to} to={to} className="block text-sm text-pool-text-dim hover:text-pool-text transition-colors">
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contracts */}
          <div>
            <h3 className="text-xs font-semibold text-pool-text uppercase tracking-wider mb-3">
              {lang === "es" ? "Contratos" : "Contracts"}
            </h3>
            <div className="space-y-2">
              {[
                { label: "Privacy Pool", id: POOL_ID },
                { label: "ASP Registry", id: ASP_ID },
                { label: "Groth16 Verifier", id: VERIFIER_ID },
              ].map(({ label, id }) => (
                <a
                  key={id}
                  href={`https://stellar.expert/explorer/testnet/contract/${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-pool-text-dim hover:text-pool-green transition-colors"
                >
                  <ExternalLink size={10} />
                  <span>{label}</span>
                  <span className="font-mono opacity-50">{id.slice(0, 6)}...{id.slice(-4)}</span>
                </a>
              ))}
            </div>
            <a
              href="https://github.com/ALFA117/MongliPool"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-pool-text-dim hover:text-pool-text transition-colors mt-3"
            >
              <ExternalLink size={10} />
              GitHub
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/[0.04] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-pool-muted">
            {lang === "es"
              ? "Prototipo educativo MVP — Stellar testnet — no usar con fondos reales"
              : "Educational MVP prototype — Stellar testnet — do not use with real funds"}
          </p>
          <p className="text-[11px] text-pool-muted">
            Stellar Hacks: ZK 2025 — Mongli DAO
          </p>
        </div>
      </div>
    </footer>
  );
}