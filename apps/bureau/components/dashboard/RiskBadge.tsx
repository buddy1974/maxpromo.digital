import { TONE_BADGE, toneMap } from "@maxpromo/ui";
import type { AgentRiskLevel } from "@/types/agent";

const RISK_TONE = toneMap<AgentRiskLevel>({
  low: 'positive',
  medium: 'caution',
  high: 'critical',
  critical: 'critical',
})

const LABELS: Record<AgentRiskLevel, string> = {
  low: "Risiko niedrig",
  medium: "Risiko mittel",
  high: "Risiko hoch",
  critical: "Kritisch",
};

export function RiskBadge({ level }: { level: AgentRiskLevel }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-label uppercase tracking-[0.12em] ${TONE_BADGE[RISK_TONE(level)]}`}
    >
      {LABELS[level]}
    </span>
  );
}
