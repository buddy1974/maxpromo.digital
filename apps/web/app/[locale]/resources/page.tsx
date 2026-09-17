import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getPublishedPosts } from '@/lib/blog/posts'
import { THEME_ORDER, themeOf } from '@/lib/blog/themes'
import { ArchitectureMap } from '@/components/ui/ArchitectureMap'

/**
 * app/[locale]/resources/page.tsx
 *
 * Rebuilt in the public presentation pass.
 *
 * What it was: three rows and "Read →", then a thin list, on a page that was
 * mostly empty. It was the third page on this site using the same directory
 * pattern, and it gave the three destinations no reason to exist beyond
 * having been created.
 *
 * What it is: each destination states what it answers. Written work is what we
 * learned, case studies are what we built, reference is how the systems are
 * put together. The recent list gets a real hierarchy instead of being a row
 * of titles with a minute count on the end.
 *
 * The capability pass changed the scene from a sequence to a map. Three
 * numbered steps said these were stages of one route — read the writing, then
 * the case studies, then the reference — which is not true and is not how
 * anybody uses the page. They are three parts of one body of work, and a
 * reader arrives at whichever one their question belongs to. The fan says
 * that: one source, three parts, no order.
 *
 * The hero says "not a blog" in as many words, because the archive leans on
 * legacy modernisation and the first impression it can otherwise give — an old
 * CMS blog — is the one thing this page must not give.
 */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isDE = locale === 'de'
  return {
    title: isDE ? 'Ressourcen' : 'Resources',
    description: isDE
      ? 'Was wir gelernt haben, was wir gebaut haben und wie die Systeme aufgebaut sind.'
      : 'What we have learned, what we have built, and how the systems are put together.',
    alternates: {
      canonical: `https://www.maxpromo.digital/${locale}/resources`,
      languages: {
        de: 'https://www.maxpromo.digital/de/resources',
        en: 'https://www.maxpromo.digital/en/resources',
      },
    },
  }
}

export default async function ResourcesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const isDE = locale === 'de'
  const tScene = await getTranslations('scenes')

  // The most recent piece from each area rather than the five most recent
  // overall. The archive leans heavily on legacy modernisation, so a plain
  // recency list made the Resources overview look like a CMS migration blog.
  const all = getPublishedPosts(locale)
  const seen = new Set<string>()
  const posts = THEME_ORDER
    .map((theme) => all.find((p) => themeOf(p.category) === theme && !seen.has(p.slug) && seen.add(p.slug)))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))

  const destinations = [
    {
      href: '/blog',
      question: isDE ? 'Was wir gelernt haben' : 'What we have learned',
      title: isDE ? 'Fachbeiträge' : 'Written work',
      desc: isDE
        ? 'Aufgeschrieben, weil es beim Bauen aufgefallen ist: Migrationen, Altsysteme, Abläufe, die in der Praxis anders laufen als im Plan. Geschrieben für Leute, die ein System betreiben.'
        : 'Written down because it came up while building: migrations, legacy systems, and workflows that behave differently in practice than on paper. Written for people who run a system.',
      cta: isDE ? 'Beiträge lesen' : 'Read the writing',
    },
    {
      href: '/case-studies',
      question: isDE ? 'Was wir gebaut haben' : 'What we have built',
      title: isDE ? 'Fallstudien' : 'Case studies',
      desc: isDE
        ? 'Drei Projekte mit Ausgangslage, Eingriff und Ergebnis. Kundennamen bleiben unter NDA vertraulich. Keine Zahl, die wir nicht belegen können.'
        : 'Three projects with the starting point, the intervention and the result. Client names stay confidential under NDA. No figure we cannot evidence.',
      cta: isDE ? 'Fallstudien ansehen' : 'See the case studies',
    },
    {
      href: '/automation-lab',
      question: isDE ? 'Wie die Systeme aufgebaut sind' : 'How the systems are put together',
      title: isDE ? 'Referenz' : 'Reference',
      desc: isDE
        ? 'Ein Verzeichnis der Entscheidungs-, Koordinations- und Kommunikationssysteme, die wir installieren, und wofür jedes gedacht ist.'
        : 'A catalogue of the decision, coordination and communication runtimes we install, and what each one is for.',
      cta: isDE ? 'Referenz öffnen' : 'Open the reference',
    },
  ]

  return (
    <>
      <section className="section-feature surface-authority">
        <div className="container">
          <div className="sec-head sec-head-wide" style={{ marginBottom: 0 }}>
            <p className="section-label">{isDE ? 'Ressourcen' : 'Resources'}</p>
            <h1 style={{ margin: '0 0 var(--space-5)' }}>
              {isDE ? 'Was wir wissen, offen aufgeschrieben.' : 'What we know, written down.'}
            </h1>
            <p className="sec-lede" style={{ margin: 0 }}>
              {isDE
                ? 'Kein Blog. Drei verschiedene Dinge: was uns das Bauen dieser Systeme beigebracht hat, was dabei herausgekommen ist, und wie die Systeme selbst aufgebaut sind.'
                : 'Not a blog. Three separate things: what building these systems taught us, what the work produced, and how the systems themselves are put together.'}
            </p>
          </div>
        </div>
      </section>

      <section className="section surface-plain">
        <div className="container">
          <div className="sec-head">
            <p className="section-label">{tScene('resSceneEyebrow')}</p>
            <h2 style={{ margin: 0 }}>{tScene('resSceneTitle')}</h2>
          </div>

          {/* The knowledge map: one body of work, three parts, no order
              between them. On a narrow screen the same markup recomposes into
              three readable blocks rather than shrinking the diagram. */}
          <div style={{ marginBottom: 'var(--space-10)' }}>
            <ArchitectureMap
              layout="fan"
              centre={{ label: tScene('resCentre') }}
              nodes={[
                { label: tScene('res1'), detail: tScene('res1d'), icon: 'documents' },
                { label: tScene('res2'), detail: tScene('res2d'), icon: 'quality' },
                { label: tScene('res3'), detail: tScene('res3d'), icon: 'operatingModel' },
              ]}
              caption={tScene('resCaption')}
              a11yIntro={tScene('resA11y')}
            />
          </div>

          <div className="ruled-grid">
            {destinations.map((d, i) => (
              <div key={d.href} className="ruled-item">
                <p className="ruled-index">{String(i + 1).padStart(2, '0')} · {d.question}</p>
                <h2 className="ruled-title" style={{ fontSize: 'var(--text-h3)' }}>{d.title}</h2>
                <p className="ruled-desc" style={{ marginBottom: 'var(--space-5)' }}>{d.desc}</p>
                <Link href={d.href} className="quiet-link">{d.cta} &rarr;</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {posts.length > 0 && (
        <section className="section surface-operational">
          <div className="container">
            <div className="sec-split">
              <div>
                <p className="section-label">{isDE ? 'Aus jedem Bereich' : 'One from each area'}</p>
                <h2 style={{ margin: 0 }}>
                  {isDE ? 'Aus der laufenden Arbeit.' : 'From the work in progress.'}
                </h2>
              </div>
              <div>
                <div className="idx">
                  {posts.map((post, i) => (
                    <Link key={post.slug} href={`/blog/${post.slug}`} className="idx-row">
                      <p className="idx-num">{String(i + 1).padStart(2, '0')}</p>
                      <div>
                        <p className="idx-title">{post.title}</p>
                        <p className="idx-abstract">{post.excerpt}</p>
                      </div>
                      <p className="idx-meta">
                        <span>{post.publishedAt}</span>
                        {post.readTime ? <span>{post.readTime} min</span> : null}
                      </p>
                    </Link>
                  ))}
                </div>
                <p style={{ marginTop: 'var(--space-5)' }}>
                  <Link href="/blog" className="quiet-link">
                    {isDE ? 'Alle Beiträge' : 'All written work'} &rarr;
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
