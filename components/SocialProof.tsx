const RESULTS = [
  {
    metric: '78%',
    label: 'reduction in manual processing time',
  },
  {
    metric: '£14,000/mo',
    label: 'saved in operational costs',
  },
  {
    metric: '3→4 hrs',
    label: 'invoice cycle (was 3 days)',
  },
]

export default function SocialProof() {
  return (
    <section
      style={{
        background: '#FFFFFF',
        padding: '80px 2rem',
        borderTop: '1px solid #F0F0F0',
        borderBottom: '1px solid #F0F0F0',
      }}
    >
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        <div
          style={{ display: 'grid', gap: '1px', background: '#E5E5E5' }}
          className="grid-cols-1 md:grid-cols-3"
        >
          {RESULTS.map((r) => (
            <div
              key={r.metric}
              style={{
                background: '#FFFFFF',
                borderLeft: '3px solid #F97316',
                padding: '40px 36px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Watermark number */}
              <span
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '-20px',
                  transform: 'translateY(-50%)',
                  fontFamily: 'var(--font-space-grotesk)',
                  fontWeight: 700,
                  fontSize: '120px',
                  color: 'rgba(249,115,22,0.04)',
                  lineHeight: 1,
                  pointerEvents: 'none',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {r.metric}
              </span>

              {/* Content */}
              <p
                style={{
                  fontFamily: 'var(--font-space-grotesk)',
                  fontWeight: 700,
                  fontSize: '48px',
                  color: '#F97316',
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  marginBottom: '12px',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {r.metric}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-dm-sans)',
                  fontSize: '16px',
                  color: '#333333',
                  lineHeight: 1.6,
                  marginBottom: '16px',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {r.label}
              </p>
            </div>
          ))}
        </div>

        <p
          style={{
            fontFamily: 'var(--font-space-mono)',
            fontSize: '11px',
            color: '#AAAAAA',
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
