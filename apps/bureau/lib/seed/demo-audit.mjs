// Demo audit session + findings. impact_area: time|revenue|visibility|risk.
export const DEMO_AUDIT_SESSION = {
  businessName: "Maxpromo Demo Operations",
  industry: "Service business / AI automation agency (demo)",
  status: "in_review",
  priorityScore: 76,
};

export const DEMO_AUDIT_FINDINGS = [
  { category: "Verpasste Follow-ups", title: "Anfragen nach Feierabend bleiben liegen", pain: "Eingehende Anfragen über mehrere Kanäle werden nicht zeitnah beantwortet.", impactArea: "revenue", priority: "high", recommendedStage: "manual_delivery", recommendedAgents: ["follow-up-agent", "chief-of-staff"] },
  { category: "Getrennte Werkzeuge", title: "Inbox, Kalender und CRM sprechen nicht", pain: "Informationen verteilen sich über Tools ohne gemeinsame Übersicht.", impactArea: "visibility", priority: "high", recommendedStage: "install", recommendedAgents: ["chief-of-staff", "crm-agent"] },
  { category: "Dokumenten-Chaos", title: "Verträge und Rechnungen verstreut", pain: "Fristen werden übersehen, Dokumente schwer auffindbar.", impactArea: "risk", priority: "medium", recommendedStage: "systemize", recommendedAgents: ["document-agent"] },
  { category: "Manuelle Verwaltung", title: "Berichte werden von Hand erstellt", pain: "Stunden pro Woche für wiederkehrende Zusammenstellungen.", impactArea: "time", priority: "medium", recommendedStage: "systemize", recommendedAgents: ["operations-agent"] },
  { category: "Shadow-AI-Risiko", title: "Unkontrollierte KI-Nutzung im Team", pain: "Kundendaten könnten in nicht freigegebene Tools gelangen.", impactArea: "risk", priority: "high", recommendedStage: "diagnose", recommendedAgents: ["chief-of-staff"] },
];
