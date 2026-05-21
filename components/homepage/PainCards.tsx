import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

interface PainCardRef {
  id: 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6'
  icon: string
  href: string
  imgBg: string // fallback gradient while waiting for real image
}

const PAIN_REFS: ReadonlyArray<PainCardRef> = [
  { id: 'p1', icon: '⊟', href: '/services/customer-inquiries',  imgBg: 'radial-gradient(circle at 20% 30%, rgba(249,115,22,0.12) 0%, transparent 60%)' },
  { id: 'p2', icon: '◇', href: '/services/workflow-automation', imgBg: 'radial-gradient(circle at 80% 20%, rgba(249,115,22,0.09) 0%, transparent 60%)' },
  { id: 'p3', icon: '⌗', href: '/services/ai-agents',          imgBg: 'radial-gradient(circle at 50% 80%, rgba(249,115,22,0.10) 0%, transparent 60%)' },
  { id: 'p4', icon: '◰', href: '/services/workflow-automation', imgBg: 'radial-gradient(circle at 10% 70%, rgba(249,115,22,0.08) 0%, transparent 60%)' },
  { id: 'p5', icon: '▤', href: '/services/reviews',             imgBg: 'radial-gradient(circle at 90% 60%, rgba(249,115,22,0.11) 0%, transparent 60%)' },
  { id: 'p6', icon: '→', href: '/services/websites-platforms',  imgBg: 'radial-gradient(circle at 30% 10%, rgba(249,115,22,0.09) 0%, transparent 60%)' },
]

export async function PainCards() {
  const t = await getTranslations('home.painCards')

  return (
    <section
      style={{
        background: 'hsl(240 14% 4%)',
        padding: '6rem 2rem',
        borderTop: '1px solid hsl(40 30% 96% / 0.06)',
      }}
    >
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '3rem', maxWidth: '44rem' }}>
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
            }}
          >
            {t('title')}{' '}
            <span style={{ color: '#F97316' }}>{t('titleAccent')}</span>
          </h2>
        </div>

        {/* Cards grid */}
        <div
          style={{ display: 'grid', gap: '12px' }}
          className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        >
          {PAIN_REFS.map((card) => (
            <Link
              key={card.id}
              href={card.href}
              style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}
            >
              <article
                className="mp-card-hover"
                style={{
                  background: 'hsl(240 12% 7%)',
                  border: '1px solid hsl(40 30% 96% / 0.07)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  position: 'relative',
                }}
              >
                {/*
                  Image area.
                  CSS background-image loads /public/images/homepage/pain/{id}.jpg when present.
                  Ghost glyph shows through when the file is missing — no broken UI.
                  Add the real photo: the background covers the glyph automatically.
                */}
                <div
                  style={{
                    position: 'relative',
                    aspectRatio: '16 / 9',
                    backgroundColor: 'hsl(240 12% 5%)',
                    backgroundImage: `url(/images/homepage/pain/${card.id}.jpg)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center top',
                    overflow: 'hidden',
                  }}
                >
                  {/* Dark gradient overlay — sits on top of the photo */}
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to bottom, rgba(10,10,14,0.2) 0%, rgba(10,10,14,0.65) 100%)',
                      zIndex: 1,
                    }}
                  />

                  {/* Fallback glyph — visible when no image is loaded, hidden beneath image */}
                  <span
                    aria-hidden="true"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '96px',
                      color: 'rgba(249,115,22,0.06)',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      userSelect: 'none',
                      pointerEvents: 'none',
                      zIndex: 0,
                    }}
                  >
                    {card.icon}
                  </span>

                  {/* Subtle radial brand gradient */}
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: card.imgBg,
                      zIndex: 0,
                      pointerEvents: 'none',
                    }}
                  />

                  {/* Orange accent top strip */}
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0,
                      height: '2px',
                      background: 'linear-gradient(90deg, #F97316 0%, rgba(249,115,22,0.3) 60%, transparent 100%)',
                      zIndex: 2,
                    }}
                  />

                  {/* Category tag — z-index 3 to sit above overlay */}
                  <span
                    style={{
                      position: 'absolute',
                      zIndex: 3,
                      top: '14px',
                      left: '14px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      color: '#F97316',
                      background: 'rgba(249,115,22,0.12)',
                      border: '1px solid rgba(249,115,22,0.2)',
                      padding: '3px 10px',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {t(`${card.id}Tag`)}
                  </span>
                </div>

                {/* Text content */}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <h3
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 700,
                      fontSize: '18px',
                      letterSpacing: '-0.03em',
                      color: 'hsl(40 30% 96%)',
                      lineHeight: 1.25,
                      margin: 0,
                    }}
                  >
                    {t(`${card.id}Title`)}
                  </h3>

                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      color: 'hsl(40 12% 60%)',
                      lineHeight: 1.7,
                      margin: 0,
                      flex: 1,
                    }}
                  >
                    {t(`${card.id}Desc`)}
                  </p>

                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      color: '#F97316',
                      letterSpacing: '0.05em',
                      marginTop: '4px',
                    }}
                  >
                    {t(`${card.id}Cta`)} →
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>

      </div>
    </section>
  )
}
