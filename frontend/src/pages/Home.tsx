import { Suspense, lazy } from "react";
import { Link } from "react-router-dom";

const PrivacyVisualizer3D = lazy(() => import("../components/PrivacyVisualizer3D"));

const steps = [
  {
    num: "1",
    title: "Deposita",
    desc: "Envías fondos al pool. Tu wallet genera un recibo privado — sólo tú lo tienes.",
    icon: "⬇",
    color: "from-pool-violet to-pool-violet-dim",
  },
  {
    num: "2",
    title: "La magia ZK sucede",
    desc: "Una prueba matemática demuestra que eres el dueño del depósito, sin revelar cuál.",
    icon: "✦",
    color: "from-pool-violet to-purple-600",
  },
  {
    num: "3",
    title: "Retira en privado",
    desc: "Los fondos llegan a otra dirección. El enlace entre depósito y retiro es invisible.",
    icon: "⬆",
    color: "from-purple-600 to-pool-green",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-4">
        <div className="absolute inset-0 bg-violet-glow pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <div className="badge-verified mb-6 mx-auto w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-pool-green" />
            Compliance verificado en Stellar
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            <span className="text-pool-text">Transferencias</span>{" "}
            <span className="bg-gradient-to-r from-pool-violet to-pool-violet-light bg-clip-text text-transparent">
              privadas
            </span>
            <br />
            <span className="text-pool-text-dim text-4xl md:text-5xl">con cumplimiento</span>
          </h1>
          <p className="text-pool-text-dim text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            MongliPool usa pruebas de conocimiento cero para ocultar el vínculo entre
            quién deposita y quién retira — sin comprometer el cumplimiento regulatorio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/deposit" className="btn-primary text-base">
              Depositar fondos
            </Link>
            <Link to="/withdraw" className="btn-secondary text-base">
              Retirar fondos
            </Link>
          </div>
        </div>
      </section>

      {/* Analogía cotidiana */}
      <section className="py-16 px-4 bg-pool-surface/30">
        <div className="max-w-3xl mx-auto">
          <div className="card border-pool-violet/30 bg-pool-violet/5">
            <div className="flex gap-4">
              <div className="text-3xl flex-shrink-0">🏧</div>
              <div>
                <h2 className="text-lg font-semibold text-pool-text mb-2">
                  ¿Cómo funciona? (En palabras simples)
                </h2>
                <p className="text-pool-text-dim leading-relaxed">
                  Es como depositar efectivo en un banco y retirarlo desde otro cajero automático
                  en otro país. El banco sabe que el dinero es legítimo — verificó tu identidad
                  cuando lo depositaste — pero nadie en la calle puede ver que el efectivo que
                  sacas es el mismo que metiste. MongliPool hace lo mismo, pero en Stellar, y
                  con matemáticas que hacen imposible romper la privacidad.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 pasos */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">¿Cómo funciona?</h2>
          <p className="text-pool-text-dim text-center mb-12">Tres pasos. Sin Web3 nerd speak.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div key={step.num} className="card hover:border-pool-violet/50 transition-colors group">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-2xl mb-4 shadow-violet-sm`}>
                  {step.icon}
                </div>
                <div className="text-xs text-pool-text-dim mb-1">Paso {step.num}</div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-pool-text-dim text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance highlight */}
      <section className="py-16 px-4 bg-pool-surface/30">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">
              Privado <span className="text-pool-green">y</span> Compliant
            </h2>
            <p className="text-pool-text-dim leading-relaxed mb-6">
              El ASP (Association Set Provider) de Mongli DAO verifica que cada
              depósito proviene de fuentes legítimas. El auditor autorizado puede
              reconstruir el historial completo con su llave de vista — sin que
              nadie más pueda hacerlo.
            </p>
            <div className="flex flex-col gap-3">
              {[
                "Pruebas ZK verificadas on-chain en Soroban",
                "Sistema de auditoría con view key",
                "Double-spend imposible por nullifier on-chain",
                "ASP de Mongli DAO controla el allowlist",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-pool-green/20 border border-pool-green/40 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-pool-green" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-pool-text-dim">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Suspense
              fallback={
                <div className="w-full h-64 rounded-2xl bg-pool-card/40 border border-pool-violet/10 animate-pulse" />
              }
            >
              <PrivacyVisualizer3D className="shadow-violet-sm" />
            </Suspense>
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-pool-text-dim">
              <span className="badge-verified">Built by Mongli DAO</span>
              <Link to="/status" className="hover:text-pool-violet-light transition-colors">
                Ver estado →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="py-20 px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">¿Listo para proteger tu privacidad?</h2>
        <p className="text-pool-text-dim mb-8">Conecta tu wallet Freighter y empieza.</p>
        <div className="flex gap-4 justify-center">
          <Link to="/deposit" className="btn-primary">Depositar</Link>
          <Link to="/auditor" className="btn-secondary">Soy Auditor</Link>
        </div>
      </section>
    </div>
  );
}