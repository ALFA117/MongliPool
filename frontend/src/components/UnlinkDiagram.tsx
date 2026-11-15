/** Ilustración (no son datos reales): depósitos entran al pool y los retiros salen sin vínculo visible. */
export default function UnlinkDiagram({ lang }: { lang: "es" | "en" | string }) {
  const es = lang === "es";
  const ins = [60, 130, 200];
  const outs = [60, 130, 200];
  return (
    <figure className="panel p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[13px] text-pool-muted">{es ? "Ilustración del flujo" : "Flow illustration"}</span>
        <span className="font-mono text-[12px] text-pool-green border border-pool-green/40 rounded px-1.5 py-0.5">ZK</span>
      </div>
      <svg viewBox="0 0 420 260" className="w-full h-auto" role="img"
        aria-label={es ? "Tres depósitos entran al pool y tres retiros salen sin que se pueda saber cuál corresponde a cuál" : "Three deposits enter the pool and three withdrawals leave with no visible link between them"}>
        {/* entradas */}
        {ins.map((y, i) => (
          <g key={`in${i}`}>
            <rect x="8" y={y - 16} width="78" height="32" rx="4" className="fill-pool-surface stroke-pool-border" strokeWidth="1" />
            <text x="47" y={y + 5} textAnchor="middle" className="fill-pool-text-dim" style={{ font: "500 12px 'Geist Mono', monospace" }}>
              {es ? "Depósito" : "Deposit"} {String.fromCharCode(65 + i)}
            </text>
            <path d={`M86 ${y} C 130 ${y}, 140 130, 162 130`} fill="none" className="stroke-pool-text-dim flow-dash" strokeWidth="1.25" />
          </g>
        ))}
        {/* pool */}
        <rect x="162" y="70" width="96" height="120" rx="6" className="fill-pool-bg stroke-pool-green" strokeWidth="1.5" />
        <text x="210" y="104" textAnchor="middle" className="fill-pool-text" style={{ font: "500 13px 'Geist', sans-serif" }}>Pool</text>
        {/* mini árbol de Merkle */}
        <g className="stroke-pool-green" strokeWidth="1">
          <line x1="210" y1="122" x2="190" y2="142" />
          <line x1="210" y1="122" x2="230" y2="142" />
          <line x1="190" y1="142" x2="182" y2="162" />
          <line x1="190" y1="142" x2="198" y2="162" />
          <line x1="230" y1="142" x2="222" y2="162" />
          <line x1="230" y1="142" x2="238" y2="162" />
        </g>
        {[[210,122],[190,142],[230,142],[182,162],[198,162],[222,162],[238,162]].map(([x,y],i)=>(
          <rect key={i} x={x-3} y={y-3} width="6" height="6" className="fill-pool-green" />
        ))}
        <text x="210" y="182" textAnchor="middle" className="fill-pool-muted" style={{ font: "400 10px 'Geist Mono', monospace" }}>merkle root</text>
        {/* salidas */}
        {outs.map((y, i) => (
          <g key={`out${i}`}>
            <path d={`M258 130 C 280 130, 290 ${y}, 334 ${y}`} fill="none" className="stroke-pool-text-dim flow-dash" strokeWidth="1.25" />
            <rect x="334" y={y - 16} width="78" height="32" rx="4" className="fill-pool-surface stroke-pool-border" strokeWidth="1" />
            <text x="373" y={y + 5} textAnchor="middle" className="fill-pool-text-dim" style={{ font: "500 12px 'Geist Mono', monospace" }}>
              {es ? "Retiro" : "Exit"} {["X", "Y", "Z"][i]}
            </text>
          </g>
        ))}
        {/* sin vínculo */}
        <g transform="translate(210 232)">
          <text textAnchor="middle" className="fill-pool-muted" style={{ font: "400 11px 'Geist Mono', monospace" }}>
            {es ? "A → ? · B → ? · C → ?" : "A → ? · B → ? · C → ?"}
          </text>
        </g>
      </svg>
      <figcaption className="mt-3 text-[14px] leading-relaxed text-pool-text-dim">
        {es
          ? "Una prueba Groth16 demuestra que el retiro viene de algún depósito del árbol, sin revelar de cuál."
          : "A Groth16 proof shows the withdrawal comes from some deposit in the tree, without revealing which one."}
      </figcaption>
    </figure>
  );
}
