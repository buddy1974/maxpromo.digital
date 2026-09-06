// Shared agent types. The bureau is SUPERVISED: agents observe, prepare and
// propose — they never silently execute. `requiresApproval` + `blockedActions`
// encode that contract at the type level.

export type AgentStatus =
  | "active"
  | "idle"
  | "paused"
  | "proposing"
  | "error"
  | "offline";

export type AgentRiskLevel = "low" | "medium" | "high" | "critical";

export type ApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "executed"
  | "expired";

export interface AgentCapability {
  id: string;
  label: string;
  description: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  status: AgentStatus;
  riskLevel: AgentRiskLevel;
  /** When true, any outward action must pass the approval queue first. */
  requiresApproval: boolean;
  capabilities: AgentCapability[];
  /** Actions the agent may PREPARE/PROPOSE. */
  allowedActions: string[];
  /** Actions the agent must never take autonomously. */
  blockedActions: string[];
  connectedSystems: string[];
  /** Operating-model stages this agent supports (OperatingStageKey values). */
  supportedOperatingStages: string[];
  /** Audit pains this agent helps resolve. */
  auditPainsSolved: string[];
  /** Playbook ids this agent participates in. */
  playbooks: string[];
  /** Business outcomes the agent drives (outcomes, not features). */
  businessOutcomes: string[];
  /** ISO timestamp of the agent's last observed activity. */
  lastActivity: string;
  nextRecommendedAction: string;
}

export interface AgentProposal {
  id: string;
  title: string;
  agentId: string;
  agentName: string;
  businessContext: string;
  proposedAction: string;
  riskLevel: AgentRiskLevel;
  status: ApprovalStatus;
  expectedOutcome: string;
  /** Human-readable preview of what would be written to the audit log. */
  auditTrailPreview: string[];
  createdAt: string;
}
