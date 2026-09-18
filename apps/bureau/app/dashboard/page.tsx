import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BriefingPanel } from "@/components/dashboard/BriefingPanel";
import { ApprovalCard } from "@/components/dashboard/ApprovalCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { getDashboardData } from "@/lib/db/queries/dashboard";
import { getCurrentUser } from "@/lib/auth/session";
import type { AgentProposal } from "@/types/agent";
import type { ActivityLog } from "@/types/activity";
import type { DailyBriefing, DashboardMetric } from "@/types/dashboard";
import { getTranslations } from "next-intl/server";
import { partOfDay, displayName } from "@/lib/i18n/format";

// DB-backed (session workspace). force-dynamic so the build never queries Neon.
export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  // Auth-5: source businessId from session — no global demo lookup.
  const user = await getCurrentUser();
  if (!user?.businessId) redirect("/login");

  const data = await getDashboardData(user.businessId);
  const t = await getTranslations("dashboard");
  const tg = await getTranslations("greeting");
  const te = await getTranslations("empty");
  const ts = await getTranslations("sections");
  const tas = await getTranslations("agentStatus");

  if (data.empty) {
    return (
      <DashboardShell title={ts("overview")}>
        <EmptyState
          title={te("workspaceEmpty")}
          hint={te("workspaceEmptyHint")}
          icon="dashboard"
        />
      </DashboardShell>
    );
  }

  const pending = data.proposals.filter((p) => p.status === "pending");
  const activeAgents = data.agents.filter(
    (a) => a.status === "active" || a.status === "proposing",
  );
  const urgent = data.waiting.filter(
    (w) => w.urgency === "urgent" || w.urgency === "high",
  );

  const briefing: DailyBriefing = {
    date: new Date().toISOString().slice(0, 10),
    greeting: tg(partOfDay(), { name: displayName(user) }),
    headline: t("headline", { approvals: pending.length, waiting: urgent.length, findings: data.audit.findings.length }),
    items: [
      { id: "b1", label: t("bApprovalsLabel"), detail: t("bApprovalsDetail", { count: pending.length }) },
      { id: "b2", label: t("bWaitingLabel"), detail: t("bWaitingDetail", { count: urgent.length }) },
      { id: "b3", label: t("bAuditLabel"), detail: data.audit.session ? t("bAuditRunning", { score: data.audit.session.priorityScore }) : t("bAuditNone") },
    ],
  };

  const metrics: DashboardMetric[] = [
    { id: "m1", label: t("mApprovals"), value: String(pending.length) },
    { id: "m2", label: t("mAgents"), value: String(activeAgents.length) },
    { id: "m3", label: t("mWaiting"), value: String(data.waiting.length) },
    { id: "m4", label: t("mFindings"), value: String(data.audit.findings.length) },
  ];

  const proposalsForCards: AgentProposal[] = pending.slice(0, 4).map((p) => ({
    id: p.id,
    title: p.title,
    agentId: p.agentKey,
    agentName: p.agentKey,
    businessContext: p.businessContext ?? "",
    proposedAction: p.proposedAction,
    riskLevel: p.riskLevel,
    status: p.status,
    expectedOutcome: p.expectedOutcome ?? "",
    auditTrailPreview: [t("trailAgent", { agent: p.agentKey }), t("trailPrepared"), t("trailAwaiting")],
    createdAt: new Date(p.createdAt).toISOString(),
  }));

  const activity: ActivityLog[] = data.activity.map((a) => ({
    id: a.id,
    timestamp: new Date(a.createdAt).toISOString(),
    actor: a.actor as ActivityLog["actor"],
    actorName: a.actorName,
    action: a.action,
    target: a.target ?? undefined,
    detail: a.detail ?? undefined,
  }));

  return (
    <DashboardShell title={ts("overview")}>
      <div className="space-y-8">
        <BriefingPanel briefing={briefing} />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => (
            <MetricCard key={m.label} metric={m} />
          ))}
        </div>

        <Section title={t("openApprovals")} hint={t("openApprovalsHint")}>
          {proposalsForCards.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {proposalsForCards.map((p) => (
                <ApprovalCard key={p.id} proposal={p} />
              ))}
            </div>
          ) : (
            <EmptyState title={t("noApprovals")} icon="approvals" />
          )}
        </Section>

        <div className="grid gap-8 lg:grid-cols-2">
          <Section title={t("activeAgents")}>
            <ul className="divide-y divide-hairline rounded-lg border border-hairline bg-surface shadow-sm">
              {activeAgents.map((a) => (
                <li key={a.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm text-ink">{a.name}</p>
                    <p className="text-xs text-ink-muted">{a.role}</p>
                  </div>
                  <span className="font-mono text-label-dense uppercase tracking-[0.12em] text-ink-secondary">{tas(a.status)}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title={t("waitingCustomers")}>
            {urgent.length ? (
              <ul className="divide-y divide-hairline rounded-lg border border-hairline bg-surface shadow-sm">
                {urgent.map((w) => (
                  <li key={w.id} className="px-4 py-3">
                    <p className="text-sm text-ink">{w.customerName}</p>
                    <p className="text-xs text-ink-muted">{w.company ?? "—"} · {t("waitingFor", { duration: w.waitingFor ?? "—" })}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title={t("noneWaitingUrgently")} icon="waiting" />
            )}
          </Section>
        </div>

        <Section title={t("recentActivity")}>
          <div className="rounded-lg border border-hairline bg-surface px-4 shadow-sm">
            <ActivityFeed items={activity} />
          </div>
        </Section>
      </div>
    </DashboardShell>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {hint && <p className="text-xs text-ink-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}
