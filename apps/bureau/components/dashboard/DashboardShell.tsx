import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { getTranslations } from "next-intl/server";

// Layout primitive: sidebar + topbar + scrollable content area.
// Used by app/dashboard/layout.tsx so every dashboard page shares the shell.
export async function DashboardShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const t = await getTranslations("common");

  return (
    <div className="flex min-h-screen bg-surface">
      {/* The sidebar is twenty-two links. Without this, an operator using the
          keyboard tabs all of them before reaching the page they opened. */}
      <a href="#content" className="skip-link">{t("skipToContent")}</a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} />
        {/* 16px of gutter on a phone, 24px from `sm` up. At 320px a 24px
            gutter on both sides leaves 272px for cards that carry a customer
            name, a channel and a waiting time on one row. The bottom padding
            clears the home indicator so the last card in a queue is fully
            readable rather than half under the gesture bar. */}
        <main
          id="content"
          className="flex-1 overflow-y-auto bg-surface-subtle p-4 sm:p-6"
          style={{ paddingBottom: "calc(var(--space-6) + env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
