import CookieBanner from '@/components/CookieBanner'
import { getLandingData } from '@/lib/registry/adapters/landing.adapter'
import { LandingThemeProvider } from './LandingThemeProvider'
import { ProductNav } from './sections/ProductNav'
import { ProductFooter } from './sections/ProductFooter'
import type { DomainEntry } from '@maxpromo/config'

interface ShowcaseChromeProps {
  domain: DomainEntry
  locale: string
  children: React.ReactNode
}

/**
 * The navigation and footer every page on a product domain wears.
 *
 * WHY THIS MOVED
 *
 * ProductNav and ProductFooter used to live inside LandingEngine, which only
 * renders on the product's home page. The locale layout suppresses all Maxpromo
 * chrome on a showcase host, so every *other* page served by that host had no
 * navigation and no footer at all.
 *
 * RC1 measured what that meant on the page it matters most:
 * `restaurant-os.de/contact` — the destination of every call to action on the
 * domain, collecting a full name, a company, an email address and a telephone
 * number — contained zero links. No Impressum, no Datenschutzerklärung, no way
 * back to the product. §5 DDG and Article 13 GDPR both attach at the point of
 * collection, and neither was reachable from the point of collection.
 *
 * Chrome belongs to the domain, not to one page on it. So it lives in the
 * layout, and LandingEngine no longer renders either component.
 *
 * The domain's route isolation (see the middleware) means the only pages that
 * reach here are the product page, its contact page and the operator's legal
 * pages — which is exactly the set that should wear this chrome.
 */
export async function ShowcaseChrome({ domain, locale, children }: ShowcaseChromeProps) {
  const data = domain.productSlug ? getLandingData(domain.productSlug, locale) : null

  // A showcase domain whose slug does not resolve is a registry error, not a
  // runtime condition — audit-domains fails the build on it. Rendering the
  // children bare is the safe answer if it ever happens anyway: a page with no
  // chrome beats no page.
  if (!data) return <>{children}</>

  const ctaLabel = data.finalCta?.primaryLabel ?? data.ctaPrimary
  const ctaHref  = data.finalCta?.primaryUrl   ?? data.bookDemoUrl

  // A product domain shows no prefix for the language it leads with, and
  // prefixes any second one — the same rule the middleware enforces and
  // canonicalUrl() writes. Stated once here so the footer's links land
  // directly rather than through a redirect.
  const path = (p: string) =>
    locale === domain.primaryLanguage ? p : `/${locale}${p}`

  return (
    <LandingThemeProvider brandColor={data.brandColor} brandColorText={data.brandColorText}>
      {/* Present on the hub since the accessibility pass and absent here: a
          keyboard user on a product domain had to tab the whole nav on every
          page. */}
      <a href="#content" className="skip-link">
        {locale === 'de' ? 'Zum Inhalt springen' : 'Skip to content'}
      </a>

      <ProductNav
        domainBrand={data.domainBrand}
        domain={domain.host}
        ctaLabel={ctaLabel}
        ctaHref={ctaHref}
        // One language, no switch. A control offering a language the domain
        // redirects away from is worse than no control.
        showLocaleSwitcher={domain.languages.length > 1}
      />

      <main id="content">{children}</main>

      <ProductFooter
        domainBrand={data.domainBrand}
        locale={locale}
        contactHref={data.bookDemoUrl}
        impressumHref={path('/impressum')}
        privacyHref={path('/privacy')}
      />

      {/* Part 6: the same cookie notice on every domain. The showcase branch
          of the layout rendered none, so nine domains showed a notice the hub
          showed and they did not. */}
      <CookieBanner privacyHref={path('/privacy')} />
    </LandingThemeProvider>
  )
}
