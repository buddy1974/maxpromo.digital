import { TONE_BADGE, toneMap } from "@maxpromo/ui";
import type { AgentRiskLevel } from "@/types/agent";
import { getTranslations } from "next-intl/server";

const RISK_TONE = toneMap<AgentRiskLevel>({
  low: 'positive',
  medium: 'caution',
  high: 'critical',
  critical: 'critical',
})

export async function RiskBadge({ level }: { level: AgentRiskLevel }) {
  const t = await getTranslations("risk");

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-label uppercase tracking-[0.12em] ${TONE_BADGE[RISK_TONE(level)]}`}
    >
      {t(level)}
    </span>
  );
}
