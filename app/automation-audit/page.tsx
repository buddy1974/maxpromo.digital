import type { Metadata } from 'next'
import AuditForm from '@/components/AuditForm'

export const metadata: Metadata = {
  title: 'Free Automation Audit',
  description:
    'Answer 5 quick questions and receive a personalised AI automation report — 3 specific opportunities for your business, free of charge.',
}

export default function AutomationAuditPage() {
  return (
    <main style={{ background: '#030305', minHeight: '100vh' }}>
      {/* Header */}
      <section
        style={{
          padding: '5rem 2rem 3rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <p
            style={{
              fontFamily: 'var(--font-space-mono)',
              fontSize: '11px',
              color: '#F97316',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}
          >
            Free — No Commitment
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-space-grotesk)',
              fontWeight: 700,
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              letterSpacing: '-0.04em',
              color: '#FAFAFF',
              marginBottom: '16px',
            }}
          >
            Automation Audit
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '16px',
              color: '#6B6B7A',
              lineHeight: 1.7,
              maxWidth: '500px',
            }}
          >
            Answer 5 questions about your business. Our AI identifies your top 3 automation
            opportunities with specific tool recommendations.
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '2rem',
              marginTop: '2rem',
            }}
          >
            {[
              { label: '5 min', sub: 'to complete' },
              { label: 'AI-powered', sub: 'analysis' },
              { label: '3 specific', sub: 'opportunities' },
            ].map((item) => (
              <div key={item.label}>
                <p
                  style={{
                    fontFamily: 'var(--font-space-mono)',
                    fontWeight: 700,
                    fontSize: '13px',
                    color: '#FAFAFF',
                    marginBottom: '2px',
                  }}
                >
                  {item.label}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-dm-sans)',
                    fontSize: '12px',
                    color: '#6B6B7A',
                  }}
                >
                  {item.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audit form */}
      <section style={{ padding: '4rem 2rem', minHeight: '500px' }}>
        <AuditForm />
      </section>
    </main>
  )
}
