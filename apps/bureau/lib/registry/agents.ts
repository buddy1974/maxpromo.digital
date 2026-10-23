import type { AgentStatus, AgentRiskLevel } from "@/types/agent";
import type { OperatingStageKey } from "@/types/operating-model";

/**
 * The Agent Bureau registry — the single source of truth for which agents
 * exist and what they are permitted to do.
 *
 * SUPERVISION CONTRACT: every agent prepares and proposes; outward actions are
 * listed in `blocked` until a human approves them via the approval queue. No
 * entry here should imply autonomous execution of risky real-world actions.
 *
 * STRUCTURE HERE, WORDS IN THE CATALOGUE
 * Each agent's role, description, capabilities, permitted and blocked actions
 * and next recommended action are sentences an operator reads, so they live in
 * `agentRegistry.<id>` in messages/{de,en}.json. What stays in this file is
 * what does not change with language and what the supervision contract depends
 * on: the ids, the status, the risk level, whether approval is required, how
 * many capabilities and actions there are, and which systems and stages the
 * agent touches.
 *
 * The counts matter. `capabilityCount`, `allowedCount` and `blockedCount` are
 * asserted against the catalogue by `npm run check:i18n`, so a translation
 * that quietly drops an entry from `blockedActions` — which would misstate
 * what an agent may do without asking — fails the build rather than the
 * review.
 */
export interface AgentRecord {
  id: string;
  /** Proper noun. The same in both languages by design. */
  name: string;
  status: AgentStatus;
  riskLevel: AgentRiskLevel;
  requiresApproval: boolean;
  capabilityIds: string[];
  allowedCount: number;
  blockedCount: number;
  /**
   * The sections of this product the agent touches, named by their message
   * key so the card says the same word the navigation does. They were English
   * product names ("Tasks", "Approvals") printed inside German cards, which is
   * the same mixture this pass removed from the sidebar.
   */
  connectedSections: string[];
  supportedOperatingStages: OperatingStageKey[];
  playbooks: string[];
  /**
   * Static registry data never claims activity: null here. A live agent's
   * real activity is its agent_runs rows, read where it is shown.
   */
  lastActivity: string | null;
  /** live = has a runtime that acts (Intake); designed = defined, no runtime yet. */
  runtime: "live" | "designed";
}

export const AGENTS: AgentRecord[] = [
  {
    // The first agent with a runtime (ADR-0021): hands enquiries captured on this
    // site to Maxpromo OS through lead.intake. Deterministic, no model.
    id: "intake-agent",
    name: "Intake",
    status: "active",
    riskLevel: "low",
    requiresApproval: false,
    capabilityIds: ["capture", "handover", "retry"],
    allowedCount: 2,
    blockedCount: 3,
    connectedSections: ["approvals"],
    supportedOperatingStages: ["audit"],
    playbooks: [],
    lastActivity: null,
    runtime: "live",
  },
  {
    id: "chief-of-staff",
    name: "Chief of Staff",
    status: "offline",
    riskLevel: "low",
    requiresApproval: true,
    capabilityIds: ["prioritize", "brief", "coordinate"],
    allowedCount: 3,
    blockedCount: 3,
    connectedSections: ["tasks", "projects", "approvals"],
    supportedOperatingStages: ["audit", "diagnose", "design", "manual_delivery", "install", "maintain"],
    playbooks: ["pb-daily-briefing", "pb-missed-inquiry", "pb-shadow-ai-policy"],
    lastActivity: null,
    runtime: "designed",
  },
  {
    id: "lead-agent",
    name: "Lead Agent",
    status: "offline",
    riskLevel: "medium",
    requiresApproval: true,
    capabilityIds: ["research", "enrich", "qualify"],
    allowedCount: 3,
    blockedCount: 2,
    connectedSections: ["leads", "contacts"],
    supportedOperatingStages: ["audit", "manual_delivery"],
    playbooks: ["pb-missed-inquiry"],
    lastActivity: null,
    runtime: "designed",
  },
  {
    id: "research-agent",
    name: "Research Agent",
    status: "offline",
    riskLevel: "low",
    requiresApproval: true,
    capabilityIds: ["scan", "summarize"],
    allowedCount: 2,
    blockedCount: 1,
    connectedSections: ["research"],
    supportedOperatingStages: ["audit", "diagnose"],
    playbooks: [],
    lastActivity: null,
    runtime: "designed",
  },
  {
    id: "crm-agent",
    name: "CRM Agent",
    status: "offline",
    riskLevel: "medium",
    requiresApproval: true,
    capabilityIds: ["followup", "hygiene"],
    allowedCount: 2,
    blockedCount: 2,
    connectedSections: ["contacts", "projects"],
    supportedOperatingStages: ["manual_delivery", "systemize"],
    playbooks: ["pb-missed-inquiry"],
    lastActivity: null,
    runtime: "designed",
  },
  {
    id: "calendar-agent",
    name: "Calendar Agent",
    status: "offline",
    riskLevel: "medium",
    requiresApproval: true,
    capabilityIds: ["schedule", "remind"],
    allowedCount: 2,
    blockedCount: 2,
    connectedSections: ["briefing", "tasks"],
    supportedOperatingStages: ["manual_delivery"],
    playbooks: [],
    lastActivity: null,
    runtime: "designed",
  },
  {
    id: "content-agent",
    name: "Content Agent",
    status: "offline",
    riskLevel: "medium",
    requiresApproval: true,
    capabilityIds: ["plan", "draft"],
    allowedCount: 2,
    blockedCount: 2,
    connectedSections: ["playbooks"],
    supportedOperatingStages: ["systemize"],
    playbooks: [],
    lastActivity: null,
    runtime: "designed",
  },
  {
    id: "operations-agent",
    name: "Operations Agent",
    status: "offline",
    riskLevel: "low",
    requiresApproval: true,
    capabilityIds: ["track", "flag"],
    allowedCount: 2,
    blockedCount: 1,
    connectedSections: ["projects", "tasks"],
    supportedOperatingStages: ["audit", "diagnose", "systemize", "maintain"],
    playbooks: [],
    lastActivity: null,
    runtime: "designed",
  },
  {
    id: "document-agent",
    name: "Document Agent",
    status: "offline",
    riskLevel: "medium",
    requiresApproval: true,
    capabilityIds: ["compose", "extract"],
    allowedCount: 2,
    blockedCount: 2,
    connectedSections: ["documents"],
    supportedOperatingStages: ["systemize", "manual_delivery"],
    playbooks: [],
    lastActivity: null,
    runtime: "designed",
  },
  {
    id: "follow-up-agent",
    name: "Follow-Up Agent",
    status: "offline",
    riskLevel: "medium",
    requiresApproval: true,
    capabilityIds: ["detect", "prepare"],
    allowedCount: 2,
    blockedCount: 2,
    connectedSections: ["waitingRoom", "contacts"],
    supportedOperatingStages: ["manual_delivery", "maintain"],
    playbooks: ["pb-missed-inquiry"],
    lastActivity: null,
    runtime: "designed",
  },
];

export function getAgentById(id: string): AgentRecord | undefined {
  return AGENTS.find((a) => a.id === id);
}
