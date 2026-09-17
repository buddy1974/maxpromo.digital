import type { SafeActionLifecycleStep } from "@/types/operating-model";

/**
 * Reusable agent playbooks — the repeatable delivery system that turns manual
 * concierge work into installable workflows. Every playbook ends in a human
 * review step before any execute or log step: that is the supervision contract,
 * and it is expressed here in structure rather than in prose, so it cannot be
 * lost in a translation.
 *
 * STRUCTURE HERE, WORDS IN THE CATALOGUE
 * The title, the pain it addresses, its trigger, its outcome and the label of
 * each step live in `playbooks.<id>` in messages/{de,en}.json. What stays is
 * the id, the order and lifecycle phase of each step, which agents are
 * responsible, the operating stage, and whether approval is required.
 */
export interface PlaybookRecord {
  id: string;
  responsibleAgents: string[];
  /** Ordered. The lifecycle phase is what makes the contract checkable. */
  steps: { id: string; order: number; lifecycle: SafeActionLifecycleStep }[];
  approvalRequired: boolean;
  operatingStage: string;
  reusableTemplate: boolean;
}

/** Every playbook runs the same four phases, in the same order. */
const FOUR_PHASE: PlaybookRecord["steps"] = [
  { id: "s1", order: 1, lifecycle: "observe" },
  { id: "s2", order: 2, lifecycle: "prepare" },
  { id: "s3", order: 3, lifecycle: "propose" },
  { id: "s4", order: 4, lifecycle: "human_review" },
];

export const PLAYBOOKS: PlaybookRecord[] = [
  { id: "pb-lead-followup",     responsibleAgents: ["lead-agent", "follow-up-agent"],        steps: FOUR_PHASE, approvalRequired: true, operatingStage: "manual_delivery", reusableTemplate: true },
  { id: "pb-missed-inquiry",    responsibleAgents: ["chief-of-staff", "follow-up-agent"],    steps: FOUR_PHASE, approvalRequired: true, operatingStage: "manual_delivery", reusableTemplate: true },
  { id: "pb-daily-briefing",    responsibleAgents: ["chief-of-staff"],                       steps: FOUR_PHASE, approvalRequired: true, operatingStage: "maintain",        reusableTemplate: true },
  { id: "pb-crm-cleanup",       responsibleAgents: ["crm-agent"],                            steps: FOUR_PHASE, approvalRequired: true, operatingStage: "systemize",       reusableTemplate: true },
  { id: "pb-meeting-prep",      responsibleAgents: ["calendar-agent", "research-agent"],     steps: FOUR_PHASE, approvalRequired: true, operatingStage: "manual_delivery", reusableTemplate: true },
  { id: "pb-document-summary",  responsibleAgents: ["document-agent"],                       steps: FOUR_PHASE, approvalRequired: true, operatingStage: "systemize",       reusableTemplate: true },
  { id: "pb-content-repurpose", responsibleAgents: ["content-agent"],                        steps: FOUR_PHASE, approvalRequired: true, operatingStage: "systemize",       reusableTemplate: true },
  { id: "pb-overdue-task",      responsibleAgents: ["operations-agent"],                     steps: FOUR_PHASE, approvalRequired: true, operatingStage: "maintain",        reusableTemplate: true },
  { id: "pb-shadow-ai-policy",  responsibleAgents: ["chief-of-staff"],                       steps: FOUR_PHASE, approvalRequired: true, operatingStage: "maintain",        reusableTemplate: false },
  { id: "pb-waiting-room",      responsibleAgents: ["follow-up-agent", "chief-of-staff"],    steps: FOUR_PHASE, approvalRequired: true, operatingStage: "manual_delivery", reusableTemplate: true },
];

export function getPlaybookById(id: string): PlaybookRecord | undefined {
  return PLAYBOOKS.find((p) => p.id === id);
}
