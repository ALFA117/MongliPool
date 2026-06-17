import { useState, useEffect } from "react";
import { ExternalLink, CheckCircle } from "lucide-react";
import { useI18n } from "../i18n/context";

interface Task {
  name: string;
  done: boolean;
}

interface Phase {
  id: number;
  name: string;
  description: string;
  status: "done" | "in_progress" | "pending";
  progress: number;
  tasks: Task[];
}

interface Progress {
  project: string;
  hackathon: string;
  deadline: string;
  current_phase: string;
  overall_progress: number;
  phases: Phase[];
  contracts: {
    testnet: Record<string, string | null>;
  };
  links: Record<string, string | null>;
}

function useCountdown(deadline: string) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const update = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      setRemaining(Math.max(0, diff));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const d = Math.floor(remaining / 86_400_000);
  const h = Math.floor((remaining % 86_400_000) / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  const s = Math.floor((remaining % 60_000) / 1_000);
  return { d, h, m, s, done: remaining === 0 };
}

export default function Status() {
  const { t } = useI18n();
  const [data, setData] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const countdown = useCountdown(data?.deadline ?? new Date(Date.now() + 1).toISOString());

  useEffect(() => {
    fetch("/progress.json")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError(t("status", "loadError")));
  }, [t]);

  if (error) {
    return <div className="text-center py-20 text-red-400">{error}</div>;
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <div className="w-8 h-8 border-2 border-pool-violet border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    done: "text-pool-green border-pool-green/20 bg-pool-green/5",
    in_progress: "text-pool-violet-light border-pool-violet/20 bg-pool-violet/5",
    pending: "text-pool-muted border-white/[0.06] bg-white/[0.02]",
  };

  const statusLabel = (s: string) => {
    if (s === "done") return t("status", "completed");
    if (s === "in_progress") return t("status", "inProgress");
    return t("status", "pending");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 animate-fade-in">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-1.5 bg-pool-violet/10 text-pool-violet-light border border-pool-violet/20 px-3 py-1 rounded-full text-xs font-medium mb-4">
          {data.hackathon}
        </div>
        <h1 className="text-4xl font-bold mb-2">{data.project}</h1>
        <p className="text-pool-text-dim">{data.current_phase}</p>
      </div>

      {/* Countdown + progress */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 text-center">
          <p className="text-pool-text-dim text-sm mb-3">{t("status", "timeLeft")}</p>
          {countdown.done ? (
            <p className="text-red-400 font-bold text-xl">{t("status", "deadlinePassed")}</p>
          ) : (
            <div className="flex justify-center gap-3">
              {[
                { val: countdown.d, label: t("status", "days") },
                { val: countdown.h, label: "h" },
                { val: countdown.m, label: "min" },
                { val: countdown.s, label: "seg" },
              ].map(({ val, label }) => (
                <div key={label} className="bg-white/[0.04] rounded-lg px-3 py-2 min-w-12">
                  <div className="font-mono font-bold text-2xl text-pool-violet-light tabular-nums">
                    {String(val).padStart(2, "0")}
                  </div>
                  <div className="text-xs text-pool-text-dim">{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
          <p className="text-pool-text-dim text-sm mb-3">{t("status", "overall")}</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white/[0.04] rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pool-violet to-pool-violet-light rounded-full transition-all duration-500"
                style={{ width: `${data.overall_progress}%` }}
              />
            </div>
            <span className="font-mono font-bold text-pool-violet-light min-w-10 text-right tabular-nums">
              {data.overall_progress}%
            </span>
          </div>
        </div>
      </div>

      {/* Phases */}
      <div className="space-y-4 mb-10">
        <h2 className="text-xl font-semibold mb-4">{t("status", "phases")}</h2>
        {data.phases.map((phase) => (
          <div key={phase.id} className={`border rounded-2xl p-5 ${statusColor[phase.status] ?? statusColor.pending}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs opacity-60">{t("status", "phase")} {phase.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor[phase.status] ?? statusColor.pending}`}>
                    {statusLabel(phase.status)}
                  </span>
                </div>
                <h3 className="font-semibold text-pool-text">{phase.name}</h3>
                <p className="text-pool-text-dim text-xs mt-0.5">{phase.description}</p>
              </div>
              <span className="font-mono font-bold text-lg ml-4 tabular-nums">{phase.progress}%</span>
            </div>

            <div className="bg-black/20 rounded-full h-1.5 mb-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  phase.status === "done"
                    ? "bg-pool-green"
                    : phase.status === "in_progress"
                    ? "bg-pool-violet"
                    : "bg-pool-muted"
                }`}
                style={{ width: `${phase.progress}%` }}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-1">
              {phase.tasks.map((task) => (
                <div key={task.name} className="flex items-center gap-2 text-xs">
                  {task.done ? (
                    <CheckCircle size={14} className="text-pool-green flex-shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded border border-white/20 flex-shrink-0" />
                  )}
                  <span className={task.done ? "text-pool-text line-through opacity-60" : "text-pool-text-dim"}>
                    {task.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Contract addresses */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">{t("status", "contracts")}</h2>
        <div className="space-y-3">
          {Object.entries(data.contracts.testnet).map(([name, addr]) => (
            <div key={name} className="flex items-center justify-between gap-4">
              <span className="text-pool-text-dim text-sm capitalize">
                {name.replace(/_/g, " ")}
              </span>
              {addr ? (
                <span className="font-mono text-xs text-pool-green bg-pool-green/10 px-2 py-1 rounded truncate max-w-[280px]">
                  {addr}
                </span>
              ) : (
                <span className="text-xs text-pool-muted italic">{t("status", "pendingDeploy")}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Links */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">{t("status", "links")}</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(data.links).map(([key, url]) =>
            url ? (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-sm py-2 px-4 inline-flex items-center gap-2"
              >
                {key.replace(/_/g, " ")}
                <ExternalLink size={12} />
              </a>
            ) : (
              <span key={key} className="text-pool-muted text-sm px-4 py-2 border border-white/[0.06] rounded-xl opacity-50">
                {key.replace(/_/g, " ")}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}