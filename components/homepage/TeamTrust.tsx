import { getTranslations } from 'next-intl/server'

const LABELS = ['l1', 'l2', 'l3'] as const

export async function TeamTrust() {
  const t = await getTranslations('home.teamTrust')

  return (
    <section
      style={{
        background: 'hsl(240 12% 6%)',
        padding: '6rem 2rem',
        borderTop: '1px solid hsl(40 30% 96% / 0.06)',
      }}
    >
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>

        {/* Header */}
        <div
          style={{ display: 'grid', gap: '3rem', marginBottom: '3.5rem' }}
          className="grid-cols-1 lg:grid-cols-2"
        >
          {/* Left: eyebrow + title */}
          <div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
              {t('eyebrow')}
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                letterSpacing: '-0.04em',
                color: 'hsl(40 30% 96%)',
                lineHeight: 1.1,
                marginBottom: 0,
              }}
            >
              {t('title')}{' '}
              <span style={{ color: '#F97316' }}>{t('titleAccent')}</span>
            </h2>
          </div>

          {/* Right: body + pain list + closing */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '1rem' }}>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '17px',
                color: 'hsl(40 30% 96%)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {t('body')}
            </p>

            {/* Pain list — mono chips inline */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {(['pain1', 'pain2', 'pain3', 'pain4'] as const).map((k) => (
                <span
                  key={k}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: 'hsl(40 12% 55%)',
                    background: 'hsl(240 12% 8%)',
                    border: '1px solid hsl(40 30% 96% / 0.07)',
                    padding: '4px 12px',
                    letterSpacing: '0.03em',
                  }}
                >
                  {t(k)}
                </span>
              ))}
            </div>

            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                color: 'hsl(40 12% 65%)',
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
          style={{ display: 'grid', gap: '1px', background: 'hsl(240 10% 16%)', borderRadius: '12px', overflow: 'hidden' }}
          className="grid-cols-1 sm:grid-cols-3"
        >
          {LABELS.map((id) => (
            <div
              key={id}
              style={{
                background: 'hsl(240 14% 4%)',
                padding: '2rem 2.5rem',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#F97316',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}
              >
                {t(`${id}Label`)}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  color: 'hsl(40 12% 60%)',
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
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'hsl(240 8% 32%)',
            letterSpacing: '0.06em',
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
