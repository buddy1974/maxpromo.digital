import type { ApprovalRisk } from "@/types/approval";
import { RiskBadge } from "./RiskBadge";

export function ApprovalRiskSummary({ risk }: { risk: ApprovalRisk }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-surface-subtle p-3">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
          Risiko-Einschätzung
        </p>
        <RiskBadge level={risk.level} />
      </div>
      <p className="mt-2 text-sm text-zinc-700">{risk.concern}</p>
      <p className="mt-1 text-xs text-zinc-500">
        <span className="text-zinc-600">Mitigation:</span> {risk.mitigation}
      </p>
    </div>
  );
}
