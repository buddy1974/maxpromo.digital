import type { Metadata } from 'next'
import Image from 'next/image'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { pageMetadata } from '@/lib/seo/og'
import { ProcessSequence } from '@/components/ui/ProcessSequence'
import { SectionHeader } from '@maxpromo/ui'
import { DEMOS } from '@/lib/demo/registry'
import { WORK_ENTRIES, CAPABILITY_HREF } from '@/lib/work-entries'
import './work.css'

/**
 * app/[locale]/work/page.tsx — public.
 *
 * The proof surface the capability pages and guides point at (ADR-0016).
 *
 * THREE KINDS OF WORK, NEVER BLURRED
 *
 *   Shown in full   our own system, the Maxpromo OS proof story. It can be
 *                   shown on screen because it is ours and the demonstration
 *                   ran against an invented customer — and the page says both.
 *   Client work     described as what changed about the work, with no client
 *                   named and no figure, because none is evidenced
 *                   (lib/work-entries.ts holds that audit). Shown running only
 *                   on request.
 *   Demonstrations  public previews from the demo registry, rendered only if
 *                   one is ever cleared for public preview.
 *
 * Our own demonstration is never presented as a customer case study, and a
 * client system is never put on display.
 *
 * WHAT WENT, AND WHY
 *
 * The link to /case-studies: that page carried figures the claims registry
 * marks unevidenced and, in one case, contradicted. It now redirects here.
 * The "how the work is grouped" strip restated the navigation. And the
 * "public examples are coming" empty state stopped being true the day the
 * proof story shipped.
 */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'work' })
  return pageMetadata({
    locale,
    path: '/work',
    title: t('metaTitle'),
    description: t('metaDesc'),
    family: 'work',
  })
}

const FLAGSHIP_STEPS = ['f1', 'f2', 'f3', 'f4', 'f5'] as const

export default async function WorkPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('work')
  const tcs = await getTranslations('caseStudies')

  /** Public previews only. Rendered when a demo is both configured and cleared
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

      {/* ── Shown in full ──────────────────────────────────────────────────
          The flagship. The screenshot is the hero frame of the proof package —
          the form before save — as a redacted public derivative. */}
      <section className="section surface-plain" data-section="flagship">
        <div className="container">
          <div className="wf">
            <div className="wf-say">
              <SectionHeader label={t('flagEyebrow')}>{t('flagTitle')}</SectionHeader>
              <p className="wf-body">{t('flagBody')}</p>
              <ol className="wf-steps">
                {FLAGSHIP_STEPS.map((k) => <li key={k}>{t(k)}</li>)}
              </ol>
              <p className="wf-disclosure">{t('flagDisclosure')}</p>
              <Link href="/work/maxpromo-os" className="btn btn-primary">{t('flagCta')}</Link>
            </div>
            <Link href="/work/maxpromo-os" className="wf-shot" aria-label={t('flagCta')}>
              <Image
                src="/images/systems/maxpromo-os/03-form-before-save.png"
                alt={t('flagAlt')}
                width={1311}
                height={752}
                sizes="(max-width: 1000px) 100vw, 640px"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Client work ────────────────────────────────────────────────────
          Each entry renders what it declares it has and nothing more.
          lib/work-entries.ts holds the claims audit that decides what appears
          at all. */}
      <section className="section surface-operational" data-section="delivered">
        <div className="container">
          <SectionHeader label={t('provenEyebrow')}>{t('provenTitle')}</SectionHeader>
          <p className="sec-lede" style={{ margin: '0 0 var(--space-8)' }}>{t('provenLede')}</p>

          <div className="we-list">
            {WORK_ENTRIES.map((e) => (
              <article key={e.id} className="we" data-entry={e.id}>
                <header className="we-head">
                  <p className="we-meta">
                    <span className="we-tag">{tcs(e.tagKey)}</span>
                  </p>
                  <h3 className="we-headline">{t(e.headlineKey)}</h3>
                </header>

                <div className="we-body">
                  {e.evidence.includes('before-after') && (
                    <div className="we-ba">
                      <div>
                        <p className="we-ba-label">{t('beforeLabel')}</p>
                        <ul className="we-ba-list we-ba-before">
                          {e.beforeKeys.map((k) => <li key={k}>{tcs(k)}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="we-ba-label we-ba-label-after">{t('afterLabel')}</p>
                        <ul className="we-ba-list we-ba-after">
                          {e.afterKeys.map((k) => <li key={k}>{tcs(k)}</li>)}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                <footer className="we-foot">
                  {e.evidence.includes('private-demo') && (
                    <Link
                      href={`/contact?intent=demo&project=${e.id}&source=work`}
                      className="btn btn-sm"
                    >
                      {t('askDemo')}
                    </Link>
                  )}
                  {CAPABILITY_HREF[e.capability] && (
                    <Link href={CAPABILITY_HREF[e.capability]} className="quiet-link">
                      {t('relatedLabel')}
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
          <SectionHeader label={t('evidenceEyebrow')}>{t('evidenceTitle')}</SectionHeader>
          <ul className="we-policy">
            {(['e1', 'e2', 'e3'] as const).map((k) => (
              <li key={k} className="we-policy-item">
                <h3 className="we-policy-title">{t(`${k}Title`)}</h3>
                <p className="we-policy-body">{t(`${k}Body`)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {publicPreviews.length > 0 && (
        <section className="section surface-plain">
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
            <Link href="/contact?intent=demo&source=work" className="btn btn-primary">{t('requestCta')}</Link>
            <p style={{ margin: 'var(--space-5) 0 0', fontSize: 'var(--text-micro)', color: 'var(--brand-text-inverted-secondary)' }}>
              {t('requestNote')}
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
