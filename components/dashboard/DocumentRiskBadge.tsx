import type { DocumentRiskLevel } from "@/types/document-intake";

const STYLES: Record<DocumentRiskLevel, string> = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  high: "border-red-200 bg-red-50 text-red-700",
};

const LABELS: Record<DocumentRiskLevel, string> = {
  low: "Niedrig",
  medium: "Mittel",
  high: "Hoch",
};

export function DocumentRiskBadge({ level }: { level: DocumentRiskLevel }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${STYLES[level]}`}
    >
      Risiko {LABELS[level]}
    </span>
  );
}
