import { after } from 'next/server'
import { getDb } from '@/lib/db'
import { hostingerStateReader, reconcileProviderState } from './providerState'

/** Check provider spam state after the response: receipt never waits on, or fails because
 * of, the Hostinger REST API. No-op until the owner connects the API (ADR-0022).
 */
export function scheduleProviderCheck(source: 'webhook' | 'inbox' | 'attention') {
  const reader = hostingerStateReader()
  if (!reader) return
  after(async () => {
    try {
      const result = await reconcileProviderState(getDb(), reader)
      // Counts only: never addresses, subjects, ids or provider error text.
      if (result.checked || result.failed) console.info(JSON.stringify({ event: 'mail.provider_state', source, ...result }))
    } catch {
      console.warn(JSON.stringify({ event: 'mail.provider_state', source, failed: true }))
    }
  })
}
