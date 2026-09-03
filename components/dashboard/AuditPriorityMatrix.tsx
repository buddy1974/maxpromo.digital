import type { AuditFinding } from "@/types/audit";

// Compact priority × impact matrix summarising findings. Read-only overview.
const IMPACTS = ["time", "revenue", "visibility", "risk"] as const;
const PRIORITIES = ["critical", "high", "medium", "low"] as const;

const IMPACT_LABEL: Record<(typeof IMPACTS)[number], string> = {
  time: "Zeit",
  revenue: "Umsatz",
  visibility: "Übersicht",
  risk: "Risiko",
};

export function AuditPriorityMatrix({ findings }: { findings: AuditFinding[] }) {
  function count(p: string, i: string) {
    return findings.filter((f) => f.priority === p && f.impactArea === i).length;
  }
  return (
    <div className="overflow-hidden rounded-lg border border-hairline bg-surface shadow-sm">
      <table className="w-full text-center text-sm">
        <thead className="border-b border-hairline text-ink-muted">
          <tr>
            <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.12em]">
              Priorität \ Wirkung
            </th>
            {IMPACTS.map((i) => (
              <th key={i} className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em]">
                {IMPACT_LABEL[i]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200">
          {PRIORITIES.map((p) => (
            <tr key={p}>
              <td className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-ink-secondary">
                {p}
              </td>
              {IMPACTS.map((i) => {
                const n = count(p, i);
                return (
                  <td key={i} className={`px-3 py-2 ${n ? "text-ink-secondary" : "text-ink-muted"}`}>
                    {n || "·"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
