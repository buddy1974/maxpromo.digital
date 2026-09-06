import { Icon, type IconName } from "@maxpromo/ui";

// Outcomes, not features — per the core philosophy ("people buy outcomes").
const PILLARS = [
  {
    icon: "agents" as IconName,
    title: "Organisation",
    desc: "Anfragen, Aufgaben, Kontakte und Projekte an einem Ort. Nichts liegt mehr in fünf Tools verstreut.",
  },
  {
    icon: "arrowRight" as IconName,
    title: "Follow-through",
    desc: "Jede Chance bekommt ein nächstes To-do. Follow-ups werden vorbereitet, nicht vergessen.",
  },
  {
    icon: "memory" as IconName,
    title: "Klarheit",
    desc: "Ein tägliches Briefing beantwortet: Was braucht Aufmerksamkeit? Was kommt als Nächstes?",
  },
];

export function Pillars() {
  return (
    <section className="border-b border-hairline">
      <div className="mx-auto max-w-content px-6 py-24 md:py-32">
        <p className="eyebrow">{"Was Sie davon haben"}</p>
        <h2 className="mt-4 max-w-2xl text-section-title text-ink">
          Wir verkaufen keine KI. Wir verkaufen Ergebnisse.
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.title} className="card">
              <span className="text-ink-secondary"><Icon name={p.icon} size="lg" /></span>
              <h3 className="mt-4 text-card-title text-ink">{p.title}</h3>
              <p className="mt-2 text-body text-ink-secondary">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
