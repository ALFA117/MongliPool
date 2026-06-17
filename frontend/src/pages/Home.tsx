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
      <section className="relative overflow-hidden min-h-[85vh] flex items-center justify-center">
        {/* 3D background */}
        <Suspense fallback={<div className="absolute inset-0 bg-pool-bg" />}>
          <PrivacyVisualizer3D fullscreen className="opacity-40" />
        </Suspense>

        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-pool-bg/40 via-transparent to-pool-bg pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 max-w-3xl mx-auto text-center px-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-pool-green/10 text-pool-green border border-pool-green/20 px-4 py-1.5 rounded-full text-xs font-medium mb-8">
            <CheckCircle size={12} />
            {t("home", "badge")}
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            <span className="text-pool-text">{t("home", "heroTitle1")}</span>{" "}
            <span className="bg-gradient-to-r from-pool-violet via-pool-violet-light to-pool-green bg-clip-text text-transparent">
              {t("home", "heroTitle2")}
            </span>
          </h1>

          <p className="text-pool-text-dim text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            {t("home", "heroSub")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/deposit" className="btn-primary text-base inline-flex items-center justify-center gap-2">
              <ArrowDownToLine size={18} />
              {t("home", "ctaDeposit")}
            </Link>
            <Link to="/withdraw" className="btn-secondary text-base inline-flex items-center justify-center gap-2">
              <ArrowUpFromLine size={18} />
              {t("home", "ctaWithdraw")}
            </Link>
          </div>
        </div>
      </section>

      {/* How it works — 3 steps */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">{t("home", "howTitle")}</h2>
          <p className="text-pool-text-dim text-center mb-16 text-lg">{t("home", "howSub")}</p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="group relative bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-7 hover:border-pool-violet/30 transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pool-violet to-pool-violet-dim flex items-center justify-center mb-5 shadow-violet-sm group-hover:shadow-violet transition-shadow">
                <ArrowDownToLine size={22} className="text-white" />
              </div>
              <div className="text-xs text-pool-violet-light font-medium mb-2 uppercase tracking-wider">Step 1</div>
              <h3 className="text-lg font-semibold mb-3">{t("home", "step1Title")}</h3>
              <p className="text-pool-text-dim text-sm leading-relaxed">{t("home", "step1Desc")}</p>
            </div>

            {/* Step 2 */}
            <div className="group relative bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-7 hover:border-purple-500/30 transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pool-violet to-purple-600 flex items-center justify-center mb-5 shadow-violet-sm group-hover:shadow-violet transition-shadow">
                <Sparkles size={22} className="text-white" />
              </div>
              <div className="text-xs text-pool-violet-light font-medium mb-2 uppercase tracking-wider">Step 2</div>
              <h3 className="text-lg font-semibold mb-3">{t("home", "step2Title")}</h3>
              <p className="text-pool-text-dim text-sm leading-relaxed">{t("home", "step2Desc")}</p>
            </div>

            {/* Step 3 */}
            <div className="group relative bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-7 hover:border-pool-green/30 transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pool-green flex items-center justify-center mb-5 shadow-violet-sm group-hover:shadow-green transition-shadow">
                <ArrowUpFromLine size={22} className="text-white" />
              </div>
              <div className="text-xs text-pool-green font-medium mb-2 uppercase tracking-wider">Step 3</div>
              <h3 className="text-lg font-semibold mb-3">{t("home", "step3Title")}</h3>
              <p className="text-pool-text-dim text-sm leading-relaxed">{t("home", "step3Desc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance section */}
      <section className="py-20 px-4 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-5">
              {t("home", "compTitle")}{" "}
              <span className="text-pool-green">{t("home", "compAnd")}</span>{" "}
              {t("home", "compTitle2")}
            </h2>
            <p className="text-pool-text-dim leading-relaxed mb-8">{t("home", "compDesc")}</p>

            <div className="flex flex-col gap-4">
              {[
                { icon: Shield, text: t("home", "compItem1") },
                { icon: Eye, text: t("home", "compItem2") },
                { icon: Lock, text: t("home", "compItem3") },
                { icon: CheckCircle, text: t("home", "compItem4") },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-pool-green/10 border border-pool-green/20 flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-pool-green" />
                  </div>
                  <span className="text-pool-text-dim">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Smaller 3D on the right */}
          <div className="relative">
            <Suspense
              fallback={<div className="w-full h-72 rounded-2xl bg-pool-card/40 border border-pool-violet/10 animate-pulse" />}
            >
              <div className="relative h-72 rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02]">
                <PrivacyVisualizer3D />
              </div>
            </Suspense>
            <div className="mt-3 flex items-center justify-center gap-3 text-xs text-pool-text-dim">
              <span className="inline-flex items-center gap-1 bg-pool-green/10 text-pool-green border border-pool-green/20 px-3 py-1 rounded-full font-medium">
                Built by Mongli DAO
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="py-24 px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("home", "ctaBottom")}</h2>
        <p className="text-pool-text-dim mb-10 text-lg">{t("home", "ctaBottomSub")}</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link to="/deposit" className="btn-primary inline-flex items-center gap-2">
            <ArrowDownToLine size={18} />
            {t("home", "ctaDeposit")}
          </Link>
          <Link to="/auditor" className="btn-secondary inline-flex items-center gap-2">
            <Eye size={18} />
            {t("home", "ctaAuditor")}
          </Link>
        </div>
      </section>
    </div>
  );
}