// Real process diagram (inline SVG). Six evenly-spaced connected nodes.
// Orange gate = "Menschliche Freigabe". Execute node is visually gated by
// a dependency arc — cannot happen without the orange approval step.
// Desktop: horizontal flow. Mobile: horizontally scrollable (min-w).

const C = {
  node:   "#FFFFFF",
  line:   "#E4E4E7",
  ring:   "#D4D4D8",
  text:   "#18181B",
  dim:    "#71717A",
  accent: "#F97316",
  ink:    "#FFFFFF",
};

type Step = { label: string[]; glyph: string; gate?: boolean; gated?: boolean };
const STEPS: Step[] = [
  { label: ["Beobachten"],         glyph: "●" },
  { label: ["Vorbereiten"],        glyph: "⊟" },
  { label: ["Vorschlagen"],        glyph: "→" },
  { label: ["Menschliche","Freigabe"], glyph: "✓", gate: true },
  { label: ["Ausführen"],          glyph: "◆", gated: true },
  { label: ["Protokollieren"],     glyph: "▦" },
];

// Even 160-px spacing across 960 wide canvas.
const XS: number[] = [80, 240, 400, 560, 720, 880];
const CY = 104;
const R  = 38;

export function SafeActionLifecycle() {
  return (
    <section id="ablauf" className="border-b border-hairline">
      <div className="mx-auto max-w-content px-6 py-20 md:py-28">
        <p className="eyebrow">{"Sichere Aktions-Kette"}</p>
        <h2 className="mt-4 max-w-2xl text-section-title text-ink">
          KI bereitet vor. Der Mensch entscheidet.
        </h2>

        <div className="mt-8 overflow-x-auto rounded-lg border border-hairline bg-surface-subtle p-4 md:p-6">
          <svg
            viewBox="0 0 960 220"
            className="h-auto w-full min-w-[720px]"
            role="img"
            aria-label="Aktions-Kette: Beobachten, Vorbereiten, Vorschlagen, Menschliche Freigabe, Ausführen, Protokollieren"
          >
            <defs>
              <marker id="ar"  viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" fill={C.line} />
              </marker>
              <marker id="arA" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" fill={C.accent} />
              </marker>
            </defs>

            {/* connector lines */}
            {XS.slice(0, -1).map((x, i) => {
              const isAccent = i === 3; // gate → execute
              return (
                <line
                  key={i}
                  x1={x + R + 6} y1={CY}
                  x2={XS[i + 1] - R - 8} y2={CY}
                  stroke={isAccent ? C.accent : C.line}
                  strokeWidth={isAccent ? 2.5 : 1.5}
                  markerEnd={`url(#${isAccent ? "arA" : "ar"})`}
                />
              );
            })}

            {/* dependency arc — gate locks execute */}
            <path
              d={`M ${XS[3]},${CY + R + 2} C ${XS[3]},${CY + R + 46} ${XS[4]},${CY + R + 46} ${XS[4]},${CY + R + 2}`}
              fill="none"
              stroke={C.accent}
              strokeWidth="1.5"
              strokeDasharray="4 3"
              strokeOpacity="0.5"
            />
            <text x={(XS[3] + XS[4]) / 2} y={CY + R + 50} textAnchor="middle" fontSize="9" fontFamily="monospace" fill={C.accent} opacity="0.7">
              NUR NACH FREIGABE
            </text>

            {/* nodes */}
            {STEPS.map((s, i) => {
              const x = XS[i];
              return (
                <g key={i}>
                  {/* emphasis ring on the approval gate — flat outline, no blur/glow */}
                  {s.gate && (
                    <circle cx={x} cy={CY} r={R + 9} fill="none" stroke={C.accent} strokeOpacity="0.25" strokeWidth="2" />
                  )}
                  {/* step counter */}
                  <text x={x} y={CY - R - 12} textAnchor="middle" fontSize="10" fontFamily="monospace" fill={C.dim}>
                    {String(i + 1).padStart(2, "0")}
                  </text>
                  {/* node circle */}
                  <circle
                    cx={x} cy={CY} r={R}
                    fill={s.gate ? C.accent : C.node}
                    stroke={s.gate ? C.accent : s.gated ? C.accent : C.ring}
                    strokeWidth={s.gated ? 2 : 1.5}
                    strokeDasharray={s.gated ? "5 4" : undefined}
                  />
                  {/* glyph */}
                  <text x={x} y={CY + 1} textAnchor="middle" dominantBaseline="central" fontSize="22"
                    fill={s.gate ? C.ink : s.gated ? C.accent : C.text}>
                    {s.glyph}
                  </text>
                  {/* label lines */}
                  {s.label.map((ln, k) => (
                    <text key={k} x={x} y={CY + R + 20 + k * 16}
                      textAnchor="middle" fontSize="13"
                      fontWeight={s.gate ? 600 : 500}
                      fill={s.gate ? C.accent : C.text}>
                      {ln}
                    </text>
                  ))}
                </g>
              );
            })}
          </svg>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent-soft px-4 py-2.5">
          <span className="font-mono text-ink-secondary">✓</span>
          <p className="text-sm text-ink-secondary">
            KI bereitet vor. Der Mensch entscheidet.{" "}
            <span className="text-ink-secondary">Jede Aktion wird protokolliert.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
