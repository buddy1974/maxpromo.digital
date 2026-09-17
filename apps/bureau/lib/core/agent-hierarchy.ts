import type { AgentHierarchyNode } from "@/types/operating-model";

/**
 * The bureau org chart: one Chief of Staff coordinates specialist agents.
 * Used by the operating-model and agents pages to show the supervised structure.
 */
/**
 * Names are proper nouns and stay here. Each summary is a sentence somebody
 * reads, so it lives in model.hierarchy_.<role>.
 */
export const AGENT_HIERARCHY: { role: string; name: string; reportsTo: string | null }[] = [
  { role: "chief-of-staff",  name: "Chief of Staff",  reportsTo: null },
  { role: "lead-agent",      name: "Lead Agent",      reportsTo: "chief-of-staff" },
  { role: "research-agent",  name: "Research Agent",  reportsTo: "chief-of-staff" },
  { role: "crm-agent",       name: "CRM Agent",       reportsTo: "chief-of-staff" },
  { role: "calendar-agent",  name: "Calendar Agent",  reportsTo: "chief-of-staff" },
  { role: "operations-agent",name: "Operations Agent",reportsTo: "chief-of-staff" },
  { role: "content-agent",   name: "Content Agent",   reportsTo: "chief-of-staff" },
  { role: "document-agent",  name: "Document Agent",  reportsTo: "chief-of-staff" },
  { role: "follow-up-agent", name: "Follow-Up Agent", reportsTo: "chief-of-staff" },
];
