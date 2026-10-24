/** Server-side Hostinger Mail contract, checked against official OpenAPI 1.2.2.
 * https://github.com/hostinger/mail-api/blob/main/openapi.json
 * No global fetch fallback: callers must explicitly wire a transport and live gates.
 */
import { createHash, timingSafeEqual } from 'node:crypto'

export interface MessageRef { folder: string; uid: number }
export interface MailAddress { name: string; address: string }
export interface ProviderMessage {
  uid: number; path: string; date: string; flags: string[]; unseen: boolean; size: number
  subject: string | null; from: MailAddress | null; to: MailAddress[]; cc: MailAddress[]; bcc: MailAddress[]
  messageId: string | null; inReplyTo: string | null
  attachments: { id: string; contentType: string; sizeBytes: number; inline: boolean; filename: string | null; contentId: string | null }[]
}
export interface ProviderFolder { path: string; name: string; delimiter: string; specialUse: string | null; messageCount: number; unreadCount: number }
export interface PageOptions { page?: number; perPage?: number; sort?: 'uid' | '-uid' | 'date' | '-date' | 'size' | '-size' }
export interface ProviderPage<T> { data: T[]; pagination: { page: number; perPage: number; total: number; totalPages: number } }
export interface SearchCriteria { since?: string; before?: string; flags?: string[]; uid?: string; subject?: string; from?: string; to?: string; cc?: string; body?: string; header?: string; larger?: number; smaller?: number; text?: string }
export interface SendPayload {
  to?: string[]; cc?: string[]; bcc?: string[]; displayName?: string; subject?: string; text?: string; html?: string
  attachments?: { filename: string; content: string; contentType?: string; cid?: string; encoding?: string }[]
  inReplyTo?: MessageRef; forwardOf?: MessageRef
}
export interface FlagChange { addFlags?: string[]; removeFlags?: string[] }
/** Rendered parts of one message, from the provider's own API host. Untrusted data. */
export interface ProviderText { text: string; html: string }
/** Response bodies larger than this are refused, never truncated silently. */
export const MAX_TEXT_RESPONSE_BYTES = 1024 * 1024
export interface EmailProvider {
  list(folder: string, page?: PageOptions): Promise<ProviderPage<ProviderMessage>>
  get(ref: MessageRef): Promise<ProviderMessage>
  search(folder: string, criteria: SearchCriteria, page?: PageOptions): Promise<ProviderPage<ProviderMessage>>
  folders(page?: Pick<PageOptions, 'page' | 'perPage'>): Promise<ProviderPage<ProviderFolder>>
  text(ref: MessageRef): Promise<ProviderText>
  attachment(ref: MessageRef, attachmentId: string, maxBytes: number): Promise<ReadableStream<Uint8Array>>
  send(payload: SendPayload): Promise<void>
  move(ref: MessageRef, targetFolder: string): Promise<void>
  flags(ref: MessageRef, change: FlagChange): Promise<ProviderMessage>
}
export interface ProviderGate { enabled: boolean; fixtureVerified: boolean; isEvidenceMode: () => boolean }
export interface HostingerProviderOptions { transport: typeof fetch; token: string; mailboxResourceId: string; gate?: ProviderGate; timeoutMs?: number }
export class MailProviderError extends Error {
  readonly outcome: 'blocked' | 'failed' | 'uncertain'
  readonly status?: number
  constructor(outcome: 'blocked' | 'failed' | 'uncertain', status?: number) {
    super(`Mail provider ${outcome}${status ? ` (${status})` : ''}`)
    this.name = 'MailProviderError'; this.outcome = outcome; this.status = status
  }
}
function segment(value: string): string {
  if (!value || value.length > 255 || /[\r\n\0]/.test(value)) throw new MailProviderError('failed')
  return encodeURIComponent(value)
}
function refPath(ref: MessageRef): string {
  if (!Number.isSafeInteger(ref.uid) || ref.uid < 1) throw new MailProviderError('failed')
  return `/folders/${segment(ref.folder)}/messages/${ref.uid}`
}
function pageQuery(page: PageOptions = {}): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(page)) {
    if (value === undefined) continue
    if (key === 'page' || key === 'perPage') {
      if (!Number.isSafeInteger(value) || Number(value) < 1 || (key === 'perPage' && Number(value) > 100)) throw new MailProviderError('failed')
    } else if (key !== 'sort' || !['uid', '-uid', 'date', '-date', 'size', '-size'].includes(String(value))) throw new MailProviderError('failed')
    query.set(key, String(value))
  }
  return query.size ? `?${query}` : ''
}
function object(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value) }
function address(value: unknown): boolean { return object(value) && typeof value.name === 'string' && typeof value.address === 'string' }
function nullableString(value: unknown): boolean { return value === null || typeof value === 'string' }
function validMessage(value: unknown): value is ProviderMessage {
  return object(value) && Number.isSafeInteger(value.uid) && Number(value.uid) > 0 && typeof value.path === 'string' &&
    typeof value.date === 'string' && Array.isArray(value.flags) && value.flags.every(flag => typeof flag === 'string') &&
    typeof value.unseen === 'boolean' && Number.isSafeInteger(value.size) && Number(value.size) >= 0 && nullableString(value.subject) &&
    (value.from === null || address(value.from)) && nullableString(value.messageId) && nullableString(value.inReplyTo) &&
    Array.isArray(value.to) && value.to.every(address) && Array.isArray(value.cc) && value.cc.every(address) && Array.isArray(value.bcc) && value.bcc.every(address) &&
    Array.isArray(value.attachments) && value.attachments.every(attachment => object(attachment) && typeof attachment.id === 'string' &&
      typeof attachment.contentType === 'string' && Number.isSafeInteger(attachment.sizeBytes) && Number(attachment.sizeBytes) >= 0 &&
      typeof attachment.inline === 'boolean' && nullableString(attachment.filename) && nullableString(attachment.contentId))
}
function validFolder(value: unknown): value is ProviderFolder {
  return object(value) && typeof value.path === 'string' && typeof value.name === 'string' && typeof value.delimiter === 'string' &&
    (value.specialUse === null || typeof value.specialUse === 'string') && Number.isSafeInteger(value.messageCount) && Number(value.messageCount) >= 0 &&
    Number.isSafeInteger(value.unreadCount) && Number(value.unreadCount) >= 0
}
function parsePage<T>(value: unknown, item: (value: unknown) => value is T): ProviderPage<T> {
  if (!object(value) || !Array.isArray(value.data) || !value.data.every(item) || !object(value.pagination)) throw new MailProviderError('failed')
  const page = value.pagination
  for (const key of ['page', 'perPage', 'total', 'totalPages']) {
    if (!Number.isSafeInteger(page[key]) || Number(page[key]) < (key === 'page' || key === 'perPage' ? 1 : 0)) throw new MailProviderError('failed')
  }
  if (Number(page.perPage) > 100 || value.data.length > Number(page.perPage)) throw new MailProviderError('failed')
  return value as unknown as ProviderPage<T>
}
function parseMessage(value: unknown): ProviderMessage {
  if (!object(value) || !validMessage(value.data)) throw new MailProviderError('failed')
  return value.data
}
export class HostingerMailProvider implements EmailProvider {
  private readonly options: HostingerProviderOptions
  constructor(options: HostingerProviderOptions) { this.options = options }
  /** The single network path: fixed API host, Bearer token, no redirects, bounded time. */
  private async open(path: string, method = 'GET', body?: unknown): Promise<Response> {
    const { gate, token, mailboxResourceId, transport } = this.options
    if (!gate?.enabled || !gate.fixtureVerified || gate.isEvidenceMode() || !token || /[\r\n]/.test(token) || !/^AC[A-Za-z0-9]+$/.test(mailboxResourceId)) throw new MailProviderError('blocked')
    const sending = path === '/send'
    try {
      return await transport(`https://api.mail.hostinger.com/api/v1/mailboxes/${mailboxResourceId}${path}`, {
        method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(this.options.timeoutMs ?? 15_000), redirect: 'error', cache: 'no-store',
      })
    } catch { throw new MailProviderError(sending ? 'uncertain' : 'failed') }
  }
  private async request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
    const sending = path === '/send'
    const response = await this.open(path, method, body)
    // Never retry sends: timeouts/upstream failures may follow successful delivery.
    if (!response.ok) throw new MailProviderError(sending && response.status >= 500 ? 'uncertain' : 'failed', response.status)
    if (response.status === 204) return undefined as T
    try { return await response.json() as T } catch { throw new MailProviderError(sending ? 'uncertain' : 'failed') }
  }
  async list(folder: string, page?: PageOptions) { return parsePage(await this.request<unknown>(`/folders/${segment(folder)}/messages${pageQuery(page)}`), validMessage) }
  async get(ref: MessageRef) { return parseMessage(await this.request<unknown>(refPath(ref))) }
  async search(folder: string, criteria: SearchCriteria, page?: PageOptions) { return parsePage(await this.request<unknown>(`/folders/${segment(folder)}/messages/search${pageQuery(page)}`, 'POST', criteria), validMessage) }
  async folders(page?: Pick<PageOptions, 'page' | 'perPage'>) { return parsePage(await this.request<unknown>(`/folders${pageQuery(page)}`), validFolder) }
  /** Plain and HTML parts; does not change \\Seen. The body is read with a byte bound. */
  async text(ref: MessageRef): Promise<ProviderText> {
    const response = await this.open(`${refPath(ref)}/text`)
    if (!response.ok) throw new MailProviderError('failed', response.status)
    const bytes = await readBounded(response, MAX_TEXT_RESPONSE_BYTES)
    let value: unknown
    try { value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) } catch { throw new MailProviderError('failed') }
    if (!object(value) || !object(value.data) || typeof value.data.text !== 'string' || typeof value.data.html !== 'string') throw new MailProviderError('failed')
    return { text: value.data.text, html: value.data.html }
  }
  /** Attachment bytes as a stream that errors past maxBytes. Nothing is stored. */
  async attachment(ref: MessageRef, attachmentId: string, maxBytes: number): Promise<ReadableStream<Uint8Array>> {
    // Provider ids are base64 (`attachment:<folder>:<uid>:<part>`); encoded into the path below.
    if (!/^[A-Za-z0-9+/_=-]{1,512}$/.test(attachmentId) || !Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 30 * 1024 * 1024) throw new MailProviderError('failed')
    const response = await this.open(`${refPath(ref)}/attachments/${encodeURIComponent(attachmentId)}`)
    if (!response.ok || !response.body) throw new MailProviderError('failed', response.status)
    const length = response.headers.get('content-length')
    if (length !== null && (!/^\d+$/.test(length) || Number(length) > maxBytes)) { await response.body.cancel().catch(() => undefined); throw new MailProviderError('failed') }
    let size = 0
    return response.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        size += chunk.byteLength
        if (size > maxBytes) { controller.error(new MailProviderError('failed')); return }
        controller.enqueue(chunk)
      },
    }))
  }
  async send(payload: SendPayload): Promise<void> {
    const recipients = [...(payload.to ?? []), ...(payload.cc ?? []), ...(payload.bcc ?? [])]
    if (!recipients.length || recipients.some(address => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) || (payload.inReplyTo && payload.forwardOf)) throw new MailProviderError('failed')
    if (payload.inReplyTo) refPath(payload.inReplyTo)
    if (payload.forwardOf) refPath(payload.forwardOf)
    await this.request<void>('/send', 'POST', payload)
  }
  async move(ref: MessageRef, targetFolder: string): Promise<void> {
    if (targetFolder.length > 100) throw new MailProviderError('failed')
    segment(targetFolder)
    await this.request<void>(`${refPath(ref)}/move`, 'POST', { targetFolder })
  }
  async flags(ref: MessageRef, change: FlagChange) {
    const flags = [...(change.addFlags ?? []), ...(change.removeFlags ?? [])]
    if (!flags.length || flags.some(flag => !flag.length || flag.length > 255 || /[\r\n\0]/.test(flag))) throw new MailProviderError('failed')
    return parseMessage(await this.request<unknown>(refPath(ref), 'PATCH', change))
  }
}
async function readBounded(response: Response, maxBytes: number): Promise<Uint8Array> {
  const length = response.headers.get('content-length')
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > maxBytes)) throw new MailProviderError('failed')
  const reader = response.body?.getReader()
  if (!reader) throw new MailProviderError('failed')
  const chunks: Uint8Array[] = []; let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBytes) throw new MailProviderError('failed')
      chunks.push(value)
    }
  } catch { await reader.cancel().catch(() => undefined); throw new MailProviderError('failed') }
  const bytes = new Uint8Array(size); let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  return bytes
}
/** Hostinger documents a Bearer secret, not a payload signature. */
export function verifyWebhookBearer(header: string | null, secret: string): boolean {
  if (!secret || secret.length > 4096 || !header || header.length > 4103 || !header.startsWith('Bearer ')) return false
  const digest = (value: string) => createHash('sha256').update(value).digest()
  return timingSafeEqual(digest(header.slice(7)), digest(secret))
}
/** Bound actual streamed bytes; Content-Length alone cannot enforce the limit. */
export async function readBoundedPayload(request: Request, maxBytes = 262_144): Promise<string> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new Error('Invalid payload limit')
  if (Number(request.headers.get('content-length')) > maxBytes) throw new Error('Payload too large')
  const reader = request.body?.getReader()
  if (!reader) return ''
  const chunks: Uint8Array[] = []; let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBytes) { await reader.cancel(); throw new Error('Payload too large') }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  const bytes = new Uint8Array(size); let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}
