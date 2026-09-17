import { TONE_BADGE, toneMap } from "@maxpromo/ui";
import type { AIToolStatus } from "@/types/ai-governance";
import type { ToolRecord } from "@/lib/mock/ai-governance";
import { getTranslations } from "next-intl/server";

const STATUS_STYLE_TONE = toneMap<AIToolStatus>({
  approved: 'positive',
  under_review: 'caution',
  blocked: 'critical',
})

export async function AIToolRegister({ tools }: { tools: ToolRecord[] }) {
  const t = await getTranslations("toolRegister");
  const d = await getTranslations("demo.tools");

  return (
    <div className="overflow-x-auto rounded-lg border border-hairline bg-surface shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-hairline text-ink-muted">
          <tr>
            <th className="px-4 py-3 font-mono text-label-dense uppercase tracking-[0.12em]">{t("tool")}</th>
            <th className="px-4 py-3 font-mono text-label-dense uppercase tracking-[0.12em]">{t("category")}</th>
            <th className="px-4 py-3 font-mono text-label-dense uppercase tracking-[0.12em]">{t("status")}</th>
            <th className="px-4 py-3 font-mono text-label-dense uppercase tracking-[0.12em]">{t("note")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {tools.map((tool) => (
            <tr key={tool.id} className="text-ink-secondary">
              <td className="px-4 py-3 font-medium text-ink">{tool.name || d(tool.id + ".name")}</td>
              <td className="px-4 py-3 text-ink-secondary">{d(tool.id + ".category")}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full border px-2.5 py-0.5 font-mono text-label-dense uppercase tracking-[0.12em] ${TONE_BADGE[STATUS_STYLE_TONE(tool.status)]}`}>
                  {t(tool.status)}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-ink-muted">{d(tool.id + ".note")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
