import type { AIToolStatus, GovernanceRiskLevel, DataSensitivity } from "@/types/ai-governance";

/**
 * Demo fixtures for the AI-governance surfaces.
 *
 * WHAT IS HERE AND WHAT IS IN THE CATALOGUE
 * These records are product content, not customer records: a tool register, a
 * policy checklist, the areas of risk this product assesses. An English
 * operator reading them is reading the product, so their text lives in
 * `demo.*` in the message catalogue and only the structure — ids, statuses,
 * levels, what is ticked — stays here.
 *
 * That line matters and it is drawn deliberately. A customer's name, a
 * customer's message and a customer's document title are records: they are not
 * translated in any product, and the fixtures that stand in for them are not
 * translated either. Anything the product itself says, is.
 */

export interface ToolRecord { id: string; name: string; status: AIToolStatus }
export interface RiskRecord { id: string; level: GovernanceRiskLevel }
export interface PolicyRecord { id: string; done: boolean }
export interface SensitivityRecord { id: string; sensitivity: DataSensitivity }

/** Tool names are proper nouns; two of them are descriptions and are keyed. */
export const MOCK_AI_TOOLS: ToolRecord[] = [
  { id: "tool-1", name: "Claude", status: "approved" },
  { id: "tool-2", name: "", status: "under_review" },
  { id: "tool-3", name: "DeepL", status: "approved" },
  { id: "tool-4", name: "", status: "blocked" },
];

export const MOCK_GOVERNANCE_RISKS: RiskRecord[] = [
  { id: "gr-1", level: "high" },
  { id: "gr-2", level: "medium" },
  { id: "gr-3", level: "medium" },
];

export const MOCK_POLICY_CHECKLIST: PolicyRecord[] = [
  { id: "pc-1", done: false },
  { id: "pc-2", done: false },
  { id: "pc-3", done: true },
  { id: "pc-4", done: true },
  { id: "pc-5", done: false },
];

export const MOCK_DATA_SENSITIVITY: SensitivityRecord[] = [
  { id: "ds-1", sensitivity: "public" },
  { id: "ds-2", sensitivity: "internal" },
  { id: "ds-3", sensitivity: "confidential" },
  { id: "ds-4", sensitivity: "personal" },
];
