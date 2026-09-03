// The "you are the bottleneck" narrative, in the Maxpromo voice.
const BEFORE = [
  "Anfragen kommen nach Feierabend — und gehen unter.",
  "Follow-ups rutschen durch. Kunden buchen woanders.",
  "Fünf Werkzeuge, keines spricht mit dem anderen.",
  "Jede Entscheidung wartet auf Sie.",
];

const AFTER = [
  "Jede Anfrage wird erfasst und vorbereitet.",
  "Follow-ups stehen bereit — Sie geben frei.",
  "Ihre Werkzeuge laufen über ein System zusammen.",
  "Sie steuern. Das Team führt aus.",
];

export function BeforeAfter() {
  return (
    <section className="border-b border-hairline">
      <div className="mx-auto max-w-content px-6 py-24 md:py-32">
        <p className="eyebrow">{"Klingt bekannt?"}</p>
        <h2 className="mt-4 max-w-2xl text-section-title text-ink">
          Sie sind der Engpass. Das muss nicht so bleiben.
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="card">
            <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
              Heute — manuell
            </h3>
            <ul className="mt-5 space-y-4">
              {BEFORE.map((b) => (
                <li key={b} className="flex gap-3 text-ink-secondary">
                  <span className="mt-1 text-ink-muted">—</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-accent/30 bg-accent-soft p-10">
            <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-ink-secondary">
              Mit Max Agent — überwacht
            </h3>
            <ul className="mt-5 space-y-4">
              {AFTER.map((a) => (
                <li key={a} className="flex gap-3 text-ink">
                  <span className="mt-0.5 text-ink-secondary">✓</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
