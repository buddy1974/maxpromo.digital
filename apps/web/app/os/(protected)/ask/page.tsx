'use client'
/**
 * Ask Max as a place (/os/ask): the phone's Max tab, and a full page on a desktop too. The same
 * conversation as the desktop slide-over (AskMaxProvider), so nothing is lost moving between them.
 */
import { useOsLocale } from '@/lib/os-i18n/context'
import { AskMaxConversation } from '@/components/os/shell/AskMax'

export default function AskPage() {
  const { t } = useOsLocale()
  return (
    <div className="askmax-page">
      <header className="askmax-page-head">
        <h1>{t.ai.title}</h1>
        <p>{t.ai.subtitle}</p>
      </header>
      <AskMaxConversation />
    </div>
  )
}
