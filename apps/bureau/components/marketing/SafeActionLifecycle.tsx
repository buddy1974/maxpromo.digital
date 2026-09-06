// Real process diagram (inline SVG). Six evenly-spaced connected nodes.
// Orange gate = "Menschliche Freigabe". Execute node is visually gated by
// a dependency arc — cannot happen without the orange approval step.
// Desktop: horizontal flow. Mobile: horizontally scrollable (min-w).

import { token } from "@maxpromo/design-tokens";
import { Icon, type IconName } from "@maxpromo/ui";

/**
 * Diagram palette. SVG presentation attributes cannot resolve CSS custom
 * properties reliably across browsers when the SVG is inlined and re-themed,
 * so the values are read from the token module instead of restated. This is
 * the same pair-of-outputs approach the documents and emails use.
 */
const V = {
  surface: token.surface,
  hairline: token.border,
  hairlineStrong: token.borderStrong,
  ink: token.text,
  inkMuted: token.textMuted,
  accent: token.primary,
  onAccent: token.onPrimary,
};

const C = {
  node:   V.surface,
  line:   V.hairline,
  ring:   V.hairlineStrong,
  text:   V.ink,
  dim:    V.inkMuted,
  accent: V.accent,
  ink:    V.surface,
};

type Step = { label: string[]; icon: IconName; gate?: boolean; gated?: boolean };
const STEPS: Step[] = [
  { label: ["Beobachten"],         icon: "running" as IconName },
  { label: ["Vorbereiten"],        icon: "leads" as IconName },
  { label: ["Vorschlagen"],        icon: "arrowRight" as IconName },
  { label: ["Menschliche","Freigabe"], icon: "approvals" as IconName, gate: true },
  { label: ["Ausführen"],          icon: "dashboard" as IconName, gated: true },
  { label: ["Protokollieren"],     icon: "tasks" as IconName },
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
                  {/* A nested <svg> is valid inside <g>, so the shared Icon
                      renders here unchanged rather than being redrawn as a
                      diagram-only glyph. */}
                  <g transform={`translate(${x - 10}, ${CY - 10})`}
                    color={s.gate ? C.ink : s.gated ? C.accent : C.text}>
                    <Icon name={s.icon} size="md" />
                  </g>
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
          <span className="font-mono text-ink-secondary"><Icon name="check" size="sm" /></span>
          <p className="text-sm text-ink-secondary">
            KI bereitet vor. Der Mensch entscheidet.{" "}
            <span className="text-ink-secondary">Jede Aktion wird protokolliert.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
