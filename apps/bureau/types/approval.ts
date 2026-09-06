import type { AgentRiskLevel, ApprovalStatus } from "./agent";

// Approval Desk types — the trust & safety layer. Extends the proposal concept
// from types/agent.ts with a reviewable timeline + risk summary.

export interface ApprovalTimelineEvent {
  id: string;
  /** ISO timestamp. */
  at: string;
  step: "observed" | "prepared" | "proposed" | "reviewed" | "executed" | "logged";
  label: string;
}

export interface ApprovalRisk {
  level: AgentRiskLevel;
  /** What could go wrong if approved blindly. */
  concern: string;
  mitigation: string;
}

export interface ApprovalDeskItem {
  id: string;
  proposalTitle: string;
  agentName: string;
  businessContext: string;
  proposedAction: string;
  expectedResult: string;
  status: ApprovalStatus;
  risk: ApprovalRisk;
  timeline: ApprovalTimelineEvent[];
  createdAt: string;
}

// ── Sprint 5: supervised approval workflow ──────────────────────────────────
// A human decision on a proposal. `mark_reviewed` records that a human looked at
// it WITHOUT approving/rejecting (status stays pending — there is no "reviewed"
// status in the approval_status enum, and we deliberately avoid a migration).
export type ApprovalAction = "approve" | "reject" | "mark_reviewed";

// Input for writing one approval_event row (the audit trail).
export interface ApprovalEventInput {
  businessId: string;
  proposalId: string;
  /** Lifecycle step; human decisions are recorded as "reviewed". */
  step: ApprovalTimelineEvent["step"];
  actor: "user" | "agent" | "system";
  note?: string;
}

// Result returned by the PATCH endpoint after a successful transition.
export interface ApprovalTransitionResult {
  proposalId: string;
  /** The resulting status (unchanged for mark_reviewed). */
  status: ApprovalStatus;
  action: ApprovalAction;
  /** ISO timestamp of the decision. */
  decidedAt: string;
}
