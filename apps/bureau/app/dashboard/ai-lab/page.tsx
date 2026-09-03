import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AILabClient } from "@/components/dashboard/AILabClient";

// Internal AI Lab — safe draft generation only. Not a public/marketing page.
export const dynamic = "force-dynamic";

export default function AILabPage() {
  return (
    <DashboardShell title="AI Lab">
      <AILabClient />
    </DashboardShell>
  );
}
