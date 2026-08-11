import type { Task, TaskStatus, TaskPriority } from "@/types/task";

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "Offen",
  in_progress: "In Arbeit",
  blocked: "Blockiert",
  done: "Erledigt",
  cancelled: "Abgebrochen",
};

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  urgent: "text-red-600",
  high: "text-orange-600",
  medium: "text-amber-600",
  low: "text-zinc-400",
};

export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
      {tasks.map((t) => (
        <li key={t.id} className="flex items-center gap-3 px-4 py-3">
          <span
            className={`font-mono text-xs uppercase tracking-[0.12em] ${PRIORITY_COLOR[t.priority]}`}
            title={`Priorität: ${t.priority}`}
          >
            ●
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-zinc-800">{t.title}</p>
            <p className="text-xs text-zinc-500">
              {STATUS_LABEL[t.status]}
              {t.dueDate ? ` · fällig ${t.dueDate}` : ""}
              {t.source === "agent" ? " · vom Agenten vorbereitet" : ""}
            </p>
          </div>
          {t.isOverdue && (
            <span className="shrink-0 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-red-700">
              Überfällig
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
