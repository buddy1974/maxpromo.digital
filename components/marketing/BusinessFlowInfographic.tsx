// Visual business pipeline — inline SVG.
// Desktop: horizontal 5-node flow (horizontally scrollable).
// Mobile: vertical spine with connected nodes.
// Orange pivot = "Owner genehmigt". Minimal text. No cards/paragraphs.

const C = {
  node:   "#FFFFFF",
  ring:   "#D4D4D8",
  line:   "#E4E4E7",
  text:   "#18181B",
  dim:    "#71717A",
  accent: "#F97316",
  ink:    "#FFFFFF",
};

type Stage = {
  glyph:  string;
  label:  string;
  sub:    string;
  accent?: boolean;
  final?: boolean;
};

const FLOW: Stage[] = [
  { glyph: "!",  label: "Problem erkannt",    sub: "Frist · Follow-up · Anfrage" },
  { glyph: "⊟", label: "Agent bereitet vor",  sub: "Entwurf — nichts gesendet" },
  { glyph: "✓",  label: "Owner genehmigt",    sub: "Sie entscheiden",           accent: true },
  { glyph: "▦",  label: "Protokolliert",       sub: "Vollständiger Audit-Trail" },
  { glyph: "◎",  label: "Geschäft organisiert", sub: "Verlässliches Follow-through", final: true },
];

// Desktop: 5 nodes, even spacing in 960px canvas.
const DXS: number[] = [80, 280, 480, 680, 880];
const DCY = 92;
const DR  = 38;

// Mobile: vertical
const MX  = 36;
const MTOP = 36;
const MGAP = 88;
const MR   = 24;

export function BusinessFlowInfographic() {
  const mHeight = MTOP + (FLOW.length - 1) * MGAP + 52;

  return (
    <section className="border-b border-hairline">
      <div className="mx-auto max-w-content px-6 py-20 md:py-28">
        <p className="eyebrow">{"Vom Problem zum System"}</p>
        <h2 className="mt-4 max-w-2xl text-2xl font-semibold tracking-tight text-ink md:text-3xl">
          Vorschläge statt Blind-Automation. Der Owner bleibt in Kontrolle.
        </h2>

        {/* Desktop: horizontal flow */}
        <div className="mt-8 hidden overflow-x-auto rounded-lg border border-hairline bg-surface-subtle p-4 md:block md:p-6">
          <svg
            viewBox="0 0 960 195"
            className="h-auto w-full min-w-[720px]"
            role="img"
            aria-label="Prozess: Problem erkannt, Agent bereitet vor, Owner genehmigt, Protokolliert, Geschäft organisiert"
          >
            <defs>
              <marker id="bfar"  viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" fill={C.line} />
              </marker>
              <marker id="bfarA" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" fill={C.accent} />
              </marker>
            </defs>

            {/* connectors */}
            {DXS.slice(0, -1).map((x, i) => {
              const isAccent = i === 1; // before-gate → gate
              return (
                <line key={i}
                  x1={x + DR + 6}   y1={DCY}
                  x2={DXS[i+1] - DR - 8} y2={DCY}
                  stroke={isAccent ? C.accent : C.line}
                  strokeWidth={isAccent ? 2 : 1.5}
                  markerEnd={`url(#${isAccent ? "bfarA" : "bfar"})`}
                />
              );
            })}

            {/* nodes */}
            {FLOW.map((s, i) => {
              const x = DXS[i];
              return (
                <g key={i}>
                  {s.accent && (
                    <circle cx={x} cy={DCY} r={DR + 9} fill="none" stroke={C.accent} strokeOpacity="0.25" strokeWidth="2" />
                  )}
                  {s.final && (
                    <circle cx={x} cy={DCY} r={DR + 5} fill="none" stroke={C.text} strokeOpacity="0.12" strokeWidth="1.5" />
                  )}
                  <circle cx={x} cy={DCY} r={DR}
                    fill={s.accent ? C.accent : C.node}
                    stroke={s.accent ? C.accent : s.final ? C.text : C.ring}
                    strokeWidth={s.final ? 1.5 : 1.5}
                    strokeOpacity={s.final ? 0.35 : 1}
                  />
                  <text x={x} y={DCY + 1} textAnchor="middle" dominantBaseline="central" fontSize="20"
                    fill={s.accent ? C.ink : s.final ? C.text : C.text}>
                    {s.glyph}
                  </text>
                  {/* label */}
                  <text x={x} y={DCY + DR + 20} textAnchor="middle" fontSize="13" fontWeight="600"
                    fill={s.accent ? C.accent : s.final ? C.text : C.text}>
                    {s.label}
                  </text>
                  <text x={x} y={DCY + DR + 36} textAnchor="middle" fontSize="11.5" fill={C.dim}>
                    {s.sub}
                  </text>
                  {s.accent && (
                    <text x={x} y={DCY - DR - 12} textAnchor="middle" fontSize="9" fontFamily="monospace" fill={C.accent}>
                      SIE ENTSCHEIDEN
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Mobile: vertical flow */}
        <div className="mt-8 overflow-hidden rounded-lg border border-hairline bg-surface-subtle p-4 md:hidden">
          <svg viewBox={`0 0 480 ${mHeight}`} className="h-auto w-full" role="img" aria-label="Prozess-Pipeline vertikal">
            {/* spine */}
            <line x1={MX} y1={MTOP} x2={MX} y2={MTOP + (FLOW.length - 1) * MGAP}
              stroke={C.line} strokeWidth="2" />

            {FLOW.map((s, i) => {
              const cy = MTOP + i * MGAP;
              return (
                <g key={i}>
                  {i < FLOW.length - 1 && (
                    <text x={MX} y={cy + MGAP / 2 + 4} textAnchor="middle" fontSize="11" fill={C.line}>▼</text>
                  )}
                  {s.accent && <circle cx={MX} cy={cy} r={MR + 6} fill="none" stroke={C.accent} strokeOpacity="0.3" strokeWidth="1.5" />}
                  <circle cx={MX} cy={cy} r={MR}
                    fill={s.accent ? C.accent : C.node}
                    stroke={s.accent ? C.accent : C.ring}
                    strokeWidth="1.5"
                  />
                  <text x={MX} y={cy + 1} textAnchor="middle" dominantBaseline="central" fontSize="15"
                    fill={s.accent ? C.ink : C.text}>
                    {s.glyph}
                  </text>
                  <text x={MX + 38} y={cy - 3} fontSize="14" fontWeight="600"
                    fill={s.accent ? C.accent : C.text}>
                    {s.label}
                  </text>
                  <text x={MX + 38} y={cy + 16} fontSize="12" fill={C.dim}>
                    {s.sub}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </section>
  );
}
