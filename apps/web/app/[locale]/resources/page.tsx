import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo/og'
import { setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getPublishedPosts } from '@/lib/blog/posts'
import { THEME_ORDER, themeOf } from '@/lib/blog/themes'

/**
 * app/[locale]/resources/page.tsx
 *
 * Material that is useful before anybody buys anything (ADR-0016): the start
 * of the acquisition engine, and written to work for a reader who never
 * contacts us.
 *
 * Organised by what an owner is trying to do, not by format. Four lanes, and
 * each one has something real behind it today:
 *
 *   decide what to change first   the guide
 *   see where your week snags     the Business Friction Check
 *   see a real workflow, built    the Maxpromo OS proof story
 *   learn from the work           the written archive
 *
 * A lane is added when it has an entry, never before: a heading with nothing
 * under it advertises absence. The guides lane links straight at its one guide
 * rather than at an index of one, and becomes an index at three.
 *
 * Gone in the 2026-10-06 build: the case studies (figures nobody could
 * evidence; the page now redirects to Work), the automation "reference" (a
 * catalogue of eighteen runtimes with nothing behind the number; it redirects
 * to Workflow Automation) and the three-part diagram that drew them.
 *
 * The archive leans on legacy modernisation, so it is the last lane rather
 * than the first impression, and the recent list takes one piece per area.
 */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isDE = locale === 'de'
  return pageMetadata({
    locale,
    path: '/resources',
    title: isDE ? 'Ressourcen' : 'Resources',
    description: isDE
      ? 'Nützlich, bevor Sie irgendetwas kaufen: ein Leitfaden, was man zuerst automatisiert, ein Check für Ihre eigene Woche, ein echter Ablauf Schritt für Schritt und Notizen aus der Arbeit.'
      : 'Useful before you buy anything: a guide to what to automate first, a check of your own working week, a real workflow shown step by step, and notes from the work.',
    family: 'resource',
  })
}

export default async function ResourcesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const isDE = locale === 'de'

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
      href: '/resources/what-to-automate-first',
      question: isDE ? 'Entscheiden, was zuerst dran ist' : 'Decide what to change first',
      title: isDE ? 'Leitfaden' : 'Guide',
      desc: isDE
        ? 'Welche Arbeit sich für Automatisierung eignet, welche besser bei Menschen bleibt und in welcher Reihenfolge man anfängt. Funktioniert ohne uns.'
        : 'Which work suits automation, which is better left with people, and what order to start in. Works without us.',
      cta: isDE ? 'Leitfaden lesen' : 'Read the guide',
    },
    {
      href: '/friction-check',
      question: isDE ? 'Sehen, wo die Woche hakt' : 'See where your week snags',
      title: isDE ? 'Business Friction Check' : 'Business Friction Check',
      desc: isDE
        ? 'Sechs Fragen zu einer normalen Arbeitswoche. Das Ergebnis kommt sofort, ohne E-Mail-Adresse und ohne Punktzahl, und es darf sagen, dass gerade nichts zu tun ist.'
        : 'Six questions about an ordinary working week. The result comes straight away, without an email address or a score, and it is allowed to say nothing needs doing.',
      cta: isDE ? 'Check starten' : 'Start the check',
    },
    {
      href: '/work/maxpromo-os',
      question: isDE ? 'Einen echten Ablauf ansehen' : 'See a real workflow, built',
      title: isDE ? 'Ablauf im Detail' : 'System breakdown',
      desc: isDE
        ? 'Wie in unserem eigenen System aus einer unsortierten Kunden-E-Mail ein geprüftes Angebot wird, Bildschirm für Bildschirm, und wo ein Mensch entscheidet.'
        : 'How a messy customer email becomes a reviewed quotation in our own system, screen by screen, and where a person decides.',
      cta: isDE ? 'Ablauf ansehen' : 'See the workflow',
    },
    {
      href: '/blog',
      question: isDE ? 'Aus der Arbeit lernen' : 'Learn from the work',
      title: isDE ? 'Fachbeiträge' : 'Written work',
      desc: isDE
        ? 'Aufgeschrieben, weil es beim Bauen aufgefallen ist: Migrationen, Altsysteme, Abläufe, die in der Praxis anders laufen als im Plan.'
        : 'Written down because it came up while building: migrations, legacy systems, and workflows that behave differently in practice than on paper.',
      cta: isDE ? 'Beiträge lesen' : 'Read the writing',
    },
  ]

  return (
    <>
      <section className="section-feature surface-authority">
        <div className="container">
          <div className="sec-head sec-head-wide" style={{ marginBottom: 0 }}>
            <p className="section-label">{isDE ? 'Ressourcen' : 'Resources'}</p>
            <h1 style={{ margin: '0 0 var(--space-5)' }}>
              {isDE ? 'Nützlich, bevor Sie irgendetwas kaufen.' : 'Useful before you buy anything.'}
            </h1>
            <p className="sec-lede" style={{ margin: 0 }}>
              {isDE
                ? 'Material, das Sie nutzen können, ohne mit uns zu sprechen. Sortiert danach, was Sie gerade vorhaben.'
                : 'Material you can use without talking to us, sorted by what you are trying to do.'}
            </p>
          </div>
        </div>
      </section>

      <section className="section surface-plain">
        <div className="container">
          <div className="ruled-grid ruled-grid-4">
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
