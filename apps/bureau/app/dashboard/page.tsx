import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { LivePanel } from "@/components/dashboard/LivePanel";
import { WorkList } from "@/components/dashboard/WorkList";
import { getCurrentUser } from "@/lib/auth/session";
import { recentWork, workHealth } from "@/lib/db/queries/work";
import { failStale, redeliverPending } from "@/lib/agents/research";
import { osConfigured } from "@/lib/os/client";
import { workDoorSecret } from "@maxpromo/config/agent-contract";

// The Agent Control Plane, truthfully (ADR-0030): the agents that run, the work
// Maxpromo OS delegated, the connections it depends on and what failed. No
// sample data. Business records and approvals live in Maxpromo OS.
export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const user = await getCurrentUser();
  if (!user?.businessId) redirect("/login");
  const businessId = user.businessId;
  const t = await getTranslations("dashboard");
  const ts = await getTranslations("sections");

  // An operator looking is a good moment to settle what died and to retry hand-backs.
  await failStale(businessId).catch(() => 0);
  await redeliverPending(3).catch(() => 0);
  const [items, health] = await Promise.all([
    recentWork(businessId, 8).catch(() => []),
    workHealth(businessId).catch(() => ({ failed7d: 0, undelivered: 0, open: 0 })),
  ]);
  const doorReady = Boolean(workDoorSecret(process.env));

  return (
    <DashboardShell title={ts("overview")}>
      <div className="space-y-8">
        <LivePanel businessId={businessId} />

        <section aria-labelledby="work-title">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="work-title" className="text-base font-semibold text-ink">{t("workTitle")}</h2>
              <p className="text-xs text-ink-muted">{t("workHint")}</p>
            </div>
            <Link href="/dashboard/work" className="btn-secondary btn-sm">{t("workAll")}</Link>
          </div>
          <WorkList items={items} />
          {health.undelivered > 0 && <p className="mt-2 text-xs text-ink-secondary">{t("undelivered", { count: health.undelivered })}</p>}
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-lg border border-hairline bg-surface p-5 shadow-sm" aria-labelledby="conn-title">
            <h2 id="conn-title" className="font-mono text-label uppercase tracking-[0.16em] text-ink-secondary">{t("healthTitle")}</h2>
            <dl className="mt-3 grid gap-2 text-sm">
              <div className="flex flex-wrap justify-between gap-2"><dt className="text-ink-secondary">{t("healthOs")}</dt><dd className="text-ink">{osConfigured() ? t("connected") : t("notConnected")}</dd></div>
              <div className="flex flex-wrap justify-between gap-2"><dt className="text-ink-secondary">{t("healthDoor")}</dt><dd className="text-ink">{doorReady ? t("connected") : t("notConnected")}</dd></div>
            </dl>
          </section>
          <section className="rounded-lg border border-hairline bg-surface p-5 shadow-sm" aria-labelledby="fail-title">
            <h2 id="fail-title" className="font-mono text-label uppercase tracking-[0.16em] text-ink-secondary">{t("failuresTitle")}</h2>
            <p className="mt-3 text-2xl font-semibold text-ink">{health.failed7d}</p>
            {health.failed7d === 0 && <p className="text-xs text-ink-muted">{t("failuresNone")}</p>}
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
