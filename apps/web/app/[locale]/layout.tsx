import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getMessages } from 'next-intl/server'
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
import { BUSINESS } from '@maxpromo/config'

/**
 * Locale layout, wraps every public marketing route with the
 * translation provider and the global chrome (Navbar, Footer, Max, CookieBanner).
 * Max widget mounts in both hub and showcase branches.
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

  // Site-wide Organization + WebSite JSON-LD, Maxpromo hub only, never on
  // white-labeled showcase product domains. Every fact is read from
  // @maxpromo/config, the same record the Impressum prints, so the markup
  // cannot drift from the legal identity the way two hand-typed copies did.
  // Only types the visible site supports: no Review, no AggregateRating, no
  // LocalBusiness implying premises and opening hours that do not exist.
  const SITE = `https://www.${BUSINESS.website}`
  const isDE = locale === 'de'
  const organizationJsonLd = [
    {
      '@context':  'https://schema.org',
      '@type':     'Organization',
      '@id':       `${SITE}/#organization`,
      name:        BUSINESS.brand,
      url:         SITE,
      logo:        `${SITE}/logo.png`,
      description: isDE
        ? 'Maxpromo Digital baut und verbessert die Systeme, auf denen Betriebe laufen: Prozessautomatisierung, individuelle Anwendungen, Webentwicklung, Content- und Produktabläufe.'
        : 'Maxpromo Digital builds and improves the systems businesses run on: workflow automation, custom applications, web development, content and product operations.',
      address: {
        '@type':         'PostalAddress',
        streetAddress:   BUSINESS.street,
        postalCode:      BUSINESS.postalCode,
        addressLocality: BUSINESS.cityName,
        addressCountry:  BUSINESS.countryCode,
      },
      email:   BUSINESS.email,
      founder: {
        '@type':  'Person',
        '@id':    `${SITE}/#founder`,
        name:     'Marcel Akwe',
        jobTitle: isDE ? 'Gründer' : 'Founder',
        url:      `${SITE}/${locale}/about`,
      },
      contactPoint: {
        '@type':           'ContactPoint',
        telephone:         BUSINESS.phone,
        email:             BUSINESS.email,
        contactType:       'customer service',
        availableLanguage: ['German', 'English'],
      },
    },
    {
      '@context':  'https://schema.org',
      '@type':     'WebSite',
      '@id':       `${SITE}/#website`,
      name:        BUSINESS.brand,
      url:         SITE,
      inLanguage:  ['de-DE', 'en-GB'],
      publisher:   { '@id': `${SITE}/#organization` },
    },
  ]

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
          <Max />
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
          <Max />
        </>
      )}
    </NextIntlClientProvider>
  )
}
