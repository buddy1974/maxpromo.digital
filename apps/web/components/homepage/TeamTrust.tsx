import { getTranslations } from 'next-intl/server'

const LABELS = ['l1', 'l2', 'l3'] as const

export async function TeamTrust() {
  const t = await getTranslations('home.teamTrust')

  return (
    <section
      style={{
        background: 'var(--brand-surface-subtle)',
        padding: 'var(--section-y) var(--section-x)',
        borderTop: '1px solid var(--brand-border)',
      }}
    >
      <div style={{ maxWidth: 'var(--container)', margin: '0 auto' }}>

        {/* Header */}
        <div
          style={{ display: 'grid', gap: '3rem', marginBottom: '3.5rem' }}
          className="grid-cols-1 lg:grid-cols-2"
        >
          {/* Left: eyebrow + title */}
          <div>
            <p className="section-label">{t('eyebrow')}</p>
            <h2 style={{ margin: 0 }}>
              {t('title')} {t('titleAccent')}
            </h2>
          </div>

          {/* Right: body + pain list + closing */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '1.1rem' }}>
            <p
              style={{
                fontFamily: 'var(--brand-font-body)',
                fontSize: '18px',
                color: 'var(--brand-text)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {t('body')}
            </p>

            {/* Pain list, mono chips inline */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {(['pain1', 'pain2', 'pain3', 'pain4'] as const).map((k) => (
                <span
                  key={k}
                  style={{
                    fontFamily: 'var(--brand-font-mono)',
                    fontSize: 'var(--text-micro)',
                    color: 'var(--brand-text-secondary)',
                    background: 'var(--brand-background)',
                    border: '1px solid var(--brand-border)',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    letterSpacing: '0.02em',
                  }}
                >
                  {t(k)}
                </span>
              ))}
            </div>

            <p
              style={{
                fontFamily: 'var(--brand-font-body)',
                fontSize: '16px',
                color: 'var(--brand-text-secondary)',
                lineHeight: 1.7,
                margin: 0,
                fontStyle: 'italic',
              }}
            >
              {t('closing')}
            </p>
          </div>
        </div>

        {/* Three pillars */}
        <div
          style={{ display: 'grid', gap: '1px', background: 'var(--brand-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--brand-border)' }}
          className="grid-cols-1 sm:grid-cols-3"
        >
          {LABELS.map((id) => (
            <div
              key={id}
              style={{
                background: 'var(--brand-background)',
                padding: '2.25rem 2.5rem',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--brand-font-sans)',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--brand-text-secondary)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                }}
              >
                {t(`${id}Label`)}
              </p>
              <p
                style={{
                  fontFamily: 'var(--brand-font-body)',
                  fontSize: 'var(--text-small)',
                  color: 'var(--brand-text-secondary)',
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {t(`${id}Desc`)}
              </p>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p
          style={{
            fontFamily: 'var(--brand-font-mono)',
            fontSize: 'var(--text-label)',
            color: 'var(--brand-text-secondary)',
            letterSpacing: '0.05em',
            marginTop: '1.25rem',
            textAlign: 'right',
          }}
        >
          {t('footer')}
        </p>

      </div>
    </section>
  )
}
