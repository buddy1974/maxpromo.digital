import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

// Layout primitive: sidebar + topbar + scrollable content area.
// Used by app/dashboard/layout.tsx so every dashboard page shares the shell.
export function DashboardShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto bg-surface-subtle p-6">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
