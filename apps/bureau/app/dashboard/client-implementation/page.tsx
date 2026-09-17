import { TONE_TEXT, type Tone } from "@maxpromo/ui";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MOCK_CLIENT_IMPLEMENTATIONS } from "@/lib/mock/client-implementation";
import { getTranslations } from "next-intl/server";

const PRIORITY_TONE_MAP = {
  low: "neutral",
  medium: "caution",
  high: "critical",
} as const satisfies Record<string, Tone>;

// Supports manual/concierge delivery — value delivered by hand before full
// automation exists. Central to the Maxpromo "we install a system" model.
export default async function ClientImplementationPage() {
  const t = await getTranslations("clientImpl");
  const ts = await getTranslations("sections");

  const HANDOVER_KEY = { not_started: "notStarted", in_progress: "inProgress", handed_over: "handedOver" } as const;

  return (
    <DashboardShell title={ts("clientImplementation")}>
      <div className="space-y-6">
        <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
          <p className="font-mono text-label uppercase tracking-[0.16em] text-ink-secondary">
            {t("eyebrow")}
          </p>
          <p className="mt-2 text-sm text-ink-secondary">
            {t("lede")}
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
                <span className={`font-mono text-label uppercase tracking-[0.12em] ${TONE_TEXT[PRIORITY_TONE_MAP[c.implementationPriority]]}`}>
                  {t("priority", { level: c.implementationPriority })}
                </span>
                <p className="mt-1 font-mono text-label text-ink-muted">
                  {t(HANDOVER_KEY[c.handoverStatus])}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Block label={t("businessPains")} items={c.businessPains} />
              <Block label={t("bottlenecks")} items={c.observedBottlenecks} />
              <Block label={t("proposedAgents")} items={c.proposedAgents} mono />
              <Block label={t("workflows")} items={c.workflowsToInstall} mono />
              <Block label={t("integrations")} items={c.integrationRequirements} />
              <Block label={t("nextSteps")} items={c.nextSteps} />
            </div>

            <div className="mt-4 rounded-lg border border-hairline bg-surface-subtle p-3">
              <p className="font-mono text-label-dense uppercase tracking-[0.14em] text-ink-muted">
                {t("serviceNote")}
              </p>
              <p className="mt-1 text-sm text-ink-secondary">{c.manualServiceNotes}</p>
            </div>

            <p className="mt-3 font-mono text-label uppercase tracking-[0.12em] text-ink-muted">
              {t("maintenanceReady")}: {c.maintenanceReady ? t("ready") : t("notYet")}
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
      <p className="font-mono text-label-dense uppercase tracking-[0.14em] text-ink-muted">{label}</p>
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
