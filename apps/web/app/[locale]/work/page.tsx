import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { ProcessSequence } from '@/components/ui/ProcessSequence'
import { SectionHeader } from '@maxpromo/ui'
import { DEMOS } from '@/lib/demo/registry'
import { WORK_ENTRIES, CAPABILITY_HREF } from '@/lib/work-entries'
import './work.css'

/**
 * app/[locale]/work/page.tsx — public.
 *
 * The commercial doorway: enough evidence that Maxpromo builds real things,
 * without putting anyone's operation on display.
 *
 * WHAT THIS PAGE IS NOT
 * Not a portfolio, and not a product catalogue. The operating systems this
 * company owns are protected products marketed on their own domains
 * (docs/architecture/platform.md §1); listing them here as demo cards would be
 * a product-exposure decision dressed up as a presentation one. And no client
 * project is attributed without evidence that the attribution is allowed —
 * naming a client on a public page is their decision, not ours.
 *
 * So the page ships with an honest empty state for public examples and a clear
 * route to a private demonstration. That is the truthful position today:
 * the work exists, the permission to publish it does not yet.
 *
 * The private room is real and access-controlled. See lib/demo/access.ts.
 * This page never names a demonstration or links into the room.
 */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'work' })
  return {
    title: t('metaTitle'),
    description: t('metaDesc'),
    alternates: {
      canonical: `https://www.maxpromo.digital/${locale}/work`,
      languages: {
        de: 'https://www.maxpromo.digital/de/work',
        en: 'https://www.maxpromo.digital/en/work',
      },
    },
  }
}

const CATEGORIES = ['cat1', 'cat2', 'cat3', 'cat4'] as const

export default async function WorkPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('work')
  const tw = t
  const tcs = await getTranslations('caseStudies')

  /** Public previews only. Empty until a demo is both configured and cleared
   *  for public preview — never merely because the page has space. */
  const publicPreviews = DEMOS.filter((d) => d.accessMode === 'public-link')

  return (
    <>
      <section className="hero-band">
        <div className="hero-panel hero-panel-inner">
          <div className="hero-copy">
            <p className="section-label">{t('eyebrow')}</p>
            <h1 style={{ margin: '0 0 var(--space-5)' }}>{t('title')}</h1>
            <p className="hero-sub">{t('lede')}</p>
          </div>

          {/* Public work to released demonstration, with the release in a
              person's hands. The page's proposition, drawn. */}
          <div className="hero-flow scene-on-dark">
            <ProcessSequence
              numbered={false}
              a11yIntro={t('sceneA11y')}
              humanLabel={t('humanLabel')}
              steps={[
                { label: t('s1'), detail: t('s1d'), icon: 'quality' },
                { label: t('s2'), detail: t('s2d'), icon: 'inbox' },
                { label: t('s3'), detail: t('s3d'), icon: 'approvals', human: true },
                { label: t('s4'), detail: t('s4d'), icon: 'system' },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="section surface-plain">
        <div className="container">
          <div className="sec-head">
            <p className="section-label">{t('catEyebrow')}</p>
            <h2 style={{ margin: 0 }}>{t('catTitle')}</h2>
          </div>

          <div className="ruled-grid ruled-grid-4">
            {CATEGORIES.map((c, i) => (
              <div key={c} className="ruled-item">
                <p className="ruled-index">{String(i + 1).padStart(2, '0')}</p>
                <h3 className="ruled-title" style={{ fontSize: 'var(--text-h4)' }}>{t(c)}</h3>
                <p className="ruled-desc">{t(`${c}d`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The proof entries. Each renders what it declares it has and nothing
          more, so an entry that gains an approved screenshot later gains a
          screenshot rather than forcing a redesign. lib/work-entries.ts holds
          the claims audit that decides what appears at all. */}
      <section className="section surface-plain" data-section="delivered">
        <div className="container">
          <SectionHeader label={tw('provenEyebrow')}>{tw('provenTitle')}</SectionHeader>
          <p className="sec-lede" style={{ margin: '0 0 var(--space-8)' }}>{tw('provenLede')}</p>

          <div className="we-list">
            {WORK_ENTRIES.map((e) => (
              <article key={e.id} className="we" data-entry={e.id}>
                <header className="we-head">
                  <p className="we-meta">
                    <span className="we-tag">{tcs(e.tagKey)}</span>
                  </p>
                  <h3 className="we-headline">{tw(e.headlineKey)}</h3>
                </header>

                <div className="we-body">
                  {e.evidence.includes('before-after') && (
                    <div className="we-ba">
                      <div>
                        <p className="we-ba-label">{tw('beforeLabel')}</p>
                        <ul className="we-ba-list we-ba-before">
                          {e.beforeKeys.map((k) => <li key={k}>{tcs(k)}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="we-ba-label we-ba-label-after">{tw('afterLabel')}</p>
                        <ul className="we-ba-list we-ba-after">
                          {e.afterKeys.map((k) => <li key={k}>{tcs(k)}</li>)}
                        </ul>
                      </div>
                    </div>
                  )}

                </div>

                <footer className="we-foot">
                  {e.evidence.includes('case-study') && (
                    <Link href="/case-studies" className="quiet-link">{tw('readCase')}</Link>
                  )}
                  {e.evidence.includes('private-demo') && (
                    <Link
                      href={`/contact?intent=demo&project=${e.id}&source=work`}
                      className="btn btn-sm"
                    >
                      {tw('askDemo')}
                    </Link>
                  )}
                  {CAPABILITY_HREF[e.capability] && (
                    <Link href={CAPABILITY_HREF[e.capability]} className="quiet-link">
                      {tw('relatedLabel')}
                    </Link>
                  )}
                </footer>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* What can be shown and what cannot, said plainly rather than left for
          the visitor to wonder about. */}
      <section className="section-compact surface-evidence" data-section="evidence-policy">
        <div className="container">
          <SectionHeader label={tw('evidenceEyebrow')}>{tw('evidenceTitle')}</SectionHeader>
          <ul className="we-policy">
            {(['e1', 'e2', 'e3'] as const).map((k) => (
              <li key={k} className="we-policy-item">
                <h3 className="we-policy-title">{tw(`${k}Title`)}</h3>
                <p className="we-policy-body">{tw(`${k}Body`)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {publicPreviews.length === 0 ? (
        <section className="section surface-operational">
          <div className="container">
            <div style={{ maxWidth: '46rem' }}>
              <h2 style={{ margin: '0 0 var(--space-4)' }}>{t('emptyTitle')}</h2>
              <p style={{ margin: 0, fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--brand-text-secondary)' }}>
                {t('emptyBody')}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="section surface-operational">
          <div className="container">
            <div className="ruled-grid">
              {publicPreviews.map((d) => (
                <div key={d.id} className="ruled-item">
                  <p className="ruled-index">{d.category[locale === 'de' ? 'de' : 'en']}</p>
                  <h3 className="ruled-title" style={{ fontSize: 'var(--text-h4)' }}>
                    {d.name[locale === 'de' ? 'de' : 'en']}
                  </h3>
                  <p className="ruled-desc">{d.description[locale === 'de' ? 'de' : 'en']}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section surface-authority">
        <div className="container">
          <div style={{ maxWidth: '42rem' }}>
            <p className="section-label">{t('requestEyebrow')}</p>
            <h2 style={{ margin: '0 0 var(--space-4)' }}>{t('requestTitle')}</h2>
            <p style={{ margin: '0 0 var(--space-6)', fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)' }}>
              {t('requestLede')}
            </p>
            {/* Carries its origin into the existing contact architecture, so a
                demonstration request arrives as one rather than as a generic
                enquiry. No new lead system. */}
            <Link href="/contact?intent=demo" className="btn btn-primary">{t('requestCta')}</Link>
            <p style={{ margin: 'var(--space-5) 0 0', fontSize: 'var(--text-micro)', color: 'var(--brand-text-inverted-secondary)' }}>
              {t('requestNote')}
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
