import type { Metadata } from 'next'

/**
 * app/[locale]/contact/page.tsx is a client component ('use client'),
 * so it cannot export generateMetadata itself, Next.js requires
 * metadata exports to live in a Server Component. This segment
 * layout supplies the metadata and otherwise just passes children
 * through; the visual shell (Navbar/Footer/CookieBanner) already
 * comes from app/[locale]/layout.tsx above it.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const isDE = locale === 'de'
  const title = isDE
    ? 'Kontakt'
    : 'Contact'
  const description = isDE
    ? 'Sprechen Sie mit Maxpromo Digital über Business-Systeme, Automatisierung oder ein bestimmtes Produkt, Antwort innerhalb eines Werktags.'
    : 'Talk to Maxpromo Digital about business systems, automation, or a specific product, we reply within one business day.'
  return {
    title,
    description,
    alternates: {
      canonical: `https://www.maxpromo.digital/${locale}/contact`,
      languages: {
        de: 'https://www.maxpromo.digital/de/contact',
        en: 'https://www.maxpromo.digital/en/contact',
      },
    },
    openGraph: { title, description, url: `https://www.maxpromo.digital/${locale}/contact` },
  }
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
