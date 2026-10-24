import { getTranslations } from "next-intl/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

/**
 * A business object's page in the Agent Control Plane (ADR-0021).
 *
 * Leads, clients, projects, tasks and the business briefing are owned by Maxpromo OS, the Business
 * Control Plane. These routes used to render invented mock records here — a second CRM with fake
 * people. They now say where the real records are and link there; the Bureau keeps agents,
 * approvals, waiting room, audit, governance, playbooks and memory.
 */
const OS = "https://maxpromo.digital/os";
export const OS_SECTION = {
  leads: `${OS}/leads`,
  contacts: `${OS}/clients`,
  projects: `${OS}/jobs`,
  tasks: OS,
  briefing: OS,
} as const;

export async function LivesInOs({ section }: { section: keyof typeof OS_SECTION }) {
  const t = await getTranslations("livesInOs");
  const ts = await getTranslations("sections");
  return (
    <DashboardShell title={ts(section)}>
      <div className="max-w-xl rounded-lg border border-hairline bg-surface p-6 shadow-sm">
        <p className="text-base font-semibold text-ink">{t("title")}</p>
        <p className="mt-2 text-sm text-ink-secondary">{t(`body.${section}`)}</p>
        <a href={OS_SECTION[section]} className="btn-primary mt-4 inline-flex">{t("open")}</a>
        <p className="mt-4 text-xs text-ink-muted">{t("why")}</p>
      </div>
    </DashboardShell>
  );
}
