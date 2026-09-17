import { getTranslations } from "next-intl/server";
import type { DocumentIntakeItem } from "@/types/document-intake";
import { DocumentRiskBadge } from "./DocumentRiskBadge";
import { RequiredActionPanel } from "./RequiredActionPanel";
import { ResponseSuggestionPanel } from "./ResponseSuggestionPanel";

/**
 * What kind of document arrived, as a message key rather than a word.
 *
 * Eight German nouns in a Record keyed by enum — "Rechnung", "Finanzamt",
 * "Versicherung" — printed at the top of every card on the document desk. The
 * same shape as the task-status and channel maps, missed for the same reason:
 * it reads as configuration.
 */
const TYPE_KEY: Record<DocumentIntakeItem["type"], string> = {
  invoice: "typeInvoice",
  contract: "typeContract",
  tax_letter: "typeTaxLetter",
  insurance: "typeInsurance",
  supplier: "typeSupplier",
  hr: "typeHr",
  customer: "typeCustomer",
  other: "typeOther",
};

export async function DocumentIntakeCard({ item }: { item: DocumentIntakeItem }) {
  const t = await getTranslations("documents");
  const w = await getTranslations("waitingRoom");
  const s = await getTranslations("status");

  return (
    <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-label uppercase tracking-[0.14em] text-ink-muted">
            {t(TYPE_KEY[item.type])} · {item.source}
          </p>
          <h3 className="mt-1 font-semibold text-ink">{item.title}</h3>
        </div>
        <DocumentRiskBadge level={item.riskLevel} />
      </div>
      <p className="mt-2 text-sm text-ink-secondary">{item.summary}</p>

      <div className="mt-3">
        <p className="font-mono text-label-dense uppercase tracking-[0.14em] text-ink-muted">
          {t("actionRequired")}
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

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
        <span>{item.assignedAgent}</span>
        <span className="rounded-full border border-hairline bg-surface-sunken px-2.5 py-0.5 font-mono text-label-dense uppercase tracking-[0.12em] text-ink-secondary">
          {item.approvalStatus === "pending" ? w("approvalRequired") : s(item.approvalStatus)}
        </span>
      </div>
    </div>
  );
}
