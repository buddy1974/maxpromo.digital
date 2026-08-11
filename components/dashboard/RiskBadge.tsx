import type { AgentRiskLevel } from "@/types/agent";

const STYLES: Record<AgentRiskLevel, string> = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  high: "border-orange-200 bg-orange-50 text-orange-700",
  critical: "border-red-200 bg-red-50 text-red-700",
};

const LABELS: Record<AgentRiskLevel, string> = {
  low: "Risiko niedrig",
  medium: "Risiko mittel",
  high: "Risiko hoch",
  critical: "Kritisch",
};

export function RiskBadge({ level }: { level: AgentRiskLevel }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.12em] ${STYLES[level]}`}
    >
      {LABELS[level]}
    </span>
  );
}
