import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DocumentIntakeCard } from "@/components/dashboard/DocumentIntakeCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { getDocuments } from "@/lib/db/queries/documents";
import { getCurrentUser } from "@/lib/auth/session";
import type { DocumentIntakeItem } from "@/types/document-intake";

// Module 4 — Document Intake Desk. DB-backed. No OCR/upload pipeline; summaries
// and actions are prepared, not executed.
export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  // Auth-5: source businessId from session — no global demo lookup.
  const user = await getCurrentUser();
  if (!user?.businessId) redirect("/login");

  const rows = await getDocuments(user.businessId);

  const items: DocumentIntakeItem[] = rows.map((d) => ({
    id: d.id,
    title: d.title,
    type: d.type as DocumentIntakeItem["type"],
    source: d.source ?? "",
    summary: d.summary ?? "",
    status: d.status as DocumentIntakeItem["status"],
    riskLevel: d.riskLevel as DocumentIntakeItem["riskLevel"],
    assignedAgent: d.assignedAgent ?? "",
    suggestedResponse: d.suggestedResponse ?? undefined,
    approvalStatus: "pending",
    requiredActions: d.requiredActions.map((a) => ({
      id: a.id,
      label: a.label,
      deadline: a.deadline ? new Date(a.deadline).toISOString().slice(0, 10) : undefined,
    })),
  }));

  const actionable = items.filter((d) => d.status === "action_required" || d.status === "new");
  const rest = items.filter((d) => !(d.status === "action_required" || d.status === "new"));

  if (!items.length) {
    return (
      <DashboardShell title="Document Intake Desk">
        <EmptyState
          title="Keine Dokumente im Demo-Workspace"
          hint="Führen Sie den Demo-Seed aus: npm run db:seed:demo"
          glyph="▢"
        />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Document Intake Desk">
      <div className="space-y-8">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
            Aus Dokument-Chaos wird strukturierte Aktion
          </p>
          <p className="mt-2 text-sm text-zinc-700">
            Zusammengefasst, mit Frist und nächster Aktion. Vorbereitet, nicht ausgeführt.
          </p>
        </div>

        {actionable.length > 0 && (
          <section>
            <h3 className="mb-3 text-base font-semibold text-zinc-900">Aktion erforderlich</h3>
            <div className="grid gap-4 lg:grid-cols-2">
              {actionable.map((d) => (
                <DocumentIntakeCard key={d.id} item={d} />
              ))}
            </div>
          </section>
        )}

        {rest.length > 0 && (
          <section>
            <h3 className="mb-3 text-base font-semibold text-zinc-900">Erledigt / geprüft</h3>
            <div className="grid gap-4 lg:grid-cols-2">
              {rest.map((d) => (
                <DocumentIntakeCard key={d.id} item={d} />
              ))}
            </div>
          </section>
        )}
      </div>
    </DashboardShell>
  );
}
