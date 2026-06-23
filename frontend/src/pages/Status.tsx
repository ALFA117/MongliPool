import { ExternalLink } from "lucide-react";
import { useI18n } from "../i18n/context";

const POOL_ID = import.meta.env.VITE_POOL_CONTRACT_ID ?? "";
const ASP_ID = import.meta.env.VITE_ASP_CONTRACT_ID ?? "";
const VERIFIER_ID = import.meta.env.VITE_VERIFIER_CONTRACT_ID ?? "";

export default function Status() {
  const { lang } = useI18n();
  const es = lang === "es";

  return (
    <div className="max-w-3xl mx-auto px-5 py-20 animate-fade-in">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold mb-3 tracking-tight">MongliPool</h1>
        <p className="text-pool-text-dim">
          {es
            ? "Pool de privacidad ZK en Stellar con cumplimiento regulatorio"
            : "ZK privacy pool on Stellar with regulatory compliance"}
        </p>
      </div>

      {/* Contracts */}
      <div className="glass-panel p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">
          {es ? "Contratos en Testnet" : "Testnet Contracts"}
        </h2>
        <div className="space-y-3">
          {[
            { name: "Privacy Pool", id: POOL_ID },
            { name: "ASP Registry", id: ASP_ID },
            { name: "Groth16 Verifier", id: VERIFIER_ID },
          ].map(({ name, id }) => (
            <div key={id} className="flex items-center justify-between gap-4">
              <span className="text-pool-text-dim text-sm">{name}</span>
              <a
                href={`https://stellar.expert/explorer/testnet/contract/${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[11px] text-pool-green hover:underline inline-flex items-center gap-1"
              >
                {id.slice(0, 8)}...{id.slice(-6)}
                <ExternalLink size={10} />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Links */}
      <div className="glass-panel p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Links</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { label: "GitHub", url: "https://github.com/ALFA117/MongliPool" },
            { label: "Live Demo", url: "https://mongli-pool.vercel.app" },
            { label: "Hackathon", url: "https://dorahacks.io/hackathon/stellar-hacks-zk" },
            { label: "Stellar Expert", url: `https://stellar.expert/explorer/testnet/contract/${POOL_ID}` },
          ].map(({ label, url }) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-sm py-2.5 px-4 inline-flex items-center justify-center gap-2"
            >
              {label}
              <ExternalLink size={12} />
            </a>
          ))}
        </div>
      </div>

      {/* Team */}
      <div className="glass-panel p-6">
        <h2 className="text-lg font-semibold mb-4">
          {es ? "Equipo" : "Team"}
        </h2>
        <div className="flex items-center gap-4">
          <img src="/logo.svg" alt="MongliPool" className="w-12 h-12" />
          <div>
            <p className="font-semibold">- A L F A -</p>
            <p className="text-pool-text-dim text-sm">Mongli DAO</p>
            <a
              href="https://instagram.com/ALFA_EDG_"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-pool-green hover:underline inline-flex items-center gap-1 mt-1"
            >
              @ALFA_EDG_
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>

      <p className="text-center text-pool-muted text-xs mt-8">
        Stellar Hacks: ZK 2025 — Mongli DAO
      </p>
    </div>
  );
}
