import type { ApprovalTimelineEvent } from "@/types/approval";

const STEP_LABEL = {
  observed: "Beobachtet",
  prepared: "Vorbereitet",
  proposed: "Vorgeschlagen",
  reviewed: "Geprüft",
  executed: "Ausgeführt",
  logged: "Protokolliert",
} as const;

// Visualises the safe-action lifecycle for one proposal. "Reviewed/Executed"
// steps only appear once a human acts — reinforcing that nothing self-executes.
export function ApprovalTimeline({ events }: { events: ApprovalTimelineEvent[] }) {
  return (
    <ol className="space-y-2">
      {events.map((e) => (
        <li key={e.id} className="flex items-center gap-3">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
            {STEP_LABEL[e.step]}
          </span>
          <span className="text-sm text-ink-secondary">{e.label}</span>
          <span className="ml-auto font-mono text-[11px] text-ink-muted">
            {e.at.slice(11, 16)} UTC
          </span>
        </li>
      ))}
      <li className="flex items-center gap-3 opacity-50">
        <span className="h-1.5 w-1.5 rounded-full border border-hairline-strong" />
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
          Menschliche Freigabe
        </span>
        <span className="text-sm text-ink-muted">ausstehend</span>
      </li>
    </ol>
  );
}
