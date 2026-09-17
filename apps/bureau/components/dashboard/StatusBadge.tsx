import { TONE_BADGE, toneMap } from "@maxpromo/ui";
import type { AgentStatus } from "@/types/agent";
import { getTranslations } from "next-intl/server";

const STATUS_TONE = toneMap<AgentStatus>({
  active: 'positive',
  proposing: 'accent',
  idle: 'neutral',
  paused: 'caution',
  error: 'critical',
  offline: 'neutral',
})

export async function StatusBadge({ status }: { status: AgentStatus }) {
  const t = await getTranslations("agentStatus");

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-label uppercase tracking-[0.12em] ${TONE_BADGE[STATUS_TONE(status)]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {t(status)}
    </span>
  );
}
