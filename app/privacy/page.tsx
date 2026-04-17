import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Datenschutzerklärung / Privacy Policy',
  description: 'Informationen zum Datenschutz gemäß DSGVO — Data protection information per GDPR',
  robots: { index: true, follow: false },
}

function Section({ label, id, children }: { label: string; id?: string; children: React.ReactNode }) {
  return (
    <div
      id={id}
      style={{
        background: '#111111',
        borderLeft: '3px solid #F97316',
        padding: '1.5rem 2rem',
        marginBottom: '1.25rem',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-roboto-mono)',
          fontSize: '10px',
          color: '#F97316',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          marginBottom: '12px',
        }}
      >
        {label}
      </p>
      <div
        style={{
          color: '#CCCCCC',
          lineHeight: '1.8',
          fontFamily: 'var(--font-inter)',
          fontSize: '15px',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <main style={{ background: '#0A0A0A', minHeight: '100vh', paddingTop: '6rem', paddingBottom: '6rem' }}>
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '0 1.5rem' }}>

        <p
          style={{
            fontFamily: 'var(--font-roboto-mono)',
            fontSize: '11px',
            color: '#F97316',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: '12px',
          }}
        >
          Rechtliches / Legal
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 700,
            color: '#FFFFFF',
            marginBottom: '8px',
            lineHeight: 1.1,
          }}
        >
          Datenschutzerklärung
          <span style={{ display: 'block', fontSize: '0.55em', color: '#888888', fontWeight: 400, marginTop: '4px' }}>
            Privacy Policy
          </span>
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '15px',
            color: '#888888',
            marginBottom: '3rem',
          }}
        >
          Informationen zum Datenschutz gemäß DSGVO · Data protection per GDPR
        </p>

        <Section label="1 · Verantwortlicher / Data Controller">
          <p style={{ marginTop: 0 }}>
            Marcel Tabit Akwe<br />
            Körnerstr. 8, 45143 Essen, Deutschland<br />
            <a href="mailto:info@maxpromo.digital" style={{ color: '#F97316', textDecoration: 'none' }}>
              info@maxpromo.digital
            </a>{' '}·{' '}
            <a href="tel:+491733645698" style={{ color: '#F97316', textDecoration: 'none' }}>
              +49 173 3645698
            </a>
          </p>
          <p style={{ color: '#888888', marginBottom: 0 }}>
            For all data protection enquiries, contact us at the address above.
          </p>
        </Section>

        <Section label="2 · Welche Daten wir erheben / What Data We Collect">
          <p style={{ marginTop: 0, fontWeight: 500, color: '#FFFFFF' }}>Kontaktformular / Contact Form</p>
          <p>
            Name, E-Mail-Adresse, Unternehmen, Nachricht.<br />
            Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung).<br />
            <span style={{ color: '#888888' }}>
              Legal basis: Art. 6(1)(b) GDPR — pre-contractual measures.
            </span>
          </p>

          <p style={{ fontWeight: 500, color: '#FFFFFF' }}>Automation-Audit-Formular / Free Automation Audit</p>
          <p>
            Name, E-Mail-Adresse, Unternehmen, Branche, Mitarbeiterzahl, Umsatzbereich, Herausforderungen.<br />
            Diese Daten werden ausschließlich zur Erstellung Ihres persönlichen Audit-Berichts verwendet
            und nicht an Dritte verkauft oder weitergegeben.<br />
            Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.<br />
            <span style={{ color: '#888888' }}>
              Legal basis: Art. 6(1)(b) GDPR. Data used solely to generate your audit report. Never sold or shared beyond service providers listed below.
            </span>
          </p>

          <p style={{ fontWeight: 500, color: '#FFFFFF' }}>Chat-Widget (Max)</p>
          <p>
            Gesprächsinhalte werden nicht dauerhaft gespeichert. Sitzungsdaten werden nach Sitzungsende gelöscht.<br />
            Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).<br />
            <span style={{ color: '#888888' }}>
              Legal basis: Art. 6(1)(f) GDPR — legitimate interest. Conversation content is session-only and not permanently stored.
            </span>
          </p>

          <p style={{ fontWeight: 500, color: '#FFFFFF' }}>Server-Logs</p>
          <p style={{ marginBottom: 0 }}>
            IP-Adresse, Browser-Typ, aufgerufene Seiten, Zeitstempel. Speicherdauer: max. 7 Tage.<br />
            Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.<br />
            <span style={{ color: '#888888' }}>
              Legal basis: Art. 6(1)(f) GDPR — legitimate interest in operating a secure service. Deleted after 7 days.
            </span>
          </p>
        </Section>

        <Section label="3 · Zweck der Verarbeitung / Purpose of Processing">
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            <li>Beantwortung von Anfragen / Responding to enquiries</li>
            <li>Bereitstellung von Automation-Audit-Berichten / Delivering audit reports</li>
            <li>Verbesserung unserer Dienstleistungen / Improving our services</li>
            <li>Einhaltung gesetzlicher Anforderungen / Legal compliance</li>
          </ul>
        </Section>

        <Section label="4 · Weitergabe an Dritte / Third-Party Disclosure">
          <p style={{ marginTop: 0 }}>
            Ihre Daten werden nicht verkauft. Wir setzen folgende Auftragsverarbeiter ein:
          </p>
          <p style={{ color: '#888888', fontSize: '13px' }}>
            Your data is never sold. We use the following processors:
          </p>
          <ul style={{ paddingLeft: '1.25rem' }}>
            <li>
              <strong style={{ color: '#FFFFFF' }}>Vercel Inc.</strong> (Hosting, USA) —{' '}
              <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#F97316', textDecoration: 'none' }}>
                Privacy Policy
              </a>
            </li>
            <li>
              <strong style={{ color: '#FFFFFF' }}>Resend Inc.</strong> (E-Mail-Versand / Email delivery, USA) —{' '}
              <a href="https://resend.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#F97316', textDecoration: 'none' }}>
                Privacy Policy
              </a>
            </li>
            <li>
              <strong style={{ color: '#FFFFFF' }}>Anthropic PBC</strong> (KI-Verarbeitung / AI processing, USA — keine dauerhafte Speicherung / no permanent storage) —{' '}
              <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#F97316', textDecoration: 'none' }}>
                Privacy Policy
              </a>
            </li>
          </ul>
          <p style={{ marginBottom: 0 }}>
            Datenübertragungen in die USA erfolgen auf Basis von Standardvertragsklauseln (SCC) gemäß
            Art. 46 DSGVO.{' '}
            <span style={{ color: '#888888' }}>
              US data transfers are covered by Standard Contractual Clauses (SCCs) per Art. 46 GDPR.
            </span>
          </p>
        </Section>

        <Section label="5 · Speicherdauer / Retention Period">
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            <li>
              Kontakt- und Audit-Anfragen: 3 Jahre (handelsrechtliche Aufbewahrungspflicht § 257 HGB)<br />
              <span style={{ color: '#888888', fontSize: '13px' }}>Contact and audit enquiries: 3 years (commercial law requirement §257 HGB)</span>
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
            <span style={{ color: '#888888' }}>Per Art. 15–21 GDPR you have the right to:</span>
          </p>
          <ul style={{ paddingLeft: '1.25rem' }}>
            <li><strong style={{ color: '#FFFFFF' }}>Auskunft</strong> / Access (Art. 15)</li>
            <li><strong style={{ color: '#FFFFFF' }}>Berichtigung</strong> / Rectification (Art. 16)</li>
            <li><strong style={{ color: '#FFFFFF' }}>Löschung</strong> / Erasure (Art. 17)</li>
            <li><strong style={{ color: '#FFFFFF' }}>Einschränkung</strong> / Restriction of processing (Art. 18)</li>
            <li><strong style={{ color: '#FFFFFF' }}>Widerspruch</strong> / Objection (Art. 21)</li>
            <li><strong style={{ color: '#FFFFFF' }}>Datenübertragbarkeit</strong> / Data portability (Art. 20)</li>
          </ul>
          <p style={{ marginBottom: 0 }}>
            Zur Ausübung Ihrer Rechte wenden Sie sich an:{' '}
            <a href="mailto:info@maxpromo.digital" style={{ color: '#F97316', textDecoration: 'none' }}>
              info@maxpromo.digital
            </a>
          </p>
        </Section>

        <Section label="7 · Beschwerderecht / Right to Complain">
          <p style={{ marginTop: 0 }}>
            Sie haben das Recht, eine Beschwerde bei der zuständigen Aufsichtsbehörde einzureichen:
          </p>
          <p>
            <strong style={{ color: '#FFFFFF' }}>
              Landesbeauftragte für Datenschutz und Informationsfreiheit NRW
            </strong><br />
            Postfach 20 04 44<br />
            40102 Düsseldorf<br />
            <a href="https://www.ldi.nrw.de" target="_blank" rel="noopener noreferrer" style={{ color: '#F97316', textDecoration: 'none' }}>
              https://www.ldi.nrw.de
            </a>
          </p>
          <p style={{ color: '#888888', marginBottom: 0 }}>
            You have the right to lodge a complaint with the supervisory authority for data protection in
            North Rhine-Westphalia at the address above.
          </p>
        </Section>

        <Section label="8 · Cookies" id="cookies">
          <p style={{ marginTop: 0 }}>
            Wir verwenden <strong style={{ color: '#FFFFFF' }}>keine Tracking- oder Werbe-Cookies</strong>.
            Es werden ausschließlich technisch notwendige Sitzungsdaten verwendet, um den Betrieb der
            Website zu gewährleisten. Eine Einwilligung ist gemäß § 25 TTDSG nicht erforderlich.
          </p>
          <p style={{ color: '#888888', marginBottom: 0 }}>
            We use <strong>no tracking or advertising cookies</strong>. Only technically necessary
            session data is used to operate the website. No consent is required per §25 TTDSG.
          </p>
        </Section>

        <Section label="9 · Änderungen / Changes">
          <p style={{ margin: 0 }}>
            Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf zu aktualisieren.{' '}
            <span style={{ color: '#888888' }}>
              We reserve the right to update this privacy policy as required.
            </span>
          </p>
        </Section>

        <p
          style={{
            fontFamily: 'var(--font-roboto-mono)',
            fontSize: '11px',
            color: '#444444',
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
