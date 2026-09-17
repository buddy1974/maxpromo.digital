import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TaskList } from "@/components/dashboard/TaskList";
import { MOCK_TASKS } from "@/lib/mock/tasks";
import { getTranslations } from "next-intl/server";

export default async function TasksPage() {
  const t = await getTranslations("tasksPage");
  const ts = await getTranslations("sections");
  const open = MOCK_TASKS.filter((t) => t.status !== "done" && t.status !== "cancelled");
  const done = MOCK_TASKS.filter((t) => t.status === "done");

  return (
    <DashboardShell title={ts("tasks")}>
      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-base font-semibold text-ink">{t("open")}</h2>
          <TaskList tasks={open} />
        </section>
        {done.length > 0 && (
          <section>
            <h2 className="mb-3 text-base font-semibold text-ink">{t("done")}</h2>
            <TaskList tasks={done} />
          </section>
        )}
      </div>
    </DashboardShell>
  );
}
