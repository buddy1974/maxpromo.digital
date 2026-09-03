import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Impressum / Legal Notice',
  description: 'Angaben gemäß § 5 DDG, Mandatory information per § 5 DDG',
  robots: { index: true, follow: false },
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--color-bg-section)',
        borderLeft: '3px solid var(--color-primary)',
        borderRadius: 'var(--radius-card)',
        padding: '1.75rem 2.25rem',
        marginBottom: '1.5rem',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--brand-font-sans)',
          fontSize: '12px',
          color: 'var(--brand-text-secondary)',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: '12px',
        }}
      >
        {label}
      </p>
      <div
        style={{
          color: 'var(--color-text-primary)',
          lineHeight: '1.8',
          fontFamily: 'var(--font-body)',
          fontSize: '16px',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default function ImpressumPage() {
  return (
    <main style={{ background: 'var(--color-bg)', minHeight: '100vh', paddingTop: '7rem', paddingBottom: '7rem' }}>
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '0 1.5rem' }}>

        <p
          style={{
            fontFamily: 'var(--brand-font-sans)',
            fontSize: '13px',
            color: 'var(--brand-text-secondary)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: '12px',
          }}
        >
          Rechtliches / Legal
        </p>
        <h1 style={{ marginBottom: '8px' }}>
          Impressum
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '16px',
            color: 'var(--color-text-secondary)',
            marginBottom: '3rem',
          }}
        >
          Angaben gemäß § 5 DDG · Mandatory information per § 5 DDG
        </p>

        <Section label="Diensteanbieter / Service Provider">
          <p style={{ margin: 0 }}>
            Marcel Tabit Akwe<br />
            Körnerstr. 8<br />
            45143 Essen<br />
            Deutschland / Germany
          </p>
        </Section>

        <Section label="Kontakt / Contact">
          <p style={{ margin: 0 }}>
            Telefon: <a href="tel:+491733645698" style={{ color: 'var(--brand-text-secondary)', textDecoration: 'none' }}>+49 173 3645698</a><br />
            E-Mail: <a href="mailto:info@maxpromo.digital" style={{ color: 'var(--brand-text-secondary)', textDecoration: 'none' }}>info@maxpromo.digital</a><br />
            Web: <a href="https://maxpromo.digital" style={{ color: 'var(--brand-text-secondary)', textDecoration: 'none' }}>https://maxpromo.digital</a>
          </p>
        </Section>

        <Section label="Beruf / Profession">
          <p style={{ margin: 0 }}>
            Softwareentwickler und IT-Berater<br />
            <span style={{ color: 'var(--color-text-secondary)' }}>Software Developer and IT Consultant</span>
          </p>
        </Section>

        <Section label="Steuerliche Angaben / Tax Information">
          <p style={{ margin: 0 }}>
            Steuernummer: 111/5339/7597<br />
            Finanzamt: Essen-NordOst<br /><br />
            Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.<br />
            <span style={{ color: 'var(--color-text-secondary)' }}>VAT exempt per § 19 UStG (Kleinunternehmerregelung).</span>
          </p>
        </Section>

        <Section label="Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV">
          <p style={{ margin: 0 }}>
            Marcel Tabit Akwe<br />
            Körnerstr. 8<br />
            45143 Essen
          </p>
        </Section>

        <Section label="Streitschlichtung / Dispute Resolution">
          <p style={{ marginTop: 0 }}>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--brand-text-secondary)', textDecoration: 'none' }}
            >
              https://ec.europa.eu/consumers/odr
            </a>
          </p>
          <p>
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 0 }}>
            The European Commission provides a platform for online dispute resolution:{' '}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--brand-text-secondary)', textDecoration: 'none' }}
            >
              https://ec.europa.eu/consumers/odr
            </a>
            <br />
            We are not willing or obliged to participate in dispute resolution proceedings before a
            consumer arbitration board.
          </p>
        </Section>

        <Section label="Haftung für Inhalte / Liability for Content">
          <p style={{ marginTop: 0 }}>
            Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten
            nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als
            Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
            Informationen zu überwachen.
          </p>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 0 }}>
            As a service provider, we are responsible for our own content on these pages in accordance
            with general laws per § 7 Abs. 1 DDG. However, we are not obligated to monitor transmitted
            or stored third-party information per §§ 8–10 DDG.
          </p>
        </Section>

        <Section label="Urheberrecht / Copyright">
          <p style={{ marginTop: 0 }}>
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
            dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art
            der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen
            Zustimmung des jeweiligen Autors bzw. Erstellers.
          </p>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 0 }}>
            The content and works created by the site operators on these pages are subject to German
            copyright law. Reproduction, processing, distribution and any form of commercialisation
            beyond the limits of copyright require the written consent of the respective author or
            creator.
          </p>
        </Section>

        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--color-text-secondary)',
            marginTop: '3rem',
            textAlign: 'center',
          }}
        >
          Stand / Last updated: April 2026
        </p>
      </div>
    </main>
  )
}
