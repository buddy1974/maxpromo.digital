import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { OPERATING_STAGES, SAFE_ACTION_LIFECYCLE } from "@/lib/core/operating-model";
import { AGENT_HIERARCHY } from "@/lib/core/agent-hierarchy";
import { Icon } from "@maxpromo/ui";

// Internal product control page — explains the backbone the bureau is built on.
// Not marketing fluff: shows what each stage does, who supports it, the handoff.
export default function OperatingModelPage() {
  return (
    <DashboardShell title="Operating Model">
      <div className="space-y-8">
        <section className="rounded-lg border border-hairline bg-surface p-6 shadow-sm">
          <p className="font-mono text-label uppercase tracking-[0.16em] text-ink-secondary">
            Produkt-Backbone
          </p>
          <h2 className="mt-2 text-xl font-semibold text-ink">
            Audit → Diagnose → Team-Design → Manuelle Lieferung → Systematisieren → Installieren → Warten
          </h2>
          <p className="mt-2 text-sm text-ink-secondary">
            Das Dashboard ist die sichtbare Oberfläche. Das eigentliche Produkt ist
            dieses Betriebsmodell — ein System, das Maxpromo in einen Betrieb installiert.
          </p>
        </section>

        <section>
          <h3 className="mb-3 text-base font-semibold text-ink">Die sieben Stufen</h3>
          <ol className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-stretch">
            {OPERATING_STAGES.map((stage, i) => (
              <li key={stage.key} className="flex items-center gap-2 md:flex-1">
                <div className="flex-1 rounded-lg border border-hairline bg-surface px-3 py-2 shadow-sm">
                  <span className="font-mono text-label-dense text-ink-secondary">
                    {String(stage.order).padStart(2, "0")}
                  </span>
                  <p className="mt-0.5 text-sm font-medium text-ink">{stage.name}</p>
                </div>
                {i < OPERATING_STAGES.length - 1 && (
                  <span className="text-ink-muted md:hidden"><Icon name="chevronDown" size="sm" /></span>
                )}
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h3 className="mb-3 text-base font-semibold text-ink">Sichere Aktions-Kette</h3>
          <div className="flex flex-wrap gap-2">
            {SAFE_ACTION_LIFECYCLE.map((s, i) => (
              <span key={s.step} className="flex items-center gap-2">
                <span className="rounded-md border border-hairline bg-surface px-3 py-1.5 font-mono text-xs text-ink-secondary shadow-sm">
                  {s.label}
                </span>
                {i < SAFE_ACTION_LIFECYCLE.length - 1 && (
                  <span className="text-ink-muted">→</span>
                )}
              </span>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          {OPERATING_STAGES.map((stage) => (
            <div key={stage.key} className="rounded-lg border border-hairline bg-surface p-6 shadow-sm">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-ink-secondary">
                  {String(stage.order).padStart(2, "0")}
                </span>
                <h3 className="text-lg font-semibold text-ink">{stage.name}</h3>
              </div>
              <p className="mt-2 text-sm text-ink-secondary">{stage.purpose}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Löst" value={stage.painAddressed} />
                <Field label="Ergebnis" value={stage.output} />
                <Field label="Agenten" value={stage.supportingAgents.join(", ")} />
                <Field label="Nächste Übergabe" value={stage.nextHandoff} />
              </div>
            </div>
          ))}
        </section>

        <section>
          <h3 className="mb-3 text-base font-semibold text-ink">Agenten-Hierarchie</h3>
          <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
            <ul className="space-y-2 text-sm">
              {AGENT_HIERARCHY.map((n) => (
                <li key={n.role} className="flex gap-3">
                  <span className={`font-mono text-label uppercase tracking-[0.12em] ${n.reportsTo ? "text-ink-muted" : "text-ink-secondary"}`}>
                    {n.reportsTo ? "└─" : <Icon name="dashboard" size="xs" />}
                  </span>
                  <span className="text-ink">{n.name}</span>
                  <span className="text-ink-muted">— {n.summary}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-label-dense uppercase tracking-[0.14em] text-ink-muted">{label}</p>
      <p className="mt-0.5 text-sm text-ink-secondary">{value}</p>
    </div>
  );
}
