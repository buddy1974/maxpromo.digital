import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo/og'

/**
 * Metadata for the Friction Check.
 *
 * The page itself is `'use client'` — it is interactive end to end — and a
 * client component cannot export `generateMetadata`. Without this layout the
 * route inherited the site defaults and had no title, description, canonical
 * or hreflang of its own, which for an acquisition asset meant the one page
 * built to be found could not be.
 *
 * `/contact` had the same gap for the same reason and now has the same fix.
 */
export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isDE = locale === 'de'
  return pageMetadata({
    locale,
    path: '/friction-check',
    title: isDE ? 'Business Friction Check' : 'Business Friction Check',
    description: isDE
      ? 'Sechs Fragen zu Dingen, die in einer normalen Woche passieren. Sie sehen sofort, welche Art von Reibung Ihr Betrieb hat und was man zuerst dagegen tut. Kein Score, keine E-Mail nötig.'
      : 'Six questions about things that happen in an ordinary week. You see straight away what kind of friction your business has and what to do about it first. No score, no email required.',
    family: 'resource',
  })
}

export default function FrictionCheckLayout({ children }: { children: React.ReactNode }) {
  return children
}
