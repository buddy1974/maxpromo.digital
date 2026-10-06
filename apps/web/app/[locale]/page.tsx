import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo/og'
import { getTranslations, getLocale } from 'next-intl/server'
import { currentDomain, showcaseRootMetadata } from '@/lib/domains/server'
import { notFound } from 'next/navigation'
import { BUSINESS, COMPANY_BRAND } from '@maxpromo/config'
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
import Image from 'next/image'
import { IntegrationMarquee } from '@/components/ui/IntegrationMarquee'
import { CAPABILITIES } from '@/lib/capabilities'
import { FlowSteps } from '@/components/ui/FlowSteps'

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
  return pageMetadata({
    locale,
    path: '/',
    title,
    description,
    family: 'company',
    // The page title is templated with the brand; og:title is shown as-is by
    // a crawler, so it carries the full framing. Previously this block was
    // hand-rolled and, despite a comment warning that setting any of
    // openGraph sets all of it, still omitted og:locale entirely.
    ogTitle,
    // The approved corporate card from the brand registry, not a generated one:
    // the home page is the link most often shared as "the company".
    image: homeCard(),
  })
}

function homeCard() {
  const card = COMPANY_BRAND.openGraphImage
  return card.path && card.width && card.height
    ? { path: card.path, width: card.width, height: card.height, alt: BUSINESS.brand }
    : undefined
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
  const tPrac  = await getTranslations('home.practice')
  const tKnow  = await getTranslations('home.knowledge')
  const tClose = await getTranslations('home.closing')

  /* Three situations, three drawings, in the order the copy states them:
     a duplicate, a queue, a split. */
  const SITUATIONS = [
    { id: 's1', scene: 'copy'  as const },
    { id: 's2', scene: 'queue' as const },
    { id: 's3', scene: 'split' as const },
  ]

  /* THE EVIDENCE IS A WORKFLOW YOU CAN SEE, NOT A FIGURE.

     This section once carried case-study figures — 78 %, three days to four
     hours — none of which has an artefact behind it; the claims registry marks
     them unevidenced and they no longer persuade anywhere. What replaced them
     is the one thing the company can show end to end: a quotation made in its
     own system, five steps, the decision with a person. The steps are the
     proof package's statements in the visitor's words. */
  const PROOF_STEPS = ['st1', 'st2', 'st3', 'st4'] as const
  const tGuide = await getTranslations('automationGuide')

  const METHOD_QUESTIONS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'] as const
  const METHOD_STEPS     = ['st1', 'st2', 'st3', 'st4'] as const
  const WHAT_LINES       = ['l1', 'l2', 'l3', 'l4'] as const
  /* Three everyday flows. The step a person takes is tagged, by index, so the
     drawing shows where judgement stays human without saying "AI" anywhere. */
  const PRACTICE = [
    { id: 'f1', personAt: 3 },
    { id: 'f2', personAt: 2 },
    { id: 'f3', personAt: -1 },
  ] as const

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

      {/* ── 4b. In practice ─────────────────────── off-white, the translation ──
          What the capabilities look like as everyday work, for an owner who
          does not want to learn the words automation, agent or API to find
          out. Three flows, drawn as steps; the person's step is tagged. */}
      <section data-section="practice" className="section surface-operational">
        <div className="container">
          <div className="sec-head">
            <SectionHeader label={tPrac('eyebrow')}>{tPrac('title')}</SectionHeader>
            <p className="sec-lede">{tPrac('intro')}</p>
          </div>

          <div className="practice">
            {PRACTICE.map((p) => (
              <article key={p.id} className="practice-flow">
                <h3 className="practice-title">{tPrac(`${p.id}Title`)}</h3>
                <FlowSteps
                  label={tPrac(`${p.id}Title`)}
                  steps={(tPrac.raw(`${p.id}Steps`) as string[]).map((label, i) => ({
                    label,
                    person: i === p.personAt ? tPrac('personTag') : undefined,
                  }))}
                />
                <p className="practice-body">{tPrac(`${p.id}Body`)}</p>
              </article>
            ))}
          </div>

          <p className="practice-end">{tPrac('end')}</p>
          <div className="practice-actions">
            <Link href="/contact?source=home-practice" className="btn btn-secondary">{tPrac('cta')}</Link>
            <Link href="/solutions#automation-or-system" className="quiet-link">{tPrac('aosLink')}</Link>
          </div>
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

      {/* ── 6. Real work ──────────────────────── pale green, the evidence ──
          The flagship proof: one quotation through the system we run our own
          paperwork on, captured in a controlled environment and published as
          a redacted derivative (docs/evidence/maxpromo-os). The visible work is
          the proof; there is no figure on this section because none is
          measured. */}
      <section data-section="evidence" className="section surface-evidence">
        <div className="container">
          <div className="evid-head">
            <SectionHeader label={tEvid('eyebrow')}>{tEvid('title')}</SectionHeader>
            <Link href="/work" className="quiet-link">{tEvid('viewAll')} &rarr;</Link>
          </div>

          <div className="hproof">
            <div className="hproof-say">
              <p className="evid-lede">{tEvid('lede')}</p>
              <ol className="hproof-steps">
                {PROOF_STEPS.map((k) => <li key={k}>{tEvid(k)}</li>)}
              </ol>
              <p className="hproof-note">{tEvid('disclosure')}</p>
              <Link href="/work/maxpromo-os" className="btn btn-secondary">{tEvid('cta')}</Link>
            </div>
            <Link href="/work/maxpromo-os" className="hproof-shot" aria-label={tEvid('cta')}>
              <Image
                src="/images/systems/maxpromo-os/02-extraction-result.png"
                alt={tEvid('alt')}
                width={1311}
                height={752}
                sizes="(max-width: 1000px) 100vw, 640px"
              />
            </Link>
          </div>
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
              ctaHref: '/about',
              portraitAlt: tFound('portraitAlt'),
              portraitPending: tFound('portraitPending'),
            }}
          />
        </div>
      </section>

      {/* ── 9. Not ready to talk? ─────────────────── white, the useful thing ──
          The Business Friction Check, the low-commitment path. Result first,
          no email gate, no score; it can conclude nothing is urgent. The list
          of what it looks at was cut when the practice section arrived: the
          page had grown, and one sentence says it. */}
      <section data-section="resource" className="section surface-plain">
        <div className="container">
          <div className="sec-head">
            <SectionHeader label={tRes('eyebrow')}>{tRes('title')}</SectionHeader>
          </div>

          <div className="resource">
            <div className="resource-say">
              <p className="resource-body">{tRes('body')}</p>

              <div className="resource-actions">
                <Link href="/friction-check" className="btn btn-primary">{tRes('cta')}</Link>
                <Link href="/contact?source=home-start" className="quiet-link">{tRes('fallbackCta')}</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. Useful, not noisy ──────────────── off-white, the knowledge ─
          The guide leads, because it is the one piece written to be useful to
          somebody who never contacts us. Then the two articles that belong to
          the current direction. */}
      {knowledge.length > 0 && (
        <section data-section="knowledge" className="section-compact surface-operational">
          <div className="container">
            <div className="evid-head">
              <SectionHeader label={tKnow('eyebrow')}>{tKnow('title')}</SectionHeader>
              <Link href="/resources" className="quiet-link">{tKnow('cta')} &rarr;</Link>
            </div>

            <ul className="know-list">
              <li>
                <Link href="/resources/what-to-automate-first" className="know-item">
                  <span className="know-kind">{tKnow('guideKind')}</span>
                  <span className="know-title">{tGuide('title')}</span>
                  <span className="know-excerpt">{tKnow('guideExcerpt')}</span>
                </Link>
              </li>
              {knowledge.map((post) => (
                <li key={post.slug}>
                  <Link href={`/blog/${post.slug}`} className="know-item">
                    <span className="know-kind">{tKnow('articleKind')}</span>
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
