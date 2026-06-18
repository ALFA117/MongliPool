import { useI18n } from "../i18n/context";
import { CheckCircle, X, ArrowRight } from "lucide-react";

export default function Business() {
  const { lang } = useI18n();
  const es = lang === "es";

  return (
    <div className="max-w-4xl mx-auto px-5 py-20 animate-fade-in">
      <div className="mb-12">
        <div className="badge-pending mb-4 w-fit">
          {es ? "Visión y propuesta de modelo" : "Vision & Model Proposal"}
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          {es ? "Modelo de negocio" : "Business Model"}
        </h1>
        <p className="text-pool-text-dim leading-relaxed max-w-2xl">
          {es
            ? "Cómo MongliPool generaría valor en un escenario de producción. Esta es una propuesta conceptual, no una proyección financiera."
            : "How MongliPool would generate value in a production scenario. This is a conceptual proposal, not a financial projection."}
        </p>
      </div>

      {/* Revenue streams */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-6 tracking-tight">
          {es ? "Fuentes de ingreso conceptuales" : "Conceptual Revenue Streams"}
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              title: es ? "Fee por retiro" : "Withdrawal Fee",
              desc: es
                ? "Un porcentaje pequeño sobre cada retiro del pool. Similar al modelo de mixers existentes en otras chains, pero con cumplimiento regulatorio integrado."
                : "A small percentage on each pool withdrawal. Similar to existing mixer models on other chains, but with built-in regulatory compliance.",
            },
            {
              title: es ? "Tier institucional" : "Institutional Tier",
              desc: es
                ? "DAOs y empresas pagarían una suscripción para acceso al panel de Auditor con view key dedicada, soporte prioritario, y reportes de compliance automatizados."
                : "DAOs and companies would pay a subscription for Auditor panel access with a dedicated view key, priority support, and automated compliance reports.",
            },
            {
              title: es ? "Integración para terceros" : "Third-Party Integration",
              desc: es
                ? "Servicios de consultoría e integración para ayudar a otros proyectos de Stellar a añadir privacidad con compliance a sus propios flujos de pago."
                : "Consulting and integration services to help other Stellar projects add privacy with compliance to their own payment flows.",
            },
          ].map(({ title, desc }) => (
            <div key={title} className="glass-panel p-5">
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-pool-text-dim text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-6 tracking-tight">
          {es ? "Comparativa honesta" : "Honest Comparison"}
        </h2>
        <div className="glass-panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-3 px-4 font-medium text-pool-text-dim">
                  {es ? "Característica" : "Feature"}
                </th>
                <th className="text-center py-3 px-4 font-medium text-pool-text-dim">
                  {es ? "Mixers tradicionales" : "Traditional Mixers"}
                </th>
                <th className="text-center py-3 px-4 font-medium text-pool-violet-light">MongliPool</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: es ? "Privacidad de transacciones" : "Transaction privacy", trad: true, mp: true },
                { feature: es ? "Compliance/ASP integrado" : "Built-in compliance/ASP", trad: false, mp: true },
                { feature: es ? "Auditoría selectiva (view key)" : "Selective audit (view key)", trad: false, mp: true },
                { feature: es ? "Verificación on-chain en Stellar" : "On-chain verification on Stellar", trad: false, mp: true },
                { feature: es ? "Prevención de doble gasto (nullifier)" : "Double-spend prevention (nullifier)", trad: true, mp: true },
                { feature: es ? "Producción probada" : "Battle-tested in production", trad: true, mp: false },
                { feature: es ? "Auditoría de seguridad externa" : "External security audit", trad: true, mp: false },
              ].map(({ feature, trad, mp }) => (
                <tr key={feature} className="border-b border-white/[0.03]">
                  <td className="py-3 px-4 text-pool-text-dim">{feature}</td>
                  <td className="py-3 px-4 text-center">
                    {trad ? <CheckCircle size={16} className="text-pool-green mx-auto" /> : <X size={16} className="text-pool-muted mx-auto" />}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {mp ? <CheckCircle size={16} className="text-pool-green mx-auto" /> : <X size={16} className="text-pool-muted mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Roadmap */}
      <section>
        <h2 className="text-2xl font-bold mb-6 tracking-tight">
          {es ? "Hoja de ruta" : "Roadmap"}
        </h2>
        <div className="space-y-4">
          {[
            {
              phase: es ? "Fase actual" : "Current Phase",
              desc: es ? "MVP en testnet — hackathon Stellar Hacks: ZK" : "Testnet MVP — Stellar Hacks: ZK hackathon",
              active: true,
            },
            {
              phase: es ? "Post-hackathon" : "Post-hackathon",
              desc: es ? "Auditoría de seguridad externa del circuito y contratos" : "External security audit of circuit and contracts",
              active: false,
            },
            {
              phase: es ? "Descentralización" : "Decentralization",
              desc: es ? "Ceremonia de trusted setup pública + view key multisig real del DAO" : "Public trusted setup ceremony + real DAO multisig view key",
              active: false,
            },
            {
              phase: es ? "Piloto mainnet" : "Mainnet Pilot",
              desc: es ? "Despliegue en Stellar mainnet con Mongli DAO como primer usuario" : "Deploy on Stellar mainnet with Mongli DAO as first user",
              active: false,
            },
            {
              phase: es ? "Expansión" : "Expansion",
              desc: es ? "Soporte multi-asset, integración con otros DAOs de Stellar" : "Multi-asset support, integration with other Stellar DAOs",
              active: false,
            },
          ].map(({ phase, desc, active }, i) => (
            <div key={phase} className="flex items-start gap-4">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  active ? "bg-pool-violet text-white shadow-violet-sm" : "bg-white/[0.04] text-pool-muted border border-white/[0.08]"
                }`}>
                  {i + 1}
                </div>
                {i < 4 && <div className="w-0.5 h-8 bg-white/[0.06] mt-1" />}
              </div>
              <div className="pt-1">
                <h3 className={`font-semibold text-sm ${active ? "text-pool-violet-light" : "text-pool-text"}`}>
                  {phase} {active && <ArrowRight size={12} className="inline ml-1" />}
                </h3>
                <p className="text-pool-text-dim text-sm">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}