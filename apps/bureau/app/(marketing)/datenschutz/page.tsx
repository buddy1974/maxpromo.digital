import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS } from "@maxpromo/config";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

export const metadata: Metadata = {
  title: "Datenschutz — Max Agent",
  robots: { index: false },
};

// Baseline DSGVO notice for the contact form. Reflects what the page actually
// does (form -> Neon EU + optional Telegram notification). Marcel should have a
// lawyer review before scaling paid traffic.
export default function DatenschutzPage() {
  return (
    <>
      <a href="#content" className="skip-link">Zum Inhalt springen</a>
      <Nav />
      <main id="content" className="mx-auto max-w-2xl px-6 py-20">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-[0.16em] text-ink-secondary hover:text-accent-text"
        >
          ← Zurück
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-ink">
          Datenschutzerklärung
        </h1>

        <div className="mt-8 space-y-7 text-ink-secondary">
          <Section title="1. Verantwortlicher">
            <p>
              {BUSINESS.legalName} ({BUSINESS.brand}), {BUSINESS.street},{" "}
              {BUSINESS.city}, {BUSINESS.country}. E-Mail: {BUSINESS.email}.
            </p>
          </Section>

          <Section title="2. Welche Daten wir verarbeiten">
            <p>
              Wenn Sie das Kontakt- bzw. Anfrageformular nutzen, verarbeiten wir
              die von Ihnen angegebenen Daten: Name, E-Mail-Adresse sowie optional
              Telefonnummer, Firma und Ihre Nachricht. Zusätzlich erfassen wir
              technische Zuordnungsdaten zur Herkunft Ihrer Anfrage (z. B.
              UTM-Parameter, Referrer), um unsere Kampagnen auszuwerten.
            </p>
          </Section>

          <Section title="3. Zweck und Rechtsgrundlage">
            <p>
              Die Verarbeitung erfolgt zur Bearbeitung Ihrer Anfrage und zur
              Vorbereitung eines möglichen Vertragsverhältnisses (Art. 6 Abs. 1
              lit. b DSGVO) sowie auf Basis unseres berechtigten Interesses an der
              Auswertung unserer Reichweite (Art. 6 Abs. 1 lit. f DSGVO).
            </p>
          </Section>

          <Section title="4. Speicherung und Empfänger">
            <p>
              Ihre Daten werden in einer Datenbank gespeichert, die in einem
              Rechenzentrum innerhalb der EU (Neon, Region Frankfurt) betrieben
              wird. Zur internen Benachrichtigung über neue Anfragen kann eine
              Nachricht an einen Messaging-Dienst (Telegram) gesendet werden.
              Eine Weitergabe zu Werbezwecken an Dritte erfolgt nicht.
            </p>
          </Section>

          <Section title="5. Speicherdauer">
            <p>
              Wir speichern Ihre Daten so lange, wie es zur Bearbeitung Ihrer
              Anfrage erforderlich ist, und löschen sie anschließend, sofern keine
              gesetzlichen Aufbewahrungspflichten entgegenstehen.
            </p>
          </Section>

          <Section title="6. Ihre Rechte">
            <p>
              Sie haben das Recht auf Auskunft, Berichtigung, Löschung,
              Einschränkung der Verarbeitung, Datenübertragbarkeit sowie
              Widerspruch. Zur Ausübung genügt eine E-Mail an {BUSINESS.email}.
              Zudem steht Ihnen ein Beschwerderecht bei einer Aufsichtsbehörde zu.
            </p>
          </Section>

          <p className="font-mono text-xs text-ink-muted">
            {"Stand: Basisfassung. Vor Skalierung von bezahltem Traffic rechtlich prüfen lassen."}
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-ink-muted">
        {title}
      </h2>
      <div className="mt-3 leading-relaxed">{children}</div>
    </section>
  );
}
