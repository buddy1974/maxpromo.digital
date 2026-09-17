import { TONE_TEXT, toneMap } from "@maxpromo/ui";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MOCK_PROJECTS } from "@/lib/mock/projects";
import type { ProjectHealth, ProjectStatus } from "@/types/project";
import { getTranslations } from "next-intl/server";
import { formatDate } from "@/lib/i18n/format";
import { resolveLocale } from "@/lib/i18n/locale";

const HEALTH_STYLE_TONE = toneMap<ProjectHealth>({
  on_track: 'positive',
  at_risk: 'caution',
  off_track: 'critical',
})

export default async function ProjectsPage() {
  const t = await getTranslations("projectsPage");
  const ts = await getTranslations("sections");
  const locale = await resolveLocale();
  return (
    <DashboardShell title={ts("projects")}>
      <div className="grid gap-4 lg:grid-cols-2">
        {MOCK_PROJECTS.map((p) => (
          <div key={p.id} className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold text-ink">{p.name}</h3>
              <span className={`font-mono text-label uppercase tracking-[0.12em] ${TONE_TEXT[HEALTH_STYLE_TONE(p.health)]}`}>
                {t(p.health)}
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              {t(p.status)} · {p.owner}
              {p.dueDate ? ` · ${t("due", { date: formatDate(p.dueDate, locale) })}` : ""}
            </p>
            <div className="mt-4">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${p.progress}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between font-mono text-label text-ink-muted">
                <span>{p.progress}%</span>
                <span>{t("openTasks", { count: p.openTasks })}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
