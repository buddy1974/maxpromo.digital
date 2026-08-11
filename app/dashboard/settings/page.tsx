import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MOCK_INTEGRATIONS } from "@/lib/mock/integrations";
import type { IntegrationStatus } from "@/types/integration";

const STATUS_STYLE: Record<IntegrationStatus, string> = {
  connected: "border-emerald-200 bg-emerald-50 text-emerald-700",
  available: "border-zinc-200 bg-zinc-100 text-zinc-600",
  error: "border-red-200 bg-red-50 text-red-700",
  coming_soon: "border-zinc-200 bg-zinc-100 text-zinc-400",
};

const STATUS_LABEL: Record<IntegrationStatus, string> = {
  connected: "Verbunden",
  available: "Verfügbar",
  error: "Fehler",
  coming_soon: "Bald",
};

export default function SettingsPage() {
  return (
    <DashboardShell title="Einstellungen">
      <div className="space-y-6">
        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-900">
            Integrationen
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {MOCK_INTEGRATIONS.map((i) => (
              <div
                key={i.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900">{i.name}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{i.description}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${STATUS_STYLE[i.status]}`}
                >
                  {STATUS_LABEL[i.status]}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">Sicherheit & Kontrolle</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Supervised Mode ist aktiv. Agenten führen keine Aktionen nach außen
            ohne Freigabe aus. Konfiguration von Rollen, Berechtigungen und
            Audit-Aufbewahrung folgt in einem späteren Sprint.
          </p>
        </section>
      </div>
    </DashboardShell>
  );
}
