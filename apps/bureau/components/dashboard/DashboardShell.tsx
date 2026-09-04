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
      {/* The sidebar is twenty-two links. Without this, an operator using the
          keyboard tabs all of them before reaching the page they opened. */}
      <a href="#content" className="skip-link">Zum Inhalt springen</a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} />
        <main id="content" className="flex-1 overflow-y-auto bg-surface-subtle p-6">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
