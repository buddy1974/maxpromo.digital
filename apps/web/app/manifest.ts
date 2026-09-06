import type { MetadataRoute } from 'next'
import { token } from '@maxpromo/design-tokens'
import { currentDomain } from '@/lib/domains/server'

/**
 * manifest.webmanifest — served per domain.
 *
 * Named in Part 1 and Part 5 of the v13.0 brief as something each domain must
 * own. It carries identity only: the name a saved shortcut takes, the language
 * it opens in, and the surface colours, all read from the Domain Registry and
 * the design tokens. No new capability, no install prompt, no service worker.
 *
 * `icons` points at the company mark on every domain, because that is what
 * exists. The registry's `favicon` field records the same fact, and
 * audit-domains counts the domains still sharing it, so the gap is a number in
 * a report rather than something to notice later.
 *
 * Colours come from the token package's TypeScript mirror, not from a literal.
 * A manifest is JSON read by the operating system, which cannot resolve a CSS
 * custom property — the same constraint email and PDF generation have, and the
 * same answer they use. The token gate caught the first draft of this file
 * writing #FFFFFF twice, which is precisely what it is for.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const domain = await currentDomain()

  return {
    name:             domain.product,
    short_name:       domain.brand,
    // The consultancy is its own parent; "Maxpromo Digital — Maxpromo Digital"
    // is not a description.
    description:      domain.product === domain.parentCompany
      ? domain.product
      : `${domain.product} — ${domain.parentCompany}`,
    lang:             domain.primaryLanguage,
    start_url:        '/',
    display:          'browser',
    background_color: token.background,
    theme_color:      token.background,
    icons: [
      { src: domain.favicon, sizes: 'any', type: 'image/x-icon' },
    ],
  }
}
