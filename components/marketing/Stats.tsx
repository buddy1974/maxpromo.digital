// Honest framing: the headline promise is the offer (Marcel's own pitch).
// Hard delivery numbers belong to Maxpromo's installed systems — linked, not faked.
const STATS = [
  { value: "10–15 Std.", label: "Zeit pro Woche, die Sie zurückgewinnen sollen" },
  { value: "Sie", label: "behalten die Kontrolle — jede Aktion wird freigegeben" },
  { value: "15+ Jahre", label: "Erfahrung mit echten Produktionssystemen" },
];

export function Stats() {
  return (
    <section className="border-b border-zinc-200 bg-surface-subtle">
      <div className="mx-auto max-w-content px-6 py-20">
        <div className="grid gap-8 sm:grid-cols-3">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-semibold tracking-tight text-accent md:text-4xl">
                {s.value}
              </div>
              <div className="mt-2 text-sm text-zinc-600">{s.label}</div>
            </div>
          ))}
        </div>
        <p className="mt-8 font-mono text-xs text-zinc-500">
          {"// Belastbare Ergebnis-Zahlen stammen aus echten, installierten Maxpromo-Systemen"}{" "}
          —{" "}
          <a
            href="https://www.maxpromo.digital/de/case-studies"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-600 underline underline-offset-2 hover:text-accent"
          >
            Fallstudien ansehen
          </a>
          .
        </p>
      </div>
    </section>
  );
}
