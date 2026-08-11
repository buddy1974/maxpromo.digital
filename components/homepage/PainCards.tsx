import { getTranslations } from 'next-intl/server'
import { PainCardsClient } from './PainCardsClient'
import type { PainCardData } from './PainCardsClient'

const PAIN_REFS = [
  { id: 'p1', icon: '⊟', href: '/services/customer-inquiries',  imgBg: "url('/images/services/kundenanfragen.png') center / cover no-repeat" },
  { id: 'p2', icon: '◇', href: '/services/workflow-automation', imgBg: "url('/images/services/rechnungen.png') center / cover no-repeat" },
  { id: 'p3', icon: '⌗', href: '/services/ai-agents',           imgBg: "url('/images/services/kommunikation.png') center / cover no-repeat" },
  { id: 'p4', icon: '◰', href: '/services/workflow-automation', imgBg: "url('/images/services/field-operation.png') center / cover no-repeat" },
  { id: 'p5', icon: '▤', href: '/services/reviews',             imgBg: "url('/images/services/reviews.png') center / cover no-repeat" },
  { id: 'p6', icon: '→', href: '/services/workflow-automation', imgBg: "url('/images/services/Tools.png') center / cover no-repeat" },
] as const

export async function PainCards() {
  const t = await getTranslations('home.painCards')

  const cards: PainCardData[] = PAIN_REFS.map((ref) => ({
    id:    ref.id,
    icon:  ref.icon,
    href:  ref.href,
    imgBg: ref.imgBg,
    tag:   t(`${ref.id}Tag`),
    title: t(`${ref.id}Title`),
    desc:  t(`${ref.id}Desc`),
    cta:   t(`${ref.id}Cta`),
  }))

  return (
    <section
      data-section="pain"
      style={{
        background: 'var(--color-bg)',
        padding: 'clamp(4.5rem, 8vw, 8.75rem) 2rem',
        borderTop: '1px solid var(--color-border)',
      }}
    >
      <div style={{ maxWidth: 'var(--container-width)', margin: '0 auto' }}>

        <div style={{ marginBottom: '3rem', maxWidth: '44rem' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--color-primary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '14px' }}>
            {t('eyebrow')}
          </p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2.25rem, 4vw, 3.25rem)', letterSpacing: '-0.02em', color: 'var(--color-text-primary)', lineHeight: 1.1 }}>
            {t('title')}{' '}
            <span style={{ color: 'var(--color-primary)' }}>{t('titleAccent')}</span>
          </h2>
        </div>

        {/* Client component owns all hover interactions + scroll entry animations */}
        <PainCardsClient cards={cards} />

      </div>
    </section>
  )
}
