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
    ? 'Kostenschätzung | Website & Systeme | Maxpromo Digital'
    : 'Get an Estimate | Website & Systems | Maxpromo Digital'
  const description = isDE
    ? 'Paket, Zusatzleistungen und Hosting wählen und sofort eine transparente Kostenschätzung für Ihre Website oder Ihr Business-System erhalten.'
    : 'Pick a package, add-ons and hosting, and get a transparent cost estimate for your website or business system instantly.'
  return {
    title,
    description,
    alternates: {
      canonical: `https://www.maxpromo.digital/${locale}/estimate`,
      languages: {
        de: 'https://www.maxpromo.digital/de/estimate',
        en: 'https://www.maxpromo.digital/en/estimate',
      },
    },
    openGraph: { title, description, url: `https://www.maxpromo.digital/${locale}/estimate` },
  }
}

export default function EstimateLayout({ children }: { children: React.ReactNode }) {
  return children
}
