import type { ApprovalRisk } from "@/types/approval";
import { RiskBadge } from "./RiskBadge";

export function ApprovalRiskSummary({ risk }: { risk: ApprovalRisk }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-subtle p-3">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
          Risiko-Einschätzung
        </p>
        <RiskBadge level={risk.level} />
      </div>
      <p className="mt-2 text-sm text-ink-secondary">{risk.concern}</p>
      <p className="mt-1 text-xs text-ink-muted">
        <span className="text-ink-secondary">Mitigation:</span> {risk.mitigation}
      </p>
    </div>
  );
}
