import { HostingerMailProvider, type EmailProvider } from './provider'

/** Read-only attachment port: the provider's attachment endpoint and nothing else. */
export function attachmentReader(env: Record<string, string | undefined> = process.env, transport: typeof fetch = fetch): Pick<EmailProvider, 'attachment'> | null {
  const token = env.HOSTINGER_MAIL_API_TOKEN, mailbox = env.HOSTINGER_MAILBOX_RESOURCE_ID
  if (!token || !mailbox || env.MAXPROMO_EVIDENCE_MODE === '1' || env.MAIL_ATTACHMENTS_DISABLED === '1') return null
  const provider = new HostingerMailProvider({ token, mailboxResourceId: mailbox, transport, timeoutMs: 30_000,
    gate: { enabled: true, fixtureVerified: true, isEvidenceMode: () => env.MAXPROMO_EVIDENCE_MODE === '1' } })
  return { attachment: (ref, id, maxBytes) => provider.attachment(ref, id, maxBytes) }
}
