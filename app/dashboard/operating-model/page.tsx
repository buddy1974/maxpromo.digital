import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { OPERATING_STAGES, SAFE_ACTION_LIFECYCLE } from "@/lib/core/operating-model";
import { AGENT_HIERARCHY } from "@/lib/core/agent-hierarchy";

// Internal product control page — explains the backbone the bureau is built on.
// Not marketing fluff: shows what each stage does, who supports it, the handoff.
export default function OperatingModelPage() {
  return (
    <DashboardShell title="Operating Model">
      <div className="space-y-8">
        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
            Produkt-Backbone
          </p>
          <h2 className="mt-2 text-xl font-semibold text-zinc-900">
            Audit → Diagnose → Team-Design → Manuelle Lieferung → Systematisieren → Installieren → Warten
          </h2>
          <p className="mt-2 text-sm text-zinc-700">
            Das Dashboard ist die sichtbare Oberfläche. Das eigentliche Produkt ist
            dieses Betriebsmodell — ein System, das Maxpromo in einen Betrieb installiert.
          </p>
        </section>

        <section>
          <h3 className="mb-3 text-base font-semibold text-zinc-900">Die sieben Stufen</h3>
          <ol className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-stretch">
            {OPERATING_STAGES.map((stage, i) => (
              <li key={stage.key} className="flex items-center gap-2 md:flex-1">
                <div className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm">
                  <span className="font-mono text-[10px] text-accent">
                    {String(stage.order).padStart(2, "0")}
                  </span>
                  <p className="mt-0.5 text-sm font-medium text-zinc-900">{stage.name}</p>
                </div>
                {i < OPERATING_STAGES.length - 1 && (
                  <span className="text-zinc-400 md:hidden">↓</span>
                )}
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h3 className="mb-3 text-base font-semibold text-zinc-900">Sichere Aktions-Kette</h3>
          <div className="flex flex-wrap gap-2">
            {SAFE_ACTION_LIFECYCLE.map((s, i) => (
              <span key={s.step} className="flex items-center gap-2">
                <span className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 font-mono text-xs text-zinc-700 shadow-sm">
                  {s.label}
                </span>
                {i < SAFE_ACTION_LIFECYCLE.length - 1 && (
                  <span className="text-zinc-400">→</span>
                )}
              </span>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          {OPERATING_STAGES.map((stage) => (
            <div key={stage.key} className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-accent">
                  {String(stage.order).padStart(2, "0")}
                </span>
                <h3 className="text-lg font-semibold text-zinc-900">{stage.name}</h3>
              </div>
              <p className="mt-2 text-sm text-zinc-600">{stage.purpose}</p>
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
          <h3 className="mb-3 text-base font-semibold text-zinc-900">Agenten-Hierarchie</h3>
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <ul className="space-y-2 text-sm">
              {AGENT_HIERARCHY.map((n) => (
                <li key={n.role} className="flex gap-3">
                  <span className={`font-mono text-[11px] uppercase tracking-[0.12em] ${n.reportsTo ? "text-zinc-500" : "text-accent"}`}>
                    {n.reportsTo ? "└─" : "◆"}
                  </span>
                  <span className="text-zinc-900">{n.name}</span>
                  <span className="text-zinc-500">— {n.summary}</span>
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
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-0.5 text-sm text-zinc-700">{value}</p>
    </div>
  );
}
