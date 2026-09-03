import { TONE_BADGE, toneMap } from "@maxpromo/ui";
import type { AgentStatus } from "@/types/agent";

const STATUS_TONE = toneMap<AgentStatus>({
  active: 'positive',
  proposing: 'accent',
  idle: 'neutral',
  paused: 'caution',
  error: 'critical',
  offline: 'neutral',
})

const LABELS: Record<AgentStatus, string> = {
  active: "Aktiv",
  proposing: "Proposal Ready",
  idle: "Bereit",
  paused: "Pausiert",
  error: "Fehler",
  offline: "Offline",
};

export function StatusBadge({ status }: { status: AgentStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.12em] ${TONE_BADGE[STATUS_TONE(status)]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {LABELS[status]}
    </span>
  );
}
