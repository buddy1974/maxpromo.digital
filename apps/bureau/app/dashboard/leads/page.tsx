import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MOCK_CONTACTS } from "@/lib/mock/contacts";
import { getTranslations } from "next-intl/server";

// Leads view (skeleton): reuses contact mock data as inbound prospects.
export default async function LeadsPage() {
  const t = await getTranslations("leadsPage");
  const ts = await getTranslations("sections");
  const leads = MOCK_CONTACTS.filter((c) => c.status === "new" || c.status === "nurturing");

  return (
    <DashboardShell title={ts("leads")}>
      {leads.length ? (
        <ul className="divide-y divide-hairline rounded-lg border border-hairline bg-surface shadow-sm">
          {leads.map((c) => (
            <li key={c.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm text-ink">{c.name}</p>
                <p className="text-xs text-ink-muted">{c.companyName ?? "—"} · {c.role ?? ""}</p>
              </div>
              <span className="font-mono text-label uppercase tracking-[0.12em] text-ink-muted">
                {c.status}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={t("empty")} icon="leads" />
      )}
    </DashboardShell>
  );
}
