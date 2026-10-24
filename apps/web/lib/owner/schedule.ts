import { after } from 'next/server'
import { getDb } from '@/lib/db'
import { dispatchOwnerNotices } from './notices'

/** Push important owner notices after the response (ADR-0024). A missing ledger table (migration
 * 0018 not applied) or Telegram not configured means nothing is sent and nothing breaks. */
export function scheduleOwnerNotices(source: 'webhook' | 'agent' | 'attention' | 'inbox') {
  after(async () => {
    try {
      const r = await dispatchOwnerNotices(getDb())
      if (r.sent || r.failed) console.info(JSON.stringify({ event: 'owner.notices', source, ...r }))
    } catch (error) {
      const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
      if (code !== '42P01') console.warn(JSON.stringify({ event: 'owner.notices', source, failed: true }))
    }
  })
}
