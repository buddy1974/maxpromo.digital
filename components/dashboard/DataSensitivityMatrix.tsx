import type { DataSensitivityRow, DataSensitivity } from "@/types/ai-governance";

const SENSITIVITY_STYLE: Record<DataSensitivity, string> = {
  public: "text-success",
  internal: "text-warning",
  confidential: "text-danger",
  personal: "text-danger",
};

const SENSITIVITY_LABEL: Record<DataSensitivity, string> = {
  public: "Öffentlich",
  internal: "Intern",
  confidential: "Vertraulich",
  personal: "Personenbezogen",
};

export function DataSensitivityMatrix({ rows }: { rows: DataSensitivityRow[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-hairline bg-surface shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-hairline text-ink-muted">
          <tr>
            <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em]">Datentyp</th>
            <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em]">Sensibilität</th>
            <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em]">Erlaubte Tools</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200">
          {rows.map((r) => (
            <tr key={r.id} className="text-ink-secondary">
              <td className="px-4 py-3">{r.dataType}</td>
              <td className={`px-4 py-3 font-mono text-[11px] uppercase tracking-[0.12em] ${SENSITIVITY_STYLE[r.sensitivity]}`}>
                {SENSITIVITY_LABEL[r.sensitivity]}
              </td>
              <td className="px-4 py-3 text-ink-secondary">{r.allowedTools}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
