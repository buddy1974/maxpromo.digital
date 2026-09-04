import { Icon } from "@maxpromo/ui";

// The supervised-operating-layer motif from maxpromo.digital: a live feed of
// agent events. Honestly labelled as a PRODUCT PREVIEW (pre-launch, not live data).
const ACTOR_ICON = { user: "user", agent: "agents", system: "system" } as const;

// "<actor>|<text>". The actor used to be a Unicode mark glued to the front of
// the string, which meant the feed's only classification lived inside its copy.
const EVENTS = [
  "user|Neue Anfrage erfasst — Essen",
  "agent|Lead-Agent qualifiziert Kontakt",
  "agent|Follow-up vorbereitet — wartet auf Freigabe",
  "system|Briefing erstellt — 08:00",
  "user|CRM synchronisiert — 14 Datensätze",
  "agent|Research-Agent: Markt-Scan abgeschlossen",
  "agent|Termin vorgeschlagen — Kalender",
  "system|Content-Entwurf bereit zur Prüfung",
  "user|Überfällige Aufgabe markiert",
];

export function StatusTicker() {
  const loop = [...EVENTS, ...EVENTS];
  return (
    <div className="overflow-hidden rounded-lg border border-hairline bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          System-Status
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-secondary">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          Produktvorschau
        </span>
      </div>
      <div className="relative whitespace-nowrap py-2.5">
        <div className="animate-ticker inline-flex gap-8 px-4 font-mono text-xs text-ink-secondary">
          {loop.map((e, i) => (
            <span key={i} className="flex shrink-0 items-center gap-2">
              <Icon name={ACTOR_ICON[e.split("|")[0] as keyof typeof ACTOR_ICON]} size="xs" />
              {e.split("|")[1]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
