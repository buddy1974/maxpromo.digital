import type { AIRiskLevel, AIGenerationTask } from "./types";

// Input bounds — reject empty and oversized payloads before hitting the provider.
export const MAX_INPUT_CHARS = 8000;

export function validateInput(input: string): { ok: true } | { ok: false; error: string } {
  const trimmed = input?.trim() ?? "";
  if (!trimmed) return { ok: false, error: "empty_input" };
  if (trimmed.length > MAX_INPUT_CHARS) return { ok: false, error: "input_too_large" };
  return { ok: true };
}

// Sensitive domains default to a higher risk floor regardless of model output.
const SENSITIVE = [
  "steuer", "tax", "finanz", "finance", "rechnung", "invoice",
  "legal", "recht", "vertrag", "contract", "anwalt",
  "medical", "medizin", "patient", "praxis", "gesund",
  "hr", "personal", "mitarbeiter", "lohn", "gehalt",
  "kundendaten", "customer data", "personenbezogen", "dsgvo", "gdpr",
];

const RISK_ORDER: Record<AIRiskLevel, number> = { low: 0, medium: 1, high: 2 };

/** Lowest risk level this task/context may be reported as. */
export function riskFloor(task: AIGenerationTask, context: { input?: string; riskContext?: string }): AIRiskLevel {
  const haystack = `${task} ${context.riskContext ?? ""} ${context.input ?? ""}`.toLowerCase();
  const sensitive = SENSITIVE.some((k) => haystack.includes(k));
  if (sensitive) return "high";
  // Outbound-adjacent drafts (follow-ups, waiting-room replies) default to medium.
  if (task === "follow_up_draft" || task === "waiting_room_response" || task === "proposal_draft") {
    return "medium";
  }
  return "low";
}

export function clampRisk(modelRisk: AIRiskLevel, floor: AIRiskLevel): AIRiskLevel {
  return RISK_ORDER[modelRisk] >= RISK_ORDER[floor] ? modelRisk : floor;
}

/**
 * The note printed under every generated draft. It is read by the operator,
 * so it follows the operator — and both versions say exactly the same thing,
 * because what it states is a safety property of the product.
 */
/* i18n-exempt — both languages are present and chosen by the locale. */
const SAFETY_NOTE = {
  de: "Entwurf zur menschlichen Prüfung. Nichts wurde gesendet, ausgeführt oder angewendet. Keine rechtliche/steuerliche/medizinische Letztberatung.",
  en: "A draft for human review. Nothing has been sent, executed or applied. Not final legal, tax or medical advice.",
} as const;

export function defaultSafetyNote(locale: "de" | "en" = "de"): string {
  return SAFETY_NOTE[locale];
}

export function coerceRisk(value: unknown): AIRiskLevel {
  return value === "high" || value === "medium" || value === "low" ? value : "medium";
}
