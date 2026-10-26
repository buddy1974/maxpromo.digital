/**
 * Reading a prospect's own public website (ADR-0027 §2, ADR-0030). SERVER ONLY — used by the OS and by the Agent Bureau's Research Agent.
 *
 * The research step needs what a business says about itself — what it does, how it can be
 * reached, how it works today. That is on its own site, so the first workflow reads the site and
 * nothing else: no search engine, no scraping service, no third-party profile.
 *
 * WHAT IT REFUSES
 *
 * - Anything but http(s) on the default port, and any host that resolves to a private, loopback,
 *   link-local or carrier-grade address — checked again after every redirect (the reader must not be
 *   usable to read its own network).
 * - Paths robots.txt disallows for every crawler or for ours. A missing robots.txt allows.
 * - More than the home page (with up to four same-site frames, when the home page is a frameset)
 *   plus three same-site pages chosen by use — contact, appointments, services, about — and the
 *   Impressum only when nothing read so far names a way to reach the business; more than 1.5 MB a
 *   page, anything that is not HTML, anything slower than 8 seconds, more than 30 seconds in all.
 *
 * MESSY REAL SITES (2026-10-26, the first real prospect: a 2009 FrontPage frameset)
 *
 * - Frames: a frameset home page holds no text of its own, only "this page uses frames". Its
 *   same-site <frame>/<iframe> documents ARE the home page and are read as such; third-party
 *   frames (maps, widgets) never are. The shell's fallback text is not business content.
 * - Encodings: bytes are decoded by the charset the server or the page declares (<meta charset>,
 *   <meta http-equiv>); undeclared bytes that are not UTF-8 are read as Windows-1252.
 * - Links: quoted and unquoted href, image-map <area>, and the link's text or image alt ("Kontakt"
 *   on a button image) all count when choosing pages.
 * - Coverage: what was actually read is recorded (page kinds, frames, amount of text), so the
 *   qualification can tell "we read the contact page and there is no email" from "we never saw it".
 *
 * WHAT IT RETURNS
 *
 * Plain text per page (scripts, styles and markup removed) and signals read by code from the
 * markup — mailto/tel links, an online booking tool, a contact form, the CMS, mobile viewport,
 * the newest copyright year, whether HTTPS answers. Code reads those; the model never decides them.
 */
import { lookup as dnsLookup } from 'node:dns/promises'
import { isIP } from 'node:net'

export const USER_AGENT = 'MaxpromoResearch/1.0 (+https://maxpromo.digital; info@maxpromo.digital)'
const MAX_BYTES = 1_500_000
const MAX_TEXT = 12_000
const TIMEOUT_MS = 8_000
const MAX_EXTRA_PAGES = 3
const MAX_FRAMES = 4
const MAX_TOTAL_TEXT = 40_000
const DEADLINE_MS = 30_000
/** Under this much readable text in all, the pages are a notice ("under construction", "enable JavaScript"), not the business. */
export const THIN_CHARS = 150

/**
 * The kinds of page worth reading, most useful first. Matched on the path and on the link's text,
 * because "main-sprechzeiten.htm" and a button image with alt="Kontakt" are both common.
 */
export type PageKind = 'home' | 'contact' | 'appointments' | 'services' | 'about' | 'identity'
const KINDS: [Exclude<PageKind, 'home'>, RegExp][] = [
  ['contact', /(kontakt|contact|anfrage|enquir|inquir)/i],
  ['appointments', /(termin|sprechzeit|sprechstunde|(oe|ö|o)ffnungszeit|buchung|buchen|booking|appointment|reservier|opening.?hours)/i],
  ['services', /(leistung|angebot|service|behandlung|schwerpunkt|produkte|products?|what.?we.?do)/i],
  ['about', /(ueber.?uns|uber.?uns|über.?uns|about|team|praxis|unternehmen|company|wir.?sind)/i],
  ['identity', /(impressum|imprint|legal.?notice)/i],
]
export const kindOf = (path: string, text: string): Exclude<PageKind, 'home'> | null => {
  const p = decodeURIComponent(path)
  return KINDS.find(([, re]) => re.test(p))?.[0] ?? KINDS.find(([, re]) => re.test(text))?.[0] ?? null
}

/** Known online booking / scheduling tools: a site linking one already books online. */
const BOOKING = /(doctolib|calendly|etermin|shore\.com|treatwell|termin-direkt|terminland|simplybook|bookingkit|timify|samedi|jameda|planity|resmio|opentable|quandoo|thefork)/i

export interface FetchedPage { url: string; title: string; text: string; kind?: PageKind; frame?: boolean }
export interface SiteSignals {
  https: boolean
  /** When the site landed on http: did https://host/ answer at all? null when it is on https already. */
  httpsAvailable?: boolean | null
  mobileViewport: boolean
  generator: string | null
  bookingTool: string | null
  contactForm: boolean
  emails: string[]
  phones: string[]
  newestYear: number | null
}
/** What was actually read — the difference between "not there" and "not seen". */
export interface Coverage {
  pages: number
  /** Frame documents read as part of the home page. */
  frames: number
  chars: number
  /** The business was not really seen: a frameset none of whose frames could be read, or under THIN_CHARS of text. */
  thin: boolean
  /** The kinds of page read. */
  read: PageKind[]
  /** Charsets the pages were decoded with. */
  charsets: string[]
}
export type SiteResult =
  | { ok: true; origin: string; pages: FetchedPage[]; signals: SiteSignals; skipped: string[]; coverage: Coverage }
  | { ok: false; reason: 'invalid_url' | 'blocked_host' | 'robots' | 'unreachable' | 'not_html' | 'too_large' | 'empty'; detail: string }

export interface SiteDeps {
  fetch?: typeof fetch
  /** Resolves a hostname to its addresses. Injected so the proof needs no network. */
  lookup?: (host: string) => Promise<string[]>
}

const defaultLookup = async (host: string) => (await dnsLookup(host, { all: true })).map(a => a.address)

/** True for every address the OS must never fetch: private, loopback, link-local, CGNAT, multicast, unspecified. */
export function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split('.').map(Number)
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
  }
  const v6 = ip.toLowerCase()
  if (v6.startsWith('::ffff:')) return isPrivateAddress(v6.slice(7))
  return v6 === '::' || v6 === '::1' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe80') || v6.startsWith('ff')
}

/** The site's origin from what Marcel or a form typed ("example.de", "www.example.de/kontakt"). */
export function siteOrigin(input: string | null | undefined): URL | null {
  const raw = (input ?? '').trim()
  if (!raw) return null
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
    if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password || (u.port && u.port !== '80' && u.port !== '443')) return null
    if (!u.hostname.includes('.') || isIP(u.hostname)) return null
    return new URL(`${u.protocol}//${u.hostname}/`)
  } catch { return null }
}

async function hostAllowed(host: string, lookup: (h: string) => Promise<string[]>): Promise<boolean> {
  if (isIP(host)) return false
  if (/(^|\.)(localhost|local|internal|test|invalid|example)$/i.test(host)) return false
  try {
    const addresses = await lookup(host)
    return addresses.length > 0 && addresses.every(a => !isPrivateAddress(a))
  } catch { return false }
}

interface Got { url: string; status: number; type: string; body: string; charset: string }

/** The charset the response or the page itself declares, if any (the page's own in the first 4 KB). */
export function declaredCharset(type: string, bytes: Uint8Array): string | null {
  const header = /charset\s*=\s*["']?([\w.:-]+)/i.exec(type)?.[1]
  if (header) return header.toLowerCase()
  const head = new TextDecoder('latin1').decode(bytes.subarray(0, 4096))
  const meta = /<meta[^>]+charset\s*=\s*["']?\s*([\w.:-]+)/i.exec(head)?.[1]
  return meta ? meta.toLowerCase() : null
}

/**
 * Bytes to text by the declared charset. Undeclared bytes are UTF-8 when they are valid UTF-8,
 * otherwise Windows-1252 (what browsers assume for old western European pages). An unknown label
 * falls back the same way. Never throws.
 */
export function decodeBody(bytes: Uint8Array, type: string): { text: string; charset: string } {
  const label = declaredCharset(type, bytes)
  if (label) {
    try { const d = new TextDecoder(label); return { text: d.decode(bytes), charset: d.encoding } } catch { /* unknown label */ }
  }
  try { return { text: new TextDecoder('utf-8', { fatal: true }).decode(bytes), charset: 'utf-8' } }
  catch { return { text: new TextDecoder('windows-1252').decode(bytes), charset: 'windows-1252' } }
}

/** One GET with manual redirects, each hop re-checked. Null when unreachable or refused. */
async function get(url: string, deps: Required<SiteDeps>, accept: string): Promise<Got | { refused: SiteResult & { ok: false } } | null> {
  let current = url
  for (let hop = 0; hop < 4; hop++) {
    const u = new URL(current)
    if (!['http:', 'https:'].includes(u.protocol) || (u.port && u.port !== '80' && u.port !== '443')) return { refused: { ok: false, reason: 'blocked_host', detail: 'redirect to a non-web address' } }
    if (!await hostAllowed(u.hostname, deps.lookup)) return { refused: { ok: false, reason: 'blocked_host', detail: `${u.hostname} is not a public web host` } }
    let res: Response
    try {
      res = await deps.fetch(current, { redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT_MS), headers: { 'user-agent': USER_AGENT, accept, 'accept-language': 'de,en;q=0.8' } })
    } catch { return null }
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      current = new URL(res.headers.get('location')!, current).toString()
      continue
    }
    const length = Number(res.headers.get('content-length') ?? '0')
    if (length > MAX_BYTES) return { refused: { ok: false, reason: 'too_large', detail: `${current} is larger than 1.5 MB` } }
    const bytes = new Uint8Array(await res.arrayBuffer().catch(() => new ArrayBuffer(0))).subarray(0, MAX_BYTES)
    const type = res.headers.get('content-type') ?? ''
    const { text, charset } = decodeBody(bytes, type)
    return { url: current, status: res.status, type, body: text, charset }
  }
  return null
}

/** robots.txt rules for `*` and for our agent: the Disallow prefixes that apply. */
export function robotsDisallows(robots: string): string[] {
  const out: string[] = []
  let applies = false, inGroup = false
  for (const raw of robots.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim()
    const m = /^([a-z-]+)\s*:\s*(.*)$/i.exec(line)
    if (!m) continue
    const key = m[1].toLowerCase(), value = m[2].trim()
    if (key === 'user-agent') {
      if (!inGroup) applies = false
      inGroup = true
      if (value === '*' || /maxpromoresearch/i.test(value)) applies = true
    } else {
      inGroup = false
      if (key === 'disallow' && applies && value) out.push(value)
    }
  }
  return out
}

const decode = (s: string) => s
  .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
  .replace(/&auml;/g, 'ä').replace(/&ouml;/g, 'ö').replace(/&uuml;/g, 'ü').replace(/&Auml;/g, 'Ä').replace(/&Ouml;/g, 'Ö').replace(/&Uuml;/g, 'Ü').replace(/&szlig;/g, 'ß')
  .replace(/&sect;/g, '§').replace(/&copy;/g, '©').replace(/&reg;/g, '®').replace(/&euro;/g, '€').replace(/&ndash;/g, '–').replace(/&mdash;/g, '—')
  .replace(/&bdquo;/g, '„').replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”').replace(/&eacute;/g, 'é').replace(/&egrave;/g, 'è').replace(/&middot;/g, '·')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))

/** Visible text of an HTML page: no scripts, styles, comments, markup. */
export function htmlText(html: string): string {
  return decode(html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    /* A line break in the source is a space; only markup breaks lines. */
    .replace(/[\r\n]+/g, ' ')
    .replace(/<(script|style|noscript|svg|template|iframe)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|tr|table|section|article|header|footer)>/gi, '\n')
    .replace(/<[^>]+>/g, ' '))
    .replace(/[ \t\f\v]+/g, ' ').replace(/\s*\n\s*/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

const HREF = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+))/i
const SRC = /\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+))/i
const ALT = /\balt\s*=\s*(?:"([^"]*)"|'([^']*)')/gi

/** Links with their visible text (or image alt): quoted or unquoted href, and image-map areas. */
export function anchors(html: string, base: string): { url: string; text: string }[] {
  const out: { url: string; text: string }[] = []
  const push = (href: string | undefined, text: string) => {
    const h = decode((href ?? '').trim()).replace(/#.*$/, '')
    if (!h) return
    try { out.push({ url: new URL(h, base).toString(), text: text.replace(/\s+/g, ' ').trim().slice(0, 80) }) } catch { /* not a URL */ }
  }
  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]{0,2000}?)<\/a>/gi)) {
    const h = HREF.exec(m[1])
    const alts = [...m[2].matchAll(ALT)].map(a => a[1] ?? a[2]).join(' ')
    if (h) push(h[1] ?? h[2] ?? h[3], `${decode(m[2].replace(/<[^>]+>/g, ' '))} ${decode(alts)}`)
  }
  for (const m of html.matchAll(/<area\b([^>]*)>/gi)) {
    const h = HREF.exec(m[1])
    if (h) push(h[1] ?? h[2] ?? h[3], decode([...m[1].matchAll(ALT)].map(a => a[1] ?? a[2]).join(' ')))
  }
  return out
}
const links = (html: string, base: string) => anchors(html, base).map(a => a.url)

/** The documents a page shows in frames: <frame src> and <iframe src>. */
export function frameSources(html: string, base: string): string[] {
  const out: string[] = []
  for (const m of html.matchAll(/<i?frame\b([^>]*)>/gi)) {
    const src = SRC.exec(m[1])
    if (!src) continue
    try { out.push(new URL(decode((src[1] ?? src[2] ?? src[3]).trim()), base).toString()) } catch { /* not a URL */ }
  }
  return [...new Set(out)]
}

export function readSignals(html: string, origin: URL): SiteSignals {
  const all = links(html, origin.toString())
  const emails = new Set<string>(), phones = new Set<string>()
  for (const l of all) {
    if (l.startsWith('mailto:')) { const e = decodeURIComponent(l.slice(7).split('?')[0]).trim().toLowerCase(); if (/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e)) emails.add(e) }
    if (l.startsWith('tel:')) { const p = decodeURIComponent(l.slice(4)).replace(/[^\d+]/g, ''); if (p.length >= 6) phones.add(p) }
  }
  const booking = all.find(l => BOOKING.test(l)) ?? (BOOKING.exec(html)?.[0] ?? null)
  /* Tags may sit between the sign and the year ("©</font> <font>2009"). */
  const years = [...html.replace(/<[^>]+>/g, ' ').matchAll(/(?:©|&copy;|copyright)(?:\s|&nbsp;)*(?:\d{4}\s*[-–]\s*)?(\d{4})/gi)].map(m => Number(m[1])).filter(y => y > 1995 && y < 2100)
  return {
    https: origin.protocol === 'https:',
    mobileViewport: /<meta[^>]+name=["']viewport["']/i.test(html),
    generator: /<meta[^>]+name=["']generator["'][^>]+content=["']([^"']{1,60})/i.exec(html)?.[1] ?? (/wp-content\//i.test(html) ? 'WordPress' : /static\.wixstatic|wix\.com/i.test(html) ? 'Wix' : /jimdo/i.test(html) ? 'Jimdo' : null),
    bookingTool: booking ? (BOOKING.exec(booking)?.[0] ?? null) : null,
    contactForm: /<form\b[\s\S]{0,4000}?(type=["']email["']|name=["'][^"']*(mail|nachricht|message)[^"']*["'])/i.test(html),
    emails: [...emails].slice(0, 5),
    phones: [...phones].slice(0, 5),
    newestYear: years.length ? Math.max(...years) : null,
  }
}

const isHtml = (type: string) => /text\/html|application\/xhtml/i.test(type)

/** Reads the home page (its frames too) and up to three useful same-site pages. Never throws. */
export async function fetchSite(website: string | null | undefined, depsIn: SiteDeps = {}): Promise<SiteResult> {
  const deps: Required<SiteDeps> = { fetch: depsIn.fetch ?? fetch, lookup: depsIn.lookup ?? defaultLookup }
  const origin = siteOrigin(website)
  if (!origin) return { ok: false, reason: 'invalid_url', detail: 'no usable website address' }

  const robotsGot = await get(new URL('/robots.txt', origin).toString(), deps, 'text/plain')
  if (robotsGot && 'refused' in robotsGot) return robotsGot.refused
  const disallowed = robotsGot && robotsGot.status === 200 ? robotsDisallows(robotsGot.body) : []
  const allowed = (u: URL) => !disallowed.some(prefix => (u.pathname + u.search).startsWith(prefix))
  if (!allowed(origin)) return { ok: false, reason: 'robots', detail: 'robots.txt asks crawlers not to read this site' }

  const home = await get(origin.toString(), deps, 'text/html')
  if (!home) return { ok: false, reason: 'unreachable', detail: `${origin.hostname} did not answer` }
  if ('refused' in home) return home.refused
  if (home.status >= 400) return { ok: false, reason: 'unreachable', detail: `${origin.hostname} answered ${home.status}` }
  if (!isHtml(home.type)) return { ok: false, reason: 'not_html', detail: 'the home page is not a web page' }
  /* A redirect to the same business on https or www is the site; record where it landed. */
  const landed = new URL(home.url)
  const site = new URL(`${landed.protocol}//${landed.hostname}/`)
  const sameSite = (u: URL) => u.hostname.replace(/^www\./, '') === site.hostname.replace(/^www\./, '')

  const started = Date.now()
  const inTime = () => Date.now() - started < DEADLINE_MS
  const pages: FetchedPage[] = []
  const skipped: string[] = []
  const charsets = new Set<string>()
  let total = 0
  const add = (got: Got, kind: PageKind, frame = false) => {
    const text = htmlText(got.body).slice(0, Math.min(MAX_TEXT, MAX_TOTAL_TEXT - total))
    charsets.add(got.charset)
    if (!text) return
    total += text.length
    pages.push({ url: got.url, title: decode(/<title[^>]*>([^<]{0,200})/i.exec(got.body)?.[1] ?? '').trim(), text, kind, ...(frame ? { frame: true } : {}) })
  }
  /* One page is one path: "/kontakt?source=home" is the contact page already read, not another. */
  const pageKey = (u: URL) => u.pathname.replace(/\/+$/, '') || '/'
  const seen = new Set([pageKey(new URL(home.url))])
  const usable = (u: URL | null): u is URL => !!u && ['http:', 'https:'].includes(u.protocol) && sameSite(u) && !/\.(pdf|jpe?g|png|gif|zip|docx?|xlsx?|mp4|mp3)$/i.test(u.pathname)
  const toUrl = (l: string) => { try { const u = new URL(l); u.hash = ''; return u } catch { return null } }
  let markup = home.body
  const linked: { url: string; text: string }[] = [...anchors(home.body, home.url)]

  /* A frameset home page is a shell: its same-site frames are the home page (nested framesets once). */
  const frameQueue = frameSources(home.body, home.url).map(toUrl).filter(usable)
  let frames = 0
  while (frameQueue.length && frames < MAX_FRAMES && inTime()) {
    const u = frameQueue.shift()!
    if (seen.has(pageKey(u))) continue
    seen.add(pageKey(u))
    if (!allowed(u)) { skipped.push(`${u.pathname} (robots.txt)`); continue }
    const got = await get(u.toString(), deps, 'text/html')
    if (!got || 'refused' in got || got.status >= 400 || !isHtml(got.type)) { skipped.push(u.pathname); continue }
    frames++
    markup += got.body
    linked.push(...anchors(got.body, got.url))
    frameQueue.push(...frameSources(got.body, got.url).map(toUrl).filter(usable))
    add(got, 'home', true)
  }
  /* The shell's own text ("this page uses frames") is not the business — unless no frame could be read. */
  if (!frames || !/<frameset\b/i.test(home.body)) add(home, 'home')

  /* The useful pages, by kind: one of each kind first, most useful kind first, in page order. */
  const ranked = new Map<string, { url: URL; kind: Exclude<PageKind, 'home'> }>()
  for (const a of linked) {
    const u = toUrl(a.url)
    if (!usable(u) || seen.has(pageKey(u)) || ranked.has(pageKey(u))) continue
    const kind = kindOf(u.pathname, a.text)
    if (kind) ranked.set(pageKey(u), { url: u, kind })
  }
  const order = KINDS.map(([k]) => k)
  const all = [...ranked.values()].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind))
  const firsts = order.map(k => all.find(c => c.kind === k)).filter((c): c is NonNullable<typeof c> => !!c)
  const picks = [...firsts, ...all.filter(c => !firsts.includes(c))]
  const reachable = () => /mailto:|tel:/i.test(markup) || /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(pages.map(p => p.text).join(' '))
  let extra = 0
  for (const c of picks) {
    if (!inTime() || total >= MAX_TOTAL_TEXT) break
    /* Three pages by use; the Impressum besides, only when nothing read names a way to reach them. */
    if (extra >= MAX_EXTRA_PAGES + (c.kind === 'identity' && !reachable() ? 1 : 0)) continue
    if (seen.has(pageKey(c.url))) continue
    seen.add(pageKey(c.url))
    if (!allowed(c.url)) { skipped.push(`${c.url.pathname} (robots.txt)`); continue }
    const got = await get(c.url.toString(), deps, 'text/html')
    if (!got || 'refused' in got || got.status >= 400 || !isHtml(got.type)) { skipped.push(c.url.pathname); continue }
    extra++
    add(got, c.kind)
    markup += got.body
  }
  if (!pages.length || total < 80) return { ok: false, reason: 'empty', detail: 'the site has almost no readable text (it may need JavaScript to show anything)' }

  const signals = readSignals(markup, site)
  /* An http site: is https there at all? One request, same host checks; any answer counts. */
  signals.httpsAvailable = null
  if (site.protocol === 'http:' && await hostAllowed(site.hostname, deps.lookup)) {
    try {
      const res = await deps.fetch(`https://${site.hostname}/`, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(5_000), headers: { 'user-agent': USER_AGENT, accept: 'text/html' } })
      await res.body?.cancel().catch(() => {})
      signals.httpsAvailable = res.status > 0 && res.status < 500
    } catch { signals.httpsAvailable = false }
  }
  const read = [...new Set(pages.map(p => p.kind ?? 'home'))]
  return {
    ok: true, origin: site.toString(), pages, signals, skipped,
    coverage: { pages: pages.length, frames, chars: total, thin: total < THIN_CHARS || (/<frameset\b/i.test(home.body) && frames === 0), read, charsets: [...charsets] },
  }
}
