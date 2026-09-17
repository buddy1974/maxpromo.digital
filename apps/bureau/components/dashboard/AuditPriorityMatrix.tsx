import type { AuditFinding } from "@/types/audit";
import { getTranslations } from "next-intl/server";

// Compact priority × impact matrix summarising findings. Read-only overview.
const IMPACTS = ["time", "revenue", "visibility", "risk"] as const;
const PRIORITIES = ["critical", "high", "medium", "low"] as const;

export async function AuditPriorityMatrix({ findings }: { findings: AuditFinding[] }) {
  const t = await getTranslations("impact");

  function count(p: string, i: string) {
    return findings.filter((f) => f.priority === p && f.impactArea === i).length;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-hairline bg-surface shadow-sm">
      <table className="w-full text-center text-sm">
        <thead className="border-b border-hairline text-ink-muted">
          <tr>
            <th className="px-3 py-2 text-left font-mono text-label-dense uppercase tracking-[0.12em]">
              Priorität \ Wirkung
            </th>
            {IMPACTS.map((i) => (
              <th key={i} className="px-3 py-2 font-mono text-label-dense uppercase tracking-[0.12em]">
                {t(i)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {PRIORITIES.map((p) => (
            <tr key={p}>
              <td className="px-3 py-2 text-left font-mono text-label uppercase tracking-[0.12em] text-ink-secondary">
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
