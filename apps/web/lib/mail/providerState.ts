import type { Sql } from '@/lib/commercial/types'
import { HostingerMailProvider, type EmailProvider, type ProviderFolder } from './provider'
import { HOSTINGER_ACCOUNT } from './hostingerIngestion'

/** Provider spam state (ADR-0022). Hostinger's webhook fires for mail it files into Junk and
 * carries no folder, so the folder is read from the REST API: folder list plus a Message-ID
 * header search. Metadata only: never a body, attachment, source or signed URL. This port
 * exposes no send, move or flag operation, so reconciliation cannot change the mailbox.
 */
export type ProviderStateReader = Pick<EmailProvider, 'folders' | 'search'>
export type ProviderState = 'inbox' | 'junk' | 'trash' | 'other' | 'not_found'
const MAX_CHECKS = 5
const LOOKBACK_DAYS = 14

/** Read-only REST port, or null when the owner has not connected the Hostinger API. */
export function hostingerStateReader(env: Record<string, string | undefined> = process.env, transport: typeof fetch = fetch): ProviderStateReader | null {
  const token = env.HOSTINGER_MAIL_API_TOKEN, mailbox = env.HOSTINGER_MAILBOX_RESOURCE_ID
  if (!token || !mailbox || env.MAXPROMO_EVIDENCE_MODE === '1') return null
  const provider = new HostingerMailProvider({ token, mailboxResourceId: mailbox, transport, timeoutMs: 8_000,
    // Read-only use: the reader below never reaches send/move/flags.
    gate: { enabled: true, fixtureVerified: true, isEvidenceMode: () => env.MAXPROMO_EVIDENCE_MODE === '1' } })
  return { folders: page => provider.folders(page), search: (folder, criteria, page) => provider.search(folder, criteria, page) }
}

/** Special-use folders decide meaning; names are localized and never guessed. */
export function classifyFolders(folders: ProviderFolder[]) {
  const by = (use: string) => folders.find(folder => folder.specialUse === use)?.path ?? null
  return { inbox: by('\\Inbox'), junk: by('\\Junk'), trash: by('\\Trash') }
}

/** A stored RFC Message-ID is the only cross-API identity; reject anything header-unsafe. */
function headerValue(messageId: string): string | null {
  return /^<[^\s<>]{1,996}>$/.test(messageId) ? messageId : null
}

export async function locateMessage(reader: ProviderStateReader, folders: ReturnType<typeof classifyFolders>, messageId: string, receivedAt: Date)
  : Promise<{ state: ProviderState; folder: string | null; uid: number | null }> {
  const id = headerValue(messageId)
  if (!id) return { state: 'not_found', folder: null, uid: null }
  const since = new Date(receivedAt.getTime() - 2 * 86_400_000).toISOString().slice(0, 10)
  // Junk first: it is the state that changes what Marcel sees.
  for (const [state, folder] of [['junk', folders.junk], ['inbox', folders.inbox], ['trash', folders.trash]] as const) {
    if (!folder) continue
    const page = await reader.search(folder, { header: `Message-ID:${id}`, since }, { perPage: 5 })
    const hit = page.data.find(message => message.messageId === id)
    if (hit) return { state, folder: hit.path, uid: hit.uid }
  }
  return { state: 'not_found', folder: null, uid: null }
}

export interface ReconcileResult { configured: boolean; checked: number; quarantined: number; failed: boolean }

/** Bounded pass over recent unverified messages. Safe to run concurrently and repeatedly:
 * each result is applied by one SQL function, and owner verdicts always win there.
 */
export async function reconcileProviderState(sql: Sql, reader: ProviderStateReader | null, limit = 10): Promise<ReconcileResult> {
  if (!reader) return { configured: false, checked: 0, quarantined: 0, failed: false }
  const pending = await sql`SELECT id,rfc_message_id,received_at,provider_checks FROM mail.messages
    WHERE account_id=${HOSTINGER_ACCOUNT} AND provider_state='unverified'
    AND received_at > now() - make_interval(days => ${LOOKBACK_DAYS})
    ORDER BY received_at DESC LIMIT ${limit}` as { id: string; rfc_message_id: string | null; received_at: Date; provider_checks: number }[]
  if (!pending.length) return { configured: true, checked: 0, quarantined: 0, failed: false }
  let checked = 0, quarantined = 0
  try {
    const folders = classifyFolders((await reader.folders({ perPage: 100 })).data)
    for (const message of pending) {
      const found = await locateMessage(reader, folders, message.rfc_message_id ?? '', new Date(message.received_at))
      // A message not found yet may still be in delivery; give up only after repeated checks.
      if (found.state === 'not_found' && message.rfc_message_id && message.provider_checks + 1 < MAX_CHECKS) {
        await sql`UPDATE mail.messages SET provider_checks=provider_checks+1,provider_checked_at=now() WHERE id=${message.id}::uuid AND provider_state='unverified'`
      } else {
        const [row] = await sql`SELECT mail.apply_provider_state(${message.id}::uuid,${found.state},${found.folder},${found.uid}) AS outcome` as { outcome: string }[]
        if (row?.outcome === 'quarantined') quarantined++
      }
      checked++
    }
    return { configured: true, checked, quarantined, failed: false }
  } catch {
    // Provider errors can echo request data; callers log only these counts.
    return { configured: true, checked, quarantined, failed: true }
  }
}
