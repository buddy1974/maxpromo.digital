// Concierge/manual delivery tracking for a single client install. Skeleton data
// supporting the "we install a system into your business" delivery model.
export interface ClientImplementation {
  id: string;
  clientName: string;
  industry: string;
  businessPains: string[];
  observedBottlenecks: string[];
  proposedAgents: string[];
  workflowsToInstall: string[];
  integrationRequirements: string[];
  manualServiceNotes: string;
  implementationPriority: "low" | "medium" | "high";
  nextSteps: string[];
  handoverStatus: "not_started" | "in_progress" | "handed_over";
  maintenanceReady: boolean;
}

export const MOCK_CLIENT_IMPLEMENTATIONS: ClientImplementation[] = [
  {
    id: "ci-1",
    clientName: "Trattoria Bella Essen",
    industry: "Gastronomie",
    businessPains: ["Verpasste Reservierungsanfragen", "Getrennte Kanäle", "Keine Bewertungs-Nachfrage"],
    observedBottlenecks: ["WhatsApp/Telefon/Mail ohne gemeinsame Übersicht", "Nachts keine Reaktion"],
    proposedAgents: ["chief-of-staff", "follow-up-agent", "crm-agent"],
    workflowsToInstall: ["pb-waiting-room", "pb-missed-inquiry", "pb-daily-briefing"],
    integrationRequirements: ["WhatsApp Business", "Webformular", "Telegram (Benachrichtigung)"],
    manualServiceNotes: "Start im Concierge-Modus: Maxpromo prüft morgens die vorbereiteten Antworten gemeinsam mit der Inhaberin.",
    implementationPriority: "high",
    nextSteps: ["Geschäfts-Check-Termin bestätigen", "Kanäle inventarisieren", "Warteraum mit echten Anfragen testen"],
    handoverStatus: "in_progress",
    maintenanceReady: false,
  },
  {
    id: "ci-2",
    clientName: "Nordlicht Logistik",
    industry: "Logistik",
    businessPains: ["Langer Rechnungszyklus", "Manuelle Datenübertragung"],
    observedBottlenecks: ["3 Tage von Auftrag bis Rechnung", "Daten in mehreren Tools"],
    proposedAgents: ["chief-of-staff", "operations-agent", "document-agent"],
    workflowsToInstall: ["pb-document-summary", "pb-overdue-task"],
    integrationRequirements: ["n8n", "Dokument-Intake"],
    manualServiceNotes: "Angebot zur Workflow-Automatisierung in Vorbereitung (Document-Desk).",
    implementationPriority: "medium",
    nextSteps: ["Angebot finalisieren", "Rückruf führen"],
    handoverStatus: "not_started",
    maintenanceReady: false,
  },
];
