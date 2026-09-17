import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BriefingPanel } from "@/components/dashboard/BriefingPanel";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { MOCK_DASHBOARD_SUMMARY, BRIEFING_ITEM_IDS } from "@/lib/mock/dashboard";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/session";
import { partOfDay, displayName } from "@/lib/i18n/format";
import type { DailyBriefing } from "@/types/dashboard";

/**
 * The demo briefing.
 *
 * The greeting is built here rather than stored: the part of the day comes
 * from Essen's clock and the name from the session, so the message catalogue
 * holds "Guten Morgen, {name}." and never a person.
 */
export default async function BriefingPage() {
  const t = await getTranslations("briefingPage");
  const ts = await getTranslations("sections");
  const d = await getTranslations("demo.briefing");
  const g = await getTranslations("greeting");
  const user = await getCurrentUser();

  const briefing: DailyBriefing = {
    date: new Date().toISOString().slice(0, 10),
    greeting: g(partOfDay(), { name: displayName(user) }),
    headline: d("headline"),
    items: BRIEFING_ITEM_IDS.map((id) => ({
      id,
      label: d(`${id}Label`),
      detail: d(`${id}Detail`),
    })),
  };

  return (
    <DashboardShell title={ts("briefing")}>
      <div className="space-y-8">
        <BriefingPanel briefing={briefing} />
        <section>
          <h2 className="mb-3 text-base font-semibold text-ink">
            {t("howItWasMade")}
          </h2>
          <div className="rounded-lg border border-hairline bg-surface px-4 shadow-sm">
            <ActivityFeed items={MOCK_DASHBOARD_SUMMARY.recentActivity} />
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
