import type { AgentHierarchyNode } from "@/types/operating-model";

/**
 * The bureau org chart: one Chief of Staff coordinates specialist agents.
 * Used by the operating-model and agents pages to show the supervised structure.
 */
export const AGENT_HIERARCHY: AgentHierarchyNode[] = [
  { role: "chief-of-staff", name: "Chief of Staff", reportsTo: null, summary: "Zentrale Intelligenz: priorisiert, koordiniert, routet Freigaben, überwacht den Audit-Trail." },
  { role: "lead-agent", name: "Lead Agent", reportsTo: "chief-of-staff", summary: "Recherchiert, qualifiziert und bereitet Outreach vor." },
  { role: "research-agent", name: "Research Agent", reportsTo: "chief-of-staff", summary: "Markt-, Wettbewerbs- und Branchenbeobachtung." },
  { role: "crm-agent", name: "CRM Agent", reportsTo: "chief-of-staff", summary: "Follow-ups, Deal-Bewegung, Beziehungspflege." },
  { role: "calendar-agent", name: "Calendar Agent", reportsTo: "chief-of-staff", summary: "Terminvorschläge, Erinnerungen, Tagesplanung." },
  { role: "operations-agent", name: "Operations Agent", reportsTo: "chief-of-staff", summary: "Projekt-/Aufgaben-Tracking und Prozess-Sichtbarkeit." },
  { role: "content-agent", name: "Content Agent", reportsTo: "chief-of-staff", summary: "Content-Planung, Entwürfe, Kampagnen-Support." },
  { role: "document-agent", name: "Document Agent", reportsTo: "chief-of-staff", summary: "Dokument-Zusammenfassungen, Angebote, Wissensextraktion." },
  { role: "follow-up-agent", name: "Follow-Up Agent", reportsTo: "chief-of-staff", summary: "Erkennt wartende Kunden, bereitet nächste Schritte vor." },
];
