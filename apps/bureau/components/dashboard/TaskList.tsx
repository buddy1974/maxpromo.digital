import { TONE_TEXT, toneMap, TONE_BADGE } from "@maxpromo/ui";
import { getTranslations } from "next-intl/server";
import type { Task, TaskStatus, TaskPriority } from "@/types/task";
import { Icon } from "@maxpromo/ui";

/**
 * A task's status, as a message key rather than as a word.
 *
 * This map held five German words. It is the shape a translation hides in:
 * nothing here reads like copy, the file imports next-intl and uses it three
 * lines down, and a reader skims a Record of enum keys as configuration. An
 * English operator saw "Offen · In Arbeit · Blockiert" inside an otherwise
 * English list, and every gate passed, because a five-letter German word with
 * no umlaut in it matches nothing a heuristic looks for.
 */
const STATUS_KEY: Record<TaskStatus, string> = {
  todo: "sTodo",
  in_progress: "sInProgress",
  blocked: "sBlocked",
  done: "sDone",
  cancelled: "sCancelled",
};

const PRIORITY_COLOR_TONE = toneMap<TaskPriority>({
  urgent: 'critical',
  high: 'critical',
  medium: 'caution',
  low: 'neutral',
})

export async function TaskList({ tasks }: { tasks: Task[] }) {
  const tr = await getTranslations("tasksPage");
  return (
    <ul className="divide-y divide-hairline rounded-xl border border-hairline bg-surface">
      {tasks.map((t) => (
        <li key={t.id} className="flex items-center gap-3 px-4 py-3">
          <span
            className={`font-mono text-xs uppercase tracking-[0.12em] ${TONE_TEXT[PRIORITY_COLOR_TONE(t.priority)]}`}
            title={tr("priorityTitle", { priority: t.priority })}
          >
            <Icon name="running" size="xs" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-ink">{t.title}</p>
            <p className="text-xs text-ink-muted">
              {tr(STATUS_KEY[t.status])}
              {t.dueDate ? tr("due", { date: t.dueDate }) : ""}
              {t.source === "agent" ? tr("preparedByAgent") : ""}
            </p>
          </div>
          {t.isOverdue && (
            <span className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-label-dense uppercase tracking-[0.12em] ${TONE_BADGE.critical}`}>
              {tr("overdue")}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
