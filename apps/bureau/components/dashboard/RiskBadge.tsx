import type { AgentRiskLevel } from "@/types/agent";

const STYLES: Record<AgentRiskLevel, string> = {
  low: "border-success/30 bg-success-soft text-success",
  medium: "border-warning/30 bg-warning-soft text-warning",
  high: "border-danger/30 bg-danger-soft text-danger",
  critical: "border-danger/30 bg-danger-soft text-danger",
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
