import type { Task, TaskStatus, TaskPriority } from "@/types/task";

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "Offen",
  in_progress: "In Arbeit",
  blocked: "Blockiert",
  done: "Erledigt",
  cancelled: "Abgebrochen",
};

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  urgent: "text-danger",
  high: "text-danger",
  medium: "text-warning",
  low: "text-ink-muted",
};

export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <ul className="divide-y divide-zinc-200 rounded-xl border border-hairline bg-surface">
      {tasks.map((t) => (
        <li key={t.id} className="flex items-center gap-3 px-4 py-3">
          <span
            className={`font-mono text-xs uppercase tracking-[0.12em] ${PRIORITY_COLOR[t.priority]}`}
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
            <span className="shrink-0 rounded-full border border-danger/30 bg-danger-soft px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-danger">
              Überfällig
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
