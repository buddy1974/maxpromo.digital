import { getTranslations } from 'next-intl/server'
import { PainCardsClient } from './PainCardsClient'
import type { PainCardData } from './PainCardsClient'

const PAIN_REFS = [
  { id: 'p1', icon: '⊟', href: '/services/customer-inquiries',  imgBg: 'radial-gradient(circle at 20% 30%, rgba(249,115,22,0.12) 0%, transparent 60%)' },
  { id: 'p2', icon: '◇', href: '/services/workflow-automation', imgBg: 'radial-gradient(circle at 80% 20%, rgba(249,115,22,0.09) 0%, transparent 60%)' },
  { id: 'p3', icon: '⌗', href: '/services/ai-agents',          imgBg: 'radial-gradient(circle at 50% 80%, rgba(249,115,22,0.10) 0%, transparent 60%)' },
  { id: 'p4', icon: '◰', href: '/services/workflow-automation', imgBg: 'radial-gradient(circle at 10% 70%, rgba(249,115,22,0.08) 0%, transparent 60%)' },
  { id: 'p5', icon: '▤', href: '/services/reviews',             imgBg: 'radial-gradient(circle at 90% 60%, rgba(249,115,22,0.11) 0%, transparent 60%)' },
  { id: 'p6', icon: '→', href: '/services/websites-platforms',  imgBg: 'radial-gradient(circle at 30% 10%, rgba(249,115,22,0.09) 0%, transparent 60%)' },
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
      style={{
        background: 'hsl(240 14% 4%)',
        padding: '6rem 2rem',
        borderTop: '1px solid hsl(40 30% 96% / 0.06)',
      }}
    >
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>

        <div style={{ marginBottom: '3rem', maxWidth: '44rem' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
            {t('eyebrow')}
          </p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: 'hsl(40 30% 96%)', lineHeight: 1.1 }}>
            {t('title')}{' '}
            <span style={{ color: '#F97316' }}>{t('titleAccent')}</span>
          </h2>
        </div>

        {/* Client component owns all hover interactions + scroll entry animations */}
        <PainCardsClient cards={cards} />

      </div>
    </section>
  )
}
