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
  /** Every registered agent has a runtime (ADR-0030). */
  runtime: "live";
}

/**
 * Only agents with a runtime are registered (ADR-0030). The eight "designed"
 * agents that used to stand here (Chief of Staff, Lead, CRM, Calendar,
 * Content, Operations, Document, Follow-Up) had a name, a prompt-less card and
 * no code; they were removed rather than shown as a workforce. A new agent is
 * added here when it runs — with its trigger, its tools and its result path.
 */
export const AGENTS: AgentRecord[] = [
  {
    // Hands enquiries captured on this site to Maxpromo OS through lead.intake
    // (ADR-0021). Deterministic, no model.
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
    // Work delegated by Maxpromo OS (ADR-0030): reads a lead's own public
    // website, keeps only quotes that are on the page, qualifies by code and
    // hands the result back to the lead in the OS. Model step through the OS
    // gateway. Sends nothing; changes no business record itself.
    id: "research-agent",
    name: "Research Agent",
    status: "active",
    riskLevel: "low",
    // Marcel confirms each delegation in Maxpromo OS; nothing it returns acts.
    requiresApproval: true,
    capabilityIds: ["read", "verify", "qualify", "handback"],
    allowedCount: 3,
    blockedCount: 4,
    connectedSections: ["work"],
    supportedOperatingStages: ["audit"],
    playbooks: [],
    lastActivity: null,
    runtime: "live",
  },
];

export function getAgentById(id: string): AgentRecord | undefined {
  return AGENTS.find((a) => a.id === id);
}
