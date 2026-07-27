import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { getLandingData } from '@/lib/registry/adapters/landing.adapter'
import { LandingEngine } from '@/components/landing/LandingEngine'

/**
 * Canonical LandingEngine bridge route — LANDINGENGINE CONSOLIDATION,
 * 2026-07-26. Retires the previous ~51KB hand-authored page.tsx (the
 * largest of the eight retired pages, plus its AccessRequestForm.tsx,
 * now unreferenced — see the consolidation report for the site-wide
 * contact-form bug that component shared with six siblings, and the
 * bank-connection/ELSTER/real-time-reserve/DATEV-export/DSGVO claims the
 * retired page reintroduced that the registry's corrected entry does
 * not make). Renders the same registry-driven LandingEngine used on the
 * branded external domain (taxkontrol.de), here under the
 * maxpromo.digital hub layout (Navbar/Footer/CookieBanner via
 * app/[locale]/layout.tsx — x-mp-mode is 'hub' on this host, not
 * 'showcase').
 *
 * The registry (lib/registry/products.ts, TAX_KONTROL entry) is the
 * only source of this page's public copy — including the mandatory
 * Steuerberater disclosure in its FAQ. Do not hardcode content here.
 */
const REGISTRY_SLUG = 'taxkontrol'
const CANONICAL_PATH = '/systems/taxkontrol'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const data = getLandingData(REGISTRY_SLUG, locale)
  if (!data) return {}

  const ogTitle = `${data.name} | Maxpromo Digital`

  return {
    title: data.headline,
    description: data.description,
    alternates: {
      canonical: `https://www.maxpromo.digital/${locale}${CANONICAL_PATH}`,
      languages: {
        de: `https://www.maxpromo.digital/de${CANONICAL_PATH}`,
        en: `https://www.maxpromo.digital/en${CANONICAL_PATH}`,
      },
    },
    openGraph: {
      title: ogTitle,
      description: data.description,
      url: `https://www.maxpromo.digital/${locale}${CANONICAL_PATH}`,
      images: [{ url: data.cardImageSrc, width: 1200, height: 630, alt: data.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: data.description,
      images: [data.cardImageSrc],
    },
  }
}

export default async function TaxKontrolPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const data = getLandingData(REGISTRY_SLUG, locale)
  if (!data) return notFound()

  return <LandingEngine data={data} />
}
