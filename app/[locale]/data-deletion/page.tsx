import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import Link from 'next/link'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const isDE = locale === 'de'
  return {
    title: isDE ? 'Antrag auf Datenlöschung | Maxpromo Digital' : 'Data Deletion Request | Maxpromo Digital',
    description: isDE
      ? 'Beantragen Sie die Löschung Ihrer personenbezogenen Daten aus den Systemen von Maxpromo Digital gemäß Art. 17 DSGVO.'
      : 'Request deletion of your personal data from Maxpromo Digital systems under DSGVO Article 17.',
    robots: { index: false, follow: false },
  }
}

/* ─── LOCALE HELPER ───────────────────────────────────────── */
function t(locale: string, de: string, en: string): string {
  return locale === 'de' ? de : en
}

const mono = 'var(--font-roboto-mono)'
const grotesk = 'var(--font-inter)'
const sans = 'var(--font-inter)'

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#111111',
        borderTop: '2px solid #F97316',
        padding: '28px',
        marginBottom: '16px',
      }}
    >
      <p
        style={{
          fontFamily: mono,
          fontSize: '10px',
          color: '#F97316',
          letterSpacing: '0.2em',
          textTransform: 'uppercase' as const,
          margin: '0 0 16px',
        }}
      >
        {title}
      </p>
      {children}
    </div>
  )
}

function BulletItem({ children }: { children: React.ReactNode }) {
  return (
    <li
      style={{
        fontFamily: sans,
        fontSize: '14px',
        color: '#AAAAAA',
        lineHeight: 1.6,
        padding: '7px 0 7px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        position: 'relative' as const,
        listStyle: 'none',
      }}
    >
      <span
        style={{
          position: 'absolute' as const,
          left: 0,
          top: '9px',
          color: '#F97316',
          fontSize: '10px',
        }}
      >
        ▸
      </span>
      {children}
    </li>
  )
}

export default async function DataDeletionPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <main
      style={{
        background: '#0A0A0A',
        minHeight: '100vh',
        padding: '64px 24px 80px',
      }}
    >
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>

        {/* Header, wordmark + divider */}
        <p
          style={{
            fontFamily: mono,
            fontSize: '11px',
            color: '#F97316',
            letterSpacing: '0.25em',
            textTransform: 'uppercase' as const,
            margin: '0 0 12px',
          }}
        >
          Maxpromo Digital
        </p>
        <div
          style={{
            height: '2px',
            background: '#F97316',
            width: '100%',
            marginBottom: '40px',
          }}
        />

        {/* Title */}
        <h1
          style={{
            fontFamily: grotesk,
            fontWeight: 700,
            fontSize: 'clamp(1.75rem, 4vw, 2.4rem)',
            color: '#FFFFFF',
            letterSpacing: '-0.03em',
            margin: '0 0 10px',
          }}
        >
          {t(locale, 'Antrag auf Datenlöschung', 'Data Deletion Request')}
        </h1>
        <p
          style={{
            fontFamily: mono,
            fontSize: '13px',
            color: '#555555',
            margin: '0 0 36px',
            letterSpacing: '0.04em',
          }}
        >
          {t(locale, 'Datenlöschung / Recht auf Löschung', 'Datenlöschung / Right to Erasure')}
        </p>

        {/* Intro */}
        <p
          style={{
            fontFamily: sans,
            fontSize: '15px',
            color: '#888888',
            lineHeight: 1.75,
            margin: '0 0 36px',
          }}
        >
          {t(locale,
            'Gemäß Art. 17 DSGVO (Recht auf Löschung) haben Sie das Recht, die Löschung sämtlicher personenbezogener Daten zu verlangen, die wir über Sie gespeichert haben. Um einen Löschungsantrag zu stellen, kontaktieren Sie uns über die unten stehenden Angaben.',
            'Under DSGVO Article 17 (Right to Erasure), you have the right to request the deletion of any personal data we hold about you. To submit a deletion request, contact us using the details below.')}
        </p>

        {/* Data Controller */}
        <p
          style={{
            fontFamily: mono,
            fontSize: '11px',
            color: '#555555',
            lineHeight: 1.7,
            margin: '-20px 0 36px',
          }}
        >
          {t(locale,
            'Verantwortlicher: Maxpromo Digital · Steuernummer: 111/5339/7597 · Finanzamt: Essen-NordOst',
            'Data Controller: Maxpromo Digital · Steuernummer: 111/5339/7597 · Finanzamt: Essen-NordOst')}
        </p>

        {/* Card 1, How to request */}
        <Card title={t(locale, 'Antrag stellen', 'Submit a Request')}>
          <div
            style={{
              background: 'rgba(249,115,22,0.06)',
              border: '1px solid rgba(249,115,22,0.18)',
              padding: '18px 20px',
              marginBottom: '16px',
            }}
          >
            <p
              style={{
                fontFamily: mono,
                fontSize: '10px',
                color: '#888',
                letterSpacing: '0.1em',
                margin: '0 0 6px',
              }}
            >
              {t(locale, 'E-MAIL', 'EMAIL')}
            </p>
            <a
              href="mailto:info@maxpromo.digital?subject=Data%20Deletion%20Request"
              style={{
                fontFamily: mono,
                fontSize: '14px',
                color: '#F97316',
                textDecoration: 'none',
                display: 'block',
                marginBottom: '14px',
              }}
            >
              info@maxpromo.digital
            </a>
            <p
              style={{
                fontFamily: mono,
                fontSize: '10px',
                color: '#888',
                letterSpacing: '0.1em',
                margin: '0 0 6px',
              }}
            >
              {t(locale, 'BETREFFZEILE', 'SUBJECT LINE')}
            </p>
            <p
              style={{
                fontFamily: mono,
                fontSize: '13px',
                color: '#CCCCCC',
                margin: 0,
              }}
            >
              {t(locale, '„Antrag auf Datenlöschung"', '"Data Deletion Request"')}
            </p>
          </div>
          <p
            style={{
              fontFamily: sans,
              fontSize: '13px',
              color: '#666666',
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            {t(locale, 'Wir bestätigen den Eingang innerhalb von', 'We will confirm receipt within')}{' '}
            <span style={{ color: '#FFFFFF' }}>{t(locale, '48 Stunden', '48 hours')}</span>{' '}
            {t(locale, 'und bearbeiten Ihren Antrag innerhalb von', 'and process your request within')}{' '}
            <span style={{ color: '#FFFFFF' }}>{t(locale, '30 Tagen', '30 days')}</span>.
          </p>
        </Card>

        {/* Card 2, Data we hold */}
        <Card title={t(locale, 'Daten, die wir möglicherweise speichern', 'Data We May Hold')}>
          <ul style={{ padding: 0, margin: 0 }}>
            <BulletItem>
              {t(locale, 'Kontaktformular-Übermittlungen', 'Contact form submissions')}{' '}
              <span style={{ color: '#555555', fontSize: '12px' }}>
                {t(locale, '(Name, E-Mail, Nachricht, Unternehmen)', '(name, email, message, company)')}
              </span>
            </BulletItem>
            <BulletItem>
              {t(locale, 'Antworten aus dem Kontaktformular', 'Contact form responses')}{' '}
              <span style={{ color: '#555555', fontSize: '12px' }}>
                {t(locale, '(bereitgestellte Unternehmensinformationen)', '(business information provided)')}
              </span>
            </BulletItem>
            <BulletItem>{t(locale, 'Demo-Anfragen über die System-Kontaktseiten', 'System demo request submissions')}</BulletItem>
            <BulletItem>
              {t(locale, 'Chat-Gesprächsinhalte', 'Chat conversation content')}{' '}
              <span style={{ color: '#555555', fontSize: '12px' }}>
                {t(locale, '(nur während der Sitzung, nicht dauerhaft gespeichert)', '(session only, not stored permanently)')}
              </span>
            </BulletItem>
            <BulletItem>
              {t(locale, 'Server-Zugriffsprotokolle', 'Server access logs')}{' '}
              <span style={{ color: '#555555', fontSize: '12px' }}>
                {t(locale, '(IP-Adresse, max. 7 Tage)', '(IP address, max 7 days)')}
              </span>
            </BulletItem>
          </ul>
        </Card>

        {/* Card 3, What happens next */}
        <Card title={t(locale, 'Wie es weitergeht', 'What Happens Next')}>
          <ul style={{ padding: 0, margin: 0 }}>
            <BulletItem>{t(locale, 'Wir verifizieren Ihre Identität per E-Mail', 'We verify your identity via email')}</BulletItem>
            <BulletItem>
              {t(locale, 'Wir ermitteln alle Daten, die mit Ihrer E-Mail-Adresse verknüpft sind', 'We locate all data associated with your email address')}
            </BulletItem>
            <BulletItem>
              {t(locale, 'Wir löschen sie dauerhaft aus allen unseren Systemen innerhalb von', 'We permanently delete it from all our systems within')}{' '}
              <span style={{ color: '#FFFFFF' }}>{t(locale, '30 Tagen', '30 days')}</span>
            </BulletItem>
            <BulletItem>{t(locale, 'Wir senden Ihnen eine schriftliche Bestätigung', 'We send you written confirmation')}</BulletItem>
          </ul>
        </Card>

        {/* Footer note */}
        <p
          style={{
            fontFamily: mono,
            fontSize: '10px',
            color: '#444444',
            lineHeight: 1.7,
            margin: '32px 0 24px',
            letterSpacing: '0.04em',
          }}
        >
          {t(locale,
            'Diese Seite wird in Übereinstimmung mit Art. 17 DSGVO, den Meta-Plattformbedingungen und geltendem Datenschutzrecht bereitgestellt.',
            'This page is provided in compliance with DSGVO Art. 17, Meta Platform Terms, and applicable data protection law.')}
        </p>

        {/* Back link */}
        <Link
          href="/privacy"
          style={{
            fontFamily: mono,
            fontSize: '12px',
            color: '#F97316',
            textDecoration: 'none',
            letterSpacing: '0.06em',
          }}
        >
          {t(locale, '← Zurück zur Datenschutzerklärung', '← Return to Privacy Policy')}
        </Link>
      </div>
    </main>
  )
}/*xxxxxxxxx*/
