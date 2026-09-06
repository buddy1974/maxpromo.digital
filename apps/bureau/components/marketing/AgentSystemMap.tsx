import { Icon, type IconName } from "@maxpromo/ui";
// Hub-and-spoke system map (inline SVG): Chief of Staff at the centre, the nine
// specialist agents connected as spokes. Pure SVG — no faces/avatars/images.
// Radial map on md+, compact hub statement on mobile.

import { token } from "@maxpromo/design-tokens";

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
  node: V.surface,
  ring: V.hairline,
  spoke: V.hairline,
  text: V.ink,
  dim: V.inkMuted,
  accent: V.accent,
  ink: V.onAccent,
};

const SPECIALISTS = [
  { icon: "leads" as IconName, name: "Lead" },
  { icon: "research" as IconName, name: "Research" },
  { icon: "clients" as IconName, name: "CRM" },
  { icon: "calendar" as IconName, name: "Kalender" },
  { icon: "edit" as IconName, name: "Content" },
  { icon: "projects" as IconName, name: "Operations" },
  { icon: "documents" as IconName, name: "Document" },
  { icon: "waiting" as IconName, name: "Follow-Up" },
  { icon: "governance" as IconName, name: "Governance" },
];

const CX = 480;
const CY = 250;
const RX = 380;
const RY = 185;
const CHIEF_R = 52;
const NODE_R = 28;

export function AgentSystemMap() {
  const nodes = SPECIALISTS.map((s, i) => {
    const theta = ((-90 + i * (360 / SPECIALISTS.length)) * Math.PI) / 180;
    return { ...s, x: CX + RX * Math.cos(theta), y: CY + RY * Math.sin(theta) };
  });

  return (
    <div className="mt-8">
      {/* Desktop: radial system map */}
      <div className="hidden rounded-lg border border-hairline bg-surface-subtle p-4 md:block">
        <svg viewBox="0 0 960 500" className="h-auto w-full" role="img" aria-label="Chief of Staff koordiniert neun spezialisierte Agenten">
          {/* spokes */}
          {nodes.map((n, i) => (
            <line key={`l${i}`} x1={CX} y1={CY} x2={n.x} y2={n.y} stroke={C.spoke} strokeWidth="1.5" />
          ))}

          {/* specialist nodes */}
          {nodes.map((n, i) => (
            <g key={`n${i}`}>
              <circle cx={n.x} cy={n.y} r={NODE_R} fill={C.node} stroke={C.ring} strokeWidth="1.5" />
              <text x={n.x} y={n.y + 1} textAnchor="middle" dominantBaseline="central" fontSize="18" fill={C.accent}>
                <Icon name={n.icon} size="md" />
              </text>
              <text x={n.x} y={n.y + NODE_R + 16} textAnchor="middle" fontSize="13" fontWeight="500" fill={C.text}>
                {n.name}
              </text>
            </g>
          ))}

          {/* central Chief hub */}
          <circle cx={CX} cy={CY} r={CHIEF_R + 8} fill="none" stroke={C.accent} strokeOpacity="0.25" strokeWidth="2" />
          <circle cx={CX} cy={CY} r={CHIEF_R} fill={C.accent} stroke={C.accent} strokeWidth="2" />
          <text x={CX} y={CY - 6} textAnchor="middle" dominantBaseline="central" fontSize="26" fill={C.ink}>
            <Icon name="dashboard" size="md" />
          </text>
          <text x={CX} y={CY + 20} textAnchor="middle" fontSize="12" fontWeight="700" fill={C.ink}>
            Chief of Staff
          </text>
        </svg>
        <p className="px-2 pb-1 text-center text-xs text-ink-muted">
          Eine Koordinationsebene. Neun Spezialisten. Jede Aktion nach außen über menschliche Freigabe.
        </p>
      </div>

      {/* Mobile: compact hub statement */}
      <div className="rounded-lg border border-accent/30 bg-accent-soft p-5 text-center md:hidden">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent font-mono text-xl text-white">
          <Icon name="dashboard" size="md" />
        </span>
        <p className="mt-3 font-semibold text-ink">Chief of Staff</p>
        <p className="mt-1 text-sm text-ink-secondary">
          koordiniert 9 spezialisierte Agenten — jede Aktion nach außen über
          menschliche Freigabe.
        </p>
      </div>
    </div>
  );
}
