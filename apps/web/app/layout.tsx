import type { Metadata } from 'next'
import { Inter, Roboto_Mono } from 'next/font/google'
import { getLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { currentDomain, currentLocale, domainRootMetadata } from '@/lib/domains/server'
import './globals.css'

/**
 * Root layout — bare html/body shell.
 *
 * The Navbar / Footer / ChatAgent / CookieBanner live in
 * app/[locale]/layout.tsx so they only render on localized public
 * routes. The OS panel (app/os/*) supplies its own visual chrome.
 *
 * The <html lang="..."> attribute is set from the active locale via
 * next-intl's getLocale() so screen readers and translation engines
 * see the right language for the document.
 */

/**
 * One neutral grotesque for headings and body; hierarchy comes from weight and
 * size, not from a second typeface. Space Grotesk was retired in v4.0 batch B3
 * — a geometric display face reads as a 2022-24 startup landing page, which is
 * the exact impression this programme exists to remove. Every reference company
 * named in the brief (Stripe, Linear, GitHub, Atlassian, Notion, Vercel,
 * Basecamp, Thoughtworks) uses a neutral grotesque this way.
 *
 * To reverse: restore the Space_Grotesk import here and repoint
 * --brand-font-heading in @maxpromo/design-tokens/brand.css. Nothing else depends on it.
 */
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

/**
 * Code, data tables and document reference numbers only — not a label face.
 *
 * 700 is loaded because the scale uses it. --weight-bold has one documented
 * role, the small uppercase mono label, and it is used at 51 sites — every one
 * of which the browser was synthesising, because this face shipped 400 and 500
 * only. Faux bold on 10px uppercase mono at 0.2em tracking is the worst place
 * to have it: the strokes thicken unevenly at exactly the size where the
 * letterforms have the least room.
 */
const robotoMono = Roboto_Mono({
  variable: '--font-roboto-mono',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
})

const SITE_URL = 'https://www.maxpromo.digital'

/**
 * The consultancy's own site-wide metadata.
 *
 * Kept as a plain object rather than exported directly: since v13.0 the
 * exported metadata is built per domain, and this is the hub's branch of that
 * decision. A product domain never sees any of it.
 *
 * Everything below is unchanged from before v13.0 — this sprint moved it, it
 * did not rewrite it.
 */
const HUB_METADATA: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: 'Maxpromo Digital',
  title: {
    default: 'Maxpromo Digital — Business Systems Consultancy',
    template: '%s | Maxpromo Digital',
  },
  description:
    'Maxpromo Digital is a software consultancy in Essen. We design and build the systems companies run on: replacing manual steps, connecting the tools already in use, and maintaining the result.',
  keywords: [
    'Business Systems',
    'Software Consultancy',
    'Workflow Automation',
    'Legacy Modernization',
    'Essen',
    'Joomla Modernization',
    'CMS Migration',
    'Operations Software',
    'RestaurantOS',
    'PrintShopOS',
  ],
  openGraph: {
    siteName: 'Maxpromo Digital',
    title: 'Maxpromo Digital — Business Systems Consultancy',
    description:
      'A software consultancy in Essen. We design and build the systems companies run on, and maintain them afterwards.',
    type: 'website',
    url: SITE_URL,
    // Dedicated 1200×630 social-preview asset (public/images/seo/) — used as
    // the site-wide fallback whenever a page doesn't set its own OG image.
    images: [{ url: '/images/seo/maxpromo-digital-og.png', width: 1200, height: 630, alt: 'Maxpromo Digital' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Maxpromo Digital — Business Systems Consultancy',
    description:
      'A software consultancy in Essen. We design and build the systems companies run on, and maintain them afterwards.',
    images: ['/images/seo/maxpromo-digital-og.png'],
  },
}

/**
 * Site-wide metadata, resolved from the Domain Registry.
 *
 * This is the single most load-bearing change of v13.0. Ten public domains are
 * served by this application, and until now all ten inherited one static
 * object: the same `metadataBase`, the same `og:site_name`, and the same
 * `%s | Maxpromo Digital` title template. RC1 measured what that produced —
 * restaurant-os.de announcing itself in the browser tab as
 * "Business-Systeme aus Essen | Maxpromo Digital".
 *
 * The title template matters more than it looks: every child page that sets a
 * bare title inherits the suffix, so fixing the home page alone would still
 * have left "Kontakt | Maxpromo Digital" on a product domain's contact page.
 */
export async function generateMetadata(): Promise<Metadata> {
  const domain = await currentDomain()
  return domainRootMetadata(domain, await resolveLocale(), HUB_METADATA)
}

/**
 * The locale for this request, in the order of things that actually know.
 *
 * The middleware's stamp is authoritative — see currentLocale(). getLocale()
 * is the fallback for anything the middleware did not match, and it throws on
 * routes that never pass through next-intl (notably /os/* and /api/*), so the
 * catch is load-bearing rather than defensive.
 */
async function resolveLocale(): Promise<string> {
  let locale: string = routing.defaultLocale
  try {
    locale = await getLocale()
  } catch {
    // intentionally swallowed — non-localized route
  }
  return currentLocale(locale)
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const locale = await resolveLocale()
  return (
    <html lang={locale}>
      <body
        className={`${inter.variable} ${robotoMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
