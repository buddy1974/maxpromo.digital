import type { Sql } from '@/lib/commercial/types'
import type { EmailProvider } from './provider'
import { HOSTINGER_ACCOUNT } from './hostingerIngestion'
import { MAX_MAIL_BYTES, classifyMail } from './normalization'
import { isBounceSender, recordBounce } from './bounces'

/** Full message text (ADR-0023). The webhook carries a 200-character preview; the full text
 * comes from the provider's own API host by folder and UID, which the spam check records.
 * HTML is converted to plain text here and never rendered anywhere. */
export type ProviderContentReader = Pick<EmailProvider, 'text'>
const MAX_ATTEMPTS = 3

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', euro: '€', ndash: '–', mdash: '—', hellip: '…', laquo: '«', raquo: '»', bdquo: '„', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', auml: 'ä', ouml: 'ö', uuml: 'ü', Auml: 'Ä', Ouml: 'Ö', Uuml: 'Ü', szlig: 'ß', copy: '©', reg: '®', middot: '·', bull: '•' }

function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]{1,6}|#\d{1,7}|[a-z]{2,8});/gi, (whole, name: string) => {
    if (name[0] === '#') {
      const code = name[1] === 'x' || name[1] === 'X' ? Number.parseInt(name.slice(2), 16) : Number(name.slice(1))
      return Number.isInteger(code) && code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : ''
    }
    return ENTITIES[name] ?? whole
  })
}

/** Plain text from untrusted HTML: structure becomes line breaks, everything else is dropped.
 * No element, attribute, URL or style survives, so nothing can execute or load. */
export function htmlToText(html: string): string {
  const text = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|head|title|template|noscript|svg|object|iframe)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '\n• ')
    .replace(/<\/(p|div|tr|h[1-6]|blockquote|section|article|table|ul|ol|li)\s*>/gi, '\n')
    .replace(/<hr\b[^>]*>/gi, '\n———\n')
    .replace(/<[^>]*>/g, '')
  return normalizeText(decodeEntities(text))
}

export function normalizeText(value: string): string {
  return value.replace(/\u0000/g, '').replace(/\r\n?/g, '\n').replace(/[ \t ]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

/** Bounded to what mail.store_content accepts, cut at a character boundary. */
export function boundedBody(value: string): string {
  if (Buffer.byteLength(value) <= MAX_MAIL_BYTES) return value
  let cut = value.slice(0, MAX_MAIL_BYTES)
  while (Buffer.byteLength(cut) > MAX_MAIL_BYTES - 64) cut = cut.slice(0, Math.floor(cut.length * 0.95))
  return `${cut}\n\n[…]`
}

export function bodyFrom(parts: { text: string; html: string }): string {
  const plain = normalizeText(parts.text)
  return boundedBody(plain || htmlToText(parts.html))
}

export interface ContentResult { checked: number; stored: number; failed: number }

/** Fetch full text for recent previews whose provider location is known. Quarantined mail is
 * never fetched: its content is not needed to keep it out of Marcel's way. */
export async function reconcileContent(sql: Sql, reader: ProviderContentReader | null, options: { threadId?: string; limit?: number } = {}): Promise<ContentResult> {
  if (!reader) return { checked: 0, stored: 0, failed: 0 }
  const limit = Math.min(Math.max(options.limit ?? 5, 1), 10)
  const rows = await sql`SELECT m.id,m.subject,m.sender,m.received_at,m.provider_folder,m.provider_uid,m.risk_signals FROM mail.messages m JOIN mail.threads t ON t.id=m.thread_id
    WHERE m.account_id=${HOSTINGER_ACCOUNT} AND m.direction='inbound' AND m.body_state='preview' AND m.content_attempts < ${MAX_ATTEMPTS}
    AND m.provider_uid IS NOT NULL AND m.provider_folder IS NOT NULL AND m.provider_state IN ('inbox','other')
    AND t.quarantine IS NULL AND t.trashed=false
    AND (${options.threadId ?? null}::uuid IS NULL OR m.thread_id=${options.threadId ?? null}::uuid)
    AND (${options.threadId ?? null}::uuid IS NOT NULL OR m.received_at > now() - interval '30 days')
    ORDER BY m.received_at DESC LIMIT ${limit}` as { id: string; subject: string; sender: string; received_at: Date; provider_folder: string; provider_uid: string | number; risk_signals: string[] | null }[]
  let stored = 0, failed = 0
  for (const row of rows) {
    try {
      const body = bodyFrom(await reader.text({ folder: row.provider_folder, uid: Number(row.provider_uid) }))
      const triage = classifyMail({ subject: row.subject, text: body })
      /* Marketing text is full of "urgent" and "security". The full body may raise attention
         only for an enquiry or a bill from a mailbox a person reads. */
      const raises = triage.needsReply && ['lead', 'billing'].includes(triage.classification) && !(row.risk_signals ?? []).includes('automated_sender')
      const [result] = await sql`SELECT mail.store_content(${row.id}::uuid,${body},${raises ? triage.classification : 'other'},${raises}) AS ok` as { ok: boolean }[]
      if (result?.ok) stored++
      // A delivery failure report marks the outbound message it is about (lib/mail/bounces.ts).
      if (result?.ok && isBounceSender(row.sender)) await recordBounce(sql, { messageId: row.id, sender: row.sender, text: body, receivedAt: new Date(row.received_at) }).catch(() => undefined)
    } catch {
      failed++
      await sql`UPDATE mail.messages SET content_attempts=content_attempts+1,content_checked_at=now() WHERE id=${row.id}::uuid AND body_state='preview'`
    }
  }
  return { checked: rows.length, stored, failed }
}
