import { useState } from "react";
import { ChevronRight, ChevronLeft, Eye, Shield, Rocket, X } from "lucide-react";
import { useI18n } from "../i18n/context";

interface Props {
  onClose: () => void;
  onStartTour: () => void;
}

export default function Onboarding({ onClose, onStartTour }: Props) {
  const { lang } = useI18n();
  const [slide, setSlide] = useState(0);
  const es = lang === "es";

  const slides = [
    {
      title: es ? "¿Sabías que cualquiera puede ver tus transacciones?" : "Did you know anyone can see your transactions?",
      desc: es
        ? "En blockchain, cuando envías dinero, cualquier persona en el mundo puede ver cuánto enviaste, a quién, y cuándo. Es como hacer tus pagos con un letrero de neón."
        : "On blockchain, when you send money, anyone in the world can see how much you sent, to whom, and when. It's like making payments with a neon sign.",
      visual: (
        <div className="flex items-center justify-center gap-4 py-6">
          <div className="w-14 h-14 rounded-md bg-pool-surface border border-pool-border flex items-center justify-center text-pool-text font-mono text-sm">A</div>
          <div className="flex flex-col items-center">
            <div className="h-px w-20 bg-pool-text-dim" />
            <span className="font-mono text-[13px] text-pool-text-dim mt-1">100 XLM</span>
          </div>
          <div className="w-14 h-14 rounded-md bg-pool-surface border border-pool-border flex items-center justify-center text-pool-text font-mono text-sm">B</div>
          <div className="absolute mt-20">
            <Eye size={22} className="problem-label" />
          </div>
        </div>
      ),
    },
    {
      title: es ? "MongliPool rompe el vínculo público" : "MongliPool breaks the public link",
      desc: es
        ? "Depositas por una 'puerta' y retiras por otra. Nadie puede saber que las dos puertas son tuyas — pero un auditor autorizado puede verificar que todo es legítimo."
        : "You deposit through one 'door' and withdraw through another. Nobody can tell both doors are yours — but an authorized auditor can verify everything is legit.",
      visual: (
        <div className="flex items-center justify-center gap-3 py-6">
          <div className="w-14 h-14 rounded-md bg-pool-surface border border-pool-border flex items-center justify-center text-pool-text font-mono text-sm">A</div>
          <div className="h-px w-8 bg-pool-border" />
          <div className="w-20 h-20 rounded-md bg-pool-bg border-2 border-pool-green flex items-center justify-center">
            <Shield size={24} className="text-pool-green" />
          </div>
          <div className="h-px w-8 bg-pool-border" />
          <div className="w-14 h-14 rounded-md bg-pool-surface border border-pool-border flex items-center justify-center text-pool-text font-mono text-sm">?</div>
        </div>
      ),
    },
    {
      title: es ? "Listo en 3 pasos" : "Ready in 3 steps",
      desc: es
        ? "Solo necesitas una wallet de Stellar y XLM de testnet (gratis). En menos de 5 minutos estarás haciendo transacciones privadas."
        : "You just need a Stellar wallet and testnet XLM (free). In less than 5 minutes you'll be making private transactions.",
      visual: (
        <div className="space-y-3 py-4">
          {[
            { n: "1", text: es ? "Instala Freighter" : "Install Freighter", link: "https://freighter.app" },
            { n: "2", text: es ? "Consigue XLM de testnet" : "Get testnet XLM", link: "https://laboratory.stellar.org/#account-creator?network=test" },
            { n: "3", text: es ? "Vuelve aquí y deposita" : "Come back and deposit", link: null },
          ].map(({ n, text, link }) => (
            <div key={n} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-sm border border-pool-border flex items-center justify-center text-pool-text font-mono text-[13px] flex-shrink-0">{n}</div>
              {link ? (
                <a href={link} target="_blank" rel="noopener noreferrer" className="min-h-[44px] inline-flex items-center text-[15px] text-pool-green underline underline-offset-4">{text}</a>
              ) : (
                <span className="text-[15px] text-pool-text-dim">{text}</span>
              )}
            </div>
          ))}
        </div>
      ),
    },
  ];

  const current = slides[slide];

  const finish = () => {
    localStorage.setItem("monglipool-onboarded", "true");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/75 px-4">
      <div role="dialog" aria-modal="true" className="panel bg-pool-bg p-6 sm:p-8 max-w-md w-full animate-fade-in">
        <div className="flex justify-end mb-2">
          <button onClick={finish} aria-label="Cerrar" className="-m-3 inline-flex w-11 h-11 items-center justify-center rounded-md text-pool-muted hover:text-pool-text cursor-pointer">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <h2 className="text-2xl leading-snug mb-3 text-center">{current.title}</h2>
        <p className="text-pool-text-dim text-[15px] leading-relaxed text-center mb-2">{current.desc}</p>

        <div className="relative flex justify-center min-h-[120px]">{current.visual}</div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, i) => (
            <div key={i} className={`h-1 transition-all ${i === slide ? "bg-pool-green w-6" : "bg-pool-border w-3"}`} />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {slide > 0 && (
            <button onClick={() => setSlide(slide - 1)} className="btn-secondary flex-1 text-[15px] gap-1">
              <ChevronLeft size={14} />
              {es ? "Anterior" : "Back"}
            </button>
          )}
          {slide < slides.length - 1 ? (
            <button onClick={() => setSlide(slide + 1)} className="btn-primary flex-1 text-[15px] gap-1">
              {es ? "Siguiente" : "Next"}
              <ChevronRight size={14} />
            </button>
          ) : (
            <div className="flex-1 flex gap-2">
              <button onClick={() => { finish(); onStartTour(); }} className="btn-secondary flex-1 text-[15px] px-3">
                {es ? "Ver demo" : "See demo"}
              </button>
              <button onClick={finish} className="btn-primary flex-1 text-[15px] gap-1">
                <Rocket size={14} />
                {es ? "Empezar" : "Start"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
