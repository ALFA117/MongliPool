import { useState, useEffect } from "react";

interface Task {
  name: string;
  done: boolean;
}

interface Phase {
  id: number;
  name: string;
  description: string;
  status: "completed" | "in_progress" | "pending";
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

const statusColor: Record<Phase["status"], string> = {
  completed: "text-pool-green border-pool-green/30 bg-pool-green/5",
  in_progress: "text-pool-violet-light border-pool-violet/30 bg-pool-violet/5",
  pending: "text-pool-muted border-pool-border bg-pool-surface/30",
};

const statusLabel: Record<Phase["status"], string> = {
  completed: "Completado",
  in_progress: "En progreso",
  pending: "Pendiente",
};

export default function Status() {
  const [data, setData] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const countdown = useCountdown(data?.deadline ?? new Date(Date.now() + 1).toISOString());

  useEffect(() => {
    fetch("/progress.json")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError("No se pudo cargar progress.json"));
  }, []);

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 animate-fade-in">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="badge-pending mb-4 mx-auto w-fit">{data.hackathon}</div>
        <h1 className="text-4xl font-bold mb-2">{data.project}</h1>
        <p className="text-pool-text-dim">{data.current_phase}</p>
      </div>

      {/* Countdown + overall progress */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <div className="card text-center">
          <p className="text-pool-text-dim text-sm mb-3">Tiempo restante al deadline</p>
          {countdown.done ? (
            <p className="text-red-400 font-bold text-xl">¡Deadline pasado!</p>
          ) : (
            <div className="flex justify-center gap-3">
              {[
                { val: countdown.d, label: "días" },
                { val: countdown.h, label: "h" },
                { val: countdown.m, label: "min" },
                { val: countdown.s, label: "seg" },
              ].map(({ val, label }) => (
                <div key={label} className="bg-pool-surface rounded-lg px-3 py-2 min-w-12">
                  <div className="font-mono font-bold text-2xl text-pool-violet-light">
                    {String(val).padStart(2, "0")}
                  </div>
                  <div className="text-xs text-pool-text-dim">{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <p className="text-pool-text-dim text-sm mb-3">Progreso general</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-pool-surface rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pool-violet to-pool-violet-light rounded-full transition-all duration-500"
                style={{ width: `${data.overall_progress}%` }}
              />
            </div>
            <span className="font-mono font-bold text-pool-violet-light min-w-10 text-right">
              {data.overall_progress}%
            </span>
          </div>
        </div>
      </div>

      {/* Phases */}
      <div className="space-y-4 mb-10">
        <h2 className="text-xl font-semibold mb-4">Fases</h2>
        {data.phases.map((phase) => (
          <div key={phase.id} className={`border rounded-2xl p-5 ${statusColor[phase.status]}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs opacity-60">Fase {phase.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor[phase.status]}`}>
                    {statusLabel[phase.status]}
                  </span>
                </div>
                <h3 className="font-semibold text-pool-text">{phase.name}</h3>
                <p className="text-pool-text-dim text-xs mt-0.5">{phase.description}</p>
              </div>
              <span className="font-mono font-bold text-lg ml-4">{phase.progress}%</span>
            </div>

            {/* Progress bar */}
            <div className="bg-black/20 rounded-full h-1.5 mb-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  phase.status === "completed"
                    ? "bg-pool-green"
                    : phase.status === "in_progress"
                    ? "bg-pool-violet"
                    : "bg-pool-muted"
                }`}
                style={{ width: `${phase.progress}%` }}
              />
            </div>

            {/* Tasks */}
            <div className="grid sm:grid-cols-2 gap-1">
              {phase.tasks.map((task) => (
                <div key={task.name} className="flex items-center gap-2 text-xs">
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                      task.done ? "bg-pool-green" : "border border-pool-border bg-pool-surface/50"
                    }`}
                  >
                    {task.done && (
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
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
      <div className="card mb-8">
        <h2 className="text-lg font-semibold mb-4">Contratos en Testnet</h2>
        <div className="space-y-3">
          {Object.entries(data.contracts.testnet).map(([name, addr]) => (
            <div key={name} className="flex items-center justify-between gap-4">
              <span className="text-pool-text-dim text-sm capitalize">
                {name.replace(/_/g, " ")}
              </span>
              {addr ? (
                <span className="font-mono text-xs text-pool-green bg-pool-green/10 px-2 py-1 rounded">
                  {addr}
                </span>
              ) : (
                <span className="text-xs text-pool-muted italic">Pendiente de deploy</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Links */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Links</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(data.links).map(([key, url]) =>
            url ? (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-sm py-2 px-4"
              >
                {key.replace(/_/g, " ")}
              </a>
            ) : (
              <span key={key} className="text-pool-muted text-sm px-4 py-2 border border-pool-border rounded-xl opacity-50">
                {key.replace(/_/g, " ")} (pendiente)
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}