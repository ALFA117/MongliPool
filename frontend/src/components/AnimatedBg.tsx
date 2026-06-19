export default function AnimatedBg() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="animated-blob absolute w-[600px] h-[600px] -top-40 -left-40 rounded-full bg-[#05D5A1]/[0.04] blur-[120px] animate-[drift_25s_ease-in-out_infinite]" style={{ willChange: "transform" }} />
      <div className="animated-blob absolute w-[500px] h-[500px] top-1/3 -right-40 rounded-full bg-[#0066FF]/[0.04] blur-[100px] animate-[drift_30s_ease-in-out_infinite_reverse]" style={{ willChange: "transform" }} />
      <div className="animated-blob absolute w-[400px] h-[400px] -bottom-20 left-1/3 rounded-full bg-[#00F5D4]/[0.03] blur-[80px] animate-[drift_20s_ease-in-out_infinite_2s]" style={{ willChange: "transform" }} />
    </div>
  );
}
