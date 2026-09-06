// Demo agents — mirrors the code registry (lib/registry/agents.ts) as DB rows.
// status/risk values match the agent_status / risk_level enums.
export const DEMO_AGENTS = [
  { key: "chief-of-staff", name: "Chief of Staff", role: "Zentrale Intelligenz & Koordination", status: "active", riskLevel: "low", requiresApproval: true },
  { key: "lead-agent", name: "Lead Agent", role: "Lead-Recherche & Qualifizierung", status: "proposing", riskLevel: "medium", requiresApproval: true },
  { key: "research-agent", name: "Research Agent", role: "Markt- & Wettbewerbsbeobachtung", status: "idle", riskLevel: "low", requiresApproval: false },
  { key: "crm-agent", name: "CRM Agent", role: "Beziehungspflege & Follow-up", status: "proposing", riskLevel: "medium", requiresApproval: true },
  { key: "calendar-agent", name: "Calendar Agent", role: "Termine & Erinnerungen", status: "idle", riskLevel: "medium", requiresApproval: true },
  { key: "operations-agent", name: "Operations Agent", role: "Projekt- & Aufgabenkoordination", status: "active", riskLevel: "low", requiresApproval: false },
  { key: "content-agent", name: "Content Agent", role: "Content-Planung & Entwürfe", status: "idle", riskLevel: "medium", requiresApproval: true },
  { key: "document-agent", name: "Document Agent", role: "Dokumente & Aufbereitung", status: "idle", riskLevel: "medium", requiresApproval: true },
  { key: "follow-up-agent", name: "Follow-Up Agent", role: "Nachverfolgung & Wiedervorlage", status: "proposing", riskLevel: "high", requiresApproval: true },
];
