// AI provider layer types (Sprint 6A). Generation is DRAFT-ONLY: the AI prepares
// proposals/recommendations for human review. It never executes anything.

export type AIProvider = "openai" | "anthropic";

export type AIGenerationTask =
  | "follow_up_draft"
  | "audit_summary"
  | "document_summary"
  | "waiting_room_response"
  | "governance_recommendation"
  | "proposal_draft";

export type AIRiskLevel = "low" | "medium" | "high";

export type AIGenerationStatus = "ok" | "not_configured" | "error";

export interface AITaskContext {
  businessName?: string;
  source?: string;
  /** The primary text the model works from. Required. */
  input: string;
  /** Free-text hint about sensitivity (tax/legal/medical/HR/finance/customer…). */
  riskContext?: string;
  relatedEntityId?: string;
}

export interface AIGenerationRequest {
  task: AIGenerationTask;
  context: AITaskContext;
}

// The structured draft the model returns. Always a proposal — never executed.
export interface AIGeneratedProposal {
  title: string;
  summary: string;
  draft: string;
  riskLevel: AIRiskLevel;
  recommendedNextAction: string;
  requiresApproval: true;
  safetyNote: string;
}

export type AIGenerationResult =
  | { ok: true; data: AIGeneratedProposal }
  | { ok: false; error: string };
