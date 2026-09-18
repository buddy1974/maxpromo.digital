import { Icon, type IconName } from "@maxpromo/ui";
import { getTranslations } from "next-intl/server";
import { AgentSystemMap } from "./AgentSystemMap";

/**
 * Public agent team section. Operational identities only — no faces, no
 * avatars. Each specialist is a discrete operational unit: name, function,
 * approval scope. The Chief of Staff gets an elevated treatment above the grid.
 *
 * "Chief of Staff" stays in both languages. It is the product's own term for
 * the coordinating agent, it is understood in German business usage, and
 * translating it ("Stabschef") would name something this product does not
 * call itself. The agents' functions and approval scopes are translated,
 * because those describe work rather than name a thing.
 */
const CHIEF_ICON: IconName = "dashboard";

const AGENTS: readonly { key: string; icon: IconName }[] = [
  { key: "a1", icon: "leads" },
  { key: "a2", icon: "research" },
  { key: "a3", icon: "clients" },
  { key: "a4", icon: "calendar" },
  { key: "a5", icon: "edit" },
  { key: "a6", icon: "projects" },
  { key: "a7", icon: "documents" },
  { key: "a8", icon: "waiting" },
  // No a9. See AgentSystemMap — "Governance-Agent" was a card for an agent
  // this product does not ship.
];

export async function AgentBureau() {
  const t = await getTranslations("bureau");

  return (
    <section id="bureau" className="border-b border-hairline">
      <div className="mx-auto max-w-content px-6 py-24 md:py-32">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h2 className="mt-4 max-w-2xl text-section-title text-ink">{t("title")}</h2>
        <p className="mt-4 max-w-2xl text-body text-ink-secondary">
          {t("ledeBefore")}
          <span className="font-medium text-ink">{t("ledeEmphasis")}</span>
        </p>

        {/* Hub-and-spoke system map — architecture, not artwork */}
        <AgentSystemMap />

        {/* Chief of Staff — elevated */}
        <div className="mt-8 rounded-lg border border-accent/30 bg-accent-soft p-8 md:p-10">
          <div className="flex items-start gap-4">
            <span className="text-ink-secondary"><Icon name={CHIEF_ICON} size="lg" /></span>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-card-title text-ink">{t("chiefName")}</h3>
                <span className="font-mono text-label uppercase tracking-[0.16em] text-ink-secondary">
                  {t("chiefRole")}
                </span>
              </div>
              <p className="mt-2 max-w-2xl text-ink-secondary">{t("chiefDesc")}</p>
            </div>
          </div>
        </div>

        {/* Specialist bureau — one operational unit per card */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((a) => (
            <div key={a.key} className="card">
              <div className="flex items-start justify-between gap-3">
                <span className="text-ink-secondary"><Icon name={a.icon} size="md" /></span>
                <span className="rounded-full border border-hairline bg-surface-subtle px-2.5 py-1 font-mono text-label-dense uppercase tracking-[0.12em] text-ink-muted">
                  {t("approvalPrefix")} {t(`${a.key}Approval`)}
                </span>
              </div>
              <h4 className="mt-4 font-semibold text-ink">{t(`${a.key}Name`)}</h4>
              <p className="mt-1 text-sm text-ink-secondary">{t(`${a.key}Fn`)}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-2 text-xs text-ink-muted">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          {t("note")}
        </div>
      </div>
    </section>
  );
}
