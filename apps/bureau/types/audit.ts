import type { AgentRiskLevel } from "./agent";
import type { OperatingStageKey } from "./operating-model";

export type AuditStatus = "open" | "in_review" | "diagnosed" | "addressed";
export type AuditPriority = "low" | "medium" | "high" | "critical";

export interface AuditFinding {
  id: string;
  category: string;
  title: string;
  /** The operational pain in business terms. */
  pain: string;
  /** Where it hurts: time, revenue, visibility… */
  impactArea: "time" | "revenue" | "visibility" | "risk";
  priority: AuditPriority;
  status: AuditStatus;
  /** Operating stage that should pick this up. */
  recommendedStage: OperatingStageKey;
  /** Registry keys of agents recommended to address it. */
  recommendedAgents: string[];
  riskLevel: AgentRiskLevel;
}

export interface AuditSession {
  id: string;
  businessName: string;
  industry?: string;
  status: AuditStatus;
  /** 0–100 readiness/priority score. */
  priorityScore: number;
  findings: AuditFinding[];
  createdAt: string;
}
