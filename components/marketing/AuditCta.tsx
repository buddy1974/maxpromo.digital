import { LeadForm } from "./LeadForm";

// The primary conversion section. Two columns: the offer + the form.
export function AuditCta() {
  return (
    <section id="audit" className="bg-grid border-b border-zinc-200">
      <div className="mx-auto grid max-w-content gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
        <div>
          <p className="eyebrow">{"// Bereit?"}</p>
          <h2 className="mt-4 text-section-title text-zinc-900">
            Sehen Sie, was Ihr Betrieb aufhören kann, manuell zu tun.
          </h2>
          <p className="mt-5 max-w-md text-lg text-zinc-600">
            30 Minuten. Unverbindlich. Wir analysieren, wo Zeit, Kunden und
            Übersicht verloren gehen — und wo ein überwachtes KI-Team Sie
            entlastet.
          </p>
          <ul className="mt-8 space-y-3 text-zinc-700">
            {[
              "Klares Bild vor jeder Verpflichtung",
              "Kein Technik-Chaos — wir starten bei Ihrem Alltag",
              "Sie behalten die Kontrolle über jede Aktion",
            ].map((p) => (
              <li key={p} className="flex gap-3">
                <span className="mt-0.5 text-accent">✓</span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <LeadForm />
        </div>
      </div>
    </section>
  );
}
