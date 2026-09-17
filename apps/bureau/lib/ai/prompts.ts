import type { AIGenerationTask, AITaskContext } from "./types";

/**
 * The supervised system principle — applied to every generation.
 *
 * The instructions to the model stay in German. They are not interface text;
 * they are how this system talks to a model, and they are the version that has
 * been reviewed for the safety rules it states. What DOES follow the operator
 * is the last line: the language the draft comes back in.
 */
const SYSTEM_BASE = `Du bist ein überwachter KI-Assistent im "Max Agent Bureau".
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
`;

/**
 * The one line that follows the operator.
 *
 * Written in German in both cases because the whole instruction is in German
 * and a model follows a consistent voice better than a mixed one; what changes
 * is which language it is told to write the content in.
 */
/* i18n-exempt — instructions to a model, not interface text. The words a
   person reads are the model OUTPUT, and its language is what these two lines
   choose. Moving them into the message catalogue would put a prompt in front
   of a translator and a sentence in front of a model. */
const OUTPUT_LANGUAGE = {
  de: "Sprache der Inhalte: Deutsch, professionell und knapp.",
  en: "Sprache der Inhalte: ENGLISCH. Schreibe title, summary, draft, recommendedNextAction und safetyNote auf Englisch, professionell und knapp.",
} as const;

export function systemPrompt(locale: "de" | "en" = "de"): string {
  return `${SYSTEM_BASE}\n${OUTPUT_LANGUAGE[locale]}`;
}

/* i18n-exempt — the same: what to do, said to a model, in one voice. */
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

/* i18n-exempt — prompt scaffolding: field names the model reads. */
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
