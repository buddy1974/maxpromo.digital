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

// DB-backed (session workspace). force-dynamic so the build never queries Neon.
export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  // Auth-5: source businessId from session — no global demo lookup.
  const user = await getCurrentUser();
  if (!user?.businessId) redirect("/login");

  const data = await getDashboardData(user.businessId);

  if (data.empty) {
    return (
      <DashboardShell title="Übersicht">
        <EmptyState
          title="Demo-Workspace ist leer"
          hint="Führen Sie den Demo-Seed aus, um diesen Workspace zu befüllen: npm run db:seed:demo"
          glyph="◆"
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
    greeting: "Guten Morgen, Marcel.",
    headline: `${pending.length} Freigaben offen · ${urgent.length} wartende Kunden · ${data.audit.findings.length} Audit-Findings.`,
    items: [
      { id: "b1", label: "Freigaben", detail: `${pending.length} Agenten-Vorschläge warten auf Ihre Prüfung.` },
      { id: "b2", label: "Warteraum", detail: `${urgent.length} Kunden warten mit hoher Dringlichkeit.` },
      { id: "b3", label: "Audit", detail: data.audit.session ? `Geschäfts-Check läuft (Score ${data.audit.session.priorityScore}).` : "Kein aktives Audit." },
    ],
  };

  const metrics: DashboardMetric[] = [
    { id: "m1", label: "Offene Freigaben", value: String(pending.length) },
    { id: "m2", label: "Aktive Agenten", value: String(activeAgents.length) },
    { id: "m3", label: "Wartende Kunden", value: String(data.waiting.length) },
    { id: "m4", label: "Audit-Findings", value: String(data.audit.findings.length) },
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
    auditTrailPreview: [`Agent: ${p.agentKey}`, "Aktion vorbereitet (nicht ausgeführt)", "Wartet auf menschliche Freigabe"],
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
    <DashboardShell title="Übersicht">
      <div className="space-y-8">
        <BriefingPanel briefing={briefing} />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => (
            <MetricCard key={m.label} metric={m} />
          ))}
        </div>

        <Section title="Offene Freigaben" hint="Agenten-Vorschläge warten auf Ihre Prüfung.">
          {proposalsForCards.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {proposalsForCards.map((p) => (
                <ApprovalCard key={p.id} proposal={p} />
              ))}
            </div>
          ) : (
            <EmptyState title="Keine offenen Freigaben" glyph="✓" />
          )}
        </Section>

        <div className="grid gap-8 lg:grid-cols-2">
          <Section title="Aktive Agenten">
            <ul className="divide-y divide-hairline rounded-lg border border-hairline bg-surface shadow-sm">
              {activeAgents.map((a) => (
                <li key={a.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm text-ink">{a.name}</p>
                    <p className="text-xs text-ink-muted">{a.role}</p>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-secondary">{a.status}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Wartende Kunden">
            {urgent.length ? (
              <ul className="divide-y divide-hairline rounded-lg border border-hairline bg-surface shadow-sm">
                {urgent.map((w) => (
                  <li key={w.id} className="px-4 py-3">
                    <p className="text-sm text-ink">{w.customerName}</p>
                    <p className="text-xs text-ink-muted">{w.company ?? "—"} · wartet {w.waitingFor}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Niemand wartet dringend" glyph="◷" />
            )}
          </Section>
        </div>

        <Section title="Letzte Aktivität">
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
