const RESULTS = [
  {
    metric: '78%',
    label: 'reduction in manual processing time',
    client: 'NGO, West Africa',
  },
  {
    metric: '£14,000/mo',
    label: 'saved in operational costs',
    client: 'Consulting firm, UK',
  },
  {
    metric: '3 days → 4 hrs',
    label: 'invoice cycle time',
    client: 'SME, logistics sector',
  },
]

export default function SocialProof() {
  return (
    <section
      style={{
        background: '#030305',
        padding: '5rem 2rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        {/* Cards */}
        <div
          style={{ display: 'grid', gap: '1px', background: 'rgba(255,255,255,0.04)' }}
          className="grid-cols-1 md:grid-cols-3"
        >
          {RESULTS.map((r) => (
            <div
              key={r.metric}
              style={{
                background: '#111111',
                borderLeft: '2px solid #F97316',
                padding: '36px 32px',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-space-grotesk)',
                  fontWeight: 700,
                  fontSize: '36px',
                  color: '#F97316',
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  marginBottom: '10px',
                }}
              >
                {r.metric}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-dm-sans)',
                  fontSize: '17px',
                  color: '#FAFAFF',
                  lineHeight: 1.6,
                  marginBottom: '16px',
                }}
              >
                {r.label}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-space-mono)',
                  fontSize: '11px',
                  color: '#6B6B7A',
                  letterSpacing: '0.1em',
                }}
              >
                — {r.client}
              </p>
            </div>
          ))}
        </div>

        {/* NDA note */}
        <p
          style={{
            fontFamily: 'var(--font-space-mono)',
            fontSize: '11px',
            color: '#6B6B7A',
            textAlign: 'center',
            marginTop: '20px',
            letterSpacing: '0.05em',
          }}
        >
          // Results based on client deployments. Names withheld under NDA.
        </p>
      </div>
    </section>
  )
}
