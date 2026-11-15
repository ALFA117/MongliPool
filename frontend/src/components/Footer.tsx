import { Link } from "react-router-dom";
import { ExternalLink, RotateCcw } from "lucide-react";
import { useI18n } from "../i18n/context";

const POOL_ID = import.meta.env.VITE_POOL_CONTRACT_ID ?? "";
const ASP_ID = import.meta.env.VITE_ASP_CONTRACT_ID ?? "";
const VERIFIER_ID = import.meta.env.VITE_VERIFIER_CONTRACT_ID ?? "";

export default function Footer() {
  const { lang } = useI18n();

  return (
    <footer className="border-t border-pool-border bg-pool-surface mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 xl:px-0 py-14">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          {/* Brand + Team */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity">
              <img src="/logo.svg" alt="" className="w-8 h-8" />
              <span className="font-semibold text-pool-text">
                Mongli<span className="font-normal text-pool-text-dim">Pool</span>
              </span>
            </Link>
            <p className="text-pool-text-dim text-[15px] leading-relaxed mb-4 max-w-sm">
              {lang === "es"
                ? "Pool de privacidad ZK en Stellar con cumplimiento regulatorio. Construido por Mongli DAO para Stellar Hacks: ZK."
                : "ZK privacy pool on Stellar with regulatory compliance. Built by Mongli DAO for Stellar Hacks: ZK."}
            </p>
            <div className="space-y-1 text-sm">
              <p className="font-mono text-pool-text">- A L F A -</p>
              <p className="text-pool-text-dim text-xs">Mongli DAO</p>
              <a
                href="https://instagram.com/ALFA_EDG_"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 min-h-[44px] text-sm text-pool-text-dim hover:text-pool-text underline underline-offset-4 decoration-pool-border transition-colors"
              >
                <ExternalLink size={10} />
                @ALFA_EDG_
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-mono text-[13px] text-pool-muted mb-3">
              {lang === "es" ? "Navegación" : "Navigation"}
            </h3>
            <div className="space-y-0.5">
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
                <Link key={to} to={to} className="block py-1.5 text-[15px] text-pool-text-dim hover:text-pool-text transition-colors">
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contracts */}
          <div>
            <h3 className="font-mono text-[13px] text-pool-muted mb-3">
              {lang === "es" ? "Contratos" : "Contracts"}
            </h3>
            <div className="space-y-0.5">
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
                  className="flex flex-wrap items-center gap-x-2 gap-y-0.5 py-1.5 text-[15px] text-pool-text-dim hover:text-pool-text transition-colors"
                >
                  <ExternalLink size={10} />
                  <span>{label}</span>
                  <span className="font-mono text-[13px] text-pool-muted">{id.slice(0, 6)}...{id.slice(-4)}</span>
                </a>
              ))}
            </div>
            <a
              href="https://github.com/ALFA117/MongliPool"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 py-1.5 text-[15px] text-pool-text-dim hover:text-pool-text transition-colors mt-2"
            >
              <ExternalLink size={10} />
              GitHub
            </a>
            <button
              onClick={() => { try { localStorage.setItem("monglipool-intro-requested", "1"); } catch { /* */ } window.location.reload(); }}
              className="flex items-center gap-1.5 min-h-[44px] text-[15px] text-pool-text-dim hover:text-pool-text transition-colors cursor-pointer"
            >
              <RotateCcw size={10} />
              {lang === "es" ? "Ver introducción" : "Replay intro"}
            </button>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-pool-border pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="font-mono text-[13px] text-pool-muted">
            {lang === "es"
              ? "Prototipo educativo MVP — Stellar testnet — no usar con fondos reales"
              : "Educational MVP prototype — Stellar testnet — do not use with real funds"}
          </p>
          <p className="font-mono text-[13px] text-pool-muted">
            Stellar Hacks: ZK 2025 — Mongli DAO
          </p>
        </div>
      </div>
    </footer>
  );
}