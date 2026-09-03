import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MOCK_CLIENT_IMPLEMENTATIONS } from "@/lib/mock/client-implementation";

const HANDOVER_LABEL = {
  not_started: "Nicht begonnen",
  in_progress: "In Umsetzung",
  handed_over: "Übergeben",
} as const;

const PRIORITY_STYLE = {
  low: "text-ink-muted",
  medium: "text-warning",
  high: "text-danger",
} as const;

// Supports manual/concierge delivery — value delivered by hand before full
// automation exists. Central to the Maxpromo "we install a system" model.
export default function ClientImplementationPage() {
  return (
    <DashboardShell title="Client Implementation">
      <div className="space-y-6">
        <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-secondary">
            Concierge / Manuelle Lieferung
          </p>
          <p className="mt-2 text-sm text-ink-secondary">
            Maxpromo liefert Wert zunächst manuell, während die Plattform wächst.
            Diese Seite hält Beobachtungen, vorgeschlagene Workflows und den
            Installations-Fortschritt pro Kunde fest.
          </p>
        </div>

        {MOCK_CLIENT_IMPLEMENTATIONS.map((c) => (
          <div key={c.id} className="rounded-lg border border-hairline bg-surface p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-ink">{c.clientName}</h3>
                <p className="text-xs text-ink-muted">{c.industry}</p>
              </div>
              <div className="text-right">
                <span className={`font-mono text-[11px] uppercase tracking-[0.12em] ${PRIORITY_STYLE[c.implementationPriority]}`}>
                  Priorität {c.implementationPriority}
                </span>
                <p className="mt-1 font-mono text-[11px] text-ink-muted">
                  {HANDOVER_LABEL[c.handoverStatus]}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Block label="Geschäftliche Schmerzpunkte" items={c.businessPains} />
              <Block label="Beobachtete Engpässe" items={c.observedBottlenecks} />
              <Block label="Vorgeschlagene Agenten" items={c.proposedAgents} mono />
              <Block label="Zu installierende Workflows" items={c.workflowsToInstall} mono />
              <Block label="Integrationen" items={c.integrationRequirements} />
              <Block label="Nächste Schritte" items={c.nextSteps} />
            </div>

            <div className="mt-4 rounded-lg border border-hairline bg-surface-subtle p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                Manuelle Service-Notiz
              </p>
              <p className="mt-1 text-sm text-ink-secondary">{c.manualServiceNotes}</p>
            </div>

            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
              Wartungsbereit: {c.maintenanceReady ? "ja" : "noch nicht"}
            </p>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}

function Block({ label, items, mono }: { label: string; items: string[]; mono?: boolean }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">{label}</p>
      <ul className="mt-1 space-y-1">
        {items.map((it, i) => (
          <li key={i} className={`text-sm ${mono ? "font-mono text-xs text-ink-secondary" : "text-ink-secondary"}`}>
            {mono ? it : `• ${it}`}
          </li>
        ))}
      </ul>
    </div>
  );
}
