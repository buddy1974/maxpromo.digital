export type AIToolStatus = "approved" | "under_review" | "blocked";
export type GovernanceRiskLevel = "low" | "medium" | "high" | "critical";
export type DataSensitivity = "public" | "internal" | "confidential" | "personal";

export interface AIToolRegisterItem {
  id: string;
  name: string;
  category: string;
  status: AIToolStatus;
  /** Note on approved usage / restriction. */
  usageNote: string;
}

export interface AIGovernanceRisk {
  id: string;
  area: string;
  /** Assessment (not a live scan claim). */
  description: string;
  level: GovernanceRiskLevel;
  recommendedAction: string;
}

export interface PolicyChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface DataSensitivityRow {
  id: string;
  dataType: string;
  sensitivity: DataSensitivity;
  allowedTools: string;
}
