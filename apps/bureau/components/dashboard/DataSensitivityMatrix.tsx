import { TONE_TEXT, toneMap } from "@maxpromo/ui";
import type { DataSensitivity } from "@/types/ai-governance";
import type { SensitivityRecord } from "@/lib/mock/ai-governance";
import { getTranslations } from "next-intl/server";

const SENSITIVITY_STYLE_TONE = toneMap<DataSensitivity>({
  public: 'positive',
  internal: 'caution',
  confidential: 'critical',
  personal: 'critical',
})

export async function DataSensitivityMatrix({ rows }: { rows: SensitivityRecord[] }) {
  const t = await getTranslations("sensitivity");
  const d = await getTranslations("demo.sensitivity");

  return (
    <div className="overflow-x-auto rounded-lg border border-hairline bg-surface shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-hairline text-ink-muted">
          <tr>
            <th className="px-4 py-3 font-mono text-label-dense uppercase tracking-[0.12em]">{t("dataType")}</th>
            <th className="px-4 py-3 font-mono text-label-dense uppercase tracking-[0.12em]">{t("level")}</th>
            <th className="px-4 py-3 font-mono text-label-dense uppercase tracking-[0.12em]">{t("allowedTools")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {rows.map((r) => (
            <tr key={r.id} className="text-ink-secondary">
              <td className="px-4 py-3">{d(r.id + ".type")}</td>
              <td className={`px-4 py-3 font-mono text-label uppercase tracking-[0.12em] ${TONE_TEXT[SENSITIVITY_STYLE_TONE(r.sensitivity)]}`}>
                {t(r.sensitivity)}
              </td>
              <td className="px-4 py-3 text-ink-secondary">{d(r.id + ".tools")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
