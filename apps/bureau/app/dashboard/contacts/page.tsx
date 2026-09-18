import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MOCK_CONTACTS } from "@/lib/mock/contacts";
import { getTranslations } from "next-intl/server";
import { formatDate } from "@/lib/i18n/format";
import { resolveLocale } from "@/lib/i18n/locale";

export default async function ContactsPage() {
  const t = await getTranslations("contactsPage");
  const ts = await getTranslations("sections");
  const s = await getTranslations("status");
  const locale = await resolveLocale();
  return (
    <DashboardShell title={ts("contacts")}>
      <div className="overflow-x-auto rounded-lg border border-hairline bg-surface shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-hairline text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-mono text-label uppercase tracking-[0.12em]">{t("name")}</th>
              <th className="px-4 py-3 font-mono text-label uppercase tracking-[0.12em]">{t("company")}</th>
              <th className="px-4 py-3 font-mono text-label uppercase tracking-[0.12em]">{t("status")}</th>
              <th className="px-4 py-3 font-mono text-label uppercase tracking-[0.12em]">{t("nextFollowUp")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {MOCK_CONTACTS.map((c) => (
              <tr key={c.id} className="text-ink-secondary">
                <td className="px-4 py-3">{c.name}</td>
                <td className="px-4 py-3 text-ink-secondary">{c.companyName ?? "—"}</td>
                <td className="px-4 py-3 text-ink-secondary">{s(c.status)}</td>
                <td className="px-4 py-3 font-mono text-xs text-ink-muted">
                  {c.nextFollowUpAt ? formatDate(c.nextFollowUpAt, locale) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
