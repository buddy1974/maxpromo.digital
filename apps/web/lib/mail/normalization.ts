/** Untrusted mail is data. This module has no model, tools, network or business writes. */
export const MAX_MAIL_BYTES = 256 * 1024
/** Reserved TLD (RFC 2606): can never equal a real lead/client address or thread sender. */
export const UNKNOWN_SENDER = 'unknown-sender@sender.invalid'
export interface Attachment { id: string; filename: string; size: number; contentType: string }
export interface InboundMail {
  accountId: string; messageId: string; threadId: string; sender: string; recipients: string[]; cc: string[]
  subject: string; text: string; receivedAt: string; attachments: Attachment[]
}
export function address(value: unknown): string {
  if (typeof value !== 'string' || value.length > 254 || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(value)) throw new Error('invalid_address')
  return value.toLowerCase()
}
export function filename(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f/\\:]/g, '_').replace(/\.\./g, '_').slice(0, 120) || 'attachment'
}
export function normalizeMail(value: InboundMail): InboundMail {
  if (!value.accountId || !value.messageId || !value.threadId || [value.accountId, value.messageId, value.threadId].some(x => x.length > 512)) throw new Error('invalid_identity')
  if (!Number.isFinite(Date.parse(value.receivedAt))) throw new Error('invalid_date')
  if (typeof value.text !== 'string' || Buffer.byteLength(value.text) > MAX_MAIL_BYTES || typeof value.subject !== 'string' || value.subject.length > 998) throw new Error('invalid_content')
  if (value.recipients.length > 50 || value.cc.length > 50 || value.attachments.length > 30) throw new Error('too_many_parts')
  return { ...value, sender: address(value.sender), recipients: value.recipients.map(address), cc: value.cc.map(address),
    subject: value.subject.replace(/[\r\n\u0000]/g, ' '), text: value.text.replace(/\u0000/g, ''),
    attachments: value.attachments.map(a => {
      if (!a.id || !Number.isSafeInteger(a.size) || a.size < 0 || a.size > 20 * 1024 * 1024) throw new Error('invalid_attachment')
      return { id: a.id.slice(0,512), filename: filename(a.filename), size: a.size, contentType: 'application/octet-stream' }
    }) }
}
export function classifyMail(mail: Pick<InboundMail,'subject'|'text'>): { classification: string; needsReply: boolean; important: boolean } {
  // Conservative triage labels, never authority to execute anything.
  const text = `${mail.subject}\n${mail.text}`.slice(0, 12000)
  if (/security|sicherheit|incident|ausfall|urgent|dringend/i.test(text)) return { classification: 'system', needsReply: true, important: true }
  if (/invoice|rechnung|payment|zahlung|billing/i.test(text)) return { classification: 'billing', needsReply: true, important: true }
  if (/unsubscribe|newsletter|abmelden/i.test(text)) return { classification: 'routine', needsReply: false, important: false }
  if (/enquiry|inquiry|anfrage|quotation|angebot|automation|automatisierung/i.test(text)) return { classification: 'lead', needsReply: true, important: true }
  return { classification: 'other', needsReply: false, important: false }
}
