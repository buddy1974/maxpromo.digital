import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Datenschutzerklärung / Privacy Policy',
  description: 'Informationen zum Datenschutz gemäß DSGVO, Data protection information per GDPR',
  robots: { index: true, follow: false },
}

function Section({ label, id, children }: { label: string; id?: string; children: React.ReactNode }) {
  return (
    <div
      id={id}
      style={{
        background: 'var(--brand-surface-subtle)',
        borderLeft: '3px solid var(--brand-primary-edge)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.75rem 2.25rem',
        marginBottom: 'var(--space-5)',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--brand-font-sans)',
          fontSize: '12px',
          color: 'var(--brand-text-secondary)',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: 'var(--space-3)',
        }}
      >
        {label}
      </p>
      <div
        style={{
          color: 'var(--brand-text)',
          lineHeight: '1.8',
          fontFamily: 'var(--brand-font-body)',
          fontSize: '16px',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <main style={{ background: 'var(--brand-background)', minHeight: '100vh', paddingTop: 'var(--space-20)', paddingBottom: 'var(--space-20)' }}>
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '0 var(--space-5)' }}>

        <p
          style={{
            fontFamily: 'var(--brand-font-sans)',
            fontSize: 'var(--text-micro)',
            color: 'var(--brand-text-secondary)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: 'var(--space-3)',
          }}
        >
          Rechtliches / Legal
        </p>
        <h1 style={{ marginBottom: 'var(--space-2)' }}>
          Datenschutzerklärung
          <span style={{ display: 'block', fontSize: '0.55em', color: 'var(--brand-text-secondary)', fontWeight: 400, marginTop: 'var(--space-1)' }}>
            Privacy Policy
          </span>
        </h1>
        <p
          style={{
            fontFamily: 'var(--brand-font-body)',
            fontSize: '16px',
            color: 'var(--brand-text-secondary)',
            marginBottom: 'var(--space-8)',
          }}
        >
          Informationen zum Datenschutz gemäß DSGVO · Data protection per GDPR
        </p>

        <Section label="1 · Verantwortlicher / Data Controller">
          <p style={{ marginTop: 0 }}>
            Marcel Tabit Akwe<br />
            Körnerstr. 8, 45143 Essen, Deutschland<br />
            <a href="mailto:info@maxpromo.digital" style={{ color: 'var(--brand-text-secondary)', textDecoration: 'none' }}>
              info@maxpromo.digital
            </a>{' '}·{' '}
            <a href="tel:+491733645698" style={{ color: 'var(--brand-text-secondary)', textDecoration: 'none' }}>
              +49 173 3645698
            </a>
          </p>
          <p style={{ color: 'var(--brand-text-secondary)', marginBottom: 0 }}>
            For all data protection enquiries, contact us at the address above.
          </p>
        </Section>

        <Section label="2 · Welche Daten wir erheben / What Data We Collect">
          <p style={{ marginTop: 0, fontWeight: 500, color: 'var(--brand-text)' }}>Kontaktformular / Contact Form</p>
          <p>
            Name, E-Mail-Adresse, Unternehmen, Nachricht.<br />
            Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung).<br />
            <span style={{ color: 'var(--brand-text-secondary)' }}>
              Legal basis: Art. 6(1)(b) GDPR, pre-contractual measures.
            </span>
          </p>

          <p style={{ fontWeight: 500, color: 'var(--brand-text)' }}>Kontaktformular / Contact form</p>
          <p>
            Name, E-Mail-Adresse, Unternehmen, Branche, Mitarbeiterzahl, Umsatzbereich, Herausforderungen.<br />
            Diese Daten werden ausschließlich zur Erstellung Ihres persönlichen Audit-Berichts verwendet
            und nicht an Dritte verkauft oder weitergegeben.<br />
            Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.<br />
            <span style={{ color: 'var(--brand-text-secondary)' }}>
              Legal basis: Art. 6(1)(b) GDPR. Data is used solely to respond to your enquiry. Never sold or shared beyond service providers listed below.
            </span>
          </p>

          <p style={{ fontWeight: 500, color: 'var(--brand-text)' }}>Chat-Widget (Max)</p>
          <p>
            Gesprächsinhalte werden nicht dauerhaft gespeichert. Sitzungsdaten werden nach Sitzungsende gelöscht.<br />
            Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).<br />
            <span style={{ color: 'var(--brand-text-secondary)' }}>
              Legal basis: Art. 6(1)(f) GDPR, legitimate interest. Conversation content is session-only and not permanently stored.
            </span>
          </p>

          <p style={{ fontWeight: 500, color: 'var(--brand-text)' }}>Server-Logs</p>
          <p style={{ marginBottom: 0 }}>
            IP-Adresse, Browser-Typ, aufgerufene Seiten, Zeitstempel. Speicherdauer: max. 7 Tage.<br />
            Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.<br />
            <span style={{ color: 'var(--brand-text-secondary)' }}>
              Legal basis: Art. 6(1)(f) GDPR, legitimate interest in operating a secure service. Deleted after 7 days.
            </span>
          </p>
        </Section>

        <Section label="3 · Zweck der Verarbeitung / Purpose of Processing">
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            <li>Beantwortung von Anfragen / Responding to enquiries</li>
            <li>Bearbeitung von Kontaktanfragen / Responding to contact enquiries</li>
            <li>Verbesserung unserer Dienstleistungen / Improving our services</li>
            <li>Einhaltung gesetzlicher Anforderungen / Legal compliance</li>
          </ul>
        </Section>

        <Section label="4 · Weitergabe an Dritte / Third-Party Disclosure">
          <p style={{ marginTop: 0 }}>
            Ihre Daten werden nicht verkauft. Wir setzen folgende Auftragsverarbeiter ein:
          </p>
          <p style={{ color: 'var(--brand-text-secondary)', fontSize: '14px' }}>
            Your data is never sold. We use the following processors:
          </p>
          <ul style={{ paddingLeft: '1.25rem' }}>
            <li>
              <strong style={{ color: 'var(--brand-text)' }}>Vercel Inc.</strong> (Hosting, USA)-{' '}
              <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-text-secondary)', textDecoration: 'none' }}>
                Privacy Policy
              </a>
            </li>
            <li>
              <strong style={{ color: 'var(--brand-text)' }}>Resend Inc.</strong> (E-Mail-Versand / Email delivery, USA)-{' '}
              <a href="https://resend.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-text-secondary)', textDecoration: 'none' }}>
                Privacy Policy
              </a>
            </li>
            <li>
              <strong style={{ color: 'var(--brand-text)' }}>Anthropic PBC</strong> (KI-Verarbeitung / AI processing, USA, keine dauerhafte Speicherung / no permanent storage)-{' '}
              <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-text-secondary)', textDecoration: 'none' }}>
                Privacy Policy
              </a>
            </li>
          </ul>
          <p style={{ marginBottom: 0 }}>
            Datenübertragungen in die USA erfolgen auf Basis von Standardvertragsklauseln (SCC) gemäß
            Art. 46 DSGVO.{' '}
            <span style={{ color: 'var(--brand-text-secondary)' }}>
              US data transfers are covered by Standard Contractual Clauses (SCCs) per Art. 46 GDPR.
            </span>
          </p>
        </Section>

        <Section label="5 · Speicherdauer / Retention Period">
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            <li>
              Kontakt- und Audit-Anfragen: 3 Jahre (handelsrechtliche Aufbewahrungspflicht § 257 HGB)<br />
              <span style={{ color: 'var(--brand-text-secondary)', fontSize: '14px' }}>Contact enquiries: 3 years (commercial law requirement §257 HGB)</span>
            </li>
            <li>
              Server-Logs: 7 Tage / Server logs: 7 days
            </li>
            <li>
              Chat-Gespräche: nur Sitzungsdauer, keine Speicherung / Chat conversations: session only, not stored
            </li>
          </ul>
        </Section>

        <Section label="6 · Ihre Rechte / Your Rights">
          <p style={{ marginTop: 0 }}>
            Gemäß Art. 15–21 DSGVO haben Sie folgende Rechte:{' '}
            <span style={{ color: 'var(--brand-text-secondary)' }}>Per Art. 15–21 GDPR you have the right to:</span>
          </p>
          <ul style={{ paddingLeft: '1.25rem' }}>
            <li><strong style={{ color: 'var(--brand-text)' }}>Auskunft</strong> / Access (Art. 15)</li>
            <li><strong style={{ color: 'var(--brand-text)' }}>Berichtigung</strong> / Rectification (Art. 16)</li>
            <li><strong style={{ color: 'var(--brand-text)' }}>Löschung</strong> / Erasure (Art. 17)</li>
            <li><strong style={{ color: 'var(--brand-text)' }}>Einschränkung</strong> / Restriction of processing (Art. 18)</li>
            <li><strong style={{ color: 'var(--brand-text)' }}>Widerspruch</strong> / Objection (Art. 21)</li>
            <li><strong style={{ color: 'var(--brand-text)' }}>Datenübertragbarkeit</strong> / Data portability (Art. 20)</li>
          </ul>
          <p style={{ marginBottom: 0 }}>
            Zur Ausübung Ihrer Rechte wenden Sie sich an:{' '}
            <a href="mailto:info@maxpromo.digital" style={{ color: 'var(--brand-text-secondary)', textDecoration: 'none' }}>
              info@maxpromo.digital
            </a>
          </p>
        </Section>

        <Section label="7 · Beschwerderecht / Right to Complain">
          <p style={{ marginTop: 0 }}>
            Sie haben das Recht, eine Beschwerde bei der zuständigen Aufsichtsbehörde einzureichen:
          </p>
          <p>
            <strong style={{ color: 'var(--brand-text)' }}>
              Landesbeauftragte für Datenschutz und Informationsfreiheit NRW
            </strong><br />
            Postfach 20 04 44<br />
            40102 Düsseldorf<br />
            <a href="https://www.ldi.nrw.de" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-text-secondary)', textDecoration: 'none' }}>
              https://www.ldi.nrw.de
            </a>
          </p>
          <p style={{ color: 'var(--brand-text-secondary)', marginBottom: 0 }}>
            You have the right to lodge a complaint with the supervisory authority for data protection in
            North Rhine-Westphalia at the address above.
          </p>
        </Section>

        <Section label="8 · Cookies" id="cookies">
          <p style={{ marginTop: 0 }}>
            Wir verwenden <strong style={{ color: 'var(--brand-text)' }}>keine Tracking- oder Werbe-Cookies</strong>.
            Es werden ausschließlich technisch notwendige Sitzungsdaten verwendet, um den Betrieb der
            Website zu gewährleisten. Eine Einwilligung ist gemäß § 25 TTDSG nicht erforderlich.
          </p>
          <p style={{ color: 'var(--brand-text-secondary)', marginBottom: 0 }}>
            We use <strong>no tracking or advertising cookies</strong>. Only technically necessary
            session data is used to operate the website. No consent is required per §25 TTDSG.
          </p>
        </Section>

        <Section label="9 · Änderungen / Changes">
          <p style={{ margin: 0 }}>
            Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf zu aktualisieren.{' '}
            <span style={{ color: 'var(--brand-text-secondary)' }}>
              We reserve the right to update this privacy policy as required.
            </span>
          </p>
        </Section>

        <p
          style={{
            fontFamily: 'var(--brand-font-mono)',
            fontSize: 'var(--text-label)',
            color: 'var(--brand-text-secondary)',
            marginTop: 'var(--space-8)',
            textAlign: 'center',
          }}
        >
          Stand / Last updated: April 2026
        </p>
      </div>
    </main>
  )
}
