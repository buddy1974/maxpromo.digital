import type { AIGovernanceRisk, GovernanceRiskLevel } from "@/types/ai-governance";

const LEVEL_STYLE: Record<GovernanceRiskLevel, string> = {
  low: "text-success",
  medium: "text-warning",
  high: "text-danger",
  critical: "text-danger",
};

export function GovernanceRiskCard({ risk }: { risk: AIGovernanceRisk }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-ink">{risk.area}</h3>
        <span className={`font-mono text-[11px] uppercase tracking-[0.12em] ${LEVEL_STYLE[risk.level]}`}>
          {risk.level}
        </span>
      </div>
      <p className="mt-2 text-sm text-ink-secondary">{risk.description}</p>
      <div className="mt-3 border-t border-hairline pt-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
          Empfohlene Maßnahme
        </p>
        <p className="mt-1 text-sm text-ink-secondary">{risk.recommendedAction}</p>
      </div>
    </div>
  );
}
