import type { AIToolRegisterItem, AIToolStatus } from "@/types/ai-governance";

const STATUS_STYLE: Record<AIToolStatus, string> = {
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  under_review: "border-amber-200 bg-amber-50 text-amber-700",
  blocked: "border-red-200 bg-red-50 text-red-700",
};

const STATUS_LABEL: Record<AIToolStatus, string> = {
  approved: "Freigegeben",
  under_review: "In Prüfung",
  blocked: "Gesperrt",
};

export function AIToolRegister({ tools }: { tools: AIToolRegisterItem[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em]">Tool</th>
            <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em]">Kategorie</th>
            <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em]">Status</th>
            <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em]">Hinweis</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200">
          {tools.map((t) => (
            <tr key={t.id} className="text-zinc-700">
              <td className="px-4 py-3 font-medium text-zinc-900">{t.name}</td>
              <td className="px-4 py-3 text-zinc-600">{t.category}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${STATUS_STYLE[t.status]}`}>
                  {STATUS_LABEL[t.status]}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-zinc-500">{t.usageNote}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
