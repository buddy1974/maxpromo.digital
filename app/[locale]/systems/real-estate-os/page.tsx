import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { getLandingData } from '@/lib/registry/adapters/landing.adapter'
import { LandingEngine } from '@/components/landing/LandingEngine'

/**
 * Canonical LandingEngine bridge route — LANDINGENGINE CONSOLIDATION,
 * 2026-07-26. NEW route. RealEstateOS previously had no /systems/real-
 * estate-os page at all — only a hand-authored /products/real-estate-os
 * page (~30KB, plus its RealEstateContactForm.tsx, now unreferenced —
 * see the consolidation report for the site-wide contact-form bug that
 * component shared with six siblings, and the 23 distinct AI-deal-
 * analysis / investor-CRM / campaign-studio claims — the single densest
 * finding in the whole audit — that the registry's corrected entry does
 * not make). /products/real-estate-os now permanently redirects here
 * (next.config.ts). Renders the same registry-driven LandingEngine used
 * on the branded external domain (easy-immo24.de), here under the
 * maxpromo.digital hub layout (Navbar/Footer/CookieBanner via
 * app/[locale]/layout.tsx — x-mp-mode is 'hub' on this host, not
 * 'showcase').
 *
 * REGISTRY_SLUG below is 'realestate-os' (no hyphen) — the registry's
 * ProductEntry.slug primary key (also the HOST_MAP lookup key for
 * easy-immo24.de). It intentionally differs from this route's folder
 * name / CANONICAL_PATH ('real-estate-os', hyphenated), which instead
 * matches contactSlug and the /contact?system= value. This split is a
 * deliberate, documented exception — see lib/registry/products.ts
 * REAL_ESTATE_OS's Links comment for the full resolution — not a typo.
 *
 * The registry (lib/registry/products.ts, REAL_ESTATE_OS entry) is the
 * only source of this page's public copy — do not hardcode content here.
 */
const REGISTRY_SLUG = 'realestate-os'
const CANONICAL_PATH = '/systems/real-estate-os'

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

export default async function RealEstateOSPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const data = getLandingData(REGISTRY_SLUG, locale)
  if (!data) return notFound()

  return <LandingEngine data={data} />
}
