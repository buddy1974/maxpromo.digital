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
  // redirect from). care-os and real-estate-os intentionally stay under
  // /products/<slug> and are not part of this redirect set. localePrefix is
  // 'always' (see i18n/routing.ts), so every path carries /de or /en.
  async redirects() {
    const movedSlugs = [
      'restaurant-os',
      'taxkontrol',
      'handwerk-os',
      'praxis-os',
      'publishing-os',
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
