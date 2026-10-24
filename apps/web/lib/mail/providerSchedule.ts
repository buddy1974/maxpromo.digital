import { after } from 'next/server'
import { getDb } from '@/lib/db'
import { hostingerStateReader, reconcileProviderState } from './providerState'
import { reconcileContent } from './providerContent'
import { dispatchOwnerNotices } from '@/lib/owner/notices'
import { scheduleOwnerNotices } from '@/lib/owner/schedule'

/** Check provider spam state, then fetch full text, after the response: receipt never waits
 * on, or fails because of, the Hostinger REST API. No-op until the owner connects the API
 * (ADR-0022, ADR-0023). Spam state runs first so quarantined mail is never fetched.
 *
 * notify: push owner notices (ADR-0024) only after the spam check, so a reply Hostinger filed as
 * Junk never reaches Marcel's phone.
 */
export function scheduleProviderCheck(source: 'webhook' | 'inbox' | 'attention' | 'thread', threadId?: string, options: { notify?: boolean } = {}) {
  const reader = hostingerStateReader()
  if (!reader) {
    if (options.notify) scheduleOwnerNotices('webhook')
    return
  }
  after(async () => {
    try {
      const result = await reconcileProviderState(getDb(), reader)
      // Counts only: never addresses, subjects, ids or provider error text.
      if (result.checked || result.failed) console.info(JSON.stringify({ event: 'mail.provider_state', source, ...result }))
      const content = await reconcileContent(getDb(), reader, threadId ? { threadId, limit: 10 } : {})
      if (content.checked) console.info(JSON.stringify({ event: 'mail.content', source, ...content }))
    } catch {
      console.warn(JSON.stringify({ event: 'mail.provider_state', source, failed: true }))
    }
    if (options.notify) {
      try {
        const r = await dispatchOwnerNotices(getDb())
        if (r.sent || r.failed) console.info(JSON.stringify({ event: 'owner.notices', source, ...r }))
      } catch { /* a missing ledger or Telegram configuration sends nothing and breaks nothing */ }
    }
  })
}
