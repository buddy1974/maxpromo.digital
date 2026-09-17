import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { getTranslations } from 'next-intl/server'
import {
  DEMO_COOKIE,
  resolveDemoSession,
  demoRoomIsClosed,
} from '@/lib/demo/access'
import { demosFor } from '@/lib/demo/registry'

/**
 * app/demo/page.tsx — the private demonstration room.
 *
 * DELIBERATELY OUTSIDE THE LOCALE TREE.
 * Living at /demo rather than /[locale]/demo keeps it out of the localised
 * route group entirely, so it cannot be swept into the sitemap, hreflang
 * alternates or the public navigation by any future change to those. It is
 * reached only by a link somebody was sent.
 *
 * THREE INDEPENDENT MEASURES, IN ORDER OF WHAT ACTUALLY PROTECTS IT:
 *   1. Server-side authorisation on every request. This is the control.
 *   2. `noindex, nofollow` in metadata.
 *   3. A robots.txt disallow.
 * Two and three are requests to well-behaved crawlers. Only the first stops
 * anybody. The order matters: this room would be safe with only the first,
 * and unsafe with only the second and third.
 *
 * FAILS CLOSED. With no DEMO_ACCESS_SECRET configured — which is how this
 * release ships — every path below renders the closed state. Production
 * therefore goes live with a room that is real, reachable and shut.
 *
 * Nothing about a demonstration reaches the browser before the grant has been
 * resolved: no id, no name, no destination. The unauthorised responses below
 * are identical whether or not any demo exists.
 *
 * ENGLISH, FROM THE CATALOGUE.
 * The room is English-only — it is reached by a link somebody was sent, not
 * browsed to in a language — but its words still live in messages/, read with
 * an explicit locale rather than one resolved from a route this page does not
 * have. The alternative was a second copy of these sentences inside the
 * component, which is the mistake this platform has paid for most often.
 */

/** The one locale this room speaks. Named once, used everywhere below. */
const ROOM_LOCALE = 'en'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: ROOM_LOCALE, namespace: 'demoRoom' })
  return {
    title: t('metaTitle'),
    robots: { index: false, follow: false, nocache: true },
  }
}

/* Never statically rendered: the answer depends on the caller's cookie. */
export const dynamic = 'force-dynamic'

export default async function DemoRoomPage() {
  const t = await getTranslations({ locale: ROOM_LOCALE, namespace: 'demoRoom' })
  const closed = demoRoomIsClosed()
  const cookie = closed ? undefined : (await cookies()).get(DEMO_COOKIE)?.value
  const grant = closed ? null : await resolveDemoSession(cookie)

  if (!grant) {
    return (
      <main className="demo-shell">
        <div className="demo-frame">
          <p className="demo-brand">{t('brand')}</p>
          <h1 className="demo-title">{closed ? t('closedTitle') : t('deniedTitle')}</h1>
          <p className="demo-body">{closed ? t('closedBody') : t('deniedBody')}</p>
          {/* next/link, not the localised one from @/i18n/navigation: this
              page lives outside the locale tree deliberately, so there is no
              locale in scope to prefix. */}
          <Link href={`/${ROOM_LOCALE}/work`} className="demo-link">{t('backToWork')}</Link>
        </div>
      </main>
    )
  }

  const demos = demosFor(grant)

  return (
    <main className="demo-shell">
      <div className="demo-frame">
        <p className="demo-brand">{t('brand')}</p>
        <h1 className="demo-title">{t('title')}</h1>

        <dl className="demo-meta">
          <div>
            <dt>{t('preparedFor')}</dt>
            <dd>{grant.company}</dd>
          </div>
          <div>
            <dt>{t('access')}</dt>
            <dd>{t('accessPrivate')}</dd>
          </div>
          <div>
            <dt>{t('expires')}</dt>
            <dd>{grant.expires}</dd>
          </div>
        </dl>

        {demos.length === 0 ? (
          <>
            <h2 className="demo-sub">{t('emptyTitle')}</h2>
            <p className="demo-body">{t('emptyBody')}</p>
          </>
        ) : (
          <ul className="demo-list">
            {demos.map((d) => (
              <li key={d.id} className="demo-card">
                <p className="demo-card-cat">{d.category[ROOM_LOCALE]}</p>
                <h2 className="demo-card-name">{d.name[ROOM_LOCALE]}</h2>
                <p className="demo-card-desc">{d.description[ROOM_LOCALE]}</p>
                {/* The destination is never rendered as a link target here.
                    Opening goes through a route that re-checks authorisation
                    for this specific demo before it redirects. */}
                <a href={`/demo/open/${d.id}`} className="btn btn-primary">{t('openDemo')}</a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
