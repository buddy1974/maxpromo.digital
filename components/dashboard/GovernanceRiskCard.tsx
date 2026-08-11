import type { AIGovernanceRisk, GovernanceRiskLevel } from "@/types/ai-governance";

const LEVEL_STYLE: Record<GovernanceRiskLevel, string> = {
  low: "text-emerald-600",
  medium: "text-amber-600",
  high: "text-orange-600",
  critical: "text-red-600",
};

export function GovernanceRiskCard({ risk }: { risk: AIGovernanceRisk }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-zinc-900">{risk.area}</h3>
        <span className={`font-mono text-[11px] uppercase tracking-[0.12em] ${LEVEL_STYLE[risk.level]}`}>
          {risk.level}
        </span>
      </div>
      <p className="mt-2 text-sm text-zinc-600">{risk.description}</p>
      <div className="mt-3 border-t border-zinc-200 pt-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
          Empfohlene Maßnahme
        </p>
        <p className="mt-1 text-sm text-zinc-700">{risk.recommendedAction}</p>
      </div>
    </div>
  );
}
