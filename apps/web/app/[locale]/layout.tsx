import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { currentDomain } from '@/lib/domains/server'
import { ShowcaseChrome } from '@/components/landing/ShowcaseChrome'
import { routing } from '@/i18n/routing'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CookieBanner from '@/components/CookieBanner'
import Max from '@/components/max/Max'

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
  // white-labeled showcase product domains. Address/contact are taken
  // verbatim from the publicly-displayed Impressum, no invented profiles.
  const organizationJsonLd = [
    {
      '@context': 'https://schema.org',
      '@type':    'Organization',
      name:       'Maxpromo Digital',
      url:        'https://www.maxpromo.digital',
      logo:       'https://www.maxpromo.digital/logo.png',
      address: {
        '@type':          'PostalAddress',
        streetAddress:    'Körnerstr. 8',
        postalCode:       '45143',
        addressLocality:  'Essen',
        addressCountry:   'DE',
      },
      contactPoint: {
        '@type':    'ContactPoint',
        telephone:  '+49 173 3645698',
        email:      'info@maxpromo.digital',
        contactType: 'customer service',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type':    'WebSite',
      name:       'Maxpromo Digital',
      url:        'https://www.maxpromo.digital',
    },
  ]

  return (
    <NextIntlClientProvider>
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
