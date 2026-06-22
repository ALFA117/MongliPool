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
          <div className="w-16 h-16 rounded-xl bg-pool-violet/20 border border-pool-violet/30 flex items-center justify-center text-pool-violet-light font-mono text-xs">A</div>
          <div className="flex flex-col items-center">
            <div className="h-0.5 w-20 bg-gradient-to-r from-pool-violet to-pool-green" />
            <span className="text-[10px] text-pool-muted mt-1">100 XLM</span>
          </div>
          <div className="w-16 h-16 rounded-xl bg-pool-green/20 border border-pool-green/30 flex items-center justify-center text-pool-green font-mono text-xs">B</div>
          <div className="absolute mt-20">
            <Eye size={24} className="text-red-400/60 animate-pulse" />
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
          <div className="w-14 h-14 rounded-xl bg-pool-violet/20 border border-pool-violet/30 flex items-center justify-center text-pool-violet-light font-mono text-xs">A</div>
          <div className="h-0.5 w-8 bg-pool-violet/30" />
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pool-green/20 to-pool-violet/20 border border-pool-green/30 flex items-center justify-center">
            <Shield size={24} className="text-pool-green" />
          </div>
          <div className="h-0.5 w-8 bg-pool-green/30" />
          <div className="w-14 h-14 rounded-xl bg-pool-green/20 border border-pool-green/30 flex items-center justify-center text-pool-green font-mono text-xs">?</div>
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
              <div className="w-8 h-8 rounded-full bg-pool-green/20 border border-pool-green/30 flex items-center justify-center text-pool-green text-xs font-bold flex-shrink-0">{n}</div>
              {link ? (
                <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-pool-green hover:underline">{text} ↗</a>
              ) : (
                <span className="text-sm text-pool-text-dim">{text}</span>
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
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-xl">
      <div className="bg-pool-bg border border-pool-green/20 rounded-2xl p-8 max-w-md w-full mx-4 shadow-[0_0_100px_rgba(5,213,161,0.1)] animate-fade-in">
        <div className="flex justify-end mb-2">
          <button onClick={finish} className="text-pool-muted hover:text-pool-text cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <h2 className="text-xl font-bold mb-3 tracking-tight text-center">{current.title}</h2>
        <p className="text-pool-text-dim text-sm leading-relaxed text-center mb-2">{current.desc}</p>

        <div className="relative flex justify-center min-h-[120px]">{current.visual}</div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === slide ? "bg-pool-green w-6" : "bg-white/10"}`} />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {slide > 0 && (
            <button onClick={() => setSlide(slide - 1)} className="btn-secondary flex-1 py-2.5 text-sm inline-flex items-center justify-center gap-1">
              <ChevronLeft size={14} />
              {es ? "Anterior" : "Back"}
            </button>
          )}
          {slide < slides.length - 1 ? (
            <button onClick={() => setSlide(slide + 1)} className="btn-primary flex-1 py-2.5 text-sm inline-flex items-center justify-center gap-1">
              {es ? "Siguiente" : "Next"}
              <ChevronRight size={14} />
            </button>
          ) : (
            <div className="flex-1 flex gap-2">
              <button onClick={() => { finish(); onStartTour(); }} className="btn-secondary flex-1 py-2.5 text-sm">
                {es ? "Ver demo" : "See demo"}
              </button>
              <button onClick={finish} className="btn-primary flex-1 py-2.5 text-sm inline-flex items-center justify-center gap-1">
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
