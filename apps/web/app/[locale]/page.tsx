import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'
import { currentDomain, showcaseRootMetadata } from '@/lib/domains/server'
import { notFound } from 'next/navigation'
import { getLandingData } from '@/lib/registry/adapters/landing.adapter'
import { LandingEngine } from '@/components/landing/LandingEngine'
import Hero from '@/components/Hero'
import { Link } from '@/i18n/navigation'
import { SectionHeader, Icon } from '@maxpromo/ui'
import { ProofMetrics } from '@/components/homepage/ProofMetrics'
import type { ProofMetric } from '@/components/homepage/ProofMetrics'
import { CapabilityRail } from '@/components/ui/CapabilityRail'
import { ArchitectureMap } from '@/components/ui/ArchitectureMap'
import { IntegrationMarquee } from '@/components/ui/IntegrationMarquee'
import { CAPABILITIES } from '@/lib/capabilities'

/* ─── METADATA ─── */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params

  // ── Showcase dispatch ─────────────────────────────────────────────────
  // The page body has dispatched on the domain since the host map was built;
  // this function never did. So nine product domains rendered their own
  // product under the consultancy's <title>, the consultancy's OpenGraph card
  // and a canonical URL pointing at the consultancy's home page — which asks
  // Google to show the consultancy in their place.
  const showcaseDomain = await currentDomain()
  const showcase = showcaseRootMetadata(showcaseDomain, locale)
  if (showcase) return showcase

  const isDE = locale === 'de'
  // Bare page title, root layout's `%s | Maxpromo Digital` template appends
  // the brand suffix. Previously this string already included the brand
  // prefix itself, producing a doubled "... | Maxpromo Digital | Maxpromo
  // Digital" <title> tag.
  const title = isDE
    ? 'Business-Systeme aus Essen'
    : 'Business Systems, Built in Essen'
  // The description no longer leads with website modernisation. That is a
  // capability, sold on /solutions/websites-platforms; leading with it told a
  // search result the company is a web agency.
  const description = isDE
    ? 'Wir entwerfen und bauen die Systeme, auf denen Unternehmen laufen, und halten sie danach am Laufen. Von der Anfrage bis zur Freigabe.'
    : 'We design and build the systems businesses run on, and keep them running afterwards. From the first request to the final approval.'
  // og:title / twitter:title are shown as-is by social crawlers (no template
  // applied), og:site_name already carries the brand there, but keeping the
  // full framing here matches the page's prior social-facing copy.
  const ogTitle = isDE
    ? 'Maxpromo Digital — Business-Systeme aus Essen'
    : 'Maxpromo Digital — Business Systems, Built in Essen'
  return {
    title,
    description,
    alternates: {
      canonical: `https://www.maxpromo.digital/${locale}`,
      languages: {
        de: 'https://www.maxpromo.digital/de',
        en: 'https://www.maxpromo.digital/en',
      },
    },
    openGraph: {
      // Next replaces the openGraph object rather than merging it, so a page
      // that sets any of it sets all of it. The root layout's siteName was
      // being dropped here — the consultancy's own home page has been serving
      // no og:site_name at all, on both locales.
      siteName: 'Maxpromo Digital',
      title: ogTitle,
      description,
      url: `https://www.maxpromo.digital/${locale}`,
      images: [{ url: '/images/seo/maxpromo-digital-og.png', width: 1200, height: 630, alt: 'Maxpromo Digital' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: ['/images/seo/maxpromo-digital-og.png'],
    },
  }
}

/* ─── PAGE ─────────────────────────────────────────────────────────────────
   Rebuilt in the homepage presentation pass. Fourteen sections became seven,
   and the page is a route rather than a catalogue: the problem, the model
   that answers it, what it is built from, what it delivered, how the work is
   done, the one product marketed from here, and the single next step.

   What was removed, and where it lives instead:

     Legacy modernisation (five cards)  → /solutions/websites-platforms, which
       already states the same thing better. Leading the homepage with Joomla
       and WordPress told every visitor this was a web agency.
     Latest insights (three cards)      → /blog. The images were the last
       generated artwork on the site and all three posts were about Joomla.
     The rotating pain strip            → deleted. A four-second carousel of
       six one-liners is a device, not an argument, and it was client
       JavaScript for a decoration.
     Six pain cards                     → three ruled columns, in prose.
     FAQ accordion                      → deleted. It also carried the second
       of two different build durations this page stated (see below).
     Why Maxpromo / team / philosophy /
       five-step process (four sections)→ one "How we work" section.
     The Agent Bureau orbit diagram     → deleted; the section stays. The
       wrapper computed to 0×0 in production, so all six of its labels stacked
       on top of the centre node.

   The capability pass then changed what the third section is for. "Three kinds
   of work. One operating model." described the work in the company's own
   vocabulary — operating systems, workflow, supervision — which is accurate
   and answers a question a first-time visitor has not asked yet. The five
   names a business actually uses (lib/capabilities.ts) now carry that slot,
   as a rail under the hero and a hub diagram here; the three operating
   families keep their home on /solutions. Nothing was added on top: one
   section was replaced, and the two new strips are compact.

   Two public claims were changed rather than carried over, and both were
   changes by subtraction because the alternative was inventing a fact:

     The process panels stated "1–4 wks" for build-and-go-live while the FAQ
     four sections below stated "2 to 6 weeks". Both are gone with the panels
     and the accordion; the commitment is stated on /pricing, once.

     The proof strip stated "€14k/mo saved" for a project whose own case study
     states £14,000. Which symbol is right is a fact about a client, so this
     states a different documented result from the same project — 94% of
     invoices processed without human intervention — instead of guessing.

   The <main> element that used to wrap this page is gone too: the locale
   layout already renders <main id="content">, so every page of the hub had
   two main landmarks nested inside one another.
   ───────────────────────────────────────────────────────────────────────── */

export default async function HomePage() {
  const locale = await getLocale()

  // ── Showcase dispatch ─────────────────────────────────────────────────
  // Resolved from the Domain Registry rather than from two loose headers, so
  // the body and the metadata above are answering the same question from the
  // same record. They were not: generateMetadata had no showcase branch at all.
  const domain = await currentDomain()

  if (domain.mode === 'showcase' && domain.productSlug) {
    const data = getLandingData(domain.productSlug, locale)
    if (!data) return notFound()
    return <LandingEngine data={data} />
  }

  // ── Hub homepage ──────────────────────────────────────────────────────
  const tProblem = await getTranslations('home.problem')
  const tCap     = await getTranslations('capabilities')
  const tProof   = await getTranslations('home.proof')
  const tMethod  = await getTranslations('home.method')
  const tBureau  = await getTranslations('home.bureau')
  const tClose   = await getTranslations('home.closing')

  const PROBLEMS = ['i1', 'i2', 'i3'] as const
  const PROOF    = ['p1', 'p2', 'p3'] as const

  /* One governed mark per problem, in the order the copy states them: work
     arriving and not landing anywhere, the same record typed again, and a
     decision waiting on a person. Beside their own titles, so decorative. */
  const PROBLEM_ICONS = ['inbox', 'documents', 'waiting'] as const
  const RULES    = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'] as const
  const STEPS    = ['st1', 'st2', 'st3', 'st4', 'st5'] as const

  return (
    <>
      {/* ── 1. Hero ─────────────────────────────────────── white, editorial */}
      <Hero />

      {/* ── 1b. What we build, in five words each ──────────────── compact rail
          The hero explains the operating model. Somebody who arrived looking
          for a web developer needs to see the word before they decide this
          site is about something else. Each item is a link into the matching
          section of Solutions. */}
      <CapabilityRail
        label={tCap('railLabel')}
        items={CAPABILITIES.map((c) => ({
          id: c.id,
          icon: c.icon,
          name: tCap(`${c.key}Name`),
        }))}
      />

      {/* ── 2. The operational problem ───────────────────── white, editorial */}
      <section data-section="problem" className="section surface-plain">
        <div className="container">
          <div className="sec-head">
            <SectionHeader label={tProblem('eyebrow')}>{tProblem('title')}</SectionHeader>
            <p className="sec-lede">{tProblem('lede')}</p>
          </div>

          {/* Three cards, and the middle one is pale green.
              The rhythm is neutral → accent → neutral, which is the one
              arrangement that reads as one set of three rather than as three
              offers competing for a click. The accent is a surface here, never
              a full lime fill and never a card that looks more important than
              the two beside it: all three carry the same structure, the same
              icon weight and the same measure. */}
          <div className="pcards">
            {PROBLEMS.map((id, i) => (
              <div key={id} className={i === 1 ? 'pcard pcard-accent' : 'pcard'}>
                <div className="pcard-head">
                  <p className="pcard-index">{String(i + 1).padStart(2, '0')}</p>
                  <span className="pcard-icon"><Icon name={PROBLEM_ICONS[i]} size="sm" /></span>
                </div>
                <h3 className="pcard-title">{tProblem(`${id}Title`)}</h3>
                <p className="pcard-desc">{tProblem(`${id}Desc`)}</p>
              </div>
            ))}
          </div>

          {/* Tighter to the cards than the section rhythm would put it: this
              sentence is the conclusion of the three, not a new thought. */}
          <p className="pcards-close">{tProblem('closing')}</p>
        </div>
      </section>

      {/* ── 3. How the five connect ───────────────── off-white, architecture
          Replaces "Three kinds of work, one operating model", which grouped
          the work the way the company thinks about it rather than the way a
          business asks for it. Nobody searches for a business operating
          system. The five names a business does use are now the diagram, and
          the operating families keep their home on /solutions, where a reader
          has already decided to understand how the work fits together. */}
      <section data-section="capabilities" className="section surface-operational">
        <div className="container">
          <div className="sec-head">
            <SectionHeader label={tCap('bridgeEyebrow')}>{tCap('bridgeTitle')}</SectionHeader>
            <p className="sec-lede">{tCap('bridgeLede')}</p>
          </div>

          <ArchitectureMap
            layout="hub"
            centre={{ label: tCap('bridgeCentre') }}
            nodes={CAPABILITIES.map((c) => ({ label: tCap(`${c.key}Name`), icon: c.icon }))}
            caption={tCap('bridgeCaption')}
            a11yIntro={tCap('bridgeA11y')}
          />
        </div>
      </section>

      {/* ── 3b. The tools already in the building ───────────── compact, white
          The most common objection this company meets is "we already have
          systems". Answering it here costs a strip.

          The intro stays in the container; the rail is a direct child of the
          section, so it spans the viewport without any negative-margin or
          100vw arithmetic. That difference is the whole layout. */}
      <section data-section="tools" className="section-compact surface-plain">
        <div className="container">
          <div className="sec-split" style={{ marginBottom: 'var(--space-6)' }}>
            <div>
              <p className="section-label">{tCap('toolsEyebrow')}</p>
              <h2 style={{ margin: 0, fontSize: 'var(--text-h3)' }}>{tCap('toolsTitle')}</h2>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--brand-text-secondary)' }}>
                {tCap('toolsLede')}
              </p>
            </div>
          </div>
        </div>

        <IntegrationMarquee label={tCap('toolsEyebrow')} />

        <div className="container">
          <p className="tool-note">{tCap('toolsNote')}</p>
        </div>
      </section>

      {/* ── 4. Proof ──────────────────────────── pale green, measured claims */}
      <section data-section="proof" className="section surface-evidence">
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 'var(--space-5)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
            <SectionHeader label={tProof('eyebrow')}>{tProof('title')}</SectionHeader>
            <Link href="/case-studies" className="quiet-link">{tProof('viewAll')}</Link>
          </div>

          <p style={{ margin: '0 0 var(--space-8)', maxWidth: '46rem', fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--brand-text-secondary)' }}>
            {tProof('lede')}
          </p>

          <ProofMetrics
            metrics={PROOF.map((id): ProofMetric => ({
              id,
              value: tProof(`${id}Value`),
              label: tProof(`${id}Label`),
              source: tProof(`${id}Source`),
            }))}
          />
        </div>
      </section>

      {/* ── 5. How we work ───────────────────────────────── white, editorial */}
      <section data-section="method" className="section surface-plain">
        <div className="container">
          <div className="sec-split" style={{ marginBottom: 'var(--space-8)' }}>
            <div>
              <SectionHeader label={tMethod('eyebrow')}>{tMethod('title')}</SectionHeader>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)' }}>
                {tMethod('body')}
              </p>
              <p style={{ margin: 'var(--space-5) 0 0', fontSize: 'var(--text-small)', lineHeight: 'var(--leading-body)', color: 'var(--brand-text-secondary)' }}>
                {tMethod('closing')}
              </p>
            </div>
          </div>

          <div className="rules-grid">
            {RULES.map((id) => (
              <div key={id} className="rule-item">
                <p className="rule-title">{tMethod(`${id}Title`)}</p>
                <p className="rule-desc">{tMethod(`${id}Desc`)}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'var(--space-8)' }}>
            <p className="section-label">{tMethod('stepsLabel')}</p>
            <ol className="steps-line">
              {STEPS.map((id) => <li key={id}>{tMethod(id)}</li>)}
            </ol>
          </div>
        </div>
      </section>

      {/* ── 6. Max Agent Bureau ───────────────────────── off-white, a product
          The one product the hub markets publicly. The operating systems are
          protected products, marketed on their own domains. See
          docs/architecture/platform.md §1. */}
      <section id="agent-bureau" data-section="agent-bureau" className="section surface-operational">
        <div className="container">
          <div className="sec-split">
            <div>
              <p className="section-label">{tBureau('label')}</p>
              <h2 style={{ margin: 0 }}>{tBureau('title')}</h2>
            </div>
            <div>
              <p style={{ margin: '0 0 var(--space-6)', fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--brand-text-secondary)' }}>
                {tBureau('desc')}
              </p>
              <Link href="/agent-bureau" className="btn btn-secondary">{tBureau('cta')}</Link>
              <p className="bureau-guarantee">{tBureau('guarantee')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Closing ──────────────────────────────── black, the conclusion */}
      <section data-section="closing" className="section surface-authority">
        <div className="container">
          <div style={{ maxWidth: '40rem', margin: '0 auto', textAlign: 'center' }}>
            <p className="section-label">{tClose('eyebrow')}</p>
            <h2 style={{ margin: '0 auto var(--space-4)' }}>{tClose('title')}</h2>
            <p style={{ margin: '0 auto var(--space-8)', fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)' }}>
              {tClose('desc')}
            </p>
            <Link href="/contact" className="btn btn-primary">{tClose('cta')}</Link>
            <p style={{ margin: 'var(--space-5) auto 0', fontFamily: 'var(--brand-font-mono)', fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}>
              {tClose('footnote')}
            </p>
          </div>

          {/* The two doors deeper into the site, for a reader not ready to
              talk. Folded into the close rather than given a section. */}
          <div style={{ maxWidth: 'var(--container-narrow)', margin: 'var(--space-10) auto 0' }}>
            <p className="section-label" style={{ textAlign: 'center' }}>{tClose('routesLede')}</p>
            <div className="route-grid route-grid-inverted">
              <Link href="/industries" className="route-cell">
                <p className="route-cell-label">{tClose('route1')}</p>
                <p className="route-cell-desc">{tClose('route1Desc')}</p>
                <span className="route-cell-cta">{tClose('route1Cta')} &rarr;</span>
              </Link>
              <Link href="/solutions" className="route-cell">
                <p className="route-cell-label">{tClose('route2')}</p>
                <p className="route-cell-desc">{tClose('route2Desc')}</p>
                <span className="route-cell-cta">{tClose('route2Cta')} &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
