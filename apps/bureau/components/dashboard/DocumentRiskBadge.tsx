import type { DocumentRiskLevel } from "@/types/document-intake";

const STYLES: Record<DocumentRiskLevel, string> = {
  low: "border-success/30 bg-success-soft text-success",
  medium: "border-warning/30 bg-warning-soft text-warning",
  high: "border-danger/30 bg-danger-soft text-danger",
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
