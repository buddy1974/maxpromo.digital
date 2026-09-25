import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo/og'

/**
 * Metadata for Contact.
 *
 * The page is `'use client'` because the form is interactive, and a client
 * component cannot export `generateMetadata`. The route therefore had no
 * title, description, canonical or hreflang of its own — on the page every
 * commercial surface on this site points at.
 */
export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isDE = locale === 'de'
  return pageMetadata({
    locale,
    path: '/contact',
    title: isDE ? 'Kontakt' : 'Contact',
    description: isDE
      ? 'Schildern Sie uns, was im Tagesgeschäft bremst. Wir sagen Ihnen, was sich vereinfachen lässt, was sich verbinden lässt und was so bleiben sollte, wie es ist.'
      : 'Tell us what is slowing the working day down. We will tell you what can be simplified, what can be connected, and what should stay exactly as it is.',
    family: 'company',
  })
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
