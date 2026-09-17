import type {
  OperatingStage,
  SafeActionLifecycleStep,
  AuditCategory,
  AgentRecommendation,
  InstallationStage,
  MaintenanceAction,
} from "@/types/operating-model";

/**
 * THE PRODUCT BACKBONE. Single source of truth for the operating model the
 * whole Agent Bureau is organised around, and structure only. The name, purpose, pain, output and handover of each stage
 * are in the message catalogue under model.stages.<key>, because they are
 * the words a person reads and this product is read in two languages. What
 * stays here is what does not change with language: the order, and which
 * agents support each stage.
 */
export const OPERATING_STAGES: OperatingStageStructure[] = [
  { key: "audit",           order: 1, supportingAgents: ["chief-of-staff", "research-agent", "operations-agent"] },
  { key: "diagnose",        order: 2, supportingAgents: ["chief-of-staff", "operations-agent"] },
  { key: "design",          order: 3, supportingAgents: ["chief-of-staff"] },
  { key: "manual_delivery", order: 4, supportingAgents: ["chief-of-staff", "crm-agent", "follow-up-agent"] },
  { key: "systemize",       order: 5, supportingAgents: ["operations-agent", "content-agent", "document-agent"] },
  { key: "install",         order: 6, supportingAgents: ["chief-of-staff"] },
  { key: "maintain",        order: 7, supportingAgents: ["chief-of-staff", "operations-agent"] },
];

export interface OperatingStageStructure {
  key: OperatingStage["key"];
  order: number;
  supportingAgents: string[];
}

/** The lifecycle EVERY meaningful agent action must follow. No silent
 *  execution. Labels live in model.lifecycle.<step>. */
export const SAFE_ACTION_LIFECYCLE: { step: SafeActionLifecycleStep }[] = [
  { step: "observe" },
  { step: "prepare" },
  { step: "propose" },
  { step: "human_review" },
  { step: "execute" },
  { step: "log" },
];

/**
 * i18n-exempt — product vocabulary that no surface renders yet.
 *
 * AUDIT_CATEGORIES, INSTALLATION_STAGES and MAINTENANCE_ACTIONS are exported
 * and imported by nothing. Translating text nobody reads would be work with no
 * reader; deleting it would throw away vocabulary the audit and installation
 * screens will need. They are marked instead, and the day one of them is
 * rendered its text moves to the catalogue with everything else.
 */
export const AUDIT_CATEGORIES: AuditCategory[] = [
  { id: "ac-followups", label: "Verpasste Follow-ups", description: "Zusagen und Threads ohne Nachverfolgung." },
  { id: "ac-replies", label: "Langsame Antworten", description: "Kunden warten zu lange auf Reaktion." },
  { id: "ac-admin", label: "Manuelle Verwaltung", description: "Wiederkehrende Handarbeit ohne Automatisierung." },
  { id: "ac-docs", label: "Dokumenten-Chaos", description: "Verstreute PDFs, Verträge, Rechnungen." },
  { id: "ac-tasks", label: "Verstreute Aufgaben", description: "Kein zentrales Aufgaben- und Prioritätssystem." },
  { id: "ac-tools", label: "Getrennte Werkzeuge", description: "Inbox, Kalender und CRM sprechen nicht miteinander." },
  { id: "ac-priority", label: "Unklare Prioritäten", description: "Kein tägliches Priorisierungssystem." },
  { id: "ac-shadow-ai", label: "Shadow-AI-Risiko", description: "Unkontrollierte KI-Nutzung im Team." },
  { id: "ac-reporting", label: "Reporting-Verzug", description: "Berichte werden mühsam von Hand erstellt." },
  { id: "ac-leakage", label: "Lead-Leckage", description: "Anfragen gehen unter und werden nicht erfasst." },
];

/** Tier and situation text live in model.recommendations.<id>. */
export const AGENT_RECOMMENDATIONS: { id: string; agents: string[] }[] = [
  { id: "rec-1", agents: ["chief-of-staff"] },
  { id: "rec-2", agents: ["chief-of-staff", "crm-agent"] },
  { id: "rec-3", agents: ["chief-of-staff", "lead-agent", "follow-up-agent"] },
  { id: "rec-4", agents: ["chief-of-staff", "lead-agent", "research-agent", "crm-agent", "calendar-agent", "operations-agent", "content-agent", "document-agent", "follow-up-agent"] },
];

/* i18n-exempt — see the note on AUDIT_CATEGORIES. */
export const INSTALLATION_STAGES: InstallationStage[] = [
  { id: "inst-1", label: "Setup", description: "Konten, Datenbasis und Berechtigungen einrichten." },
  { id: "inst-2", label: "Konfiguration", description: "Agenten und Playbooks auf den Betrieb zuschneiden." },
  { id: "inst-3", label: "Übergabe", description: "Einweisung im überwachten Betrieb." },
  { id: "inst-4", label: "Überwachter Betrieb", description: "Agenten arbeiten unter Freigabekontrolle." },
];

/* i18n-exempt — see the note on AUDIT_CATEGORIES. */
export const MAINTENANCE_ACTIONS: MaintenanceAction[] = [
  { id: "mnt-1", label: "Integrations-Gesundheit", cadence: "wöchentlich", description: "Verbindungen prüfen und reparieren." },
  { id: "mnt-2", label: "Agenten-Review", cadence: "monatlich", description: "Vorschlagsqualität und Risiken bewerten." },
  { id: "mnt-3", label: "Audit-Log-Durchsicht", cadence: "monatlich", description: "Freigaben und Aktionen nachvollziehen." },
  { id: "mnt-4", label: "Verbesserungs-Empfehlung", cadence: "monatlich", description: "Nächste Optimierungen vorschlagen." },
];
