import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { BUSINESS } from '@maxpromo/config'
import { ProcessSequence } from '@/components/ui/ProcessSequence'

/**
 * app/[locale]/about/page.tsx
 *
 * Rewritten in the public presentation pass, and this one was an editorial
 * correction rather than a visual one.
 *
 * The page opened with fifteen years of experience and then spent that
 * credibility on a list of content management systems: Joomla, WordPress,
 * Drupal, TYPO3, shared hosting. All of it true, and all of it answering a
 * question nobody asked. A buyer reading it learned which products Marcel has
 * used, which is a tooling biography, and it positioned the company as a web
 * agency on the one page whose job is to say what the company is.
 *
 * The history is not erased. It is re-aimed. The same fifteen years now
 * establish something a buyer can actually use: that this company has been
 * answerable for systems a business depended on, has seen what breaks when
 * that dependency fails, and reached operating design by going through it
 * rather than by reading about it.
 *
 * The arc is the structure of the page:
 *
 *     keeping systems alive
 *     understanding why they break
 *     redesigning how work moves
 *     building business operating systems
 *
 * Specific platforms are named once, inside the first step, where they are
 * evidence of production responsibility. They are no longer the visual centre
 * and no longer the first noun on the page.
 */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  return {
    title: t('metaTitle'),
    description: t('metaDesc'),
    alternates: {
      canonical: `https://www.maxpromo.digital/${locale}/about`,
      languages: {
        de: 'https://www.maxpromo.digital/de/about',
        en: 'https://www.maxpromo.digital/en/about',
      },
    },
  }
}

const ARC = ['a1', 'a2', 'a3', 'a4'] as const

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('about')
  const tScene = await getTranslations('scenes')
  const isDE = locale === 'de'

  const todayList = t.raw('todayList') as string[]
  const principles = t.raw('principles') as { t: string; d: string }[]

  return (
    <>
      <section className="section-feature surface-authority">
        <div className="container">
          <div className="sec-head sec-head-wide" style={{ marginBottom: 0 }}>
            <p className="section-label">{t('eyebrow')}</p>
            <h1 style={{ margin: '0 0 var(--space-5)' }}>{t('title')}</h1>
            <p className="sec-lede" style={{ margin: 0 }}>{t('intro')}</p>
          </div>
        </div>
      </section>

      {/* The arc, drawn before it is read: four steps on one line. */}
      <section className="section surface-operational">
        <div className="container">
          <div className="sec-head">
            <p className="section-label">{t('arcEyebrow')}</p>
            <h2 style={{ margin: 0 }}>{t('arcTitle')}</h2>
            <p className="sec-lede">{t('arcLede')}</p>
          </div>

          <div style={{ marginBottom: 'var(--space-10)' }}>
            <ProcessSequence
              a11yIntro={tScene('aboutA11y')}
              steps={[
                { label: tScene('about1'), detail: tScene('about1d'), icon: 'system' },
                { label: tScene('about2'), detail: tScene('about2d'), icon: 'audit' },
                { label: tScene('about3'), detail: tScene('about3d'), icon: 'agents' },
                { label: tScene('about4'), detail: tScene('about4d'), icon: 'operatingModel' },
              ]}
            />
          </div>

          <div className="ruled-grid-2">
            {ARC.map((id, i) => (
              <div key={id} className="ruled-item">
                <p className="ruled-index">{String(i + 1).padStart(2, '0')}</p>
                <h3 className="ruled-title">{t(`${id}Label`)}</h3>
                <p className="ruled-desc">{t(`${id}Body`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section surface-plain">
        <div className="container">
          <div className="sec-split">
            <div>
              <p className="section-label">{t('transformEyebrow')}</p>
              <h2 style={{ margin: 0 }}>{t('transformTitle')}</h2>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 'var(--text-lede)', lineHeight: 'var(--leading-body)' }}>
                {t('transformBody')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section surface-plain">
        <div className="container">
          <div className="sec-split">
            <div>
              <p className="section-label">{t('todayEyebrow')}</p>
              <h2 style={{ margin: 0 }}>{t('todayTitle')}</h2>
            </div>
            <div>
              <p style={{ margin: '0 0 var(--space-6)', fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--brand-text-secondary)' }}>
                {t('todayIntro')}
              </p>
              <ul className="plain-list">
                {todayList.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Commitments a client could hold us to, which is the only kind of
          values section worth printing. */}
      <section className="section surface-operational">
        <div className="container">
          <div className="sec-split">
            <div>
              <p className="section-label">{t('principlesEyebrow')}</p>
              <h2 style={{ margin: 0 }}>{t('principlesTitle')}</h2>
            </div>
            <div>
              <dl className="spec">
                {principles.map((p) => (
                  <div key={p.t}>
                    <dt>{p.t}</dt>
                    <dd>{p.d}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="section surface-plain">
        <div className="container">
          <div className="sec-split">
            <div>
              <p className="section-label">{isDE ? 'Unternehmen' : 'The company'}</p>
            </div>
            <div>
              <dl className="spec">
                <div>
                  <dt>{isDE ? 'Firma' : 'Legal entity'}</dt>
                  <dd>{BUSINESS.legalName} · {BUSINESS.brand}</dd>
                </div>
                <div>
                  <dt>{isDE ? 'Sitz' : 'Based in'}</dt>
                  <dd>{BUSINESS.street}, {BUSINESS.city}, {BUSINESS.country}</dd>
                </div>
                <div>
                  <dt>{isDE ? 'Sprachen' : 'Languages'}</dt>
                  <dd>{isDE ? 'Deutsch, Englisch' : 'German, English'}</dd>
                </div>
                <div>
                  <dt>{isDE ? 'Kontakt' : 'Contact'}</dt>
                  <dd><a href={`mailto:${BUSINESS.email}`} className="link">{BUSINESS.email}</a></dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="section surface-authority">
        <div className="container">
          <div style={{ maxWidth: '40rem' }}>
            <p className="section-label">{t('ctaEyebrow')}</p>
            <h2 style={{ margin: '0 0 var(--space-4)' }}>{t('ctaTitle')}</h2>
            <p style={{ margin: '0 0 var(--space-6)', fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)' }}>
              {t('ctaDesc')}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <Link href="/contact" className="btn btn-primary">{t('ctaPrimary')}</Link>
              <Link href="/solutions" className="btn btn-secondary">{t('ctaSecondary')}</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
