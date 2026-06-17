import { Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { ArrowDownToLine, Sparkles, ArrowUpFromLine, Shield, Eye, Lock, CheckCircle } from "lucide-react";
import { useI18n } from "../i18n/context";

const PrivacyVisualizer3D = lazy(() => import("../components/PrivacyVisualizer3D"));

export default function Home() {
  const { t } = useI18n();

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
          <div className="inline-flex items-center gap-2 bg-pool-green/8 text-pool-green border border-pool-green/15 px-4 py-1.5 rounded-full text-xs font-medium mb-10 shadow-inner-glow">
            <CheckCircle size={12} />
            {t("home", "badge")}
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-[-0.03em] mb-7 leading-[1.05]">
            <span className="text-pool-text">{t("home", "heroTitle1")}</span>{" "}
            <span className="bg-gradient-to-r from-pool-violet via-pool-violet-light to-pool-green bg-clip-text text-transparent">
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
        </div>

        {/* Subtle bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-pool-bg to-transparent pointer-events-none" />
      </section>

      {/* How it works */}
      <section className="py-28 px-6 relative">
        <div className="absolute inset-0 bg-violet-glow opacity-30 pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3 tracking-tight">{t("home", "howTitle")}</h2>
          <p className="text-pool-text-dim text-center mb-16 text-lg">{t("home", "howSub")}</p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                Icon: ArrowDownToLine,
                color: "from-pool-violet to-pool-violet-dim",
                accent: "pool-violet",
                step: "01",
                title: t("home", "step1Title"),
                desc: t("home", "step1Desc"),
              },
              {
                Icon: Sparkles,
                color: "from-pool-violet to-purple-600",
                accent: "purple-500",
                step: "02",
                title: t("home", "step2Title"),
                desc: t("home", "step2Desc"),
              },
              {
                Icon: ArrowUpFromLine,
                color: "from-purple-600 to-pool-green",
                accent: "pool-green",
                step: "03",
                title: t("home", "step3Title"),
                desc: t("home", "step3Desc"),
              },
            ].map(({ Icon, color, step, title, desc }) => (
              <div
                key={step}
                className="group glass-panel p-8 hover:border-white/[0.12] transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-6 shadow-violet-sm group-hover:shadow-violet transition-shadow duration-300`}>
                  <Icon size={22} className="text-white" strokeWidth={2} />
                </div>
                <div className="text-[11px] text-pool-muted font-medium mb-3 uppercase tracking-[0.15em] font-mono">
                  Step {step}
                </div>
                <h3 className="text-lg font-semibold mb-3 tracking-tight">{title}</h3>
                <p className="text-pool-text-dim text-[15px] leading-relaxed">{desc}</p>
              </div>
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

            <div className="flex flex-col gap-5">
              {[
                { icon: Shield, text: t("home", "compItem1") },
                { icon: Eye, text: t("home", "compItem2") },
                { icon: Lock, text: t("home", "compItem3") },
                { icon: CheckCircle, text: t("home", "compItem4") },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-pool-green/8 border border-pool-green/15 flex items-center justify-center flex-shrink-0 shadow-inner-glow">
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
                Built by Mongli DAO
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* CTA */}
      <section className="py-28 px-6 text-center relative">
        <div className="absolute inset-0 bg-violet-glow opacity-20 pointer-events-none" />
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