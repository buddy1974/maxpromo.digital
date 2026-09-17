import { TONE_TEXT, type Tone } from "@maxpromo/ui";
import type { AuditFinding } from "@/types/audit";
import { RiskBadge } from "./RiskBadge";
import { getTranslations } from "next-intl/server";

const PRIORITY_TONE_MAP = {
  low: "neutral",
  medium: "caution",
  high: "critical",
  critical: "critical",
} as const satisfies Record<string, Tone>;

export async function AuditFindingCard({ finding }: { finding: AuditFinding }) {
  const t = await getTranslations("impact");

  return (
    <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-label uppercase tracking-[0.14em] text-ink-muted">
            {finding.category}
          </p>
          <h3 className="mt-1 font-semibold text-ink">{finding.title}</h3>
        </div>
        <span className={`font-mono text-label uppercase tracking-[0.12em] ${TONE_TEXT[PRIORITY_TONE_MAP[finding.priority]]}`}>
          {finding.priority}
        </span>
      </div>
      <p className="mt-2 text-sm text-ink-secondary">{finding.pain}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-hairline bg-surface-sunken px-2.5 py-0.5 font-mono text-label-dense uppercase tracking-[0.12em] text-ink-secondary">
          {t("label")}: {t(finding.impactArea)}
        </span>
        <RiskBadge level={finding.riskLevel} />
        <span className="rounded-full border border-hairline bg-surface-sunken px-2.5 py-0.5 font-mono text-label-dense uppercase tracking-[0.12em] text-ink-secondary">
          {t("stage")}: {finding.recommendedStage}
        </span>
      </div>
    </div>
  );
}
