import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { pickClientMessages } from '@/i18n/client-namespaces'
import HtmlLangSync from '@/components/HtmlLangSync'
import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { currentDomain } from '@/lib/domains/server'
import { ShowcaseChrome } from '@/components/landing/ShowcaseChrome'
import { routing } from '@/i18n/routing'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CookieBanner from '@/components/CookieBanner'
import Max from '@/components/max/Max'

/*
 * The public assistant is off for launch (2026-10-06, final browser review).
 * A visible "ask a question, get a real answer" widget has to answer, and its
 * reliability in production could not be shown without live provider calls
 * and production chat storage — so it does not render, and nothing calls
 * /api/chat/* on page load. Contact and the Friction Check carry the
 * conversion. The code stays for a later iteration; flip this once the
 * assistant is proven in its deployed environment.
 */
const PUBLIC_CHAT_ENABLED = false
import { siteGraph } from '@/lib/seo/schema'

/**
 * Locale layout, wraps every public marketing route with the
 * translation provider and the global chrome (Navbar, Footer, CookieBanner).
 * The Max widget is gated by PUBLIC_CHAT_ENABLED above, off for launch.
 *
 * setRequestLocale() enables static rendering for translated content
 *, without it, every page would be dynamic on every request.
 *
 * The OS routes (app/os/*) are NOT under this layout and never see
 * the provider, they're internal admin, single-language for now.
 */

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  // Opt into static rendering for this locale segment.
  setRequestLocale(locale)

  // Showcase product domains own their full visual identity — the Maxpromo
  // chrome (Navbar, Footer, CookieBanner) is suppressed and the product's own
  // nav and footer take its place, on every page the domain serves rather than
  // only on its home page. See components/landing/ShowcaseChrome.tsx.
  const domain     = await currentDomain()
  const isShowcase = domain.mode === 'showcase'

  // The site-wide entity graph (Organization, founder, WebSite), hub only,
  // never on white-labeled showcase product domains. Built in
  // lib/seo/schema.ts, which documents what it deliberately leaves out.
  const tFounder = await getTranslations({ locale, namespace: 'about.founder' })
  const organizationJsonLd = siteGraph(locale, tFounder('name'))

  /*
   * Only the namespaces the browser actually needs.
   *
   * Without this the whole tree is serialised into every page: 22
   * namespaces, 66,635 bytes per locale, on every route. `caseStudies`
   * was among them, so pages with no commercial figures on them were
   * serving the withdrawn £14,000/month claim in their HTML. Risk 55.
   *
   * Server components are unaffected — `getTranslations` reads the full
   * tree server-side and serialises none of it.
   */
  const clientMessages = pickClientMessages(await getMessages())

  return (
    <NextIntlClientProvider messages={clientMessages}>
      <HtmlLangSync />
      {isShowcase ? (
        <>
          <ShowcaseChrome domain={domain} locale={locale}>
            {children}
          </ShowcaseChrome>
          {PUBLIC_CHAT_ENABLED && <Max />}
        </>
      ) : (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
          />
          {/* Skip link. First thing in the tab order, visible only on focus —
              a keyboard user should not have to tab through the whole nav on
              every page. */}
          <a href="#content" className="skip-link">
            {locale === 'de' ? 'Zum Inhalt springen' : 'Skip to content'}
          </a>
          <Navbar />
          {/* The <main> landmark was missing: pages rendered as fragments
              directly under the provider, so a screen reader had no way to
              jump past the chrome. */}
          <main id="content">{children}</main>
          <Footer />
          <CookieBanner />
          {PUBLIC_CHAT_ENABLED && <Max />}
        </>
      )}
    </NextIntlClientProvider>
  )
}
