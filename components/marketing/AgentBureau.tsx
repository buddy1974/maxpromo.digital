import { AgentSystemMap } from "./AgentSystemMap";

// Public agent team section. Operational identities only — no faces/avatars.
// Each specialist is presented as a discrete operational unit: name, function,
// approval scope. Chief hub gets an elevated treatment above the grid.

const CHIEF = {
  glyph: "◆",
  name:  "Chief of Staff",
  role:  "Die zentrale Koordinationsebene",
  desc:  "Priorisiert, koordiniert, eskaliert und erstellt das tägliche Briefing. Entscheidet nicht allein, sondern legt Aktionen zur Freigabe vor.",
};

const AGENTS = [
  {
    glyph:    "⊟",
    name:     "Lead-Agent",
    fn:       "Anfragen & Qualifizierung",
    approval: "Direktkontakt",
  },
  {
    glyph:    "▤",
    name:     "Research-Agent",
    fn:       "Markt & Wettbewerb",
    approval: "Externe Inhalte",
  },
  {
    glyph:    "→",
    name:     "CRM-Agent",
    fn:       "Deals & Follow-ups",
    approval: "Kundennachrichten",
  },
  {
    glyph:    "▦",
    name:     "Kalender-Agent",
    fn:       "Termine & Erinnerungen",
    approval: "Einladungsversand",
  },
  {
    glyph:    "✎",
    name:     "Content-Agent",
    fn:       "Entwürfe & Kampagnen",
    approval: "Veröffentlichung",
  },
  {
    glyph:    "◰",
    name:     "Operations-Agent",
    fn:       "Projekte & Deadlines",
    approval: "Aufgaben-Umverteilung",
  },
  {
    glyph:    "▢",
    name:     "Document-Agent",
    fn:       "Dokumente & Fristen",
    approval: "Externer Versand",
  },
  {
    glyph:    "◷",
    name:     "Follow-Up-Agent",
    fn:       "Wartende Kunden",
    approval: "Jede externe Nachricht",
  },
  {
    glyph:    "⚐",
    name:     "Governance-Agent",
    fn:       "KI-Risiken & Policy",
    approval: "Policy-Änderungen",
  },
];

export function AgentBureau() {
  return (
    <section id="bureau" className="border-b border-zinc-200">
      <div className="mx-auto max-w-content px-6 py-24 md:py-32">
        <p className="eyebrow">{"// Das Team, kein Chatbot"}</p>
        <h2 className="mt-4 max-w-2xl text-section-title text-zinc-900">
          Ein Chief of Staff. Ein überwachtes Agenten-Team.
        </h2>
        <p className="mt-4 max-w-2xl text-body text-zinc-600">
          Jeder Agent beobachtet einen Geschäftsbereich, bereitet Entscheidungen
          vor und legt Aktionen zur Freigabe vor.{" "}
          <span className="font-medium text-zinc-900">Keine unkontrollierte Ausführung.</span>
        </p>

        {/* Hub-and-spoke system map — architecture, not artwork */}
        <AgentSystemMap />

        {/* Chief of Staff — elevated */}
        <div className="mt-8 rounded-lg border border-accent/30 bg-accent-soft p-8 md:p-10">
          <div className="flex items-start gap-4">
            <span className="font-mono text-2xl text-accent">{CHIEF.glyph}</span>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-card-title text-zinc-900">{CHIEF.name}</h3>
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
                  {CHIEF.role}
                </span>
              </div>
              <p className="mt-2 max-w-2xl text-zinc-600">{CHIEF.desc}</p>
            </div>
          </div>
        </div>

        {/* Specialist bureau — one operational unit per card */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((a) => (
            <div key={a.name} className="card">
              <div className="flex items-start justify-between gap-3">
                <span className="font-mono text-xl text-accent">{a.glyph}</span>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                  Freigabe: {a.approval}
                </span>
              </div>
              <h4 className="mt-4 font-semibold text-zinc-900">{a.name}</h4>
              <p className="mt-1 text-sm text-zinc-600">{a.fn}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-2 text-xs text-zinc-500">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          Jede externe Aktion erfordert die angegebene Freigabe, bevor sie ausgeführt wird.
        </div>
      </div>
    </section>
  );
}
