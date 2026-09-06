import type { ApprovalStatus } from "./agent";

export type DocumentType =
  | "invoice"
  | "contract"
  | "tax_letter"
  | "insurance"
  | "supplier"
  | "hr"
  | "customer"
  | "other";

export type DocumentStatus = "new" | "reviewed" | "action_required" | "filed";
export type DocumentRiskLevel = "low" | "medium" | "high";

export interface DocumentRequiredAction {
  id: string;
  label: string;
  /** ISO date string, optional. */
  deadline?: string;
}

export interface DocumentIntakeItem {
  id: string;
  title: string;
  type: DocumentType;
  source: string;
  /** Prepared summary (no OCR/upload pipeline yet). */
  summary: string;
  status: DocumentStatus;
  riskLevel: DocumentRiskLevel;
  requiredActions: DocumentRequiredAction[];
  assignedAgent: string;
  /** Prepared, not sent. */
  suggestedResponse?: string;
  approvalStatus: ApprovalStatus;
}
