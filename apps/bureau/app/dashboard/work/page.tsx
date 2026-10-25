import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { WorkList } from "@/components/dashboard/WorkList";
import { getCurrentUser } from "@/lib/auth/session";
import { recentWork } from "@/lib/db/queries/work";
import { failStale } from "@/lib/agents/research";

// Delegated work (ADR-0030), newest first. Session business only.
export const dynamic = "force-dynamic";

export default async function WorkPage() {
  const user = await getCurrentUser();
  if (!user?.businessId) redirect("/login");
  const t = await getTranslations("workPage");
  const ts = await getTranslations("sections");
  // An operator looking is a good moment to fail work that died while running.
  await failStale(user.businessId).catch(() => 0);
  const items = await recentWork(user.businessId, 50);
  return (
    <DashboardShell title={ts("work")}>
      <div className="space-y-6">
        <p className="text-sm text-ink-secondary">{t("lede")}</p>
        <WorkList items={items} />
      </div>
    </DashboardShell>
  );
}
