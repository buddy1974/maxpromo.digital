import type { AIGenerationTask, AITaskContext } from "./types";

// The supervised system principle — applied to every generation.
export const SYSTEM_PROMPT = `Du bist ein überwachter KI-Assistent im "Max Agent Bureau".
Du bereitest ausschließlich Empfehlungen und Entwürfe vor.
Du behauptest NIEMALS, etwas ausgeführt, gesendet oder zugesagt zu haben.
Du sendest keine Nachrichten, E-Mails oder Kalendereinladungen.
Du gibst keine rechtliche, steuerliche oder medizinische Letztberatung — nur Hinweise zur Prüfung.
Alles, was du produzierst, ist ein Entwurf für die menschliche Freigabe.

Antworte AUSSCHLIESSLICH mit gültigem JSON in genau diesem Schema (keine Code-Fences, kein Fließtext drumherum):
{
  "title": string,
  "summary": string,
  "draft": string,
  "riskLevel": "low" | "medium" | "high",
  "recommendedNextAction": string,
  "safetyNote": string
}
Sprache der Inhalte: Deutsch, professionell und knapp.`;

const TASK_INSTRUCTIONS: Record<AIGenerationTask, string> = {
  follow_up_draft:
    "Erstelle einen freundlichen, professionellen Follow-up-Entwurf an einen wartenden Kontakt. Nur Entwurf — nicht senden.",
  audit_summary:
    "Fasse die Geschäfts-Audit-Eingaben zu klaren operativen Schmerzpunkten und einem nächsten Schritt zusammen.",
  document_summary:
    "Fasse das Dokument zusammen: Kernpunkte, mögliche Fristen/Risiken und die empfohlene nächste Aktion. Keine Rechts-/Steuerberatung.",
  waiting_room_response:
    "Entwirf eine kurze, hilfreiche Antwort an einen wartenden Kunden. Nur Entwurf — nicht senden.",
  governance_recommendation:
    "Gib eine KI-Governance-Empfehlung (Richtlinie/Maßnahme) auf Basis der beschriebenen Situation. Bewertung, kein Live-Scan.",
  proposal_draft:
    "Erstelle einen strukturierten Vorschlags-Entwurf für eine interne Aktion zur menschlichen Freigabe.",
};

export function buildUserPrompt(task: AIGenerationTask, context: AITaskContext): string {
  const lines = [
    `Aufgabe: ${task}`,
    TASK_INSTRUCTIONS[task],
    context.businessName ? `Betrieb: ${context.businessName}` : null,
    context.source ? `Quelle: ${context.source}` : null,
    context.riskContext ? `Sensibilitäts-Hinweis: ${context.riskContext}` : null,
    "",
    "Eingabe:",
    context.input,
  ].filter(Boolean);
  return lines.join("\n");
}
