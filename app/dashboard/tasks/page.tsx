import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TaskList } from "@/components/dashboard/TaskList";
import { MOCK_TASKS } from "@/lib/mock/tasks";

export default function TasksPage() {
  const open = MOCK_TASKS.filter((t) => t.status !== "done" && t.status !== "cancelled");
  const done = MOCK_TASKS.filter((t) => t.status === "done");

  return (
    <DashboardShell title="Aufgaben">
      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-900">Offen</h2>
          <TaskList tasks={open} />
        </section>
        {done.length > 0 && (
          <section>
            <h2 className="mb-3 text-base font-semibold text-zinc-900">Erledigt</h2>
            <TaskList tasks={done} />
          </section>
        )}
      </div>
    </DashboardShell>
  );
}
