import { address, filename, UNKNOWN_SENDER } from './normalization'
import { validateSignedUrl } from './content'

/** Trust model (authentication precedes this parser):
 * - ENVELOPE fields decide identity and routing. Invalid envelope => 400.
 *   Provider identifiers are OPAQUE bounded strings: Hostinger documents no character set,
 *   so none is invented. They are only ever SQL parameters/AAD, never paths or URLs.
 * - CONTENT fields are untrusted data. They are normalized, bounded or dropped, never a
 *   reason to refuse a durable receipt: refusing loses mail and repeated failures pause
 *   the provider webhook for every later message. Each degradation is a fixed code.
 */
export interface HostingerWebhookAttachment {
  id: string; filename: string; size: number; contentType: string; fileUrl: string | null
}
/** URLs are transient fetch candidates, never durable attachment locations or logging fields. */
export interface VerifiedHostingerEvent {
  deliveryId: string; eventId: string; mailbox: string; messageId: string; inReplyTo: string
  references: string[]; subject: string; sender: string; recipients: string[]; cc: string[]
  eventAt: string; emailDate: string | null; previewText: string; attachments: HostingerWebhookAttachment[]
  bodyUrl: string | null; degraded: string[]
}
export { UNKNOWN_SENDER }
export const MAX_PREVIEW_CHARS = 200
const MAX_ID = 256

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
}
/** Postgres text/jsonb refuse NUL and lone surrogates; a refusal there would be a retry loop. */
function clean(value: string): string {
  return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g, '�')
}
function codePoints(value: string, max: number): string {
  const points = [...value]
  return points.length > max ? points.slice(0, max).join('') : value
}
/** Opaque provider identity: string, bounded, printable. No grammar beyond that. */
function opaqueId(value: unknown, reason: string, allowEmpty: boolean): string {
  if (typeof value !== 'string' || value.length > MAX_ID || (!allowEmpty && !value) ||
    /[\u0000-\u001f\u007f-\u009f]/.test(value) || clean(value) !== value) throw new Error(reason)
  return value
}

export function parseHostingerWebhook(value: unknown, configuredMailbox: string): VerifiedHostingerEvent {
  const envelope = record(value)
  if (!envelope) throw new Error('invalid_webhook')
  if (envelope.event !== 'message.received') throw new Error('unsupported_webhook_event')
  const deliveryId = opaqueId(envelope.id, 'invalid_delivery_id', false)
  const data = record(envelope.data)
  if (!data) throw new Error('invalid_webhook')
  // Empty is the provider stating there is no mailbox message behind this event
  // (observed on Hostinger Test). The route acknowledges such events without ingestion.
  const eventId = opaqueId(data.eventId, 'invalid_event_id', true)
  let mailbox: string
  try { mailbox = address(typeof data.mailboxAddress === 'string' ? data.mailboxAddress.trim() : data.mailboxAddress) } catch { throw new Error('wrong_mailbox') }
  if (mailbox !== address(configuredMailbox)) throw new Error('wrong_mailbox')
  const timestamp = envelope.timestamp
  if (typeof timestamp !== 'string' || timestamp.length > 64 ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(timestamp) ||
    !Number.isFinite(Date.parse(timestamp)) ||
    // Date.parse rolls impossible dates (02-30) forward; require the calendar date to survive.
    (timestamp.endsWith('Z') && new Date(timestamp).toISOString().slice(0, 19) !== timestamp.slice(0, 19))) throw new Error('invalid_event_date')

  const degraded = new Set<string>()
  const text = (field: unknown, code: string): string => {
    if (field === undefined || field === null) return ''
    if (typeof field !== 'string') { degraded.add(code); return '' }
    return clean(field)
  }
  const header = (field: unknown, code: string): string => {
    const result = text(field, code).trim()
    if (!result) return ''
    if (result.length <= 998 && /^<[^\s<>]+>$/.test(result)) return result
    degraded.add(code); return ''
  }
  const mailboxAddress = (field: unknown, code: string): string => {
    const raw = text(field, code).replace(/[\r\n\t]/g, ' ').trim()
    if (!raw) return ''
    // Display names never participate in identity; quoted names may contain , ; < >.
    const unquoted = raw.replace(/"(?:[^"\\]|\\.)*"/g, '""').replace(/\([^()]*\)/g, ' ').trim()
    const brackets = unquoted.match(/<[^<>]*>/g) ?? []
    try {
      if (brackets.length === 1 && !/[<>]/.test(unquoted.replace(brackets[0], ''))) return address(brackets[0].slice(1, -1).trim())
      if (brackets.length === 0 && !/[\s,;"]/.test(unquoted)) return address(unquoted)
    } catch { /* unparseable below */ }
    degraded.add(code); return ''
  }
  const addressList = (field: unknown, code: string): string[] => {
    if (field === undefined || field === null) return []
    if (!Array.isArray(field)) { degraded.add(code); return [] }
    if (field.length > 50) degraded.add(code)
    return [...new Set(field.slice(0, 50).map(item => mailboxAddress(item, code)).filter(Boolean))]
  }

  const date = text(data.date, 'date_unparsed').slice(0, 200)
  const emailDate = date && Number.isFinite(Date.parse(date)) ? new Date(date).toISOString() : null
  if (date && !emailDate) degraded.add('date_unparsed')
  const parsedSender = mailboxAddress(data.from, 'sender_unparsed')
  const sender = parsedSender || UNKNOWN_SENDER
  if (!parsedSender) degraded.add('sender_unparsed')
  let references: string[] = []
  if (Array.isArray(data.references)) {
    // Most relevant ancestors are last; keep the newest bounded tail.
    references = data.references.slice(-100).map(item => header(item, 'references_dropped')).filter(Boolean)
    if (data.references.length > 100) degraded.add('references_dropped')
  } else if (data.references !== undefined && data.references !== null) degraded.add('references_dropped')
  let inReplyTo = header(data.inReplyTo, 'in_reply_to_dropped')
  // Threading requires a known sender; never link an unknown sender to anyone's thread.
  if (!parsedSender) { references = []; inReplyTo = '' }
  const fullSubject = text(data.subject, 'subject_unparsed').replace(/[\r\n\t]/g, ' ')
  if ([...fullSubject].length > 998) degraded.add('subject_truncated')
  const preview = text(data.plainBody, 'preview_unparsed')
  if ([...preview].length > MAX_PREVIEW_CHARS) degraded.add('preview_truncated')
  const url = (field: unknown, code: string): string | null => {
    if (field === undefined || field === null || field === '') return null
    try { return validateSignedUrl(field) } catch { degraded.add(code); return null }
  }

  let items: unknown[] = []
  if (Array.isArray(data.attachments)) items = data.attachments
  else if (data.attachments !== undefined && data.attachments !== null) degraded.add('attachments_unparsed')
  if (items.length > 30) degraded.add('attachments_truncated')
  const attachments = items.slice(0, 30).flatMap((item, index) => {
    const attachment = record(item)
    if (!attachment) { degraded.add('attachments_unparsed'); return [] }
    const original = text(attachment.filename, 'attachment_name_sanitized')
    const name = clean(codePoints(filename(original.replace(/[<>|?*"]/g, '_')), 120).replace(/[. ]+$/, '').trim()) || 'attachment'
    if (name !== original) degraded.add('attachment_name_sanitized')
    const size = attachment.sizeBytes
    const validSize = typeof size === 'number' && Number.isSafeInteger(size) && size >= 0
    if (!validSize) degraded.add('attachment_size_unknown')
    // Provider MIME is untrusted metadata; never authorize rendering with it.
    return [{ id: `${eventId}:${index}`, filename: name, size: validSize ? size : 0, contentType: 'application/octet-stream',
      fileUrl: url(attachment.fileUrl, 'attachment_url_unusable') }]
  })

  return { deliveryId, eventId, mailbox, messageId: header(data.messageId, 'message_id_dropped'), inReplyTo, references,
    subject: codePoints(fullSubject, 998), sender, recipients: addressList(data.to, 'recipients_dropped'), cc: addressList(data.cc, 'cc_dropped'),
    eventAt: new Date(timestamp).toISOString(), emailDate, previewText: codePoints(preview, MAX_PREVIEW_CHARS), attachments,
    bodyUrl: url(data.bodyUrl, 'body_url_unusable'), degraded: [...degraded].sort() }
}
