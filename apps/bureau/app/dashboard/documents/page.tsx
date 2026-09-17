import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DocumentIntakeCard } from "@/components/dashboard/DocumentIntakeCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { getDocuments } from "@/lib/db/queries/documents";
import { getCurrentUser } from "@/lib/auth/session";
import type { DocumentIntakeItem } from "@/types/document-intake";
import { getTranslations } from "next-intl/server";

// Module 4 — Document Intake Desk. DB-backed. No OCR/upload pipeline; summaries
// and actions are prepared, not executed.
export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  // Auth-5: source businessId from session — no global demo lookup.
  const user = await getCurrentUser();
  if (!user?.businessId) redirect("/login");

  const t = await getTranslations("documents");
  const ts = await getTranslations("sections");
  const te = await getTranslations("empty");

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
      <DashboardShell title={ts("documents")}>
        <EmptyState
          title={te("noDocuments")}
          hint={te("seedHint")}
          icon="documents"
        />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title={ts("documents")}>
      <div className="space-y-8">
        <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
          <p className="font-mono text-label uppercase tracking-[0.16em] text-ink-secondary">
            {t("eyebrow")}
          </p>
          <p className="mt-2 text-sm text-ink-secondary">
            {t("lede")}
          </p>
        </div>

        {actionable.length > 0 && (
          <section>
            <h3 className="mb-3 text-base font-semibold text-ink">{t("actionRequired")}</h3>
            <div className="grid gap-4 lg:grid-cols-2">
              {actionable.map((d) => (
                <DocumentIntakeCard key={d.id} item={d} />
              ))}
            </div>
          </section>
        )}

        {rest.length > 0 && (
          <section>
            <h3 className="mb-3 text-base font-semibold text-ink">{t("doneReviewed")}</h3>
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
