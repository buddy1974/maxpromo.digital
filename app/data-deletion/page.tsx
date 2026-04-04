const mono = 'var(--font-space-mono)'
const grotesk = 'var(--font-space-grotesk)'
const sans = 'var(--font-dm-sans)'

export const metadata = {
  title: 'Data Deletion Request | MaxPromo Digital',
  description: 'Request deletion of your personal data held by MaxPromo Digital.',
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
        {/* Wordmark */}
        <p
          style={{
            fontFamily: mono,
            fontSize: '11px',
            color: '#F97316',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            margin: '0 0 40px',
          }}
        >
          MaxPromo Digital
        </p>

        {/* Title */}
        <h1
          style={{
            fontFamily: grotesk,
            fontWeight: 700,
            fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
            color: '#FFFFFF',
            letterSpacing: '-0.03em',
            margin: '0 0 8px',
          }}
        >
          Data Deletion Request
        </h1>
        <p
          style={{
            fontFamily: mono,
            fontSize: '13px',
            color: '#555',
            margin: '0 0 40px',
          }}
        >
          Datenlöschung
        </p>

        {/* Orange divider */}
        <div
          style={{
            height: '2px',
            background: '#F97316',
            width: '48px',
            marginBottom: '40px',
          }}
        />

        {/* How to request */}
        <div
          style={{
            background: '#111111',
            borderTop: '2px solid #F97316',
            padding: '28px',
            marginBottom: '20px',
          }}
        >
          <p
            style={{
              fontFamily: mono,
              fontSize: '10px',
              color: '#F97316',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              margin: '0 0 16px',
            }}
          >
            How to Request / So beantragen Sie
          </p>
          <p
            style={{
              fontFamily: sans,
              fontSize: '14px',
              color: '#AAAAAA',
              lineHeight: 1.7,
              margin: '0 0 20px',
            }}
          >
            To request deletion of any personal data we hold about you, contact
            us at:
          </p>
          <div
            style={{
              background: 'rgba(249,115,22,0.06)',
              border: '1px solid rgba(249,115,22,0.2)',
              padding: '16px 20px',
              marginBottom: '20px',
            }}
          >
            <p style={{ fontFamily: mono, fontSize: '12px', color: '#888', margin: '0 0 6px' }}>
              Email:
            </p>
            <a
              href="mailto:info@maxpromo.digital?subject=Data Deletion Request"
              style={{
                fontFamily: mono,
                fontSize: '14px',
                color: '#F97316',
                textDecoration: 'none',
                display: 'block',
                marginBottom: '12px',
              }}
            >
              info@maxpromo.digital
            </a>
            <p style={{ fontFamily: mono, fontSize: '12px', color: '#888', margin: '0 0 6px' }}>
              Subject:
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
              color: '#666',
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            We will process your request within{' '}
            <span style={{ color: '#FFFFFF' }}>30 days</span> in accordance with
            DSGVO Art. 17 (Right to Erasure).
          </p>
        </div>

        {/* Data we hold */}
        <div
          style={{
            background: '#111111',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: '28px',
            marginBottom: '20px',
          }}
        >
          <p
            style={{
              fontFamily: mono,
              fontSize: '10px',
              color: '#888',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              margin: '0 0 16px',
            }}
          >
            Data We May Hold / Gespeicherte Daten
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {[
              'Contact form submissions',
              'Automation audit responses',
              'Chat conversation history (session only)',
            ].map((item) => (
              <li
                key={item}
                style={{
                  fontFamily: sans,
                  fontSize: '14px',
                  color: '#AAAAAA',
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  paddingLeft: '16px',
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    color: '#F97316',
                    fontSize: '10px',
                    top: '10px',
                  }}
                >
                  ▸
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* What happens */}
        <div
          style={{
            background: '#111111',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: '28px',
          }}
        >
          <p
            style={{
              fontFamily: mono,
              fontSize: '10px',
              color: '#888',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              margin: '0 0 16px',
            }}
          >
            What Happens Next / Was passiert dann
          </p>
          <p
            style={{
              fontFamily: sans,
              fontSize: '14px',
              color: '#AAAAAA',
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            Upon request we will permanently delete all personal data associated
            with your email address from our systems.
          </p>
        </div>

        {/* Footer note */}
        <p
          style={{
            fontFamily: mono,
            fontSize: '10px',
            color: '#333',
            marginTop: '40px',
            letterSpacing: '0.06em',
          }}
        >
          MaxPromo Digital · info@maxpromo.digital · maxpromo.digital
        </p>
      </div>
    </main>
  )
}
