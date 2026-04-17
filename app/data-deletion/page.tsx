import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Data Deletion Request | MaxPromo Digital',
  description:
    'Request deletion of your personal data from MaxPromo Digital systems under DSGVO Article 17.',
  robots: { index: false, follow: false },
}

const mono = 'var(--font-space-mono)'
const grotesk = 'var(--font-space-grotesk)'
const sans = 'var(--font-dm-sans)'

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

export default function DataDeletionPage() {
  return (
    <main
      style={{
        background: '#0A0A0A',
        minHeight: '100vh',
        padding: '64px 24px 80px',
      }}
    >
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>

        {/* Header — wordmark + divider */}
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
          MaxPromo Digital
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
          Data Deletion Request
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
          Datenlöschung / Right to Erasure
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
          Under DSGVO Article 17 (Right to Erasure), you have the right to
          request the deletion of any personal data we hold about you. To
          submit a deletion request, contact us using the details below.
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
          Data Controller: MaxPromo Digital · Steuernummer: 111/5339/7597 · Finanzamt: Essen-NordOst
        </p>

        {/* Card 1 — How to request */}
        <Card title="Submit a Request">
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
              EMAIL
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
              SUBJECT LINE
            </p>
            <p
              style={{
                fontFamily: mono,
                fontSize: '13px',
                color: '#CCCCCC',
                margin: 0,
              }}
            >
              &quot;Data Deletion Request&quot;
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
            We will confirm receipt within{' '}
            <span style={{ color: '#FFFFFF' }}>48 hours</span> and process your
            request within{' '}
            <span style={{ color: '#FFFFFF' }}>30 days</span>.
          </p>
        </Card>

        {/* Card 2 — Data we hold */}
        <Card title="Data We May Hold">
          <ul style={{ padding: 0, margin: 0 }}>
            <BulletItem>
              Contact form submissions{' '}
              <span style={{ color: '#555555', fontSize: '12px' }}>
                (name, email, message, company)
              </span>
            </BulletItem>
            <BulletItem>
              Automation audit responses{' '}
              <span style={{ color: '#555555', fontSize: '12px' }}>
                (business information provided)
              </span>
            </BulletItem>
            <BulletItem>Discovery wizard submissions</BulletItem>
            <BulletItem>
              Chat conversation content{' '}
              <span style={{ color: '#555555', fontSize: '12px' }}>
                (session only — not stored permanently)
              </span>
            </BulletItem>
            <BulletItem>
              Server access logs{' '}
              <span style={{ color: '#555555', fontSize: '12px' }}>
                (IP address, max 7 days)
              </span>
            </BulletItem>
          </ul>
        </Card>

        {/* Card 3 — What happens next */}
        <Card title="What Happens Next">
          <ul style={{ padding: 0, margin: 0 }}>
            <BulletItem>We verify your identity via email</BulletItem>
            <BulletItem>
              We locate all data associated with your email address
            </BulletItem>
            <BulletItem>
              We permanently delete it from all our systems within{' '}
              <span style={{ color: '#FFFFFF' }}>30 days</span>
            </BulletItem>
            <BulletItem>We send you written confirmation</BulletItem>
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
          This page is provided in compliance with DSGVO Art. 17, Meta Platform
          Terms, and applicable data protection law.
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
          ← Return to Privacy Policy
        </Link>
      </div>
    </main>
  )
}
