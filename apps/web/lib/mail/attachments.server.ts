import { HostingerMailProvider, type EmailProvider, type ProviderMessage } from './provider'
import { filename as normalizeFilename } from './normalization'

/** Read-only attachment port: message metadata and the attachment endpoint, nothing else. */
export type AttachmentReader = Pick<EmailProvider, 'get' | 'attachment'>
export function attachmentReader(env: Record<string, string | undefined> = process.env, transport: typeof fetch = fetch): AttachmentReader | null {
  const token = env.HOSTINGER_MAIL_API_TOKEN, mailbox = env.HOSTINGER_MAILBOX_RESOURCE_ID
  if (!token || !mailbox || env.MAXPROMO_EVIDENCE_MODE === '1' || env.MAIL_ATTACHMENTS_DISABLED === '1') return null
  const provider = new HostingerMailProvider({ token, mailboxResourceId: mailbox, transport, timeoutMs: 30_000,
    gate: { enabled: true, fixtureVerified: true, isEvidenceMode: () => env.MAXPROMO_EVIDENCE_MODE === '1' } })
  return { get: ref => provider.get(ref), attachment: (ref, id, maxBytes) => provider.attachment(ref, id, maxBytes) }
}

/**
 * The webhook names an attachment `<content hash>:<index>`; the REST API names it by its own id and
 * reports a size a few bytes different. Find the REST attachment that is the stored one: same
 * normalised file name, else the same position among real (non-inline) attachments.
 */
export function matchProviderAttachment(stored: { id: string; filename: string }, message: Pick<ProviderMessage, 'attachments'>): ProviderMessage['attachments'][number] | null {
  const real = message.attachments.filter(a => !a.inline)
  const byName = real.filter(a => normalizeFilename(a.filename ?? '') === stored.filename)
  if (byName.length === 1) return byName[0]
  const index = Number(stored.id.match(/:(\d{1,3})$/)?.[1] ?? NaN)
  if (byName.length === 0 && Number.isInteger(index) && real[index]) return real[index]
  return null
}
