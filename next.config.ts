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
  /**
   * v5.0 information-architecture move.
   *
   * /services      -> /solutions   (renamed section)
   * /systems/*     -> /solutions   (the operating systems became protected
   *                                 products; they are marketed on their own
   *                                 domains, not from the consultancy site)
   * /products/*    -> /solutions   (retired duplicate section)
   *
   * Agent Bureau stays public and moves from /systems/agent-bureau to its own
   * top-level /agent-bureau route.
   *
   * Every redirect is permanent because these paths were indexed. The showcase
   * domains are unaffected: they render the product at their own root via
   * lib/host/HOST_MAP.ts, never through /systems/*.
   */
  async redirects() {
    const L = '/:locale(de|en)'
    const SOLUTION_SLUGS = [
      'customer-inquiries',
      'workflow-automation',
      'ai-agents',
      'reviews',
      'social-media',
      'websites-platforms',
    ]
    const RETIRED_SYSTEM_SLUGS = [
      'restaurant-os',
      'taxkontrol',
      'handwerk-os',
      'praxis-os',
      'publishing-os',
      'printshop-os',
      'care-os',
      'real-estate-os',
    ]

    return [
      // Section rename, index and children.
      { source: `${L}/services`, destination: '/:locale/solutions', permanent: true },
      ...SOLUTION_SLUGS.map((slug) => ({
        source: `${L}/services/${slug}`,
        destination: `/:locale/solutions/${slug}`,
        permanent: true,
      })),

      // Agent Bureau keeps a public home, one level up.
      { source: `${L}/systems/agent-bureau`, destination: '/:locale/agent-bureau', permanent: true },
      { source: `${L}/products/agent-bureau`, destination: '/:locale/agent-bureau', permanent: true },

      // Protected products: no public hub page. Send the visitor to the work
      // we do rather than to a 404.
      { source: `${L}/systems`, destination: '/:locale/solutions', permanent: true },
      ...RETIRED_SYSTEM_SLUGS.flatMap((slug) => [
        { source: `${L}/systems/${slug}`, destination: '/:locale/solutions', permanent: true },
        { source: `${L}/products/${slug}`, destination: '/:locale/solutions', permanent: true },
      ]),
      // printshop-os lived at /products/printshop before the 2026-07-25 slug fix.
      { source: `${L}/products/printshop`, destination: '/:locale/solutions', permanent: true },
      { source: `${L}/products`, destination: '/:locale/solutions', permanent: true },
    ]
  },
}

// Compose: withNextIntl(withMDX(nextConfig))
export default withNextIntl(withMDX(nextConfig))
