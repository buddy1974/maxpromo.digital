import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MOCK_CONTACTS } from "@/lib/mock/contacts";

export default function ContactsPage() {
  return (
    <DashboardShell title="Kontakte">
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.12em]">Name</th>
              <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.12em]">Firma</th>
              <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.12em]">Status</th>
              <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.12em]">Nächstes Follow-up</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {MOCK_CONTACTS.map((c) => (
              <tr key={c.id} className="text-zinc-700">
                <td className="px-4 py-3">{c.name}</td>
                <td className="px-4 py-3 text-zinc-600">{c.companyName ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-600">{c.status}</td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-500">
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
