import type {
  AIToolRegisterItem,
  AIGovernanceRisk,
  PolicyChecklistItem,
  DataSensitivityRow,
} from "@/types/ai-governance";

export const MOCK_AI_TOOLS: AIToolRegisterItem[] = [
  { id: "tool-1", name: "Claude", category: "Assistenz / Text", status: "approved", usageNote: "Freigegeben für interne Texte ohne personenbezogene Kundendaten." },
  { id: "tool-2", name: "ChatGPT (privat)", category: "Assistenz / Text", status: "under_review", usageNote: "Private Accounts im Team — Richtlinie ausstehend." },
  { id: "tool-3", name: "DeepL", category: "Übersetzung", status: "approved", usageNote: "Freigegeben für nicht-sensible Inhalte." },
  { id: "tool-4", name: "Unbekannter Bild-Generator", category: "Bild", status: "blocked", usageNote: "Unklare Datenverarbeitung — bis zur Prüfung gesperrt." },
];

export const MOCK_GOVERNANCE_RISKS: AIGovernanceRisk[] = [
  { id: "gr-1", area: "Kundendaten", description: "Bewertung: Risiko, dass Kundendaten in nicht freigegebene Tools eingegeben werden.", level: "high", recommendedAction: "Freigegebene Tool-Liste kommunizieren und Schulung." },
  { id: "gr-2", area: "Richtlinie", description: "Es existiert keine schriftliche KI-Nutzungsrichtlinie.", level: "medium", recommendedAction: "Basis-Policy erstellen und im Team bestätigen." },
  { id: "gr-3", area: "Sichtbarkeit", description: "Keine Übersicht, welche Tools im Team genutzt werden.", level: "medium", recommendedAction: "Tool-Register pflegen und regelmäßig prüfen." },
];

export const MOCK_POLICY_CHECKLIST: PolicyChecklistItem[] = [
  { id: "pc-1", label: "Schriftliche KI-Nutzungsrichtlinie vorhanden", done: false },
  { id: "pc-2", label: "Freigegebene Tool-Liste kommuniziert", done: false },
  { id: "pc-3", label: "Regel: keine Kundendaten in nicht freigegebene Tools", done: true },
  { id: "pc-4", label: "Verantwortliche Person benannt", done: true },
  { id: "pc-5", label: "Regelmäßiges Governance-Review angesetzt", done: false },
];

export const MOCK_DATA_SENSITIVITY: DataSensitivityRow[] = [
  { id: "ds-1", dataType: "Marketing-Texte", sensitivity: "public", allowedTools: "Alle freigegebenen Tools" },
  { id: "ds-2", dataType: "Interne Notizen", sensitivity: "internal", allowedTools: "Nur freigegebene Tools" },
  { id: "ds-3", dataType: "Angebote / Verträge", sensitivity: "confidential", allowedTools: "Nur mit Freigabe" },
  { id: "ds-4", dataType: "Kundendaten / personenbezogen", sensitivity: "personal", allowedTools: "Keine externen KI-Tools" },
];
