// Outcomes, not features — per the core philosophy ("people buy outcomes").
const PILLARS = [
  {
    glyph: "◇",
    title: "Organisation",
    desc: "Anfragen, Aufgaben, Kontakte und Projekte an einem Ort. Nichts liegt mehr in fünf Tools verstreut.",
  },
  {
    glyph: "→",
    title: "Follow-through",
    desc: "Jede Chance bekommt ein nächstes To-do. Follow-ups werden vorbereitet, nicht vergessen.",
  },
  {
    glyph: "◎",
    title: "Klarheit",
    desc: "Ein tägliches Briefing beantwortet: Was braucht Aufmerksamkeit? Was kommt als Nächstes?",
  },
];

export function Pillars() {
  return (
    <section className="border-b border-zinc-200">
      <div className="mx-auto max-w-content px-6 py-24 md:py-32">
        <p className="eyebrow">{"// Was Sie davon haben"}</p>
        <h2 className="mt-4 max-w-2xl text-section-title text-zinc-900">
          Wir verkaufen keine KI. Wir verkaufen Ergebnisse.
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.title} className="card">
              <span className="font-mono text-2xl text-accent">{p.glyph}</span>
              <h3 className="mt-4 text-card-title text-zinc-900">{p.title}</h3>
              <p className="mt-2 text-body text-zinc-600">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
