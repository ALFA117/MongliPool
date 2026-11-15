import { Link } from "react-router-dom";
import { ArrowDownToLine, ArrowUpFromLine, ArrowRight, Shield, Eye, Lock, CheckCircle, Play, Plus, Check, Minus } from "lucide-react";
import { useI18n } from "../i18n/context";
import Reveal from "../components/Reveal";
import UnlinkDiagram from "../components/UnlinkDiagram";

export default function Home({ onStartTour }: { onStartTour?: () => void }) {
  const { t, lang } = useI18n();
  const es = lang === "es";

  const stats = [
    { value: "1–1000", label: es ? "XLM por depósito" : "XLM per deposit" },
    { value: "~30 s", label: es ? "prueba ZK en el navegador" : "ZK proof in the browser" },
    { value: "3", label: es ? "contratos en testnet" : "contracts on testnet" },
    { value: "18/18", label: es ? "tests pasando" : "tests passing" },
  ];

  const steps = [
    { Icon: ArrowDownToLine, title: t("home", "step1Title"), desc: t("home", "step1Desc") },
    { Icon: Lock, title: t("home", "step2Title"), desc: t("home", "step2Desc") },
    { Icon: ArrowUpFromLine, title: t("home", "step3Title"), desc: t("home", "step3Desc") },
  ];

  const faqs = [
    {
      q: es ? "¿Es seguro?" : "Is it safe?",
      a: es
        ? "MongliPool es un prototipo de hackathon en Stellar testnet. La criptografía ZK es real (Groth16/BN254 verificado on-chain), pero el circuito no ha sido auditado externamente. No usar con fondos reales hasta completar auditoría."
        : "MongliPool is a hackathon prototype on Stellar testnet. The ZK cryptography is real (Groth16/BN254 verified on-chain), but the circuit hasn't been externally audited. Do not use with real funds until audited.",
    },
    {
      q: es ? "¿Qué pasa si pierdo mi recibo?" : "What if I lose my receipt?",
      a: es
        ? "Los fondos quedan en el pool para siempre. No existe recuperación — es una propiedad fundamental del diseño de privacidad. Guarda tu recibo en múltiples lugares seguros."
        : "The funds stay in the pool forever. There is no recovery — this is a fundamental property of the privacy design. Save your receipt in multiple safe places.",
    },
    {
      q: es ? "¿Por qué necesito una wallet?" : "Why do I need a wallet?",
      a: es
        ? "Freighter (extensión de Stellar) autoriza las transacciones en la blockchain. Tu recibo privado se genera localmente — la wallet solo firma, no ve tus secretos. También puedes probar con una cuenta temporal de testnet."
        : "Freighter (Stellar extension) authorizes blockchain transactions. Your private receipt is generated locally — the wallet only signs, it doesn't see your secrets. You can also try it with a temporary testnet account.",
    },
    {
      q: es ? "¿Esto es dinero real?" : "Is this real money?",
      a: es
        ? "No. Corre en Stellar testnet y usa XLM de prueba sin valor monetario. Puedes experimentar sin riesgo; el XLM de prueba es gratis en friendbot.stellar.org."
        : "No. It runs on Stellar testnet and uses test XLM with no monetary value. You can experiment risk-free; test XLM is free at friendbot.stellar.org.",
    },
  ];

  const visibility = [
    { d: es ? "Que hubo depósitos y retiros" : "That deposits and withdrawals happened", pub: true, aud: true },
    { d: es ? "Qué depósito corresponde a qué retiro" : "Which deposit maps to which withdrawal", pub: false, aud: true },
    { d: es ? "Historial completo del pool" : "Full pool history", pub: false, aud: true },
  ];

  return (
    <div className="flex flex-col">
      {/* ── Hero ───────────────────────────────────────── */}
      <section className="border-b border-pool-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 xl:px-0 py-14 md:py-24 grid lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 border border-pool-border rounded px-2.5 py-1 mb-8 font-mono text-[13px] text-pool-text-dim">
              <span className="w-1.5 h-1.5 rounded-full bg-pool-green" aria-hidden="true" />
              {t("home", "badge")} · {es ? "prototipo" : "prototype"}
            </div>
            <h1 className="text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-[4.6rem] text-pool-text mb-6">
              {t("home", "heroTitle1")}{" "}
              <em className="italic text-pool-green">{t("home", "heroTitle2")}</em>.
            </h1>
            <p className="text-pool-text-dim text-[17px] md:text-lg leading-relaxed max-w-xl mb-9">
              {es
                ? "Pool de privacidad en Stellar. Depositas desde una dirección y retiras a otra: una prueba de conocimiento cero demuestra que el retiro es legítimo sin revelar de qué depósito viene. Un auditor autorizado conserva la vista completa."
                : "A privacy pool on Stellar. Deposit from one address and withdraw to another: a zero-knowledge proof shows the withdrawal is legitimate without revealing which deposit it came from. An authorized auditor keeps the full view."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/deposit" className="btn-primary gap-2 text-base px-7">
                <ArrowDownToLine size={18} strokeWidth={2.25} />
                {t("home", "ctaDeposit")}
              </Link>
              <Link to="/withdraw" className="btn-secondary gap-2 text-base px-7">
                <ArrowUpFromLine size={18} />
                {t("home", "ctaWithdraw")}
              </Link>
            </div>
            {onStartTour && (
              <button
                onClick={onStartTour}
                className="mt-5 min-h-[44px] text-[15px] text-pool-text-dim hover:text-pool-text inline-flex items-center gap-2 cursor-pointer underline decoration-pool-border underline-offset-4 hover:decoration-pool-green"
              >
                <Play size={14} />
                {es ? "Ver demo guiada (sin wallet)" : "See guided demo (no wallet)"}
              </button>
            )}
          </div>
          <div className="lg:col-span-5">
            <UnlinkDiagram lang={lang} />
          </div>
        </div>

        {/* Cifras */}
        <div className="border-t border-pool-border">
          <dl className="max-w-6xl mx-auto px-4 sm:px-6 xl:px-0 grid grid-cols-2 md:grid-cols-4">
            {stats.map(({ value, label }, i) => (
              <div
                key={label}
                className={`flex flex-col-reverse py-6 md:py-8 border-pool-border ${i === 0 ? "pr-4" : i === 2 ? "pr-4 md:pl-6" : "pl-4 sm:pl-6 pr-4"} ${i % 2 === 1 ? "border-l" : ""} ${i >= 2 ? "border-t md:border-t-0" : ""} ${i === 2 ? "md:border-l" : ""}`}
              >
                <dt className="text-[14px] text-pool-text-dim mt-1">{label}</dt>
                <dd className="font-mono text-2xl md:text-[28px] text-pool-text tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Caso real ──────────────────────────────────── */}
      <section className="py-16 md:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <span className="eyebrow">01</span>
            <h2 className="text-3xl md:text-[2.6rem] leading-tight mt-3">{t("home", "caseTitle")}</h2>
            <p className="text-pool-text-dim mt-4 leading-relaxed">
              {es ? "La tesorería de una DAO necesita dos cosas que parecen opuestas." : "A DAO treasury needs two things that look opposed."}
            </p>
          </div>
          <div className="lg:col-span-8 grid md:grid-cols-2 border border-pool-border rounded-lg overflow-hidden">
            <Reveal className="p-6 md:p-8 bg-pool-card">
              <p className="font-mono text-[13px] mb-3 flex items-center gap-2 problem-label">
                <span className="w-2 h-2 bg-current" aria-hidden="true" />
                {t("home", "caseProblemLabel")}
              </p>
              <p className="text-pool-text-dim leading-relaxed">{t("home", "caseProblem")}</p>
            </Reveal>
            <Reveal delay={100} className="p-6 md:p-8 bg-pool-card border-t md:border-t-0 md:border-l border-pool-border">
              <p className="font-mono text-[13px] text-pool-green mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-pool-green" aria-hidden="true" />
                {t("home", "caseSolutionLabel")}
              </p>
              <p className="text-pool-text-dim leading-relaxed">{t("home", "caseSolution")}</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ──────────────────────────────── */}
      <section className="py-16 md:py-24 px-4 sm:px-6 bg-pool-surface border-y border-pool-border">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-12">
            <span className="eyebrow">02</span>
            <h2 className="text-3xl md:text-[2.6rem] leading-tight mt-3">{t("home", "howTitle")}</h2>
            <p className="text-pool-text-dim mt-3 text-lg">{t("home", "howSub")}</p>
          </div>
          <ol className="grid md:grid-cols-3 gap-px bg-pool-border border border-pool-border rounded-lg overflow-hidden">
            {steps.map(({ Icon, title, desc }, i) => (
              <li key={title} className="bg-pool-card p-6 md:p-8 flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <span className="font-mono text-[13px] text-pool-muted">{es ? "Paso" : "Step"} {String(i + 1).padStart(2, "0")}</span>
                  <span className="w-10 h-10 rounded-md border border-pool-border flex items-center justify-center text-pool-green">
                    <Icon size={18} strokeWidth={1.75} />
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-3">{title}</h3>
                <p className="text-pool-text-dim leading-relaxed">{desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Privado y regulado ─────────────────────────── */}
      <section className="py-16 md:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5">
            <span className="eyebrow">03</span>
            <h2 className="text-3xl md:text-[2.6rem] leading-tight mt-3 mb-5">
              {t("home", "compTitle")} {t("home", "compAnd")} <em className="italic">{t("home", "compTitle2").toLowerCase()}</em>
            </h2>
            <p className="text-pool-text-dim leading-relaxed mb-8">{t("home", "compDesc")}</p>
            <ul className="divide-y divide-pool-border border-y border-pool-border">
              {[
                { icon: Shield, text: t("home", "compItem1") },
                { icon: Eye, text: t("home", "compItem2") },
                { icon: Lock, text: t("home", "compItem3") },
                { icon: CheckCircle, text: t("home", "compItem4") },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-4 py-3.5">
                  <Icon size={18} className="text-pool-green flex-shrink-0" strokeWidth={1.75} />
                  <span className="text-pool-text">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-7">
            <div className="panel overflow-hidden">
              <div className="px-5 sm:px-6 py-4 border-b border-pool-border flex items-center justify-between gap-3">
                <span className="font-semibold">{es ? "Quién ve qué" : "Who sees what"}</span>
                <span className="font-mono text-[12px] text-pool-muted">view key</span>
              </div>
              <table className="w-full text-[15px]">
                <thead>
                  <tr className="text-left text-pool-muted font-mono text-[13px]">
                    <th className="font-normal px-5 sm:px-6 py-3">{es ? "Dato" : "Data"}</th>
                    <th className="font-normal px-2 sm:px-3 py-3 text-center">{es ? "Público" : "Public"}</th>
                    <th className="font-normal px-3 sm:px-6 py-3 text-center">Auditor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pool-border border-t border-pool-border">
                  {visibility.map(({ d, pub, aud }) => (
                    <tr key={d}>
                      <td className="px-5 sm:px-6 py-4 text-pool-text">{d}</td>
                      {[pub, aud].map((v, j) => (
                        <td key={j} className="px-2 sm:px-6 py-4 text-center">
                          {v ? (
                            <Check size={18} className="inline text-pool-green" aria-label={es ? "Sí" : "Yes"} />
                          ) : (
                            <Minus size={18} className="inline text-pool-muted" aria-label="No" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 sm:px-6 py-3 border-t border-pool-border bg-pool-surface flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-[14px] text-pool-text-dim">
                  {es ? "El auditor usa la llave de vista de Mongli DAO." : "The auditor uses the Mongli DAO view key."}
                </p>
                <Link to="/auditor" className="inline-flex items-center gap-1.5 min-h-[44px] text-[15px] font-medium text-pool-green hover:underline underline-offset-4">
                  {t("home", "ctaAuditor")} <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────── */}
      <section className="py-16 md:py-24 px-4 sm:px-6 border-t border-pool-border">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <span className="eyebrow">04</span>
            <h2 className="text-3xl md:text-[2.6rem] leading-tight mt-3">{es ? "Preguntas frecuentes" : "FAQ"}</h2>
          </div>
          <div className="lg:col-span-8 border-t border-pool-border">
            {faqs.map(({ q, a }, i) => (
              <details key={q} className="group border-b border-pool-border" open={i === 0}>
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none min-h-[60px] py-4 text-[17px] font-medium text-pool-text [&::-webkit-details-marker]:hidden">
                  {q}
                  <Plus size={18} className="flex-shrink-0 text-pool-muted transition-transform duration-200 group-open:rotate-45" />
                </summary>
                <p className="pb-5 pr-8 text-pool-text-dim leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ───────────────────────────────────── */}
      <section className="px-4 sm:px-6 pb-20">
        <div className="max-w-6xl mx-auto panel p-6 sm:p-8 md:p-12 grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7">
            <h2 className="text-3xl md:text-4xl leading-tight mb-3">{t("home", "ctaBottom")}</h2>
            <p className="text-pool-text-dim text-lg">{t("home", "ctaBottomSub")}</p>
          </div>
          <div className="md:col-span-5 flex flex-col sm:flex-row md:justify-end gap-3">
            <Link to="/deposit" className="btn-primary gap-2">
              <ArrowDownToLine size={18} strokeWidth={2.25} />
              {t("home", "ctaDeposit")}
            </Link>
            <a href="https://youtu.be/Me4MJGTcKgA" target="_blank" rel="noopener noreferrer" className="btn-secondary gap-2">
              <Play size={16} />
              {es ? "Ver video demo" : "Watch demo video"}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
