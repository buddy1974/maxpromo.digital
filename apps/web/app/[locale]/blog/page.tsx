import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getPublishedPosts, type BlogPost } from '@/lib/blog/posts'
import { THEME_ORDER, themeOf, type Theme } from '@/lib/blog/themes'

/**
 * app/[locale]/blog/page.tsx — the written-work index.
 *
 * Rebuilt in the public presentation pass. Two things were wrong with it, and
 * only one of them was visual.
 *
 * THE IMAGES. Every article carried a generated promotional thumbnail, and
 * three of them were on the homepage. Neon palettes, glowing screens, collages
 * of interfaces that are not ours. They were the clearest remaining signal
 * that this company outsources its visual thinking, and they were the first
 * thing a reader saw on the page where the company is supposed to sound like
 * it knows something. They are gone from the index. They are NOT deleted:
 * `featuredImage` still exists on every post and still serves the article page
 * and the social card, where an image has a job.
 *
 * THE SHAPE OF THE ARCHIVE. Nine of the thirteen articles are about Joomla,
 * WordPress or recovering a website somebody lost control of. That is an
 * accurate record of where several years went, and deleting it would throw
 * away both the truth and the search traffic. But presented as a flat grid it
 * made legacy web work look like the company's subject, which it is not any
 * more.
 *
 * So the index is grouped by theme and the themes are ordered by where the
 * company is now, not by how many articles each one has. Legacy modernisation
 * keeps every article it had and gets a note saying plainly what it is. No
 * article was retitled, recategorised or unpublished to make this look better,
 * and no article was invented to fill a theme.
 *
 * Presentation is typographic: number, theme, title, abstract, date, reading
 * time. An index of writing should look like an index of writing.
 */


export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('blog')
  return {
    title: t('metaTitle'),
    description: t('metaDesc'),
  }
}

export default async function BlogIndexPage() {
  const locale = await getLocale()
  const t = await getTranslations('blog')
  const isDE = locale === 'de'
  const posts = getPublishedPosts(locale)
  const tScene = await getTranslations('scenes')

  const themes: Record<Theme, { title: string; note: string; posts: BlogPost[] }> = {
    operations: {
      title: isDE ? 'Betrieb und Systeme' : 'Operations and systems',
      note: isDE
        ? 'Wie Arbeit durch ein Unternehmen läuft, und was passiert, wenn sie an einer Stelle stehen bleibt.'
        : 'How work moves through a business, and what happens when it stops somewhere.',
      posts: [],
    },
    delivered: {
      title: isDE ? 'Umgesetzte Projekte' : 'Delivered work',
      note: isDE
        ? 'Einzelne Projekte, ausführlicher als in den Fallstudien.'
        : 'Individual projects, at more length than the case studies carry.',
      posts: [],
    },
    modernisation: {
      title: isDE ? 'Altsysteme' : 'Legacy modernisation',
      note: isDE
        ? 'Der größte Teil dieses Archivs. Migrationen, Joomla, WordPress und Websites, über die jemand die Kontrolle verloren hat. Die Beiträge bleiben, weil sie stimmen und weil sie Leuten in derselben Lage weiterhin helfen. Sie beschreiben, woher wir kommen, nicht wohin wir gehen.'
        : 'The largest part of this archive. Migrations, Joomla, WordPress, and websites somebody lost control of. These stay because they are accurate and because they still help people in the same position. They describe where we came from rather than where we are going.',
      posts: [],
    },
  }

  for (const post of posts) {
    themes[themeOf(post.category)].posts.push(post)
  }

  const populated = THEME_ORDER.filter((k) => themes[k].posts.length > 0)

  // One running number across the whole index, resolved before render rather
  // than by a counter incremented while rendering.
  const numberOf = new Map<string, number>()
  populated.flatMap((k) => themes[k].posts).forEach((post, i) => numberOf.set(post.slug, i + 1))

  return (
    <>
      <section className="section-feature surface-authority">
        <div className="container">
          <div className="sec-head sec-head-wide" style={{ marginBottom: 0 }}>
            <p className="section-label">{isDE ? 'Fachbeiträge' : 'Written work'}</p>
            <h1 style={{ margin: '0 0 var(--space-5)' }}>
              {isDE ? 'Aufgeschrieben, weil es beim Bauen aufgefallen ist.' : 'Written down because it came up while building.'}
            </h1>
            <p className="sec-lede" style={{ margin: 0 }}>
              {isDE
                ? 'Keine Beiträge für Suchmaschinen. Notizen aus Projekten, die jemand betreiben musste, nachdem sie fertig waren.'
                : 'Not written for search engines. Notes from projects somebody had to run after they were finished.'}
            </p>
          </div>
        </div>
      </section>

      {/* The shape of the archive, before the index of it. Counts are real. */}
      {posts.length > 0 && (
        <section className="section surface-operational">
          <div className="container">
            <p className="section-label">{tScene('insSceneEyebrow')}</p>
            <div className="ruled-grid" style={{ marginTop: 'var(--space-6)' }}>
              {populated.map((key) => (
                <div key={key} className="ruled-item">
                  <p className="ruled-index">
                    {themes[key].posts.length} {tScene('insCount')}
                  </p>
                  <h2 className="ruled-title" style={{ fontSize: 'var(--text-h4)' }}>{themes[key].title}</h2>
                  <p className="ruled-desc">{themes[key].note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section surface-plain">
        <div className="container">
          {posts.length === 0 ? (
            <div style={{ maxWidth: '40rem' }}>
              <h2 style={{ margin: '0 0 var(--space-4)' }}>{t('emptyTitle')}</h2>
              <p style={{ margin: '0 0 var(--space-6)', color: 'var(--brand-text-secondary)' }}>{t('emptyDesc')}</p>
              <Link href="/contact" className="btn btn-primary">{t('bottomCtaPrimary')}</Link>
            </div>
          ) : (
            <div style={{ maxWidth: '68rem' }}>
              {populated.map((key) => {
                const theme = themes[key]
                return (
                  <section key={key} aria-labelledby={`theme-${key}`}>
                    <h2 id={`theme-${key}`} className="idx-theme">{theme.title}</h2>
                    <p className="idx-theme-note">{theme.note}</p>
                    <div className="idx">
                      {theme.posts.map((post) => {
                        const n = numberOf.get(post.slug) ?? 0
                        return (
                          <Link key={post.slug} href={`/blog/${post.slug}`} className="idx-row">
                            <p className="idx-num">{String(n).padStart(2, '0')}</p>
                            <div>
                              <p className="idx-title">{post.title}</p>
                              <p className="idx-abstract">{post.excerpt}</p>
                            </div>
                            <p className="idx-meta">
                              <span>{post.publishedAt}</span>
                              {post.readTime ? <span>{post.readTime} min</span> : null}
                            </p>
                          </Link>
                        )
                      })}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <section className="section surface-authority">
        <div className="container">
          <div style={{ maxWidth: '40rem' }}>
            <h2 style={{ margin: '0 0 var(--space-4)' }}>
              {isDE ? 'Läuft bei Ihnen noch ein altes System?' : 'Still running an old system?'}
            </h2>
            <p style={{ margin: '0 0 var(--space-6)', fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)' }}>
              {isDE
                ? 'Sagen Sie uns, was hakt. Unverbindlich, und die ehrliche Antwort kann auch lauten: lassen Sie es, wie es ist.'
                : 'Tell us what is getting in the way. No commitment, and the honest answer may well be to leave it as it is.'}
            </p>
            <Link href="/contact" className="btn btn-primary">
              {isDE ? 'Gespräch vereinbaren' : 'Start a conversation'}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
