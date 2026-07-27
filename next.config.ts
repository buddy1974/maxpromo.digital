import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import createMDX from '@next/mdx'

const withNextIntl = createNextIntlPlugin()

const withMDX = createMDX({
  extension: /\.mdx?$/,
})

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'mdx'],

  // 2026-07-25: six system pages moved from /products/<slug> to /systems/<slug>
  // (agent-bureau is new at /systems/agent-bureau and has no legacy path to
  // redirect from). localePrefix is 'always' (see i18n/routing.ts), so
  // every path carries /de or /en.
  //
  // 2026-07-26 (LANDINGENGINE CONSOLIDATION): care-os and real-estate-os
  // join the same pattern — their hand-authored /products/<slug> pages are
  // retired in favour of canonical /systems/<slug> LandingEngine routes.
  // real-estate-os's redirect source intentionally stays hyphenated
  // ('real-estate-os') to match its route folder and contactSlug, even
  // though the registry's internal `slug` primary key for that product is
  // 'realestate-os' (no hyphen) — see lib/registry/products.ts REAL_ESTATE_OS.
  async redirects() {
    const movedSlugs = [
      'restaurant-os',
      'taxkontrol',
      'handwerk-os',
      'praxis-os',
      'publishing-os',
      'care-os',
      'real-estate-os',
    ]
    const redirects = movedSlugs.map((slug) => ({
      source: `/:locale(de|en)/products/${slug}`,
      destination: `/:locale/systems/${slug}`,
      permanent: true,
    }))
    // printshop-os: the old page folder was named /products/printshop (a
    // pre-existing slug mismatch bug, fixed 2026-07-25 alongside the move),
    // so its legacy path does not match the pattern above.
    redirects.push({
      source: '/:locale(de|en)/products/printshop',
      destination: '/:locale/systems/printshop-os',
      permanent: true,
    })
    return redirects
  },
}

// Compose: withNextIntl(withMDX(nextConfig))
export default withNextIntl(withMDX(nextConfig))
