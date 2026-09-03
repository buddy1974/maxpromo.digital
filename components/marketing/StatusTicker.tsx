// The supervised-operating-layer motif from maxpromo.digital: a live feed of
// agent events. Honestly labelled as a PRODUCT PREVIEW (pre-launch, not live data).
const EVENTS = [
  "● Neue Anfrage erfasst — Essen",
  "⊟ Lead-Agent qualifiziert Kontakt",
  "→ Follow-up vorbereitet — wartet auf Freigabe",
  "◆ Briefing erstellt — 08:00",
  "● CRM synchronisiert — 14 Datensätze",
  "⊟ Research-Agent: Markt-Scan abgeschlossen",
  "→ Termin vorgeschlagen — Kalender",
  "◆ Content-Entwurf bereit zur Prüfung",
  "● Überfällige Aufgabe markiert",
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
            <span key={i} className="shrink-0">
              {e}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
