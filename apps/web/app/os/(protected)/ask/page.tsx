'use client'
/**
 * Max as a place (/os/ask): the phone's Max tab, and a full page on a desktop too. The same
 * conversation as the desktop slide-over (MaxProvider), so nothing is lost moving between them.
 * The surface is loaded with this page only (components/os/max, ADR-0029).
 */
import dynamic from 'next/dynamic'
import { useOsLocale } from '@/lib/os-i18n/context'

const MaxSurface = dynamic(() => import('@/components/os/max/MaxSurface'), { ssr: false })

export default function AskPage() {
  const { t } = useOsLocale()
  return (
    <div className="askmax-page">
      <header className="askmax-page-head">
        <h1>{t.ai.title}</h1>
        <p>{t.ai.subtitle}</p>
      </header>
      <MaxSurface />
    </div>
  )
}
