import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

// Auto-discovers i18n/request.ts. No options needed.
const withNextIntl = createNextIntlPlugin()

const nextConfig: NextConfig = {
  /* config options here */
}

export default withNextIntl(nextConfig)
