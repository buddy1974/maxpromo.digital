import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'
import { currentDomain, showcaseRootMetadata } from '@/lib/domains/server'
import { notFound } from 'next/navigation'
import { BUSINESS } from '@maxpromo/config'
import { getLandingData } from '@/lib/registry/adapters/landing.adapter'
import { LandingEngine } from '@/components/landing/LandingEngine'
import { Link } from '@/i18n/navigation'
import { SectionHeader } from '@maxpromo/ui'
import { getPostBySlug } from '@/lib/blog/posts'
import HomeHero from '@/components/home/HomeHero'
import { FrictionScene } from '@/components/home/FrictionScene'
import { CapabilityBench } from '@/components/home/CapabilityBench'
import { MethodTransform } from '@/components/home/MethodTransform'
import { FounderNote } from '@/components/home/FounderNote'
import { ProofMetrics } from '@/components/homepage/ProofMetrics'
import type { ProofMetric } from '@/components/homepage/ProofMetrics'
import { IntegrationMarquee } from '@/components/ui/IntegrationMarquee'
import { CAPABILITIES } from '@/lib/capabilities'

/**
 * The homepage's own styles, carried by the homepage.
 *
 * Every class in this file is used by this route and nothing else: the
 * friction scenes, the capability bench, the method transformation, the
 * founder block, the resource panel and the closing invitation. Held in
 * app/globals.css they would be downloaded by every visitor to every page of
 * the site in order to serve one of them. Same precedent as the back office's
 * chrome and the legal-document typography.
 */
import './home.css'

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

/* ─────────────────────────────────────────────────────────────────────────────
   THE HOMEPAGE, AFTER THE CONTENT RESET

   The order is the argument, and it is deliberate:

     pain -> recognition -> explanation -> capability -> method -> evidence
     -> compatibility -> founder -> resource -> knowledge -> conversation

   A visitor meets their own business before they meet ours. Nothing above the
   capability bench asks them to understand automation, agents or an operating
   model, because a person with a full inbox is not shopping for an
   architecture. What they recognise first is the week they have just had.

   The phrase "business operating systems" does not appear on this page. It is
   still how the company thinks and it still belongs on /solutions and deeper,
   where a reader has chosen to understand the shape of the work. It is not a
   thing a cold visitor should have to decode in the first screen.

   Every section here earns its place by doing something the one above it
   cannot: recognise, explain, list, justify, prove, reassure, introduce, help,
   teach, invite. Sections that existed to complete a template are gone.
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
  const tFam   = await getTranslations('home.familiar')
  const tWhat  = await getTranslations('home.whatWeDo')
  const tCap   = await getTranslations('capabilities')
  const tMeth  = await getTranslations('home.method')
  const tEvid  = await getTranslations('home.evidence')
  const tTools = await getTranslations('home.tools')
  const tFound = await getTranslations('home.founder')
  const tRes   = await getTranslations('home.resource')
  const tKnow  = await getTranslations('home.knowledge')
  const tClose = await getTranslations('home.closing')

  /* Three situations, three drawings, in the order the copy states them:
     a duplicate, a queue, a split. */
  const SITUATIONS = [
    { id: 's1', scene: 'copy'  as const },
    { id: 's2', scene: 'queue' as const },
    { id: 's3', scene: 'split' as const },
  ]

  /* TWO EVIDENCE STORIES, AND TWO IS THE ANSWER.

     Both are from published case studies, both measured after that system went
     live, neither rounded, strengthened or moved between projects:

       78%            less time spent on manual data processing
       3 days -> 4h   invoice cycle, start to finish

     Two figures that were available are deliberately absent. £14,000/month has
     a currency under forensic review. And "94% of invoices processed without
     human intervention" was dropped on Marcel's instruction: it reads as
     automation language on a page whose whole argument is to describe the
     business before the technology, and a cold visitor cannot tell from those
     six words what was happening before. A third number to square off a row is
     the thing this section is least allowed to do.

     Dropping it meant deleting the key, not skipping it. These figures were in
     a `home.proof` group of their own, and next-intl serialises the whole
     message tree into the document — so the first attempt, which simply stopped
     rendering p2, left "94 % der Rechnungen ohne manuellen Eingriff verarbeitet"
     sitting in the page source of every visit. Found by reading what production
     actually served, not the component. The two live figures now sit in
     `home.evidence` with the rest of this section's copy, and the group that
     held the withdrawn claim, along with a stale title still promising three
     systems, is gone.

     Proof before symmetry. The grid sizes itself to what it is given. */
  const PROOF = ['p1', 'p3'] as const

  const METHOD_QUESTIONS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'] as const
  const METHOD_STEPS     = ['st1', 'st2', 'st3', 'st4'] as const
  const WHAT_LINES       = ['l1', 'l2', 'l3', 'l4'] as const
  const RESOURCE_ITEMS   = ['i1', 'i2', 'i3', 'i4', 'i5', 'i6', 'i7'] as const

  /* USEFUL, NOT NOISY — and that rule is applied to our own inventory.

     The published editorial is thirteen articles and eleven of them are Joomla
     or WordPress migration and recovery pieces. They are real work and they
     stay published, but promoting three of them under "things we've learned
     from building real systems" would make this company look like a CMS
     rescue service, which is the positioning this reset exists to correct.

     So: the two that genuinely belong to the new direction, by slug, and no
     third to fill the row. The editorial topics this section is waiting for
     are recorded in the backlog rather than faked here. */
  const KNOWLEDGE_SLUGS = ['website-online-business-dead', 'internal-newsletter-system']
  const knowledge = KNOWLEDGE_SLUGS
    .map((slug) => getPostBySlug(slug, locale))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))

  return (
    <>
      {/* ── 1. Hero ──────────────────────────── contained dark, the promise */}
      <HomeHero />

      {/* ── 2. Sound familiar? ────────────────────── white, recognition ────
          The first thing on this page after the promise is the reader's own
          business, described without a single word about technology. */}
      <section data-section="familiar" className="section surface-plain">
        <div className="container">
          <div className="sec-head">
            <SectionHeader label={tFam('eyebrow')}>{tFam('title')}</SectionHeader>
          </div>

          <div className="fsits">
            {SITUATIONS.map((s) => (
              <article className="fsit" key={s.id}>
                <FrictionScene id={s.scene} a11y={tFam(`${s.id}A11y`)} />
                <h3 className="fsit-title">{tFam(`${s.id}Title`)}</h3>
                <p className="fsit-body">{tFam(`${s.id}Body`)}</p>
              </article>
            ))}
          </div>

          <p className="fsits-close">{tFam('closing')}</p>
        </div>
      </section>

      {/* ── 3. What we do ───────────────────── off-white, the explanation ──
          Four sentences, each naming a real situation, then the rule. This is
          the first point on the page where we describe ourselves, and it is
          still in the language of the reader's problem. */}
      <section data-section="what-we-do" className="section surface-operational">
        <div className="container">
          <div className="sec-split">
            <div>
              <SectionHeader label={tWhat('eyebrow')}>{tWhat('title')}</SectionHeader>
            </div>
            <div className="what-lines">
              {WHAT_LINES.map((l) => (
                <p className="what-line" key={l}>{tWhat(l)}</p>
              ))}
              <p className="what-rule">
                {tWhat('l5')}<br />{tWhat('l6')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. The five capabilities ──────────────────── white, one bench ──
          Five rows in one frame rather than five cards in a grid. See the
          component for why that difference matters. */}
      <section data-section="capabilities" className="section-compact surface-plain">
        <div className="container">
          <CapabilityBench
            items={CAPABILITIES.map((c) => ({
              id: c.id,
              icon: c.icon,
              name: tCap(`${c.key}Name`),
              headline: tCap(`${c.key}Headline`),
              body: tCap(`${c.key}Body`),
              cta: tCap(`${c.key}Cta`),
            }))}
          />
        </div>
      </section>

      {/* ── 5. How we think ──────────────────────── black, the method ──────
          The one dark section in the middle of the page. It carries the
          sentence this company would most like to be remembered for. */}
      <section data-section="method" className="section surface-authority">
        <div className="container">
          <div className="sec-split">
            <div>
              <SectionHeader label={tMeth('eyebrow')}>{tMeth('title')}</SectionHeader>
            </div>
            <div>
              <p className="method-body">{tMeth('body')}</p>
              <p className="method-lead">{tMeth('lead')}</p>
              <ul className="method-questions">
                {METHOD_QUESTIONS.map((q) => <li key={q}>{tMeth(q)}</li>)}
              </ul>
              <p className="method-then">{tMeth('then')}</p>
            </div>
          </div>

          <MethodTransform
            beforeLabel={tMeth('beforeLabel')}
            afterLabel={tMeth('afterLabel')}
            beforeA11y={tMeth('beforeA11y')}
            afterA11y={tMeth('afterA11y')}
          />

          <ol className="method-steps">
            {METHOD_STEPS.map((s) => <li key={s}>{tMeth(s)}</li>)}
          </ol>
        </div>
      </section>

      {/* ── 6. Real work ──────────────────────── pale green, the evidence ── */}
      <section data-section="evidence" className="section surface-evidence">
        <div className="container">
          <div className="evid-head">
            <SectionHeader label={tEvid('eyebrow')}>{tEvid('title')}</SectionHeader>
            <Link href="/case-studies" className="quiet-link">{tEvid('viewAll')} &rarr;</Link>
          </div>

          <p className="evid-lede">{tEvid('lede')}</p>

          <ProofMetrics
            metrics={PROOF.map((id): ProofMetric => ({
              id,
              value: tEvid(`${id}Value`),
              label: tEvid(`${id}Label`),
              source: tEvid(`${id}Source`),
            }))}
          />
        </div>
      </section>

      {/* ── 7. The tools ──────────────────────── white, the objection ──────
          "We already have systems" is the most common thing this company is
          told. Answering it costs one strip. The rail is a direct child of the
          section so it spans the viewport without negative-margin arithmetic. */}
      <section data-section="tools" className="section-compact surface-plain">
        <div className="container">
          <div className="sec-split" style={{ marginBottom: 'var(--space-6)' }}>
            <div>
              <p className="section-label">{tTools('eyebrow')}</p>
              <h2 className="tools-title">{tTools('title')}</h2>
            </div>
            <div>
              <p className="tools-body">{tTools('body')}</p>
            </div>
          </div>
        </div>

        <IntegrationMarquee label={tTools('eyebrow')} />

        <div className="container">
          <p className="tool-note">{tTools('note')}</p>
        </div>
      </section>

      {/* ── 8. The founder ─────────────────── off-white, the person ────────
          Fifteen years of this work is the strongest thing this company has to
          say, and it is said in the first person. */}
      <section data-section="founder" className="section surface-operational">
        <div className="container">
          <FounderNote
            copy={{
              eyebrow: tFound('eyebrow'),
              title: tFound('title'),
              p1: tFound('p1'),
              p2: tFound('p2'),
              list: [tFound('l1'), tFound('l2'), tFound('l3'), tFound('l4')],
              p3: tFound('p3'),
              p4: tFound('p4'),
              rule: tFound('rule'),
              name: tFound('name'),
              role: tFound('role'),
              cta: tFound('cta'),
              portraitAlt: tFound('portraitAlt'),
              portraitPending: tFound('portraitPending'),
            }}
          />
        </div>
      </section>

      {/* ── 9. Start here ──────────────────────── white, the useful thing ──
          THE CHECK IS NOT BUILT YET, AND THIS SECTION SAYS SO.

          It describes what it will look at and then tells the truth about its
          state. There is no button to a page that does not exist: the action
          here is the one that is genuinely available today, which is to talk to
          us. Building the tool is a backlog item, not a link. */}
      <section data-section="resource" className="section surface-plain">
        <div className="container">
          <div className="sec-head">
            <SectionHeader label={tRes('eyebrow')}>{tRes('title')}</SectionHeader>
          </div>

          <div className="resource">
            <div className="resource-say">
              <p className="resource-name">
                {tRes('name')}
                <span className="resource-status">{tRes('status')}</span>
              </p>
              <p className="resource-body">{tRes('body')}</p>

              <p className="resource-lookat">{tRes('lookAt')}</p>
              <ul className="resource-items">
                {RESOURCE_ITEMS.map((i) => <li key={i}>{tRes(i)}</li>)}
              </ul>

              <p className="resource-outcome">{tRes('outcome')}</p>
              <p className="resource-note">{tRes('statusNote')}</p>

              <Link href="/contact" className="btn btn-secondary">{tRes('fallbackCta')}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. Useful, not noisy ──────────────── off-white, the knowledge ─ */}
      {knowledge.length > 0 && (
        <section data-section="knowledge" className="section-compact surface-operational">
          <div className="container">
            <div className="evid-head">
              <SectionHeader label={tKnow('eyebrow')}>{tKnow('title')}</SectionHeader>
              <Link href="/resources" className="quiet-link">{tKnow('cta')} &rarr;</Link>
            </div>

            <ul className="know-list">
              {knowledge.map((post) => (
                <li key={post.slug}>
                  <Link href={`/blog/${post.slug}`} className="know-item">
                    <span className="know-title">{post.title}</span>
                    <span className="know-excerpt">{post.excerpt}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── 11. The conversation ───────────────────── black, the invitation */}
      <section data-section="closing" className="section surface-authority">
        <div className="container">
          <div className="close-block">
            <h2 className="close-title">{tClose('title')}</h2>
            <p className="close-body">{tClose('body')}</p>
            <Link href="/contact" className="btn btn-primary">{tClose('cta')}</Link>
            <p className="close-email">
              {tClose('emailLabel')}{' '}
              <a href={`mailto:${BUSINESS.email}`} className="close-email-link">{BUSINESS.email}</a>
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
