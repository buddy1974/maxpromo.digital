import { address, filename } from './normalization'
import { validateSignedUrl } from './content'

export interface HostingerWebhookAttachment {
  id: string; filename: string; size: number; contentType: string; fileUrl: string
}
/** URLs are transient fetch candidates, never durable attachment locations or logging fields. */
export interface VerifiedHostingerEvent {
  deliveryId: string; eventId: string; mailbox: string; messageId: string; inReplyTo: string
  references: string[]; subject: string; sender: string; recipients: string[]; cc: string[]
  eventAt: string; emailDate: string | null; previewText: string; attachments: HostingerWebhookAttachment[]
  bodyUrl: string | null
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid_webhook')
  return value as Record<string, unknown>
}
function text(value: unknown, max: number): string {
  if (typeof value !== 'string' || value.length > max || /[\u0000]/.test(value)) throw new Error('invalid_webhook_field')
  return value
}
function headerId(value: unknown): string {
  const result = text(value, 998)
  if (!/^<[^\s<>@]+@[^\s<>@]+>$/.test(result)) throw new Error('invalid_message_header')
  return result
}
/** Display names never participate in identity resolution. */
function mailboxAddress(value: unknown): string {
  const result = text(value, 998)
  if (/[\r\n]/.test(result)) throw new Error('invalid_address')
  const match = /^([^<>]*)<([^<>]+)>$/.exec(result)
  if (match && /[,;]/.test(match[1])) throw new Error('invalid_address')
  return address(match ? match[2].trim() : result.trim())
}
function addresses(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 50) throw new Error('invalid_recipients')
  return value.map(mailboxAddress)
}
export function parseHostingerWebhook(value: unknown, configuredMailbox: string): VerifiedHostingerEvent {
  const envelope = record(value)
  if (envelope.event !== 'message.received') throw new Error('unsupported_webhook_event')
  const deliveryId = text(envelope.id, 256)
  if (!/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,255}$/.test(deliveryId)) throw new Error('invalid_delivery_id')
  const data = record(envelope.data)
  const eventId = text(data.eventId, 256)
  if (!/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,255}$/.test(eventId)) throw new Error('invalid_event_id')
  const mailbox = address(data.mailboxAddress)
  if (mailbox !== address(configuredMailbox)) throw new Error('wrong_mailbox')
  const timestamp = text(envelope.timestamp, 64)
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/.test(timestamp) || !Number.isFinite(Date.parse(timestamp))) throw new Error('invalid_event_date')
  if (new Date(timestamp).toISOString().slice(0, 19) !== timestamp.slice(0, 19)) throw new Error('invalid_event_date')
  const date = text(data.date, 200)
  const emailDate = date && Number.isFinite(Date.parse(date)) ? new Date(date).toISOString() : null
  const inReplyTo = data.inReplyTo === '' ? '' : headerId(data.inReplyTo)
  if (!Array.isArray(data.references) || data.references.length > 100) throw new Error('invalid_references')
  const references = data.references.map(headerId)
  const plain = text(data.plainBody, 800)
  const html = text(data.htmlBody, 800)
  if ([...plain].length > 200 || [...html].length > 200) throw new Error('invalid_preview')
  if (!Array.isArray(data.attachments) || data.attachments.length > 30) throw new Error('invalid_attachments')
  const attachments = data.attachments.map((item, index) => {
    const attachment = record(item)
    const name = text(attachment.filename, 120)
    if (!name || filename(name) !== name || /[<>|?*"]/g.test(name) || /[. ]$/.test(name)) throw new Error('unsafe_filename')
    const size = attachment.sizeBytes
    if (typeof size !== 'number' || !Number.isSafeInteger(size) || size < 0 || size > 20 * 1024 * 1024) throw new Error('invalid_attachment_size')
    text(attachment.contentType, 255) // Provider MIME is untrusted metadata; never authorize rendering with it.
    return { id: `${eventId}:${index}`, filename: name, size, contentType: 'application/octet-stream', fileUrl: validateSignedUrl(attachment.fileUrl) }
  })
  return { deliveryId, eventId, mailbox, messageId: data.messageId===''?'':headerId(data.messageId), inReplyTo,
    references, subject: text(data.subject, 998).replace(/[\r\n]/g, ' '), sender: mailboxAddress(data.from), recipients: addresses(data.to), cc: addresses(data.cc),
    eventAt: new Date(timestamp).toISOString(), emailDate, previewText: plain, attachments,
    bodyUrl: data.bodyUrl === '' ? null : validateSignedUrl(data.bodyUrl) }
}
