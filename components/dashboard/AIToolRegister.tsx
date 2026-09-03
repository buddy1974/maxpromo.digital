import type { AIToolRegisterItem, AIToolStatus } from "@/types/ai-governance";

const STATUS_STYLE: Record<AIToolStatus, string> = {
  approved: "border-success/30 bg-success-soft text-success",
  under_review: "border-warning/30 bg-warning-soft text-warning",
  blocked: "border-danger/30 bg-danger-soft text-danger",
};

const STATUS_LABEL: Record<AIToolStatus, string> = {
  approved: "Freigegeben",
  under_review: "In Prüfung",
  blocked: "Gesperrt",
};

export function AIToolRegister({ tools }: { tools: AIToolRegisterItem[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-hairline bg-surface shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-hairline text-ink-muted">
          <tr>
            <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em]">Tool</th>
            <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em]">Kategorie</th>
            <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em]">Status</th>
            <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em]">Hinweis</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200">
          {tools.map((t) => (
            <tr key={t.id} className="text-ink-secondary">
              <td className="px-4 py-3 font-medium text-ink">{t.name}</td>
              <td className="px-4 py-3 text-ink-secondary">{t.category}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${STATUS_STYLE[t.status]}`}>
                  {STATUS_LABEL[t.status]}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-ink-muted">{t.usageNote}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
