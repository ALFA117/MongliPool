import { useState, useEffect } from "react";
import { Search, RefreshCw, ExternalLink, Hash, Layers } from "lucide-react";
import { useI18n } from "../i18n/context";
import { getCommitments, getPoolBalance, getPoolDepositCount } from "../lib/stellar";
import Reveal from "../components/Reveal";

export default function Explorer() {
  const { lang } = useI18n();
  const [commitments, setCommitments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [poolBalance, setPoolBalance] = useState(0);
  const [depositCount, setDepositCount] = useState(0);

  async function fetchData() {
    setLoading(true);
    try {
      const [cs, bal, count] = await Promise.all([
        getCommitments(),
        getPoolBalance(),
        getPoolDepositCount(),
      ]);
      setCommitments(cs);
      setPoolBalance(bal);
      setDepositCount(count);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  const filtered = search
    ? commitments.filter((c) => c.toLowerCase().includes(search.toLowerCase()))
    : commitments;

  return (
    <div className="max-w-4xl mx-auto px-5 py-20 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {lang === "es" ? "Explorador del Pool" : "Pool Explorer"}
          </h1>
          <p className="text-pool-text-dim text-sm">
            {lang === "es"
              ? "Todos los commitments anónimos registrados en el contrato"
              : "All anonymous commitments registered in the contract"}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="btn-secondary py-2 px-3 inline-flex items-center gap-2 text-sm"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {lang === "es" ? "Actualizar" : "Refresh"}
        </button>
      </div>

      {/* Pool summary */}
      <Reveal>
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="glass-panel p-4 text-center">
            <Layers size={20} className="text-pool-green mx-auto mb-2" />
            <div className="text-2xl font-bold text-pool-text tabular-nums">{depositCount}</div>
            <div className="text-xs text-pool-text-dim">{lang === "es" ? "Depósitos totales" : "Total deposits"}</div>
          </div>
          <div className="glass-panel p-4 text-center">
            <Hash size={20} className="text-pool-violet-light mx-auto mb-2" />
            <div className="text-2xl font-bold text-pool-text tabular-nums">{commitments.length}</div>
            <div className="text-xs text-pool-text-dim">Commitments</div>
          </div>
          <div className="glass-panel p-4 text-center">
            <div className="text-pool-accent mx-auto mb-2 text-xl font-bold">₮</div>
            <div className="text-2xl font-bold text-pool-text tabular-nums">{poolBalance.toFixed(1)}</div>
            <div className="text-xs text-pool-text-dim">XLM TVL</div>
          </div>
        </div>
      </Reveal>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-pool-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={lang === "es" ? "Buscar commitment por hash..." : "Search commitment by hash..."}
          className="input-field pl-11"
        />
      </div>

      {/* Commitment list */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-pool-green border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel p-8 text-center text-pool-text-dim">
          {search
            ? (lang === "es" ? "No se encontraron resultados" : "No results found")
            : (lang === "es" ? "No hay commitments en el pool" : "No commitments in the pool")}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c, i) => (
            <Reveal key={c} delay={Math.min(i * 30, 300)}>
              <div className="glass-panel px-4 py-3 flex items-center justify-between gap-4 card-hover">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-pool-green/10 border border-pool-green/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-mono text-pool-green">#{commitments.indexOf(c)}</span>
                  </div>
                  <span className="font-mono text-xs text-pool-text-dim truncate">{c}</span>
                </div>
                <a
                  href={`https://stellar.expert/explorer/testnet/contract/${import.meta.env.VITE_POOL_CONTRACT_ID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pool-muted hover:text-pool-green transition-colors flex-shrink-0"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      )}

      <p className="text-center text-pool-muted text-xs mt-8">
        {lang === "es"
          ? "Cada commitment es un hash Poseidon anónimo — nadie puede saber a quién pertenece ni cuánto contiene."
          : "Each commitment is an anonymous Poseidon hash — nobody can tell who it belongs to or how much it contains."}
      </p>
    </div>
  );
}
