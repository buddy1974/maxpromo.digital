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
 * - More than the home page plus three same-site pages (Impressum, contact, services, about),
 *   more than 1.5 MB a page, anything that is not HTML, anything slower than 8 seconds.
 *
 * WHAT IT RETURNS
 *
 * Plain text per page (scripts, styles and markup removed) and signals read by code from the
 * markup — mailto/tel links, an online booking tool, a contact form, the CMS, mobile viewport,
 * the newest copyright year. Code reads those; the model never decides them.
 */
import { lookup as dnsLookup } from 'node:dns/promises'
import { isIP } from 'node:net'

export const USER_AGENT = 'MaxpromoResearch/1.0 (+https://maxpromo.digital; info@maxpromo.digital)'
const MAX_BYTES = 1_500_000
const MAX_TEXT = 12_000
const TIMEOUT_MS = 8_000
const MAX_EXTRA_PAGES = 3
const WANTED = /(impressum|imprint|kontakt|contact|leistung|angebot|service|ueber-uns|uber-uns|about|team|praxis|termin)/i

/** Known online booking / scheduling tools: a site linking one already books online. */
const BOOKING = /(doctolib|calendly|etermin|shore\.com|treatwell|termin-direkt|terminland|simplybook|bookingkit|timify|samedi|jameda|planity|resmio|opentable|quandoo|thefork)/i

export interface FetchedPage { url: string; title: string; text: string }
export interface SiteSignals {
  https: boolean
  mobileViewport: boolean
  generator: string | null
  bookingTool: string | null
  contactForm: boolean
  emails: string[]
  phones: string[]
  newestYear: number | null
}
export type SiteResult =
  | { ok: true; origin: string; pages: FetchedPage[]; signals: SiteSignals; skipped: string[] }
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

interface Got { url: string; status: number; type: string; body: string }

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
    const body = (await res.text().catch(() => '')).slice(0, MAX_BYTES)
    return { url: current, status: res.status, type: res.headers.get('content-type') ?? '', body }
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
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))

/** Visible text of an HTML page: no scripts, styles, comments, markup. */
export function htmlText(html: string): string {
  return decode(html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|template|iframe)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|tr|section|article|header|footer)>/gi, '\n')
    .replace(/<[^>]+>/g, ' '))
    .replace(/[ \t\f\v]+/g, ' ').replace(/\s*\n\s*/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

function links(html: string, base: string): string[] {
  const out: string[] = []
  for (const m of html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"'#]+)["']/gi)) {
    try { out.push(new URL(decode(m[1]), base).toString()) } catch { /* not a URL */ }
  }
  return out
}

export function readSignals(html: string, origin: URL): SiteSignals {
  const all = links(html, origin.toString())
  const emails = new Set<string>(), phones = new Set<string>()
  for (const l of all) {
    if (l.startsWith('mailto:')) { const e = decodeURIComponent(l.slice(7).split('?')[0]).trim().toLowerCase(); if (/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e)) emails.add(e) }
    if (l.startsWith('tel:')) { const p = decodeURIComponent(l.slice(4)).replace(/[^\d+]/g, ''); if (p.length >= 6) phones.add(p) }
  }
  const booking = all.find(l => BOOKING.test(l)) ?? (BOOKING.exec(html)?.[0] ?? null)
  const years = [...html.matchAll(/(?:©|&copy;|copyright)\s*(?:\d{4}\s*[-–]\s*)?(\d{4})/gi)].map(m => Number(m[1])).filter(y => y > 1995 && y < 2100)
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

/** Reads the home page and up to three useful same-site pages. Never throws. */
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

  const pages: FetchedPage[] = []
  const skipped: string[] = []
  const add = (url: string, html: string) => {
    const text = htmlText(html).slice(0, MAX_TEXT)
    if (text) pages.push({ url, title: decode(/<title[^>]*>([^<]{0,200})/i.exec(html)?.[1] ?? '').trim(), text })
  }
  add(home.url, home.body)
  let markup = home.body

  const candidates = [...new Set(links(home.body, home.url))]
    .map(l => { try { return new URL(l) } catch { return null } })
    .filter((u): u is URL => !!u && ['http:', 'https:'].includes(u.protocol) && sameSite(u) && WANTED.test(u.pathname) && !/\.(pdf|jpe?g|png|gif|zip|docx?)$/i.test(u.pathname))
    .map(u => { u.hash = ''; return u })
  /* One page is one path: "/kontakt?source=home" is the contact page already read, not another. */
  const pageKey = (u: URL) => u.pathname.replace(/\/+$/, '') || '/'
  const seen = new Set([pageKey(new URL(home.url))])
  for (const u of candidates) {
    if (pages.length > MAX_EXTRA_PAGES) break
    if (seen.has(pageKey(u))) continue
    seen.add(pageKey(u))
    if (!allowed(u)) { skipped.push(`${u.pathname} (robots.txt)`); continue }
    const got = await get(u.toString(), deps, 'text/html')
    if (!got || 'refused' in got || got.status >= 400 || !isHtml(got.type)) { skipped.push(u.pathname); continue }
    add(got.url, got.body)
    markup += got.body
  }
  if (!pages.length || pages.reduce((n, p) => n + p.text.length, 0) < 80) return { ok: false, reason: 'empty', detail: 'the site has almost no readable text (it may need JavaScript to show anything)' }
  return { ok: true, origin: site.toString(), pages, signals: readSignals(markup, site), skipped }
}
