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

export const metadata: Metadata = {
  applicationName: 'Maxpromo Digital',
  title: {
    default: 'Maxpromo Digital | KI-Business-Systeme & Automatisierungs-Infrastruktur',
    template: '%s | Maxpromo Digital',
  },
  description:
    'Maxpromo Digital entwickelt und installiert KI-gestützte Business-Systeme, Automatisierungs-Workflows und operative Plattformen für Unternehmen, die weniger manuelle Prozesse und mehr Kontrolle wollen.',
  keywords: [
    'KI Business Systeme',
    'Automatisierung',
    'AI Automation',
    'Business Infrastructure',
    'Workflow Automatisierung',
    'Operative Plattformen',
    'Restaurant OS',
    'Handwerk OS',
    'Business Systems',
    'Prozessautomatisierung',
  ],
  openGraph: {
    siteName: 'Maxpromo Digital',
    title: 'Maxpromo Digital — AI systems that run business operations',
    description:
      'Installed AI automation systems, workflow platforms and productized operating systems for modern businesses.',
    type: 'website',
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
