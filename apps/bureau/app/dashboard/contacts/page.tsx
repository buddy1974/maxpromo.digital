import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MOCK_CONTACTS } from "@/lib/mock/contacts";

export default function ContactsPage() {
  return (
    <DashboardShell title="Kontakte">
      <div className="overflow-x-auto rounded-lg border border-hairline bg-surface shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-hairline text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-mono text-label uppercase tracking-[0.12em]">Name</th>
              <th className="px-4 py-3 font-mono text-label uppercase tracking-[0.12em]">Firma</th>
              <th className="px-4 py-3 font-mono text-label uppercase tracking-[0.12em]">Status</th>
              <th className="px-4 py-3 font-mono text-label uppercase tracking-[0.12em]">Nächstes Follow-up</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {MOCK_CONTACTS.map((c) => (
              <tr key={c.id} className="text-ink-secondary">
                <td className="px-4 py-3">{c.name}</td>
                <td className="px-4 py-3 text-ink-secondary">{c.companyName ?? "—"}</td>
                <td className="px-4 py-3 text-ink-secondary">{c.status}</td>
                <td className="px-4 py-3 font-mono text-xs text-ink-muted">
                  {c.nextFollowUpAt?.slice(0, 10) ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
