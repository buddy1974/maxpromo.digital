import { TONE_TEXT, toneMap } from "@maxpromo/ui";
import type { GovernanceRiskLevel } from "@/types/ai-governance";
import type { RiskRecord } from "@/lib/mock/ai-governance";
import { getTranslations } from "next-intl/server";

const LEVEL_STYLE_TONE = toneMap<GovernanceRiskLevel>({
  low: 'positive',
  medium: 'caution',
  high: 'critical',
  critical: 'critical',
})

export async function GovernanceRiskCard({ risk }: { risk: RiskRecord }) {
  const t = await getTranslations("demo.risks");
  const g = await getTranslations("governancePage");

  return (
    <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-ink">{t(risk.id + ".area")}</h3>
        <span className={`font-mono text-label uppercase tracking-[0.12em] ${TONE_TEXT[LEVEL_STYLE_TONE(risk.level)]}`}>
          {risk.level}
        </span>
      </div>
      <p className="mt-2 text-sm text-ink-secondary">{t(risk.id + ".description")}</p>
      <div className="mt-3 border-t border-hairline pt-2">
        <p className="font-mono text-label-dense uppercase tracking-[0.14em] text-ink-muted">
          {g("recommendedAction")}
        </p>
        <p className="mt-1 text-sm text-ink-secondary">{t(risk.id + ".action")}</p>
      </div>
    </div>
  );
}
