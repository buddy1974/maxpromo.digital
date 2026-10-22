import { createHash } from 'node:crypto'
import { isIP } from 'node:net'
import { filename } from './normalization'

const invalid = (): never => { throw new Error('invalid_signed_content') }

/** Syntax validation only. A URL is never authority to make a network request. */
export function validateSignedUrl(value: unknown): string {
  if (typeof value !== 'string' || value.length > 8192 || /[\s\\\u0000-\u001f]/.test(value)) return invalid()
  let url: URL
  try { url = new URL(value) } catch { return invalid() }
  const host = url.hostname.toLowerCase()
  if (url.protocol !== 'https:' || url.username || url.password || url.hash || (url.port && url.port !== '443') ||
      isIP(host.replace(/^\[|\]$/g, '')) || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(host) ||
      /(?:^|\.)(?:localhost|local|internal|test|invalid|example|onion)$/.test(host) ||
      /%(?:2e|2f|5c)/i.test(value.split('?')[0]) || /(?:^|\/)\.\.(?:\/|$)/.test(value.split('?')[0])) return invalid()
  return url.href
}

/** Deliberately conservative: reject special-purpose networks, including IPv4-mapped IPv6. */
export function isPublicAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a,b,c] = address.split('.').map(Number)
    return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 0 || b === 168 || (b === 88 && c === 99) || (b === 0 && c === 2))) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) || (a === 203 && b === 0 && c === 113))
  }
  // Global unicast only; reject transition, documentation and reserved suballocations.
  if (isIP(address) !== 6 || address.includes('.')) return false
  const first = Number.parseInt(address.split(':')[0],16)
  return first > 0x2002 && first < 0x3fff
}

export interface PinnedContentRequest {
  url: string; hostname: string; address: string; signal: AbortSignal; redirect: 'error'
}
/** Transport MUST connect to address while retaining hostname TLS verification/SNI.
 * No production implementation exists until Hostinger download hosts/media contracts are verified.
 * A generic fetch implementation is NOT conformant (DNS rebinding).
 */
export type PinnedContentTransport = (request: PinnedContentRequest) => Promise<Response>
export interface SignedContentOptions {
  allowedHosts: readonly string[]
  resolve: (hostname: string) => Promise<string[]>
  transport: PinnedContentTransport
  maxBytes: number
  timeoutMs?: number
  expectedType?: string
}
export interface RetrievedContent { bytes: Uint8Array; contentType: string }

export async function fetchSignedContent(value: string, options: SignedContentOptions): Promise<RetrievedContent> {
  const url = validateSignedUrl(value)
  const hostname = new URL(url).hostname
  if (!options.allowedHosts.includes(hostname) || !Number.isSafeInteger(options.maxBytes) || options.maxBytes < 1 || options.maxBytes > 20 * 1024 * 1024) return invalid()
  const controller = new AbortController()
  const timeoutMs = options.timeoutMs ?? 5000
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000) return invalid()
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('signed_content_unavailable')) }, timeoutMs) })
    return await Promise.race([timeout, (async () => {
      const addresses = await options.resolve(hostname)
      if (controller.signal.aborted || !addresses.length || addresses.some(address => !isPublicAddress(address))) return invalid()
      const response = await options.transport({url, hostname, address:addresses[0],signal:controller.signal,redirect:'error'})
      if (!response.ok || response.redirected || !response.body) return invalid()
      const length = response.headers.get('content-length')
      if (length !== null && (!/^\d+$/.test(length) || Number(length) > options.maxBytes)) return invalid()
      const contentType = (response.headers.get('content-type') ?? 'application/octet-stream').split(';')[0].trim().toLowerCase()
      if (options.expectedType && contentType !== options.expectedType) return invalid()
      const reader = response.body.getReader()
      const chunks: Uint8Array[] = []
      let size = 0
      try {
        while (true) {
          const chunk = await reader.read()
          if (chunk.done) break
          size += chunk.value.byteLength
          if (size > options.maxBytes || controller.signal.aborted) return invalid()
          chunks.push(chunk.value)
        }
      } finally { await reader.cancel().catch(() => undefined); reader.releaseLock() }
      const bytes = new Uint8Array(size)
      let offset = 0
      for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.length }
      return {bytes,contentType}
    })()])
  } catch { throw new Error('signed_content_unavailable') }
  finally { if (timer) clearTimeout(timer); controller.abort() }
}

export interface DurableAttachmentSink {
  /** Private authenticated storage, never a public URL. Implementations must be idempotent by sha256. */
  put(bytes: Uint8Array, metadata: {filename:string;contentType:string;sha256:string}): Promise<string>
}
export function sniffAttachment(bytes: Uint8Array): string {
  const prefix = Buffer.from(bytes.subarray(0,8))
  if (prefix.subarray(0,5).toString() === '%PDF-') return 'application/pdf'
  if (prefix.equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png'
  if (prefix[0] === 255 && prefix[1] === 216 && prefix[2] === 255) return 'image/jpeg'
  // ZIP/Office, HTML, scripts and unknown formats remain opaque downloads.
  return 'application/octet-stream'
}
export async function persistAttachment(content: RetrievedContent, originalFilename: string, sink: DurableAttachmentSink) {
  if (!content.bytes.length || content.bytes.length > 20 * 1024 * 1024) return invalid()
  const metadata = { filename:filename(originalFilename), contentType:sniffAttachment(content.bytes), sha256:createHash('sha256').update(content.bytes).digest('hex') }
  const storageRef = await sink.put(content.bytes,metadata)
  return {...metadata,size:content.bytes.length,storageRef}
}
