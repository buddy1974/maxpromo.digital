import { TONE_TEXT, toneMap } from "@maxpromo/ui";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MOCK_PROJECTS } from "@/lib/mock/projects";
import type { ProjectHealth, ProjectStatus } from "@/types/project";

const STATUS_LABEL: Record<ProjectStatus, string> = {
  planning: "Planung",
  active: "Aktiv",
  blocked: "Blockiert",
  on_hold: "Pausiert",
  done: "Abgeschlossen",
};

const HEALTH_STYLE_TONE = toneMap<ProjectHealth>({
  on_track: 'positive',
  at_risk: 'caution',
  off_track: 'critical',
})

const HEALTH_LABEL: Record<ProjectHealth, string> = {
  on_track: "Auf Kurs",
  at_risk: "Risiko",
  off_track: "Kritisch",
};

export default function ProjectsPage() {
  return (
    <DashboardShell title="Projekte">
      <div className="grid gap-4 lg:grid-cols-2">
        {MOCK_PROJECTS.map((p) => (
          <div key={p.id} className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold text-ink">{p.name}</h3>
              <span className={`font-mono text-[11px] uppercase tracking-[0.12em] ${TONE_TEXT[HEALTH_STYLE_TONE(p.health)]}`}>
                {HEALTH_LABEL[p.health]}
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              {STATUS_LABEL[p.status]} · {p.owner}
              {p.dueDate ? ` · fällig ${p.dueDate}` : ""}
            </p>
            <div className="mt-4">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${p.progress}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between font-mono text-[11px] text-ink-muted">
                <span>{p.progress}%</span>
                <span>{p.openTasks} offene Aufgaben</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
