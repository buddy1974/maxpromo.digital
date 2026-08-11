import type { AgentStatus } from "@/types/agent";

const STYLES: Record<AgentStatus, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  proposing: "border-accent/40 bg-accent-soft text-accent",
  idle: "border-zinc-200 bg-zinc-50 text-zinc-500",
  paused: "border-amber-200 bg-amber-50 text-amber-700",
  error: "border-red-200 bg-red-50 text-red-700",
  offline: "border-zinc-200 bg-zinc-50 text-zinc-400",
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
