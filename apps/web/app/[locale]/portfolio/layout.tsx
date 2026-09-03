import type { Metadata } from 'next'

/**
 * Internal staff-access page, not a public marketing route. Excluded
 * from app/sitemap.ts and app/robots.ts already; this adds a page-level
 * noindex as defence in depth in case it's ever linked externally.
 */
export const metadata: Metadata = {
  title: 'Staff access',
  robots: { index: false, follow: false },
}

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return children
}
