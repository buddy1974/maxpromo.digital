import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AuditFindingCard } from "@/components/dashboard/AuditFindingCard";
import { AuditPriorityMatrix } from "@/components/dashboard/AuditPriorityMatrix";
import { AgentRecommendationCard } from "@/components/dashboard/AgentRecommendationCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { getAuditOverview } from "@/lib/db/queries/audit";
import { getCurrentUser } from "@/lib/auth/session";
import { AGENT_RECOMMENDATIONS } from "@/lib/core/operating-model";
import type { AuditFinding, AuditPriority } from "@/types/audit";
import type { AgentRiskLevel } from "@/types/agent";
import type { OperatingStageKey } from "@/types/operating-model";

// Module 1 — AI Audit Console. DB-backed (session workspace).
export const dynamic = "force-dynamic";

export default async function AuditConsolePage() {
  // Auth-5: source businessId from session — no global demo lookup.
  const user = await getCurrentUser();
  if (!user?.businessId) redirect("/login");

  const { session, findings } = await getAuditOverview(user.businessId);

  if (!session) {
    return (
      <DashboardShell title="Audit Console">
        <EmptyState
          title="Kein Audit im Demo-Workspace"
          hint="Führen Sie den Demo-Seed aus: npm run db:seed:demo"
          icon="audit"
        />
      </DashboardShell>
    );
  }

  // Map DB rows -> AuditFinding. The table has no riskLevel column, so derive it
  // from priority (same scale) for the RiskBadge.
  const mapped: AuditFinding[] = findings.map((f) => ({
    id: f.id,
    category: f.category,
    title: f.title,
    pain: f.pain,
    impactArea: f.impactArea as AuditFinding["impactArea"],
    priority: f.priority as AuditPriority,
    status: f.status as AuditFinding["status"],
    recommendedStage: (f.recommendedStage ?? "audit") as OperatingStageKey,
    recommendedAgents: Array.isArray(f.recommendedAgents)
      ? (f.recommendedAgents as string[])
      : [],
    riskLevel: f.priority as AgentRiskLevel,
  }));

  const recommendation =
    AGENT_RECOMMENDATIONS.find((r) => r.agents.length >= 3) ?? AGENT_RECOMMENDATIONS[0];

  return (
    <DashboardShell title="Audit Console">
      <div className="space-y-8">
        <section className="rounded-lg border border-hairline bg-surface p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-secondary">
                Geschäfts-Check · {session.industry ?? "—"}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-ink">{session.businessName}</h2>
            </div>
            <div className="text-right">
              <p className="text-3xl font-semibold text-ink-secondary">{session.priorityScore}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">Prioritäts-Score</p>
            </div>
          </div>
        </section>

        {mapped.length ? (
          <>
            <section className="grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="mb-3 text-base font-semibold text-ink">Prioritäts-Matrix</h3>
                <AuditPriorityMatrix findings={mapped} />
              </div>
              <div>
                <h3 className="mb-3 text-base font-semibold text-ink">Empfohlenes Team</h3>
                <AgentRecommendationCard recommendation={recommendation} />
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-base font-semibold text-ink">Findings ({mapped.length})</h3>
              <div className="grid gap-4 lg:grid-cols-2">
                {mapped.map((f) => (
                  <AuditFindingCard key={f.id} finding={f} />
                ))}
              </div>
            </section>
          </>
        ) : (
          <EmptyState title="Keine Findings" icon="audit" />
        )}
      </div>
    </DashboardShell>
  );
}
