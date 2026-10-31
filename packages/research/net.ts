/**
 * The research reader's network boundary (ADR-0033 A1). SERVER ONLY.
 *
 * WHICH ADDRESSES ARE NEVER FETCHED
 *
 * Everything that is not the public internet: private, loopback, link-local, carrier-grade NAT,
 * benchmark, documentation, multicast, reserved and unspecified IPv4; IPv6 loopback, unique-local,
 * link-local, site-local, multicast, documentation, discard and Teredo; and IPv4 hidden inside IPv6
 * (mapped, compatible, NAT64, 6to4), judged by the IPv4 inside. An address that does not parse is
 * refused.
 *
 * WHEN IT IS CHECKED
 *
 * At the moment of connecting, not only before. `guardedFetch` resolves the host itself and connects
 * to the address it checked, so a name that answers public first and private second (DNS rebinding)
 * reaches nothing. Every redirect hop is a new connection and is checked again (fetchSite follows
 * redirects itself). The body is read up to a byte cap whatever Content-Length says.
 */
import { lookup as dnsLookup } from 'node:dns/promises'
import { request as httpRequest, type IncomingMessage } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { isIP, type LookupFunction } from 'node:net'
import { Readable } from 'node:stream'
import { createBrotliDecompress, createGunzip, createInflate } from 'node:zlib'

const v4 = (ip: string) => ip.split('.').map(Number)

function privateV4(ip: string): boolean {
  const [a, b, c] = v4(ip)
  return a === 0 || a === 10 || a === 127 || a >= 224
    || (a === 100 && b >= 64 && b <= 127)          // carrier-grade NAT (also cloud metadata 100.100.100.200)
    || (a === 169 && b === 254)                    // link-local, cloud metadata 169.254.169.254
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || (a === 192 && b === 0 && (c === 0 || c === 2)) // IETF protocol assignments, TEST-NET-1
    || (a === 198 && (b === 18 || b === 19))       // benchmarking
    || (a === 198 && b === 51 && c === 100)        // TEST-NET-2
    || (a === 203 && b === 0 && c === 113)         // TEST-NET-3
}

/** Eight 16-bit groups, or null when the text is not an IPv6 address. Accepts "::", a trailing dotted IPv4 and a zone. */
export function ipv6Groups(text: string): number[] | null {
  let s = text.toLowerCase().replace(/^\[|\]$/g, '').replace(/%.*$/, '')
  const dotted = /(\d+\.\d+\.\d+\.\d+)$/.exec(s)
  if (dotted) {
    if (isIP(dotted[1]) !== 4) return null
    const [a, b, c, d] = v4(dotted[1])
    s = s.slice(0, -dotted[1].length) + `${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`
  }
  const halves = s.split('::')
  if (halves.length > 2) return null
  const part = (h: string) => (h ? h.split(':') : [])
  const head = part(halves[0]), tail = halves.length === 2 ? part(halves[1]) : []
  const missing = 8 - head.length - tail.length
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null
  const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill('0'), ...tail]
  if (groups.some(g => !/^[0-9a-f]{1,4}$/.test(g))) return null
  return groups.map(g => parseInt(g, 16))
}

const embeddedV4 = (hi: number, lo: number) => `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`

/** True for every address the research reader must never connect to. Unknown shapes are refused. */
export function isPrivateAddress(ip: string): boolean {
  const kind = isIP(ip)
  if (kind === 4) return privateV4(ip)
  const g = ipv6Groups(ip)
  if (!g) return true
  const zeros = (n: number) => g.slice(0, n).every(x => x === 0)
  if (zeros(8)) return true                                                // ::
  if (zeros(7) && g[7] === 1) return true                                  // ::1
  if (zeros(5) && g[5] === 0xffff) return privateV4(embeddedV4(g[6], g[7])) // ::ffff:a.b.c.d, any notation
  if (zeros(6)) return true                                                // ::a.b.c.d (deprecated compatible)
  if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every(x => x === 0)) return privateV4(embeddedV4(g[6], g[7])) // NAT64 well-known
  if (g[0] === 0x64 && g[1] === 0xff9b && g[2] === 1) return true          // NAT64 local use
  if (g[0] === 0x2002) return privateV4(embeddedV4(g[1], g[2]))            // 6to4
  if (g[0] === 0x2001 && g[1] === 0) return true                           // Teredo (hides an IPv4)
  if (g[0] === 0x2001 && g[1] === 0xdb8) return true                       // documentation
  if (g[0] === 0x100 && g[1] === 0 && g[2] === 0 && g[3] === 0) return true // discard 100::/64
  const top = g[0]
  return (top & 0xfe00) === 0xfc00   // unique-local fc00::/7
    || (top & 0xffc0) === 0xfe80     // link-local fe80::/10
    || (top & 0xffc0) === 0xfec0     // site-local fec0::/10
    || (top & 0xff00) === 0xff00     // multicast
}

export interface Resolved { address: string; family: number }
export type Resolver = (host: string) => Promise<Resolved[]>
const systemResolver: Resolver = async host => (await dnsLookup(host, { all: true })).map(a => ({ address: a.address, family: a.family }))

export class BlockedAddressError extends Error {
  constructor(host: string) { super(`${host} resolves to an address that is not on the public internet`); this.name = 'BlockedAddressError' }
}

/** A connect-time lookup: resolves, refuses if ANY address is not public, then connects to the addresses it checked. */
export function guardedLookup(resolve: Resolver = systemResolver, blocked: (ip: string) => boolean = isPrivateAddress): LookupFunction {
  return ((host: string, options: { all?: boolean }, callback: (...args: unknown[]) => void) => {
    resolve(host).then(addresses => {
      if (!addresses.length) return callback(Object.assign(new Error(`${host} has no address`), { code: 'ENOTFOUND' }))
      if (addresses.some(a => blocked(a.address))) return callback(new BlockedAddressError(host))
      if (options?.all) return callback(null, addresses)
      callback(null, addresses[0].address, addresses[0].family)
    }, err => callback(err))
  }) as unknown as LookupFunction
}

const NULL_BODY = new Set([101, 103, 204, 205, 304])

/**
 * A `fetch` for the research reader: GET/HEAD only, no redirects followed (the caller follows and
 * re-checks each hop), connect-time address check, gzip/deflate/br decoded. Same shape as `fetch`
 * so the reader and its proofs need no second code path.
 */
export function createGuardedFetch(opts: { resolve?: Resolver; blocked?: (ip: string) => boolean } = {}): typeof fetch {
  const lookup = guardedLookup(opts.resolve, opts.blocked)
  return (async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new TypeError(`unsupported protocol ${url.protocol}`)
    if (isIP(url.hostname.replace(/^\[|\]$/g, ''))) throw new BlockedAddressError(url.hostname)
    const headers: Record<string, string> = { 'accept-encoding': 'gzip, deflate, br' }
    new Headers(init.headers).forEach((v, k) => { headers[k] = v })
    const method = (init.method ?? 'GET').toUpperCase()
    if (method !== 'GET' && method !== 'HEAD') throw new TypeError('the research reader only reads')
    const signal = init.signal ?? undefined
    const res = await new Promise<IncomingMessage>((resolveRes, reject) => {
      const req = (url.protocol === 'https:' ? httpsRequest : httpRequest)(url, { method, headers, lookup, signal })
      req.on('response', resolveRes)
      req.on('error', reject)
      req.end()
    })
    const outHeaders = new Headers()
    for (const [k, v] of Object.entries(res.headers)) {
      if (v === undefined) continue
      for (const one of Array.isArray(v) ? v : [v]) outHeaders.append(k, one)
    }
    const status = res.statusCode ?? 0
    if (NULL_BODY.has(status) || method === 'HEAD') {
      res.resume()
      return new Response(null, { status, headers: outHeaders })
    }
    const encoding = (res.headers['content-encoding'] ?? '').toString().trim().toLowerCase()
    const decoder = encoding === 'gzip' || encoding === 'x-gzip' ? createGunzip() : encoding === 'deflate' ? createInflate() : encoding === 'br' ? createBrotliDecompress() : null
    const stream: Readable = decoder ? res.pipe(decoder) : res
    if (decoder) { outHeaders.delete('content-encoding'); outHeaders.delete('content-length'); res.on('error', e => decoder.destroy(e)) }
    signal?.addEventListener('abort', () => { res.destroy(); stream.destroy() }, { once: true })
    return new Response(Readable.toWeb(stream) as ReadableStream, { status, headers: outHeaders })
  }) as typeof fetch
}

/** The default research fetch: system DNS, connect-time public-address check. */
export const guardedFetch = createGuardedFetch()

/** A body read up to `max` bytes; the rest is never downloaded. */
export async function readCapped(res: Response, max: number): Promise<Uint8Array> {
  if (!res.body) return new Uint8Array(0)
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (size < max) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      size += value.byteLength
    }
  } catch { /* a broken stream: keep what arrived */ }
  finally { await reader.cancel().catch(() => {}) }
  const out = new Uint8Array(Math.min(size, max))
  let at = 0
  for (const c of chunks) {
    if (at >= out.length) break
    const take = c.subarray(0, out.length - at)
    out.set(take, at)
    at += take.byteLength
  }
  return out
}
