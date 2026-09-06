// The product backbone. The dashboard is the visible surface; THIS is the model
// the whole system is organised around:
// Audit → Diagnose → Design Agent Team → Manual Delivery → Systemize → Install → Maintain

export type OperatingStageKey =
  | "audit"
  | "diagnose"
  | "design"
  | "manual_delivery"
  | "systemize"
  | "install"
  | "maintain";

export interface OperatingStage {
  key: OperatingStageKey;
  order: number;
  name: string;
  /** What this stage does. */
  purpose: string;
  /** Agent roles (registry keys) that support this stage. */
  supportingAgents: string[];
  /** Business pain this stage addresses. */
  painAddressed: string;
  /** Concrete output the stage produces. */
  output: string;
  /** What handoff comes next. */
  nextHandoff: string;
}

/** The safe action lifecycle every agent action must follow. */
export type SafeActionLifecycleStep =
  | "observe"
  | "prepare"
  | "propose"
  | "human_review"
  | "execute"
  | "log";

export type AgentRole =
  | "chief-of-staff"
  | "lead-agent"
  | "research-agent"
  | "crm-agent"
  | "calendar-agent"
  | "operations-agent"
  | "content-agent"
  | "document-agent"
  | "follow-up-agent";

export interface AgentHierarchyNode {
  role: AgentRole;
  name: string;
  reportsTo: AgentRole | null;
  summary: string;
}

export interface AuditCategory {
  id: string;
  label: string;
  description: string;
}

export interface DiagnosisFinding {
  id: string;
  category: string;
  pain: string;
  impact: string;
  recommendedStage: OperatingStageKey;
}

export interface AgentRecommendation {
  id: string;
  /** e.g. "Chief of Staff + CRM Agent". */
  tier: string;
  forSituation: string;
  agents: string[];
}

export interface ManualDeliveryNote {
  id: string;
  clientName: string;
  observation: string;
  proposedWorkflow: string;
  status: "captured" | "proposed" | "approved";
}

export interface InstallationStage {
  id: string;
  label: string;
  description: string;
}

export interface MaintenanceAction {
  id: string;
  label: string;
  cadence: string;
  description: string;
}
