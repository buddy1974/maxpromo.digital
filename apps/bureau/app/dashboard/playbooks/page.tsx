import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PLAYBOOKS } from "@/lib/core/playbooks";

// Reusable agent playbooks — the repeatable delivery system (systemize stage).
export default function PlaybooksPage() {
  return (
    <DashboardShell title="Playbooks">
      <div className="space-y-4">
        <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
          <p className="font-mono text-label uppercase tracking-[0.16em] text-ink-secondary">
            Wiederverwendbare Playbooks
          </p>
          <p className="mt-2 text-sm text-ink-secondary">
            Wiederholte manuelle Arbeit wird zu installierbaren Workflows. Jedes
            Playbook endet vor der Ausführung mit einer menschlichen Freigabe.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {PLAYBOOKS.map((p) => (
            <div key={p.id} className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-ink">{p.title}</h3>
                {p.approvalRequired && (
                  <span className="shrink-0 rounded-full border border-hairline bg-surface-sunken px-2.5 py-0.5 font-mono text-label-dense uppercase tracking-[0.12em] text-ink-secondary">
                    Approval Required
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-ink-muted">Schmerz: {p.businessPain}</p>
              <p className="mt-2 text-sm text-ink-secondary">
                <span className="text-ink-muted">Auslöser:</span> {p.trigger}
              </p>

              <ol className="mt-3 space-y-1">
                {p.steps.map((s) => (
                  <li key={s.id} className="flex gap-2 text-sm text-ink-secondary">
                    <span className="font-mono text-label text-ink-secondary">{s.order}.</span>
                    {s.label}
                  </li>
                ))}
              </ol>

              <div className="mt-3 flex flex-wrap gap-2 border-t border-hairline pt-3 text-label">
                <span className="font-mono uppercase tracking-[0.12em] text-ink-muted">
                  Stage: {p.operatingStage}
                </span>
                <span className="font-mono uppercase tracking-[0.12em] text-ink-muted">
                  · Agenten: {p.responsibleAgents.join(", ")}
                </span>
                {p.reusableTemplate && (
                  <span className="font-mono uppercase tracking-[0.12em] text-ink-secondary">
                    · Vorlage
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-ink-muted">Ergebnis: {p.expectedOutcome}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
