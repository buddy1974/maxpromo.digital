import { TONE_TEXT, toneMap } from "@maxpromo/ui";
import type { DataSensitivityRow, DataSensitivity } from "@/types/ai-governance";

const SENSITIVITY_STYLE_TONE = toneMap<DataSensitivity>({
  public: 'positive',
  internal: 'caution',
  confidential: 'critical',
  personal: 'critical',
})

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
            <th className="px-4 py-3 font-mono text-label-dense uppercase tracking-[0.12em]">Datentyp</th>
            <th className="px-4 py-3 font-mono text-label-dense uppercase tracking-[0.12em]">Sensibilität</th>
            <th className="px-4 py-3 font-mono text-label-dense uppercase tracking-[0.12em]">Erlaubte Tools</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {rows.map((r) => (
            <tr key={r.id} className="text-ink-secondary">
              <td className="px-4 py-3">{r.dataType}</td>
              <td className={`px-4 py-3 font-mono text-label uppercase tracking-[0.12em] ${TONE_TEXT[SENSITIVITY_STYLE_TONE(r.sensitivity)]}`}>
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
