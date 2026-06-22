import { Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { ArrowDownToLine, Sparkles, ArrowUpFromLine, Shield, Eye, Lock, CheckCircle, AlertTriangle, Lightbulb, Play } from "lucide-react";
import { useI18n } from "../i18n/context";
import Reveal from "../components/Reveal";

const PrivacyVisualizer3D = lazy(() => import("../components/PrivacyVisualizer3D"));

export default function Home({ onStartTour }: { onStartTour?: () => void }) {
  const { t, lang } = useI18n();

  return (
    <div className="flex flex-col">
      {/* Hero with 3D background */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center justify-center">
        <Suspense fallback={<div className="absolute inset-0 bg-pool-bg" />}>
          <PrivacyVisualizer3D fullscreen className="opacity-30" />
        </Suspense>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-pool-bg/60 via-transparent to-pool-bg pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-pool-bg/40 via-transparent to-pool-bg/40 pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 max-w-3xl mx-auto text-center px-6 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-pool-green/8 text-pool-green border border-pool-green/15 px-4 py-1.5 rounded-full text-xs font-medium mb-10 shadow-inner-glow animate-float">
            <CheckCircle size={12} />
            {t("home", "badge")}
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-[-0.03em] mb-7 leading-[1.05]">
            <span className="text-pool-text">{t("home", "heroTitle1")}</span>{" "}
            <span className="bg-gradient-to-r from-[#05D5A1] via-[#00F5D4] to-[#0066FF] bg-clip-text text-transparent glow-text">
              {t("home", "heroTitle2")}
            </span>
          </h1>

          <p className="text-pool-text-dim text-lg md:text-xl max-w-xl mx-auto mb-12 leading-relaxed tracking-[-0.01em]">
            {t("home", "heroSub")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/deposit" className="btn-primary text-base inline-flex items-center justify-center gap-2.5 px-8 py-3.5">
              <ArrowDownToLine size={18} strokeWidth={2.5} />
              {t("home", "ctaDeposit")}
            </Link>
            <Link to="/withdraw" className="btn-secondary text-base inline-flex items-center justify-center gap-2.5 px-8 py-3.5">
              <ArrowUpFromLine size={18} />
              {t("home", "ctaWithdraw")}
            </Link>
          </div>
          {onStartTour && (
            <button
              onClick={onStartTour}
              className="mt-6 text-sm text-pool-accent hover:text-pool-green-light transition-colors inline-flex items-center gap-1.5 cursor-pointer mx-auto"
            >
              <Play size={14} />
              {lang === "es" ? "Ver demo guiada →" : "See guided demo →"}
            </button>
          )}
        </div>

        {/* Subtle bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-pool-bg to-transparent pointer-events-none" />
      </section>

      {/* Live pool stats bar */}
      <section className="py-8 px-6">
        <Reveal>
          <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { value: "1–1000", label: lang === "es" ? "XLM por depósito" : "XLM per deposit" },
              { value: "~30s", label: lang === "es" ? "prueba ZK en browser" : "ZK proof in browser" },
              { value: "3", label: lang === "es" ? "contratos en testnet" : "contracts on testnet" },
              { value: "18/18", label: lang === "es" ? "tests pasando" : "tests passing" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pool-green to-pool-violet bg-clip-text text-transparent">
                  {value}
                </div>
                <div className="text-xs text-pool-text-dim mt-1">{label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Real-world case study */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 tracking-tight">
              {t("home", "caseTitle")}
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-6">
            <Reveal delay={100}>
              <div className="glass-panel animated-border p-7 h-full border-red-500/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <AlertTriangle size={20} className="text-red-400" />
                  </div>
                  <h3 className="font-semibold text-red-400">{t("home", "caseProblemLabel")}</h3>
                </div>
                <p className="text-pool-text-dim text-[15px] leading-relaxed">{t("home", "caseProblem")}</p>
              </div>
            </Reveal>
            <Reveal delay={200}>
              <div className="glass-panel animated-border p-7 h-full border-pool-green/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-pool-green/10 border border-pool-green/20 flex items-center justify-center">
                    <Lightbulb size={20} className="text-pool-green" />
                  </div>
                  <h3 className="font-semibold text-pool-green">{t("home", "caseSolutionLabel")}</h3>
                </div>
                <p className="text-pool-text-dim text-[15px] leading-relaxed">{t("home", "caseSolution")}</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* How it works */}
      <section className="py-28 px-6 relative">
        <div className="absolute inset-0 bg-gradient-radial opacity-30 pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3 tracking-tight">{t("home", "howTitle")}</h2>
          <p className="text-pool-text-dim text-center mb-16 text-lg">{t("home", "howSub")}</p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                Icon: ArrowDownToLine,
                color: "from-pool-green to-pool-accent",
                step: "01",
                title: t("home", "step1Title"),
                desc: t("home", "step1Desc"),
              },
              {
                Icon: Sparkles,
                color: "from-pool-accent to-pool-violet",
                step: "02",
                title: t("home", "step2Title"),
                desc: t("home", "step2Desc"),
              },
              {
                Icon: ArrowUpFromLine,
                color: "from-pool-violet to-pool-green",
                step: "03",
                title: t("home", "step3Title"),
                desc: t("home", "step3Desc"),
              },
            ].map(({ Icon, color, step, title, desc }, i) => (
              <Reveal key={step} delay={i * 100}>
              <div
                className="group glass-panel animated-border p-8 transition-all duration-300 card-hover"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-6 shadow-violet-sm group-hover:shadow-violet transition-shadow duration-300`}>
                  <Icon size={22} className="text-white" strokeWidth={2} />
                </div>
                <div className="text-[11px] text-pool-muted font-medium mb-3 uppercase tracking-[0.15em] font-mono">
                  {lang === "es" ? "Paso" : "Step"} {step}
                </div>
                <h3 className="text-lg font-semibold mb-3 tracking-tight">{title}</h3>
                <p className="text-pool-text-dim text-[15px] leading-relaxed">{desc}</p>
              </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* Compliance */}
      <section className="py-28 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
              {t("home", "compTitle")}{" "}
              <span className="text-pool-green">{t("home", "compAnd")}</span>{" "}
              {t("home", "compTitle2")}
            </h2>
            <p className="text-pool-text-dim leading-relaxed mb-10 text-[15px]">{t("home", "compDesc")}</p>

            <div className="flex flex-col gap-5 stagger-children">
              {[
                { icon: Shield, text: t("home", "compItem1") },
                { icon: Eye, text: t("home", "compItem2") },
                { icon: Lock, text: t("home", "compItem3") },
                { icon: CheckCircle, text: t("home", "compItem4") },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-4">
                  <div className="relative w-9 h-9 rounded-lg bg-pool-green/8 border border-pool-green/15 flex items-center justify-center flex-shrink-0 shadow-inner-glow pulse-ring text-pool-green">
                    <Icon size={16} className="text-pool-green" />
                  </div>
                  <span className="text-pool-text-dim text-[15px]">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-pool-violet/10 via-transparent to-pool-green/10 rounded-3xl blur-2xl pointer-events-none" />
            <Suspense
              fallback={<div className="w-full h-80 rounded-2xl bg-pool-card/40 animate-pulse" />}
            >
              <div className="relative h-80 glass-panel overflow-hidden gradient-border">
                <PrivacyVisualizer3D />
              </div>
            </Suspense>
            <div className="mt-4 flex items-center justify-center">
              <span className="badge-verified">
                <CheckCircle size={10} />
                {lang === "es" ? "Hecho por Mongli DAO" : "Built by Mongli DAO"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* FAQ */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 tracking-tight">
            {lang === "es" ? "Preguntas frecuentes" : "FAQ"}
          </h2>
          <div className="space-y-4">
            {[
              {
                q: lang === "es" ? "¿Es seguro?" : "Is it safe?",
                a: lang === "es"
                  ? "MongliPool es un prototipo de hackathon en Stellar testnet. La criptografía ZK es real (Groth16/BN254 verificado on-chain), pero el circuito no ha sido auditado externamente. No usar con fondos reales hasta completar auditoría."
                  : "MongliPool is a hackathon prototype on Stellar testnet. The ZK cryptography is real (Groth16/BN254 verified on-chain), but the circuit hasn't been externally audited. Do not use with real funds until audited."
              },
              {
                q: lang === "es" ? "¿Qué pasa si pierdo mi recibo?" : "What if I lose my receipt?",
                a: lang === "es"
                  ? "Los fondos quedan en el pool para siempre. No existe recuperación — es una propiedad fundamental del diseño de privacidad. Guarda tu recibo en múltiples lugares seguros."
                  : "The funds stay in the pool forever. There is no recovery — this is a fundamental property of the privacy design. Save your receipt in multiple safe places."
              },
              {
                q: lang === "es" ? "¿Por qué necesito una wallet?" : "Why do I need a wallet?",
                a: lang === "es"
                  ? "Freighter (extensión de Stellar) autoriza las transacciones en la blockchain. Tu recibo privado se genera localmente — la wallet solo firma, no ve tus secretos."
                  : "Freighter (Stellar extension) authorizes blockchain transactions. Your private receipt is generated locally — the wallet only signs, it doesn't see your secrets."
              },
              {
                q: lang === "es" ? "¿Esto es dinero real?" : "Is this real money?",
                a: lang === "es"
                  ? "Corre en Stellar testnet — usa XLM de prueba sin valor monetario real. Puedes experimentar sin riesgo. Pide XLM de prueba gratis en friendbot.stellar.org."
                  : "It runs on Stellar testnet — uses test XLM with no real monetary value. You can experiment risk-free. Get free test XLM at friendbot.stellar.org."
              },
            ].map(({ q, a }, i) => (
              <Reveal key={q} delay={i * 80}>
                <div className="glass-panel animated-border p-5 card-hover">
                  <h3 className="font-semibold text-pool-text mb-2">{q}</h3>
                  <p className="text-pool-text-dim text-sm leading-relaxed">{a}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* CTA */}
      <section className="py-28 px-6 text-center relative">
        <div className="absolute inset-0 bg-gradient-radial opacity-20 pointer-events-none" />
        <div className="relative">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">{t("home", "ctaBottom")}</h2>
          <p className="text-pool-text-dim mb-12 text-lg">{t("home", "ctaBottomSub")}</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/deposit" className="btn-primary inline-flex items-center gap-2.5 px-8 py-3.5">
              <ArrowDownToLine size={18} strokeWidth={2.5} />
              {t("home", "ctaDeposit")}
            </Link>
            <Link to="/auditor" className="btn-secondary inline-flex items-center gap-2.5 px-8 py-3.5">
              <Eye size={18} />
              {t("home", "ctaAuditor")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}