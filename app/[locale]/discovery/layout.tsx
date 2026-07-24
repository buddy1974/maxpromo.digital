import type { Metadata } from 'next'

/** See app/[locale]/contact/layout.tsx for why this wrapper exists. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const isDE = locale === 'de'
  const title = isDE
    ? 'Discovery-Gespräch | Maxpromo Digital'
    : 'Business Systems Discovery | Maxpromo Digital'
  const description = isDE
    ? 'Ein kurzes, geführtes Gespräch über Ihre aktuellen Abläufe — bevor wir irgendetwas konfigurieren. Kein Verkaufsdruck, keine Verpflichtung.'
    : 'A short, guided conversation about how your business actually operates today — before we configure anything. No pressure, no commitment.'
  return {
    title,
    description,
    alternates: {
      canonical: `https://www.maxpromo.digital/${locale}/discovery`,
      languages: {
        de: 'https://www.maxpromo.digital/de/discovery',
        en: 'https://www.maxpromo.digital/en/discovery',
      },
    },
    openGraph: { title, description, url: `https://www.maxpromo.digital/${locale}/discovery` },
  }
}

export default function DiscoveryLayout({ children }: { children: React.ReactNode }) {
  return children
}
