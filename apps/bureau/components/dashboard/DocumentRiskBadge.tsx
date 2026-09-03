import { TONE_BADGE, toneMap } from "@maxpromo/ui";
import type { DocumentRiskLevel } from "@/types/document-intake";

const RISK_TONE = toneMap<DocumentRiskLevel>({
  low: 'positive',
  medium: 'caution',
  high: 'critical',
})

const LABELS: Record<DocumentRiskLevel, string> = {
  low: "Niedrig",
  medium: "Mittel",
  high: "Hoch",
};

export function DocumentRiskBadge({ level }: { level: DocumentRiskLevel }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${TONE_BADGE[RISK_TONE(level)]}`}
    >
      Risiko {LABELS[level]}
    </span>
  );
}
