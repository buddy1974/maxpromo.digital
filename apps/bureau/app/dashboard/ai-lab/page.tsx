import { getTranslations } from "next-intl/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AILabClient } from "@/components/dashboard/AILabClient";

// Internal AI Lab — safe draft generation only. Not a public/marketing page.
export const dynamic = "force-dynamic";

// The title was the literal "AI Lab", which made this the one page in the
// product whose heading disagreed with the sidebar entry that opens it: the
// sidebar reads `sections.aiLab` from the catalogue and this read a string.
// The name is the same in both languages, and it is still named once.
export default async function AILabPage() {
  const ts = await getTranslations("sections");
  return (
    <DashboardShell title={ts("aiLab")}>
      <AILabClient />
    </DashboardShell>
  );
}
