import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AgentIdentityCard } from "@/components/dashboard/AgentIdentityCard";
import { AGENTS } from "@/lib/registry/agents";

// Agent registry view (code-defined). Operational identity cards — no faces.
export default function AgentsPage() {
  const chief = AGENTS.find((a) => a.id === "chief-of-staff");
  const specialists = AGENTS.filter((a) => a.id !== "chief-of-staff");

  return (
    <DashboardShell title="Agenten">
      <div className="space-y-6">
        <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
          <p className="font-mono text-label uppercase tracking-[0.16em] text-ink-secondary">
            Agent Bureau · {AGENTS.length} Agenten
          </p>
          <p className="mt-2 text-sm text-ink-secondary">
            Ein Chief of Staff koordiniert ein überwachtes Team. Jeder Agent
            beobachtet einen Bereich, bereitet vor und legt Aktionen zur Freigabe
            vor — keine unkontrollierte Ausführung.
          </p>
        </div>

        {chief && (
          <section>
            <h2 className="mb-3 font-mono text-label uppercase tracking-[0.16em] text-ink-muted">
              Koordination
            </h2>
            <AgentIdentityCard agent={chief} primary />
          </section>
        )}

        <section>
          <h2 className="mb-3 font-mono text-label uppercase tracking-[0.16em] text-ink-muted">
            Spezialisten
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {specialists.map((a) => (
              <AgentIdentityCard key={a.id} agent={a} />
            ))}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
