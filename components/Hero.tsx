import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { OperationsCenter } from '@/components/ui/OperationsCenter'

/**
 * components/Hero.tsx
 *
 * Rebuilt in v4.0 batch B3.
 *
 * The v2.1 hero was a single 52rem copy column with no visual at all — the
 * Ken Burns carousel had been removed and nothing replaced it. Before that it
 * was a 4-slide photo carousel with particles and an ambient glow. Neither
 * argued for the product.
 *
 * This version makes the headline and the interface one statement: the copy
 * claims Maxpromo builds the systems a company runs on, and the panel beside
 * it is that claim, rendered. They share a rule and a baseline rather than
 * sitting in two unrelated columns.
 *
 * Three deliberate departures from the previous implementation:
 *
 *   1. Server component. The old hero pulled framer-motion into the critical
 *      path to fade five elements in. The same cascade is four CSS classes
 *      (.mp-hero-1..5), so the largest element above the fold now ships no
 *      client JavaScript.
 *   2. The headline is entirely black. It previously rendered its middle line
 *      as a full-width accent-coloured block, which is the single clearest
 *      "marketing site" tell on the page.
 *   3. The three status pills below the CTAs are gone. They were decoration
 *      asserting uptime we do not measure on this page.
 */

export default async function Hero() {
  const t = await getTranslations('hero')

  const modules = t.raw('ocModules') as string[]
  const systems = t.raw('ocSystems') as {
    name: string
    detail: string
    state: 'running' | 'attention' | 'scheduled'
  }[]
  const queue = t.raw('ocQueue') as string[]

  return (
    <section data-section="hero" className="section-feature" style={{ background: 'var(--brand-background)' }}>
      <div className="container">
        <div className="hero-grid">
          {/* Copy */}
          <div style={{ minWidth: 0 }}>
            <p className="section-label mp-hero-1">{t('eyebrow')}</p>

            <h1 className="mp-hero-2" style={{ margin: '0 0 var(--space-5)', maxWidth: '18ch' }}>
              {t('headline')}
            </h1>

            <p
              className="mp-hero-3"
              style={{
                margin: '0 0 var(--space-6)',
                maxWidth: '44ch',
                fontSize: 'var(--text-body)',
                lineHeight: 'var(--leading-body)',
                color: 'var(--brand-text-secondary)',
              }}
            >
              {t('sub')}
            </p>

            <div className="mp-hero-4" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <Link href="/contact" className="btn btn-primary">
                {t('ctaPrimary')}
              </Link>
              <Link href="/systems" className="btn btn-secondary">
                {t('ctaSecondary')}
              </Link>
            </div>

            <p
              className="mp-hero-5"
              style={{
                margin: 'var(--space-6) 0 0',
                fontSize: 'var(--text-small)',
                color: 'var(--brand-text-muted)',
                maxWidth: '46ch',
              }}
            >
              {t('urgency')}
            </p>
          </div>

          {/* The claim, rendered */}
          <div className="mp-hero-3" style={{ minWidth: 0 }}>
            <OperationsCenter
              title={t('ocTitle')}
              modules={modules}
              activeModule={0}
              systems={systems}
              queueLabel={t('ocQueueLabel')}
              queue={queue}
              footnote={t('ocFootnote')}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
