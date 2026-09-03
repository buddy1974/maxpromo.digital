import type { AuditFinding } from "@/types/audit";
import { RiskBadge } from "./RiskBadge";

const IMPACT_LABEL = {
  time: "Zeit",
  revenue: "Umsatz",
  visibility: "Übersicht",
  risk: "Risiko",
} as const;

const PRIORITY_STYLE = {
  low: "text-ink-muted",
  medium: "text-warning",
  high: "text-danger",
  critical: "text-danger",
} as const;

export function AuditFindingCard({ finding }: { finding: AuditFinding }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
            {finding.category}
          </p>
          <h3 className="mt-1 font-semibold text-ink">{finding.title}</h3>
        </div>
        <span className={`font-mono text-[11px] uppercase tracking-[0.12em] ${PRIORITY_STYLE[finding.priority]}`}>
          {finding.priority}
        </span>
      </div>
      <p className="mt-2 text-sm text-ink-secondary">{finding.pain}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-hairline bg-surface-sunken px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-secondary">
          Wirkung: {IMPACT_LABEL[finding.impactArea]}
        </span>
        <RiskBadge level={finding.riskLevel} />
        <span className="rounded-full border border-hairline bg-surface-sunken px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-secondary">
          Stage: {finding.recommendedStage}
        </span>
      </div>
    </div>
  );
}
