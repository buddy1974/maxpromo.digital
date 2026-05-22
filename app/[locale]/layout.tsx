import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { routing } from '@/i18n/routing'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ChatAgent from '@/components/ChatAgent'
import CookieBanner from '@/components/CookieBanner'
import { MobileStickyCTA } from '@/components/ui/MobileStickyCTA'
import { MaxAgent } from '@/components/MaxAgent'

/**
 * Locale layout — wraps every public marketing route with the
 * translation provider and the global chrome (Navbar, Footer,
 * ChatAgent, CookieBanner).
 *
 * setRequestLocale() enables static rendering for translated content
 * — without it, every page would be dynamic on every request.
 *
 * The OS routes (app/os/*) are NOT under this layout and never see
 * the provider — they're internal admin, single-language for now.
 */

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  // Opt into static rendering for this locale segment.
  setRequestLocale(locale)

  // Showcase product domains own their full visual identity —
  // suppress Maxpromo chrome (Navbar, Footer, ChatAgent, etc.)
  const h          = await headers()
  const isShowcase = h.get('x-mp-mode') === 'showcase'

  return (
    <NextIntlClientProvider>
      {isShowcase ? (
        <>{children}</>
      ) : (
        <>
          <Navbar />
          {children}
          <Footer />
          <ChatAgent />
          <CookieBanner />
          <MobileStickyCTA />
          <MaxAgent />
        </>
      )}
    </NextIntlClientProvider>
  )
}
