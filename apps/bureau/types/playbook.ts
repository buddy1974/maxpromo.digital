import type { OperatingStageKey } from "./operating-model";

export interface PlaybookStep {
  id: string;
  order: number;
  label: string;
  /** Which lifecycle step this maps to. */
  lifecycle: "observe" | "prepare" | "propose" | "human_review" | "execute" | "log";
}

export interface Playbook {
  id: string;
  title: string;
  /** Business pain the playbook addresses. */
  businessPain: string;
  trigger: string;
  /** Registry keys of responsible agents. */
  responsibleAgents: string[];
  steps: PlaybookStep[];
  approvalRequired: boolean;
  expectedOutcome: string;
  operatingStage: OperatingStageKey;
  reusableTemplate: boolean;
}
