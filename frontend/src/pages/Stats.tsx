import { useState, useEffect, useRef } from "react";
import { Activity, ArrowDownToLine, ArrowUpFromLine, Wallet, RefreshCw } from "lucide-react";
import { useI18n } from "../i18n/context";
import { rpc, TransactionBuilder, Networks, BASE_FEE, Contract, scValToNative } from "@stellar/stellar-sdk";

const RPC_URL = import.meta.env.VITE_STELLAR_RPC_URL ?? "https://soroban-testnet.stellar.org";
const POOL_ID = import.meta.env.VITE_POOL_CONTRACT_ID ?? "";
const SIM = import.meta.env.VITE_ADMIN_ADDRESS ?? "";

const server = new rpc.Server(RPC_URL);

async function queryContract(method: string): Promise<unknown> {
  const account = await server.getAccount(SIM);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(new Contract(POOL_ID).call(method))
    .setTimeout(30)
    .build();
  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) return null;
  return scValToNative(sim.result!.retval);
}

interface PoolMetrics {
  depositCount: number;
  tvl: string;
  commitments: number;
  rootsCount: number;
}

export default function Stats() {
  const { lang } = useI18n();
  const [metrics, setMetrics] = useState<PoolMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchMetrics() {
    setLoading(true);
    setError(null);
    try {
      const [depositCount, balance, commitments, roots] = await Promise.all([
        queryContract("get_deposit_count"),
        queryContract("get_pool_balance"),
        queryContract("get_commitments"),
        queryContract("get_roots_history"),
      ]);

      setMetrics({
        depositCount: (depositCount as number) ?? 0,
        tvl: balance != null ? (Number(balance as bigint) / 1e7).toFixed(2) : "0.00",
        commitments: Array.isArray(commitments) ? commitments.length : 0,
        rootsCount: Array.isArray(roots) ? roots.length : 0,
      });
    } catch {
      setError(lang === "es" ? "Error al cargar métricas" : "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchMetrics(); }, []);

  return (
    <div className="max-w-4xl mx-auto px-5 py-20 animate-fade-in">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {lang === "es" ? "Métricas del Pool" : "Pool Metrics"}
          </h1>
          <p className="text-pool-text-dim text-sm">
            {lang === "es" ? "Datos reales leídos on-chain del contrato en testnet" : "Real on-chain data from the testnet contract"}
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="btn-secondary py-2 px-3 inline-flex items-center gap-2 text-sm"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {lang === "es" ? "Actualizar" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading && !metrics ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-pool-violet border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : metrics ? (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <MetricCard
              icon={<Wallet size={20} />}
              label={lang === "es" ? "TVL del Pool" : "Pool TVL"}
              value={`${metrics.tvl} XLM`}
              numericValue={parseFloat(metrics.tvl)}
              color="violet"
            />
            <MetricCard
              icon={<ArrowDownToLine size={20} />}
              label={lang === "es" ? "Depósitos totales" : "Total Deposits"}
              value={String(metrics.depositCount)}
              numericValue={metrics.depositCount}
              color="green"
            />
            <MetricCard
              icon={<Activity size={20} />}
              label={lang === "es" ? "Commitments" : "Commitments"}
              value={String(metrics.commitments)}
              numericValue={metrics.commitments}
              color="blue"
            />
            <MetricCard
              icon={<ArrowUpFromLine size={20} />}
              label={lang === "es" ? "Raíces registradas" : "Registered Roots"}
              value={String(metrics.rootsCount)}
              numericValue={metrics.rootsCount}
              color="violet"
            />
          </div>

          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-3">
              {lang === "es" ? "Contrato" : "Contract"}
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-pool-text-dim">Privacy Pool</span>
                <a
                  href={`https://stellar.expert/explorer/testnet/contract/${POOL_ID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-pool-green hover:underline"
                >
                  {POOL_ID.slice(0, 8)}...{POOL_ID.slice(-6)}
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-pool-text-dim">Network</span>
                <span className="text-xs text-pool-text-dim">Stellar Testnet</span>
              </div>
            </div>
          </div>

          <p className="text-center text-pool-muted text-xs mt-8">
            {lang === "es"
              ? "Todos los datos se leen directamente del contrato en Stellar testnet vía RPC. Nada es simulado."
              : "All data is read directly from the Stellar testnet contract via RPC. Nothing is simulated."}
          </p>
        </>
      ) : null}
    </div>
  );
}

function useCountUp(target: number, duration = 1000) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current || target === 0) return;
    started.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return val;
}

function MetricCard({ icon, label, value, numericValue, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  numericValue?: number;
  color: "violet" | "green" | "blue";
}) {
  const animated = useCountUp(numericValue ?? 0);
  const colors = {
    violet: "from-pool-violet/20 to-pool-violet/5 border-pool-violet/20 text-pool-violet-light",
    green: "from-pool-green/20 to-pool-green/5 border-pool-green/20 text-pool-green",
    blue: "from-blue-500/20 to-blue-500/5 border-blue-500/20 text-blue-400",
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5 card-hover`}>
      <div className="flex items-center gap-2 mb-3 opacity-70">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-pool-text tabular-nums">
        {numericValue != null ? animated : value}
        {numericValue != null && value.includes("XLM") ? " XLM" : ""}
      </p>
    </div>
  );
}