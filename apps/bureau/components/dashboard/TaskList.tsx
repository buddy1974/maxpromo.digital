import { TONE_TEXT, toneMap, TONE_BADGE } from "@maxpromo/ui";
import type { Task, TaskStatus, TaskPriority } from "@/types/task";

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "Offen",
  in_progress: "In Arbeit",
  blocked: "Blockiert",
  done: "Erledigt",
  cancelled: "Abgebrochen",
};

const PRIORITY_COLOR_TONE = toneMap<TaskPriority>({
  urgent: 'critical',
  high: 'critical',
  medium: 'caution',
  low: 'neutral',
})

export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <ul className="divide-y divide-hairline rounded-xl border border-hairline bg-surface">
      {tasks.map((t) => (
        <li key={t.id} className="flex items-center gap-3 px-4 py-3">
          <span
            className={`font-mono text-xs uppercase tracking-[0.12em] ${TONE_TEXT[PRIORITY_COLOR_TONE(t.priority)]}`}
            title={`Priorität: ${t.priority}`}
          >
            ●
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-ink">{t.title}</p>
            <p className="text-xs text-ink-muted">
              {STATUS_LABEL[t.status]}
              {t.dueDate ? ` · fällig ${t.dueDate}` : ""}
              {t.source === "agent" ? " · vom Agenten vorbereitet" : ""}
            </p>
          </div>
          {t.isOverdue && (
            <span className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${TONE_BADGE.critical}`}>
              Überfällig
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
