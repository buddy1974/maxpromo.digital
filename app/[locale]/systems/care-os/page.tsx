import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { getLandingData } from '@/lib/registry/adapters/landing.adapter'
import { LandingEngine } from '@/components/landing/LandingEngine'

/**
 * Canonical LandingEngine bridge route — LANDINGENGINE CONSOLIDATION,
 * 2026-07-26. NEW route. CareOS previously had no /systems/care-os page
 * at all — only a hand-authored /products/care-os page (~30KB, plus its
 * CareContactForm.tsx, now unreferenced — see the consolidation report
 * for the site-wide contact-form bug that component shared with six
 * siblings, and the EMAR/CQC-compliance/AI-assistant claims — CQC
 * continuous tracking alone was claimed 3× — the retired page made that
 * the registry's corrected entry does not). /products/care-os now
 * permanently redirects here (next.config.ts). Renders the same
 * registry-driven LandingEngine used on the branded external domain
 * (pflege-care24.de), here under the maxpromo.digital hub layout
 * (Navbar/Footer/CookieBanner via app/[locale]/layout.tsx — x-mp-mode is
 * 'hub' on this host, not 'showcase').
 *
 * The registry (lib/registry/products.ts, CARE_OS entry) is the only
 * source of this page's public copy — do not hardcode content here.
 */
const REGISTRY_SLUG = 'care-os'
const CANONICAL_PATH = '/systems/care-os'

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

export default async function CareOSPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const data = getLandingData(REGISTRY_SLUG, locale)
  if (!data) return notFound()

  return <LandingEngine data={data} />
}
