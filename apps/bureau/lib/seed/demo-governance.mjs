// Demo Shadow-AI governance. Assessment + policy data (NOT a live scan).
// tool status: approved|under_review|blocked. risk level: low|medium|high|critical.
export const DEMO_AI_TOOLS = [
  { name: "Max Agent Bureau", category: "Operations / Assistenz", status: "approved", usageNote: "Internes, überwachtes System — freigegeben." },
  { name: "Claude (Team-Workspace)", category: "Assistenz / Text", status: "approved", usageNote: "Freigegeben für interne Texte ohne personenbezogene Kundendaten." },
  { name: "ChatGPT (privat)", category: "Assistenz / Text", status: "under_review", usageNote: "Risiko: Mitarbeiter nutzt mit Kundendaten — Richtlinie ausstehend." },
  { name: "Unbekanntes Notiz-Tool", category: "Meeting / Transkription", status: "under_review", usageNote: "Unklare Datenverarbeitung — Prüfung erforderlich." },
  { name: "Unbekannte Browser-Erweiterung", category: "Browser", status: "blocked", usageNote: "Nicht freigegeben — bis zur Prüfung gesperrt." },
];

export const DEMO_GOVERNANCE_RISKS = [
  { area: "Kundendaten", description: "Bewertung: Kundendaten könnten in nicht freigegebene Tools eingegeben werden.", level: "high", recommendedAction: "Freigegebene Tool-Liste kommunizieren und Team schulen." },
  { area: "Richtlinie", description: "Keine schriftliche KI-Nutzungsrichtlinie vorhanden.", level: "medium", recommendedAction: "Basis-Policy erstellen und im Team bestätigen lassen." },
  { area: "Sichtbarkeit", description: "Keine Übersicht, welche Tools im Team genutzt werden.", level: "medium", recommendedAction: "Tool-Register pflegen und regelmäßig prüfen." },
];

export const DEMO_POLICY_CHECKLIST = [
  { label: "Schriftliche KI-Nutzungsrichtlinie vorhanden", done: false },
  { label: "Freigegebene Tool-Liste kommuniziert", done: false },
  { label: "Regel: keine Kundendaten in nicht freigegebene Tools", done: true },
  { label: "Verantwortliche Person benannt", done: true },
  { label: "Regelmäßiges Governance-Review angesetzt", done: false },
];
