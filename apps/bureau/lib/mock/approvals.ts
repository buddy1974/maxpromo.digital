import type { AgentProposal } from "@/types/agent";
import type { ApprovalDeskItem } from "@/types/approval";

// Proposals waiting for human review. This is the heart of the supervision model:
// agents PREPARE these; a human approves/rejects/edits before anything executes.
export const MOCK_APPROVALS: AgentProposal[] = [
  {
    id: "ap-6001",
    title: "Follow-up an Druckerei senden",
    agentId: "follow-up-agent",
    agentName: "Follow-Up Agent",
    businessContext:
      "Thomas Berger (Druck & Design Ruhr) hat seit dem Erstgespräch am 20.05. nicht geantwortet.",
    proposedAction:
      "Kurze, freundliche Nachfass-E-Mail mit Terminvorschlag für ein zweites Gespräch.",
    riskLevel: "high",
    status: "pending",
    expectedOutcome: "Reaktivierung des Gesprächs; Termin in dieser Woche.",
    auditTrailPreview: [
      "Agent: Follow-Up Agent",
      "Aktion: E-Mail-Entwurf erstellt (nicht gesendet)",
      "Wartet auf: menschliche Freigabe",
    ],
    createdAt: "2026-05-29T06:50:00Z",
  },
  {
    id: "ap-6002",
    title: "Qualifizierten Lead als Chance anlegen",
    agentId: "lead-agent",
    agentName: "Lead Agent",
    businessContext:
      "Audit-Anfrage aus Essen (Gastronomie) mit Qualifizierungs-Score 82.",
    proposedAction:
      "Lead in die Pipeline aufnehmen und Operations-Agent eine Vorbereitungs-Aufgabe zuweisen.",
    riskLevel: "low",
    status: "pending",
    expectedOutcome: "Strukturierte Nachverfolgung der Anfrage.",
    auditTrailPreview: [
      "Agent: Lead Agent",
      "Aktion: Pipeline-Eintrag vorbereitet",
      "Wartet auf: menschliche Freigabe",
    ],
    createdAt: "2026-05-29T07:40:00Z",
  },
  {
    id: "ap-6003",
    title: "Terminvorschlag für Audit-Gespräch",
    agentId: "calendar-agent",
    agentName: "Calendar Agent",
    businessContext:
      "Dr. Vogel hat Interesse an einem Geschäfts-Check signalisiert.",
    proposedAction:
      "Drei Zeitfenster diese Woche vorschlagen; nach Freigabe Einladung vorbereiten.",
    riskLevel: "medium",
    status: "pending",
    expectedOutcome: "Bestätigter Termin ohne manuelles Hin-und-Her.",
    auditTrailPreview: [
      "Agent: Calendar Agent",
      "Aktion: Zeitfenster ermittelt",
      "Wartet auf: menschliche Freigabe",
    ],
    createdAt: "2026-05-29T07:10:00Z",
  },
  {
    id: "ap-6004",
    title: "Angebotsentwurf für Logistikkunde",
    agentId: "document-agent",
    agentName: "Document Agent",
    businessContext:
      "Nordlicht Logistik möchte ein Angebot zur Workflow-Automatisierung.",
    proposedAction:
      "Strukturierten Angebotsentwurf erstellen (inkl. §19-Hinweis) — zur Prüfung, nicht zum Versand.",
    riskLevel: "medium",
    status: "pending",
    expectedOutcome: "Prüfbereiter Angebotsentwurf.",
    auditTrailPreview: [
      "Agent: Document Agent",
      "Aktion: Dokumententwurf erstellt",
      "Wartet auf: menschliche Freigabe",
    ],
    createdAt: "2026-05-29T05:30:00Z",
  },
];

// Approval Desk view — richer, reviewable items with lifecycle timeline + risk.
export const MOCK_APPROVAL_DESK: ApprovalDeskItem[] = [
  {
    id: "ad-1",
    proposalTitle: "Follow-up an Druckerei senden",
    agentName: "Follow-Up Agent",
    businessContext: "Thomas Berger hat seit dem Erstgespräch (20.05.) nicht reagiert.",
    proposedAction: "Freundliche Nachfass-E-Mail mit zwei Terminoptionen senden.",
    expectedResult: "Reaktivierung des Gesprächs in dieser Woche.",
    status: "pending",
    risk: {
      level: "high",
      concern: "E-Mail-Versand an Kunden — Ton und Timing müssen passen.",
      mitigation: "Entwurf vor Versand prüfen und ggf. anpassen.",
    },
    timeline: [
      { id: "tl-1", at: "2026-05-29T06:45:00Z", step: "observed", label: "Stiller Thread erkannt" },
      { id: "tl-2", at: "2026-05-29T06:48:00Z", step: "prepared", label: "Kontext zusammengestellt" },
      { id: "tl-3", at: "2026-05-29T06:50:00Z", step: "proposed", label: "Entwurf vorgelegt" },
    ],
    createdAt: "2026-05-29T06:50:00Z",
  },
  {
    id: "ad-2",
    proposalTitle: "Zahlung Lieferantenrechnung freigeben",
    agentName: "Document Agent",
    businessContext: "Getränkerechnung Mai, Zahlungsziel 05.06.",
    proposedAction: "Zahlung zur Ausführung vorbereiten (nicht ausgelöst).",
    expectedResult: "Fristgerechte Zahlung ohne manuelle Erfassung.",
    status: "pending",
    risk: {
      level: "critical",
      concern: "Geldbewegung — niemals ohne ausdrückliche menschliche Freigabe.",
      mitigation: "Betrag und Empfänger vor Freigabe verifizieren.",
    },
    timeline: [
      { id: "tl-1", at: "2026-05-29T05:20:00Z", step: "observed", label: "Rechnung im Intake erkannt" },
      { id: "tl-2", at: "2026-05-29T05:25:00Z", step: "prepared", label: "Eckdaten extrahiert" },
      { id: "tl-3", at: "2026-05-29T05:30:00Z", step: "proposed", label: "Zahlungsvorschlag vorgelegt" },
    ],
    createdAt: "2026-05-29T05:30:00Z",
  },
];
