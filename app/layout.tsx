import type { Metadata } from 'next'
import { Space_Grotesk, Inter, Roboto_Mono } from 'next/font/google'
import { getLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
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

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const robotoMono = Roboto_Mono({
  variable: '--font-roboto-mono',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
})

const SITE_URL = 'https://www.maxpromo.digital'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: 'Maxpromo Digital',
  title: {
    default: 'Maxpromo Digital | AI Business Systems & Automation Infrastructure',
    template: '%s | Maxpromo Digital',
  },
  description:
    'Maxpromo Digital is an Essen-based business systems and automation company. We modernize legacy websites, automate workflows and install AI-powered operational systems for companies.',
  keywords: [
    'Business Systems',
    'AI Automation',
    'Legacy Modernization',
    'Workflow Automation',
    'Essen',
    'Joomla Modernization',
    'CMS Migration',
    'AI Business Systems',
    'Restaurant OS',
    'PrintShop OS',
    'Operational Platforms',
  ],
  openGraph: {
    siteName: 'Maxpromo Digital',
    title: 'Maxpromo Digital | AI Business Systems & Automation Infrastructure',
    description:
      'Essen-based business systems and automation company. We modernize legacy websites, connect workflows and install AI-powered operational systems.',
    type: 'website',
    url: SITE_URL,
    // TODO: replace with a dedicated 1200×630 social-preview asset once
    // produced — logo.png is used as an interim fallback so shared links
    // never render blank, per the image-repair discipline for this repo.
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'Maxpromo Digital' }],
  },
  twitter: {
    card: 'summary',
    title: 'Maxpromo Digital | AI Business Systems & Automation Infrastructure',
    description:
      'Essen-based business systems and automation company. We modernize legacy websites, connect workflows and install AI-powered operational systems.',
    images: ['/logo.png'],
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default async function RootLayout({ children }: RootLayoutProps) {
  // getLocale() throws on routes that don't pass through next-intl
  // middleware (notably /os/* and /api/*). Catch and fall back to the
  // default locale so the OS panel renders with a valid <html lang>.
  let locale: string = routing.defaultLocale
  try {
    locale = await getLocale()
  } catch {
    // intentionally swallowed — non-localized route
  }
  return (
    <html lang={locale}>
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${robotoMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
