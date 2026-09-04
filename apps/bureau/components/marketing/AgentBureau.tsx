import { Icon, type IconName } from "@maxpromo/ui";
import { AgentSystemMap } from "./AgentSystemMap";

// Public agent team section. Operational identities only — no faces/avatars.
// Each specialist is presented as a discrete operational unit: name, function,
// approval scope. Chief hub gets an elevated treatment above the grid.

const CHIEF = {
  icon: "dashboard" as IconName,
  name:  "Chief of Staff",
  role:  "Die zentrale Koordinationsebene",
  desc:  "Priorisiert, koordiniert, eskaliert und erstellt das tägliche Briefing. Entscheidet nicht allein, sondern legt Aktionen zur Freigabe vor.",
};

const AGENTS = [
  {
    icon:     "leads" as IconName,
    name:     "Lead-Agent",
    fn:       "Anfragen & Qualifizierung",
    approval: "Direktkontakt",
  },
  {
    icon:     "research" as IconName,
    name:     "Research-Agent",
    fn:       "Markt & Wettbewerb",
    approval: "Externe Inhalte",
  },
  {
    icon:     "clients" as IconName,
    name:     "CRM-Agent",
    fn:       "Deals & Follow-ups",
    approval: "Kundennachrichten",
  },
  {
    icon:     "calendar" as IconName,
    name:     "Kalender-Agent",
    fn:       "Termine & Erinnerungen",
    approval: "Einladungsversand",
  },
  {
    icon:     "edit" as IconName,
    name:     "Content-Agent",
    fn:       "Entwürfe & Kampagnen",
    approval: "Veröffentlichung",
  },
  {
    icon:     "projects" as IconName,
    name:     "Operations-Agent",
    fn:       "Projekte & Deadlines",
    approval: "Aufgaben-Umverteilung",
  },
  {
    icon:     "documents" as IconName,
    name:     "Document-Agent",
    fn:       "Dokumente & Fristen",
    approval: "Externer Versand",
  },
  {
    icon:     "waiting" as IconName,
    name:     "Follow-Up-Agent",
    fn:       "Wartende Kunden",
    approval: "Jede externe Nachricht",
  },
  {
    icon:     "governance" as IconName,
    name:     "Governance-Agent",
    fn:       "KI-Risiken & Policy",
    approval: "Policy-Änderungen",
  },
];

export function AgentBureau() {
  return (
    <section id="bureau" className="border-b border-hairline">
      <div className="mx-auto max-w-content px-6 py-24 md:py-32">
        <p className="eyebrow">{"Das Team, kein Chatbot"}</p>
        <h2 className="mt-4 max-w-2xl text-section-title text-ink">
          Ein Chief of Staff. Ein überwachtes Agenten-Team.
        </h2>
        <p className="mt-4 max-w-2xl text-body text-ink-secondary">
          Jeder Agent beobachtet einen Geschäftsbereich, bereitet Entscheidungen
          vor und legt Aktionen zur Freigabe vor.{" "}
          <span className="font-medium text-ink">Keine unkontrollierte Ausführung.</span>
        </p>

        {/* Hub-and-spoke system map — architecture, not artwork */}
        <AgentSystemMap />

        {/* Chief of Staff — elevated */}
        <div className="mt-8 rounded-lg border border-accent/30 bg-accent-soft p-8 md:p-10">
          <div className="flex items-start gap-4">
            <span className="text-ink-secondary"><Icon name={CHIEF.icon} size="lg" /></span>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-card-title text-ink">{CHIEF.name}</h3>
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-secondary">
                  {CHIEF.role}
                </span>
              </div>
              <p className="mt-2 max-w-2xl text-ink-secondary">{CHIEF.desc}</p>
            </div>
          </div>
        </div>

        {/* Specialist bureau — one operational unit per card */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((a) => (
            <div key={a.name} className="card">
              <div className="flex items-start justify-between gap-3">
                <span className="text-ink-secondary"><Icon name={a.icon} size="md" /></span>
                <span className="rounded-full border border-hairline bg-surface-subtle px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                  Freigabe: {a.approval}
                </span>
              </div>
              <h4 className="mt-4 font-semibold text-ink">{a.name}</h4>
              <p className="mt-1 text-sm text-ink-secondary">{a.fn}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-2 text-xs text-ink-muted">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          Jede externe Aktion erfordert die angegebene Freigabe, bevor sie ausgeführt wird.
        </div>
      </div>
    </section>
  );
}
