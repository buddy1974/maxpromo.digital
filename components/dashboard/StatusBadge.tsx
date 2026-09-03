import type { AgentStatus } from "@/types/agent";

const STYLES: Record<AgentStatus, string> = {
  active: "border-success/30 bg-success-soft text-success",
  proposing: "border-accent/40 bg-accent-soft text-ink-secondary",
  idle: "border-hairline bg-surface-subtle text-ink-muted",
  paused: "border-warning/30 bg-warning-soft text-warning",
  error: "border-danger/30 bg-danger-soft text-danger",
  offline: "border-hairline bg-surface-subtle text-ink-muted",
};

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
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.12em] ${STYLES[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {LABELS[status]}
    </span>
  );
}
