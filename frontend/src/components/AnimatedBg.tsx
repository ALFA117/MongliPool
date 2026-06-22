export default function AnimatedBg() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Large emerald blob - top left */}
      <div className="animated-blob absolute w-[700px] h-[700px] -top-48 -left-48 rounded-full bg-[#05D5A1]/[0.06] blur-[140px] animate-[drift_20s_ease-in-out_infinite]" style={{ willChange: "transform" }} />
      {/* Electric blue blob - right */}
      <div className="animated-blob absolute w-[600px] h-[600px] top-1/4 -right-48 rounded-full bg-[#0066FF]/[0.05] blur-[120px] animate-[drift_28s_ease-in-out_infinite_reverse]" style={{ willChange: "transform" }} />
      {/* Turquoise accent blob - bottom center */}
      <div className="animated-blob absolute w-[500px] h-[500px] -bottom-32 left-1/4 rounded-full bg-[#00F5D4]/[0.04] blur-[100px] animate-[drift_24s_ease-in-out_infinite_3s]" style={{ willChange: "transform" }} />
      {/* Small intense green dot - mid */}
      <div className="animated-blob absolute w-[200px] h-[200px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#05D5A1]/[0.03] blur-[60px] animate-[drift_15s_ease-in-out_infinite_5s]" style={{ willChange: "transform" }} />
    </div>
  );
}
