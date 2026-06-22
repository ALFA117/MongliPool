import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, ChevronRight, ChevronLeft, Play, Wallet, ArrowDownToLine, FileKey, Sparkles, Eye, Shield, Rocket } from "lucide-react";
import { useI18n } from "../i18n/context";

interface Step {
  title: string;
  desc: string;
  icon: React.ReactNode;
  route?: string;
}

export default function DemoTour({ onClose }: { onClose: () => void }) {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const es = lang === "es";

  const steps: Step[] = [
    {
      title: es ? "Bienvenido a MongliPool" : "Welcome to MongliPool",
      desc: es
        ? "El primer privacy pool con cumplimiento regulatorio en Stellar. Te guiaremos por el flujo completo en 2 minutos — sin necesitar wallet ni fondos."
        : "The first privacy pool with regulatory compliance on Stellar. We'll walk you through the complete flow in 2 minutes — no wallet or funds needed.",
      icon: <Play size={24} />,
    },
    {
      title: es ? "1. Conecta tu wallet" : "1. Connect your wallet",
      desc: es
        ? "Primero conectas Freighter (extensión de Stellar). Tu dirección es pública — pero lo que depositas en el pool permanece privado. La wallet solo firma transacciones, nunca ve tus secretos."
        : "First you connect Freighter (Stellar extension). Your address is public — but what you deposit in the pool stays private. The wallet only signs transactions, never sees your secrets.",
      icon: <Wallet size={24} />,
    },
    {
      title: es ? "2. Deposita fondos" : "2. Deposit funds",
      desc: es
        ? "Eliges cuánto XLM depositar (1-1000). Tu dispositivo genera un recibo secreto — como un ticket de guardarropa que NUNCA sale de tu navegador. El contrato solo recibe un hash matemático anónimo."
        : "Choose how much XLM to deposit (1-1000). Your device generates a secret receipt — like a coat check ticket that NEVER leaves your browser. The contract only receives an anonymous math hash.",
      icon: <ArrowDownToLine size={24} />,
      route: "/deposit",
    },
    {
      title: es ? "3. Tu recibo privado" : "3. Your private receipt",
      desc: es
        ? "Este recibo es tu ÚNICA llave para retirar. Sin él, nadie — ni siquiera el DAO — puede acceder a tus fondos. Guárdalo como si fuera la combinación de tu caja fuerte."
        : "This receipt is your ONLY key to withdraw. Without it, nobody — not even the DAO — can access your funds. Guard it like the combination to your safe.",
      icon: <FileKey size={24} />,
    },
    {
      title: es ? "4. Prueba ZK en tu navegador" : "4. ZK proof in your browser",
      desc: es
        ? "Al retirar, tu dispositivo genera una prueba Groth16 (~30 seg, 21,781 restricciones sobre BN254). Esta prueba demuestra que eres dueño de UN depósito sin revelar cuál. Se verifica on-chain en el contrato groth16-verifier."
        : "When withdrawing, your device generates a Groth16 proof (~30 sec, 21,781 constraints on BN254). This proof shows you own A deposit without revealing which one. Verified on-chain in the groth16-verifier contract.",
      icon: <Sparkles size={24} />,
      route: "/withdraw",
    },
    {
      title: es ? "5. Auditoría selectiva" : "5. Selective audit",
      desc: es
        ? "Solo el auditor de Mongli DAO, con su clave privada Curve25519, puede descifrar los detalles de depósitos. Privacidad para el público, transparencia para el regulador — ese es el balance."
        : "Only Mongli DAO's auditor, with their Curve25519 private key, can decrypt deposit details. Privacy for the public, transparency for the regulator — that's the balance.",
      icon: <Eye size={24} />,
      route: "/auditor",
    },
    {
      title: es ? "6. Cumplimiento integrado (ASP)" : "6. Built-in compliance (ASP)",
      desc: es
        ? "El Authorized Set Provider (ASP) mantiene una lista blanca de direcciones aprobadas. Solo usuarios verificados pueden retirar. Esto previene lavado de dinero sin sacrificar la privacidad de los participantes legítimos."
        : "The Authorized Set Provider (ASP) maintains an allowlist of approved addresses. Only verified users can withdraw. This prevents money laundering without sacrificing privacy for legitimate participants.",
      icon: <Shield size={24} />,
      route: "/explorer",
    },
    {
      title: es ? "¡Listo para probarlo!" : "Ready to try it!",
      desc: es
        ? "Instala Freighter, consigue XLM de testnet en laboratory.stellar.org, y vuelve aquí para hacer tu primer depósito privado."
        : "Install Freighter, get testnet XLM at laboratory.stellar.org, and come back to make your first private deposit.",
      icon: <Rocket size={24} />,
    },
  ];

  const current = steps[step];

  const goNext = () => {
    if (step < steps.length - 1) {
      const next = steps[step + 1];
      if (next.route) navigate(next.route);
      setStep(step + 1);
    } else {
      navigate("/");
      onClose();
    }
  };

  const goPrev = () => {
    if (step > 0) {
      const prev = steps[step - 1];
      if (prev.route) navigate(prev.route);
      else navigate("/");
      setStep(step - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-lg">
      <div className="bg-pool-bg border border-pool-green/20 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-[0_0_80px_rgba(5,213,161,0.12)] animate-fade-in">
        {/* Progress */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i <= step ? "w-6 bg-pool-green" : "w-3 bg-white/10"
                }`}
              />
            ))}
          </div>
          <button onClick={onClose} className="text-pool-muted hover:text-pool-text cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pool-green to-pool-violet flex items-center justify-center mb-5 text-white">
          {current.icon}
        </div>

        {/* Content */}
        <h2 className="text-xl font-bold mb-3 tracking-tight">{current.title}</h2>
        <p className="text-pool-text-dim text-sm leading-relaxed mb-8">{current.desc}</p>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={goPrev}
            disabled={step === 0}
            className={`inline-flex items-center gap-1.5 text-sm ${step === 0 ? "text-pool-muted" : "text-pool-text-dim hover:text-pool-text cursor-pointer"}`}
          >
            <ChevronLeft size={16} />
            {es ? "Anterior" : "Previous"}
          </button>
          <span className="text-xs text-pool-muted">{step + 1} / {steps.length}</span>
          <button onClick={goNext} className="btn-primary py-2 px-5 text-sm inline-flex items-center gap-1.5">
            {step === steps.length - 1 ? (es ? "Empezar" : "Start") : (es ? "Siguiente" : "Next")}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
