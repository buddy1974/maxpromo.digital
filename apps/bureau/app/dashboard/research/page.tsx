import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MOCK_MEMORY } from "@/lib/mock/memory";

// Research workspace (skeleton): surfaces agent-sourced research notes.
export default function ResearchPage() {
  const research = MOCK_MEMORY.filter(
    (m) => m.type === "company" || m.type === "conversation",
  );

  return (
    <DashboardShell title="Research">
      <div className="space-y-4">
        <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-secondary">
            Research Agent · Supervised
          </p>
          <p className="mt-2 text-sm text-ink-secondary">
            Recherche-Ergebnisse und Markt-Signale. Der Research-Agent fasst
            zusammen — er veröffentlicht nichts ohne Freigabe.
          </p>
        </div>

        {research.length ? (
          research.map((m) => (
            <div key={m.id} className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
              <h3 className="font-semibold text-ink">{m.title}</h3>
              <p className="mt-1 text-sm text-ink-secondary">{m.summary}</p>
              <p className="mt-2 font-mono text-[11px] text-ink-muted">
                {m.createdAt.slice(0, 10)} · {m.source}
              </p>
            </div>
          ))
        ) : (
          <EmptyState title="Noch keine Recherche" glyph="▥" />
        )}
      </div>
    </DashboardShell>
  );
}
