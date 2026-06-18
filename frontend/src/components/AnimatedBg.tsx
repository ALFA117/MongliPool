export default function AnimatedBg() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute w-[600px] h-[600px] -top-40 -left-40 rounded-full bg-pool-violet/[0.04] blur-[120px] animate-[drift_25s_ease-in-out_infinite]" />
      <div className="absolute w-[500px] h-[500px] top-1/3 -right-40 rounded-full bg-pool-green/[0.03] blur-[100px] animate-[drift_30s_ease-in-out_infinite_reverse]" />
      <div className="absolute w-[400px] h-[400px] -bottom-20 left-1/3 rounded-full bg-blue-500/[0.02] blur-[80px] animate-[drift_20s_ease-in-out_infinite_2s]" />
    </div>
  );
}
