import type { DocumentIntakeItem } from "@/types/document-intake";
import { DocumentRiskBadge } from "./DocumentRiskBadge";
import { RequiredActionPanel } from "./RequiredActionPanel";
import { ResponseSuggestionPanel } from "./ResponseSuggestionPanel";

const TYPE_LABEL: Record<DocumentIntakeItem["type"], string> = {
  invoice: "Rechnung",
  contract: "Vertrag",
  tax_letter: "Finanzamt",
  insurance: "Versicherung",
  supplier: "Lieferant",
  hr: "Personal",
  customer: "Kunde",
  other: "Sonstiges",
};

export function DocumentIntakeCard({ item }: { item: DocumentIntakeItem }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-label uppercase tracking-[0.14em] text-ink-muted">
            {TYPE_LABEL[item.type]} · {item.source}
          </p>
          <h3 className="mt-1 font-semibold text-ink">{item.title}</h3>
        </div>
        <DocumentRiskBadge level={item.riskLevel} />
      </div>
      <p className="mt-2 text-sm text-ink-secondary">{item.summary}</p>

      <div className="mt-3">
        <p className="font-mono text-label-dense uppercase tracking-[0.14em] text-ink-muted">
          Erforderliche Aktion
        </p>
        <div className="mt-1">
          <RequiredActionPanel actions={item.requiredActions} />
        </div>
      </div>

      {item.suggestedResponse && (
        <div className="mt-3">
          <ResponseSuggestionPanel text={item.suggestedResponse} />
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-ink-muted">
        <span>{item.assignedAgent}</span>
        <span className="rounded-full border border-hairline bg-surface-sunken px-2.5 py-0.5 font-mono text-label-dense uppercase tracking-[0.12em] text-ink-secondary">
          {item.approvalStatus === "pending" ? "Approval Required" : item.approvalStatus}
        </span>
      </div>
    </div>
  );
}
