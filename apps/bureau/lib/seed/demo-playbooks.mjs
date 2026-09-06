// Demo playbooks (the repeatable delivery system). Each ends in human review
// before any execute/log step. operating_stage is informational text.
const review = (n, label, lifecycle) => ({ order: n, label, lifecycle });
const standard = [
  review(1, "Auslöser erkennen", "observe"),
  review(2, "Kontext vorbereiten", "prepare"),
  review(3, "Aktion vorschlagen", "propose"),
  review(4, "Freigabe einholen", "human_review"),
];

export const DEMO_PLAYBOOKS = [
  { key: "pb-lead-followup", title: "Lead-Follow-up", businessPain: "Leads kommen rein, niemand fasst nach.", trigger: "Qualifizierter Lead ohne Reaktion seit 24h.", operatingStage: "manual_delivery", approvalRequired: true, steps: standard },
  { key: "pb-missed-inquiry", title: "Verpasste-Anfrage-Rettung", businessPain: "Anfragen nach Feierabend gehen unter.", trigger: "Eingehende Anfrage ohne Erfassung.", operatingStage: "manual_delivery", approvalRequired: true, steps: standard },
  { key: "pb-daily-briefing", title: "Tägliches Briefing", businessPain: "Kein klarer Tagesstart.", trigger: "Jeden Morgen 08:00.", operatingStage: "systemize", approvalRequired: false, steps: standard },
  { key: "pb-crm-cleanup", title: "CRM-Bereinigung", businessPain: "Veraltete, doppelte Daten.", trigger: "Monatlicher Hygiene-Lauf.", operatingStage: "systemize", approvalRequired: true, steps: standard },
  { key: "pb-meeting-prep", title: "Meeting-Vorbereitung", businessPain: "Unvorbereitet in Termine.", trigger: "Termin in den nächsten 24h.", operatingStage: "systemize", approvalRequired: false, steps: standard },
  { key: "pb-document-summary", title: "Dokument-Zusammenfassung", businessPain: "Wichtiges in Dokumenten übersehen.", trigger: "Neues Dokument im Intake.", operatingStage: "systemize", approvalRequired: true, steps: standard },
  { key: "pb-content-repurpose", title: "Content-Wiederverwertung", businessPain: "Content nur einmal genutzt.", trigger: "Neuer Beitrag/Fallstudie.", operatingStage: "systemize", approvalRequired: true, steps: standard },
  { key: "pb-overdue-task", title: "Überfällige-Aufgaben-Rettung", businessPain: "Aufgaben werden überfällig.", trigger: "Aufgabe überschreitet Fälligkeit.", operatingStage: "manual_delivery", approvalRequired: false, steps: standard },
  { key: "pb-shadow-ai-policy", title: "Shadow-AI-Policy", businessPain: "Unkontrollierte KI-Nutzung.", trigger: "Governance-Review.", operatingStage: "diagnose", approvalRequired: true, steps: standard },
  { key: "pb-waiting-room", title: "Kunden-Warteraum", businessPain: "Kunden warten und springen ab.", trigger: "Kunde wartet über Schwellwert.", operatingStage: "manual_delivery", approvalRequired: true, steps: standard },
];
