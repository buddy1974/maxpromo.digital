import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

/**
 * components/homepage/PainCards.tsx
 *
 * Rebuilt in v4.0 batch B3.
 *
 * Was six bordered cards, each with a 48px tinted icon tile, an accent-tinted
 * category pill, a drop shadow, and a framer-motion entrance — the SaaS
 * feature-grid pattern in full. Three of the four decorations v4.0 retires
 * (oversized icons, marketing pills, heavy shadows) were in this one component.
 *
 * Now a hairline grid: no card boxes, no icons, no pills, no shadows. The
 * separators come from the grid gap showing the border colour through, which is
 * how a reference table looks rather than how a pricing page looks. Category,
 * problem, consequence, route to the answer — read in that order.
 *
 * Also dropped the client component wrapper: hover is one CSS rule, so this is
 * now server-rendered with no JavaScript.
 */

const PAIN_REFS = [
  { id: 'p1', href: '/services/customer-inquiries' },
  { id: 'p2', href: '/services/workflow-automation' },
  { id: 'p3', href: '/services/ai-agents' },
  { id: 'p4', href: '/services/workflow-automation' },
  { id: 'p5', href: '/services/reviews' },
  { id: 'p6', href: '/services/workflow-automation' },
] as const

export async function PainCards() {
  const t = await getTranslations('home.painCards')

  return (
    <section data-section="pain" className="section" style={{ background: 'var(--brand-background)', borderTop: '1px solid var(--brand-border)' }}>
      <div className="container">

        <div style={{ marginBottom: 'var(--space-8)', maxWidth: '44rem' }}>
          <p className="section-label">{t('eyebrow')}</p>
          <h2 style={{ margin: 0 }}>
            {t('title')} {t('titleAccent')}
          </h2>
        </div>

        <div className="pain-grid">
          {PAIN_REFS.map((ref) => (
            <Link key={ref.id} href={ref.href} className="pain-cell">
              <p className="pain-cell-label">{t(`${ref.id}Tag`)}</p>
              <h3 className="h-card" style={{ margin: '0 0 var(--space-3)' }}>
                {t(`${ref.id}Title`)}
              </h3>
              <p className="pain-cell-desc">{t(`${ref.id}Desc`)}</p>
              <span className="pain-cell-cta">{t(`${ref.id}Cta`)} →</span>
            </Link>
          ))}
        </div>

      </div>
    </section>
  )
}
