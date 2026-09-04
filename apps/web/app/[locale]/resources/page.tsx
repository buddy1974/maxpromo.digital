import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getPublishedPosts } from '@/lib/blog/posts'

/**
 * app/[locale]/resources/page.tsx
 *
 * The Resources index. Answers one business question: "what do these people
 * actually know?"
 *
 * A hub, not a content page. It routes to the three things that already exist
 * and have their own URLs — written work, case studies, and what a piece of
 * work costs — rather than duplicating them. The blog keeps its /blog paths
 * because those carry search history worth preserving.
 */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isDE = locale === 'de'
  return {
    title: isDE ? 'Ressourcen' : 'Resources',
    description: isDE
      ? 'Fachbeiträge, Fallstudien und Preisrahmen — was wir gelernt haben und was Arbeit bei uns kostet.'
      : 'Written work, case studies and pricing — what we have learned and what a piece of work costs.',
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

  const posts = getPublishedPosts(locale).slice(0, 4)

  const sections = [
    {
      href: '/blog',
      label: isDE ? 'Fachbeiträge' : 'Written work',
      title: isDE ? 'Was wir beim Bauen gelernt haben' : 'What we have learned building',
      desc: isDE
        ? 'Beiträge zu Migrationen, Altsystemen und Betriebsabläufen. Geschrieben für Leute, die ein System betreiben, nicht für Suchmaschinen.'
        : 'Pieces on migrations, legacy systems and operational workflows. Written for people running a system, not for search engines.',
    },
    {
      href: '/case-studies',
      label: isDE ? 'Fallstudien' : 'Case studies',
      title: isDE ? 'Was wir gebaut haben und was sich änderte' : 'What we built and what changed',
      desc: isDE
        ? 'Konkrete Projekte: Ausgangslage, Vorgehen, Ergebnis. Ohne Zahlen, die wir nicht belegen können.'
        : 'Specific projects: the situation, the approach, the result. Without numbers we cannot evidence.',
    },
    {
      href: '/automation-lab',
      label: isDE ? 'Referenz' : 'Reference',
      title: isDE ? 'Die Systeme, auf denen wir bauen' : 'The runtimes we build on',
      desc: isDE
        ? 'Ein Verzeichnis der Entscheidungs-, Koordinations- und Kommunikationssysteme, die wir installieren, und wofür jedes gedacht ist.'
        : 'A catalogue of the decision, coordination and communication runtimes we install, and what each one is for.',
    },
    {
      href: '/pricing',
      label: isDE ? 'Preise' : 'Pricing',
      title: isDE ? 'Was eine Arbeit kostet' : 'What a piece of work costs',
      desc: isDE
        ? 'Rahmen für Umfang und Kosten, damit ein Gespräch nicht mit einer Zahl beginnen muss, die niemand kennt.'
        : 'Ranges for scope and cost, so a conversation does not have to start with a number nobody knows.',
    },
  ]

  return (
    <>
      <section className="section-feature">
        <div className="container">
          <div style={{ maxWidth: '44rem' }}>
            <p className="section-label">{isDE ? 'Ressourcen' : 'Resources'}</p>
            <h1 style={{ margin: '0 0 var(--space-5)' }}>
              {isDE ? 'Was wir wissen, offen aufgeschrieben.' : 'What we know, written down.'}
            </h1>
            <p className="lede">
              {isDE
                ? 'Fünfzehn Jahre Arbeit an Produktionssystemen hinterlassen Wissen. Das Nützliche davon steht hier.'
                : 'Fifteen years of work on production systems leaves knowledge behind. The useful part of it is here.'}
            </p>
          </div>
        </div>
      </section>

      <section className="section" style={{ borderTop: '1px solid var(--brand-border)' }}>
        <div className="container">
          <div className="industry-list">
            {sections.map((s) => (
              <Link key={s.href} href={s.href} className="industry-row">
                <div>
                  <p className="route-cell-label">{s.label}</p>
                  <h2 className="h-card" style={{ margin: 0 }}>{s.title}</h2>
                </div>
                <div className="industry-row-body">
                  <p className="industry-row-summary">{s.desc}</p>
                  <span className="industry-row-cta">{isDE ? 'Ansehen' : 'Read'} →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {posts.length > 0 && (
        <section className="section" style={{ background: 'var(--brand-surface-subtle)', borderTop: '1px solid var(--brand-border)' }}>
          <div className="container">
            <p className="section-label">{isDE ? 'Zuletzt geschrieben' : 'Most recent'}</p>
            <ul className="link-list">
              {posts.map((post) => (
                <li key={post.slug}>
                  <Link href={`/blog/${post.slug}`} className="link-list-item">
                    <span className="link-list-title">{post.title}</span>
                    <span className="link-list-meta">{post.readTime ? `${post.readTime} min` : ''}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  )
}
