import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { RiskBadge } from "@/components/dashboard/RiskBadge";
import { ApprovalActions } from "@/components/dashboard/ApprovalActions";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { getProposals } from "@/lib/db/queries/approvals";
import { getCurrentUser } from "@/lib/auth/session";

// Module 3 — Approval Desk. DB-backed + interactive (Sprint 5).
// Approving records a decision + audit trail only — no real-world execution.
export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  // Auth-5: source businessId from session — no global demo lookup.
  const user = await getCurrentUser();
  if (!user?.businessId) redirect("/login");

  const rows = await getProposals(user.businessId);
  // Show pending first, then decided (so the queue reads naturally).
  const ordered = [...rows].sort((a, b) =>
    a.status === b.status ? 0 : a.status === "pending" ? -1 : 1,
  );

  return (
    <DashboardShell title="Approval Desk">
      <div className="space-y-6">
        <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-secondary">
            Supervised Mode
          </p>
          <p className="mt-2 text-sm text-ink-secondary">
            Eine Freigabe protokolliert nur die Entscheidung und den Audit-Trail.
            In dieser Vorschau wird keine externe Nachricht, E-Mail, Kalender-Aktion
            oder CRM-Aktualisierung ausgeführt.
          </p>
        </div>

        {ordered.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {ordered.map((p) => (
              <div key={p.id} className="rounded-lg border border-hairline bg-surface p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-ink">{p.title}</h3>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {p.agentKey} ·{" "}
                      {p.status === "pending" ? "Awaiting Review" : p.status}
                    </p>
                  </div>
                  <RiskBadge level={p.riskLevel} />
                </div>

                <dl className="mt-4 space-y-3 text-sm">
                  <Row label="Kontext" value={p.businessContext ?? "—"} />
                  <Row label="Vorgeschlagene Aktion" value={p.proposedAction} />
                  <Row label="Erwartetes Ergebnis" value={p.expectedOutcome ?? "—"} />
                </dl>

                <div className="mt-4 rounded-lg border border-hairline bg-surface-subtle p-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                    Audit-Trail
                  </p>
                  <ul className="mt-2 space-y-1 font-mono text-xs text-ink-secondary">
                    <li>Agent: {p.agentKey}</li>
                    <li>Aktion vorbereitet (nicht ausgeführt)</li>
                    <li>Wartet auf menschliche Freigabe</li>
                  </ul>
                </div>

                <ApprovalActions
                  proposalId={p.id}
                  initialStatus={
                    p.status === "approved" || p.status === "rejected"
                      ? p.status
                      : "pending"
                  }
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Keine Vorschläge"
            hint="Führen Sie den Demo-Seed aus: npm run db:seed:demo"
            icon="approvals"
          />
        )}
      </div>
    </DashboardShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">{label}</dt>
      <dd className="mt-0.5 text-ink-secondary">{value}</dd>
    </div>
  );
}
