import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { OPERATING_STAGES, SAFE_ACTION_LIFECYCLE } from "@/lib/core/operating-model";
import { AGENT_HIERARCHY } from "@/lib/core/agent-hierarchy";
import { Icon } from "@maxpromo/ui";
import { getTranslations } from "next-intl/server";

/**
 * Internal product control page — explains the backbone the bureau is built on.
 * Not marketing: it shows what each stage does, who supports it, and the
 * handover to the next one.
 *
 * The stages themselves are structure (lib/core/operating-model.ts); every
 * word on this page comes from the catalogue, keyed by the stage's own key.
 * That is what stops the sidebar calling this "Betriebsmodell" while the page
 * it opens is headed "Operating Model".
 */
export default async function OperatingModelPage() {
  const t = await getTranslations("model");
  const ts = await getTranslations("sections");

  return (
    <DashboardShell title={ts("operatingModel")}>
      <div className="space-y-8">
        <section className="rounded-lg border border-hairline bg-surface p-6 shadow-sm">
          <p className="font-mono text-label uppercase tracking-[0.16em] text-ink-secondary">
            {t("eyebrow")}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-ink">{t("backbone")}</h2>
          <p className="mt-2 text-sm text-ink-secondary">{t("lede")}</p>
        </section>

        <section>
          <h3 className="mb-3 text-base font-semibold text-ink">{t("sevenStages")}</h3>
          <ol className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-stretch">
            {OPERATING_STAGES.map((stage, i) => (
              <li key={stage.key} className="flex items-center gap-2 md:flex-1">
                <div className="flex-1 rounded-lg border border-hairline bg-surface px-3 py-2 shadow-sm">
                  <span className="font-mono text-label-dense text-ink-secondary">
                    {String(stage.order).padStart(2, "0")}
                  </span>
                  <p className="mt-0.5 text-sm font-medium text-ink">
                    {t(`stages.${stage.key}.name`)}
                  </p>
                </div>
                {i < OPERATING_STAGES.length - 1 && (
                  <span className="text-ink-muted md:hidden"><Icon name="chevronDown" size="sm" /></span>
                )}
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h3 className="mb-3 text-base font-semibold text-ink">{t("safeChain")}</h3>
          <div className="flex flex-wrap gap-2">
            {SAFE_ACTION_LIFECYCLE.map((s, i) => (
              <span key={s.step} className="flex items-center gap-2">
                <span className="rounded-md border border-hairline bg-surface px-3 py-1.5 font-mono text-xs text-ink-secondary shadow-sm">
                  {t(`lifecycle.${s.step}`)}
                </span>
                {i < SAFE_ACTION_LIFECYCLE.length - 1 && (
                  <span className="text-ink-muted"><Icon name="chevronRight" size="xs" /></span>
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
                <h3 className="text-lg font-semibold text-ink">{t(`stages.${stage.key}.name`)}</h3>
              </div>
              <p className="mt-2 text-sm text-ink-secondary">{t(`stages.${stage.key}.purpose`)}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label={t("solves")} value={t(`stages.${stage.key}.pain`)} />
                <Field label={t("result")} value={t(`stages.${stage.key}.output`)} />
                <Field label={t("agentsLabel")} value={stage.supportingAgents.join(", ")} />
                <Field label={t("nextHandoff")} value={t(`stages.${stage.key}.handoff`)} />
              </div>
            </div>
          ))}
        </section>

        <section>
          <h3 className="mb-3 text-base font-semibold text-ink">{t("hierarchy")}</h3>
          <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
            <ul className="space-y-2 text-sm">
              {AGENT_HIERARCHY.map((n) => (
                <li key={n.role} className="flex gap-3">
                  <span className={`font-mono text-label uppercase tracking-[0.12em] ${n.reportsTo ? "text-ink-muted" : "text-ink-secondary"}`}>
                    {n.reportsTo ? "└─" : <Icon name="dashboard" size="xs" />}
                  </span>
                  <span className="text-ink">{n.name}</span>
                  <span className="text-ink-muted">— {t(`hierarchy_.${n.role}`)}</span>
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
