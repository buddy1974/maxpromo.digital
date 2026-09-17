import { TONE_BADGE, toneMap } from "@maxpromo/ui";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MOCK_INTEGRATIONS } from "@/lib/mock/integrations";
import type { IntegrationStatus } from "@/types/integration";
import { getTranslations } from "next-intl/server";

const STATUS_TONE = toneMap<IntegrationStatus>({
  connected: 'positive',
  available: 'neutral',
  error: 'critical',
  coming_soon: 'neutral',
})

export default async function SettingsPage() {
  const t = await getTranslations("settingsPage");
  const d = await getTranslations("demo.integrations");
  const ts = await getTranslations("sections");
  return (
    <DashboardShell title={ts("settings")}>
      <div className="space-y-6">
        <section>
          <h2 className="mb-3 text-base font-semibold text-ink">
            {t("integrations")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {MOCK_INTEGRATIONS.map((i) => (
              <div
                key={i.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-hairline bg-surface p-4 shadow-sm"
              >
                <div>
                  <p className="text-sm font-medium text-ink">{i.name || d(i.nameKey as string)}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">{d(i.id)}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 font-mono text-label-dense uppercase tracking-[0.12em] ${TONE_BADGE[STATUS_TONE(i.status)]}`}
                >
                  {t(i.status)}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
          <h2 className="text-base font-semibold text-ink">{t("securityHeading")}</h2>
          <p className="mt-2 text-sm text-ink-secondary">
            {t("securityBody")}
          </p>
        </section>
      </div>
    </DashboardShell>
  );
}
