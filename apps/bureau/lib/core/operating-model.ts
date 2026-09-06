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
 * whole Agent Bureau is organised around. The dashboard renders this; agents
 * declare which stages they support.
 */
export const OPERATING_STAGES: OperatingStage[] = [
  {
    key: "audit",
    order: 1,
    name: "Audit",
    purpose: "Den Betrieb durchleuchten: Wo geht Zeit verloren, wo warten Kunden, wo lecken Leads, was läuft manuell?",
    supportingAgents: ["chief-of-staff", "research-agent", "operations-agent"],
    painAddressed: "Kein klares Bild, wo der Betrieb Zeit, Kunden und Übersicht verliert.",
    output: "Strukturierte Audit-Findings mit Prioritäten.",
    nextHandoff: "Findings gehen in die Diagnose.",
  },
  {
    key: "diagnose",
    order: 2,
    name: "Diagnose",
    purpose: "Audit-Funde in konkrete operative Schmerzpunkte übersetzen.",
    supportingAgents: ["chief-of-staff", "operations-agent"],
    painAddressed: "Symptome sind sichtbar, aber die Ursache und Wirkung sind unklar.",
    output: "Diagnose-Liste mit Wirkung und empfohlenem Stage.",
    nextHandoff: "Diagnose bestimmt das benötigte Agenten-Team.",
  },
  {
    key: "design",
    order: 3,
    name: "Agenten-Team-Design",
    purpose: "Empfehlen, welche Agenten der Betrieb braucht — vom Chief of Staff allein bis zum vollen Bureau.",
    supportingAgents: ["chief-of-staff"],
    painAddressed: "Unklar, welche Unterstützung wirklich nötig ist.",
    output: "Agenten-Empfehlung (Tier) für die Situation.",
    nextHandoff: "Team geht in die manuelle Lieferung.",
  },
  {
    key: "manual_delivery",
    order: 4,
    name: "Manuelle Lieferung",
    purpose: "Erste Kunden im Concierge-Modus bedienen, während die Plattform wächst.",
    supportingAgents: ["chief-of-staff", "crm-agent", "follow-up-agent"],
    painAddressed: "Wert muss geliefert werden, bevor alles automatisiert ist.",
    output: "Implementierungsnotizen und freigegebene Agenten-Aufgaben.",
    nextHandoff: "Wiederholbares wird systematisiert.",
  },
  {
    key: "systemize",
    order: 5,
    name: "Systematisierung",
    purpose: "Wiederholte manuelle Arbeit in wiederverwendbare Playbooks und Workflows verwandeln.",
    supportingAgents: ["operations-agent", "content-agent", "document-agent"],
    painAddressed: "Gleiche Arbeit wird immer wieder von Hand erledigt.",
    output: "Wiederverwendbare Playbooks, Vorlagen und Freigaberegeln.",
    nextHandoff: "Systeme werden installiert.",
  },
  {
    key: "install",
    order: 6,
    name: "Installation",
    purpose: "Den AI Chief of Staff und das Agenten-Bureau in den Betrieb installieren.",
    supportingAgents: ["chief-of-staff"],
    painAddressed: "Der Betrieb braucht ein installiertes, kontrolliertes System — kein Tool zum Selbermachen.",
    output: "Installierte, übergebene und überwachte Konfiguration.",
    nextHandoff: "System geht in die Wartung.",
  },
  {
    key: "maintain",
    order: 7,
    name: "Wartung",
    purpose: "Laufender Betrieb: Monitoring, Updates, kundenspezifische Konfiguration, Verbesserungen.",
    supportingAgents: ["chief-of-staff", "operations-agent"],
    painAddressed: "Systeme veralten ohne Pflege; kein Einmalprojekt.",
    output: "Gesundheits-Checks, Audit-Logs und monatliche Empfehlungen.",
    nextHandoff: "Neue Findings starten den Zyklus erneut.",
  },
];

/** The lifecycle EVERY meaningful agent action must follow. No silent execution. */
export const SAFE_ACTION_LIFECYCLE: { step: SafeActionLifecycleStep; label: string }[] = [
  { step: "observe", label: "Beobachten" },
  { step: "prepare", label: "Vorbereiten" },
  { step: "propose", label: "Vorschlagen" },
  { step: "human_review", label: "Menschliche Freigabe" },
  { step: "execute", label: "Ausführen" },
  { step: "log", label: "Protokollieren" },
];

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

export const AGENT_RECOMMENDATIONS: AgentRecommendation[] = [
  { id: "rec-1", tier: "Chief of Staff", forSituation: "Erst einmal Übersicht und tägliche Priorität.", agents: ["chief-of-staff"] },
  { id: "rec-2", tier: "Chief of Staff + CRM Agent", forSituation: "Follow-ups und Beziehungen rutschen durch.", agents: ["chief-of-staff", "crm-agent"] },
  { id: "rec-3", tier: "Chief of Staff + Lead + Follow-Up", forSituation: "Leads kommen rein, aber gehen verloren.", agents: ["chief-of-staff", "lead-agent", "follow-up-agent"] },
  { id: "rec-4", tier: "Volles Agenten-Bureau", forSituation: "Operativer Betrieb soll durchgängig unterstützt werden.", agents: ["chief-of-staff", "lead-agent", "research-agent", "crm-agent", "calendar-agent", "operations-agent", "content-agent", "document-agent", "follow-up-agent"] },
];

export const INSTALLATION_STAGES: InstallationStage[] = [
  { id: "inst-1", label: "Setup", description: "Konten, Datenbasis und Berechtigungen einrichten." },
  { id: "inst-2", label: "Konfiguration", description: "Agenten und Playbooks auf den Betrieb zuschneiden." },
  { id: "inst-3", label: "Übergabe", description: "Einweisung im überwachten Betrieb." },
  { id: "inst-4", label: "Überwachter Betrieb", description: "Agenten arbeiten unter Freigabekontrolle." },
];

export const MAINTENANCE_ACTIONS: MaintenanceAction[] = [
  { id: "mnt-1", label: "Integrations-Gesundheit", cadence: "wöchentlich", description: "Verbindungen prüfen und reparieren." },
  { id: "mnt-2", label: "Agenten-Review", cadence: "monatlich", description: "Vorschlagsqualität und Risiken bewerten." },
  { id: "mnt-3", label: "Audit-Log-Durchsicht", cadence: "monatlich", description: "Freigaben und Aktionen nachvollziehen." },
  { id: "mnt-4", label: "Verbesserungs-Empfehlung", cadence: "monatlich", description: "Nächste Optimierungen vorschlagen." },
];
