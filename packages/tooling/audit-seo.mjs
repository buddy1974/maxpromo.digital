#!/usr/bin/env node
/**
 * packages/tooling/audit-seo.mjs
 *
 * What a search engine and a link preview actually receive, for every URL the
 * sitemap publishes — read from rendered HTML, not from the source.
 *
 * WHY IT READS THE RENDERED PAGE
 *
 * Metadata in this application is assembled from several places: the root
 * layout, the locale layout, pageMetadata() in lib/seo/og.ts, segment layouts
 * for client pages, and per-page JSON-LD. A source check can confirm each
 * piece exists and still miss what ships — a child that replaces the whole
 * openGraph object, a canonical that inherits the wrong path, a card URL that
 * 307s. The only honest test is the head a crawler downloads.
 *
 * WHAT FAILS — each one a defect a searcher, a sharer or a crawler would meet
 *
 *   Head        a missing title, description, canonical, og:title,
 *               og:description, og:url, og:type, og:image, og:site_name,
 *               twitter:card, twitter:title, twitter:description or
 *               twitter:image; a canonical or og:url that is not this page; an
 *               <html lang> or og:locale in the wrong language; noindex or
 *               nofollow on a published page, in the meta tag or the
 *               X-Robots-Tag header; no <h1>.
 *   Titles      over the 65-character budget (lib/seo/og.ts documentTitle), the
 *               brand twice, a description outside 70–170 characters, or a
 *               title or description used by two pages of one language.
 *   Languages   hreflang de or en missing, unpublished, in the wrong language
 *               folder, not pointing at the page itself, or not returned by
 *               the other language; an x-default that is not the German page.
 *   Images      an og:image or twitter:image that is relative, off the
 *               canonical host, or does not answer 200 with an image.
 *   Schema      JSON-LD that does not parse; not exactly one Organization
 *               (#organization), founder Person (#founder) and WebSite
 *               (#website); an @id reference to the site entities that the
 *               page does not define; LocalBusiness, a street address, geo or
 *               opening hours; an offer, price, rating, review or
 *               SearchAction; a BreadcrumbList whose items are not published
 *               pages or whose last item is not this page; a Service whose URL
 *               is not this page or whose provider is not the Organization; an
 *               Article without a real past datePublished, an author and a
 *               publisher, or whose mainEntityOfPage is not this page.
 *   Leaks       localhost, a Vercel preview host or a local path in the head;
 *               the street address anywhere on a page that is not a legal page.
 *   Variants    a trailing-slash URL that does not 308 to the page; a tracking
 *               query that changes the canonical.
 *   Sitemap     a URL off the canonical host, listed twice, private, not 200;
 *               a lastmod in the future or stamped with the request time;
 *               sitemap alternates that disagree with the page's own hreflang.
 *   robots.txt  a site-wide Disallow, a missing private disallow, or no
 *               canonical Sitemap line.
 *   Routing     an unprefixed URL that renders instead of answering a 308 to
 *               the same path under /de; a destination that changes with the
 *               user agent (Googlebot, Bingbot, a browser, curl), with
 *               Accept-Language or with a locale cookie; a NEXT_LOCALE cookie
 *               set; an HTTP Link header declaring hreflang alternates (the
 *               page head and the sitemap are the only governed sources);
 *               robots.txt, sitemap.xml, an API route, a static asset or the
 *               social-card route answering anything but its own content
 *               (Iteration 2A.1 — Search Console found `/` kept as canonical).
 *
 * Every rule is proved to fire by `npm run prove:seo-audit`, which feeds the
 * same functions broken fixtures. There are no warnings: a rule either
 * protects an invariant and fails, or it does not exist.
 *
 *   node packages/tooling/audit-seo.mjs [baseUrl] [--inventory out.json]
 *
 * Needs a running server (default http://localhost:3020), like audit:a11y.
 */

import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

export const CANON = 'https://www.maxpromo.digital'
export const ORG = `${CANON}/#organization`
export const FOUNDER = `${CANON}/#founder`
export const WEBSITE = `${CANON}/#website`
export const TITLE_BUDGET = 65
export const DESCRIPTION = [70, 170]

/* The legal pages carry the postal address because the law requires it
   (§ 5 DDG for the Impressum, Art. 13 GDPR for the privacy notice, the
   contracting party in the AGB). Nowhere else on the public site may print it. */
export const LEGAL = /\/(impressum|privacy|agb)$/
const STREET = /Körnerstr|Koernerstr|K\\u00f6rnerstr/i
const PRIVATE = /\/(os|api|demo|portfolio|data-deletion)(\/|$)/
const OG_LOCALE = { de: 'de_DE', en: 'en_GB' }
const FORBIDDEN_KEYS = /"(offers|price|priceRange|aggregateRating|review|potentialAction|openingHours|openingHoursSpecification|geo|streetAddress|postalCode)"/
const FORBIDDEN_TYPES = new Set(['LocalBusiness', 'ProfessionalService', 'Store', 'Offer', 'AggregateRating', 'Review', 'SearchAction', 'FAQPage'])

const decode = (s) => s
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')

/** The parts of a rendered page this audit reads. */
export function readPage(html) {
  const tag = (attr, key) => {
    const re = new RegExp(`<meta\\s+${attr}="${key.replace(/[:.]/g, '\\$&')}"\\s+content="([^"]*)"`, 'i')
    const m = html.match(re)
    return m ? decode(m[1]) : null
  }
  const end = html.indexOf('</head>')
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1]
  return {
    lang: html.match(/<html[^>]*\slang="([^"]+)"/)?.[1] ?? null,
    title: title ? decode(title) : null,
    description: tag('name', 'description'),
    canonical: html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? null,
    hreflang: Object.fromEntries(
      [...html.matchAll(/<link rel="alternate" hrefLang="([a-zA-Z-]+)" href="([^"]+)"/g)].map((m) => [m[1], m[2]]),
    ),
    robots: tag('name', 'robots'),
    h1: (html.match(/<h1[\s>]/g) ?? []).length,
    og: {
      title: tag('property', 'og:title'),
      description: tag('property', 'og:description'),
      url: tag('property', 'og:url'),
      type: tag('property', 'og:type'),
      image: tag('property', 'og:image'),
      siteName: tag('property', 'og:site_name'),
      locale: tag('property', 'og:locale'),
    },
    twitter: {
      card: tag('name', 'twitter:card'),
      title: tag('name', 'twitter:title'),
      description: tag('name', 'twitter:description'),
      image: tag('name', 'twitter:image'),
    },
    ld: [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]),
    headHtml: html.slice(0, end > 0 ? end : 20000),
    html,
  }
}

const nodesOf = (data) => (Array.isArray(data) ? data : data['@graph'] ?? [data]).flatMap((n) => n['@graph'] ?? [n])
const typesOf = (n) => [n['@type']].flat()
const isPastDate = (d, now) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d) && !Number.isNaN(Date.parse(d)) && Date.parse(d) <= now

/**
 * Everything that can be said about one page from its own HTML and headers.
 * `published` is the set of sitemap URLs; returns failure strings.
 */
export function checkPage({ url, page: h, headers = {}, published, now = Date.now() }) {
  const out = []
  const fail = (what) => out.push(what)
  const path = url.slice(CANON.length)
  const lang = path.split('/')[1]

  const required = {
    title: h.title, description: h.description, canonical: h.canonical,
    'og:title': h.og.title, 'og:description': h.og.description, 'og:url': h.og.url, 'og:type': h.og.type,
    'og:image': h.og.image, 'og:site_name': h.og.siteName,
    'twitter:card': h.twitter.card, 'twitter:title': h.twitter.title,
    'twitter:description': h.twitter.description, 'twitter:image': h.twitter.image,
  }
  for (const [k, v] of Object.entries(required)) if (!v) fail(`missing ${k}`)
  if (h.canonical && h.canonical !== url) fail(`canonical is ${h.canonical}`)
  if (h.og.url && h.og.url !== url) fail(`og:url is ${h.og.url}`)
  if (h.lang !== lang) fail(`<html lang> is ${h.lang}, page is ${lang}`)
  if (h.og.locale && h.og.locale !== OG_LOCALE[lang]) fail(`og:locale is ${h.og.locale}, expected ${OG_LOCALE[lang]}`)
  if (h.robots && /noindex|nofollow|none/i.test(h.robots)) fail(`published page carries robots "${h.robots}"`)
  const xRobots = headers['x-robots-tag']
  if (xRobots && /noindex|nofollow|none/i.test(xRobots)) fail(`published page sends X-Robots-Tag "${xRobots}"`)
  if (h.h1 === 0) fail('no <h1>')

  if (h.title) {
    if (h.title.length > TITLE_BUDGET) fail(`title is ${h.title.length} characters, budget ${TITLE_BUDGET}`)
    if ((h.title.match(/Maxpromo Digital/g) ?? []).length > 1) fail('title carries the brand twice')
  }
  if (h.description && (h.description.length < DESCRIPTION[0] || h.description.length > DESCRIPTION[1])) {
    fail(`description is ${h.description.length} characters, outside ${DESCRIPTION[0]}–${DESCRIPTION[1]}`)
  }

  for (const l of ['de', 'en']) {
    const target = h.hreflang[l]
    if (!target) fail(`missing hreflang ${l}`)
    else if (!published.has(target)) fail(`hreflang ${l} points at ${target}, not a published URL`)
    else if (!target.startsWith(`${CANON}/${l}/`) && target !== `${CANON}/${l}`) fail(`hreflang ${l} points into another language: ${target}`)
  }
  if (h.hreflang[lang] && h.hreflang[lang] !== url) fail(`hreflang ${lang} does not point at the page itself`)
  if (h.hreflang.de && h.hreflang['x-default'] !== h.hreflang.de) fail(`hreflang x-default is ${h.hreflang['x-default'] ?? 'missing'}, not the German page`)

  for (const [k, v] of [['og:image', h.og.image], ['twitter:image', h.twitter.image]]) {
    if (v && !v.startsWith(`${CANON}/`)) fail(`${k} is not absolute on the canonical host: ${v}`)
  }

  const counts = { Organization: 0, founder: 0, WebSite: 0 }
  const ids = new Set()
  const refs = new Set()
  for (const block of h.ld) {
    let data
    try { data = JSON.parse(block) } catch { fail('JSON-LD does not parse'); continue }
    if (FORBIDDEN_KEYS.test(block)) fail(`JSON-LD carries ${block.match(FORBIDDEN_KEYS)[1]}`)
    JSON.stringify(data, (k, v) => {
      if (v && typeof v === 'object' && !Array.isArray(v) && typeof v['@id'] === 'string') {
        if (Object.keys(v).length === 1) refs.add(v['@id']); else ids.add(v['@id'])
      }
      return v
    })
    for (const n of nodesOf(data)) {
      const types = typesOf(n)
      for (const t of types) if (FORBIDDEN_TYPES.has(t)) fail(`JSON-LD declares ${t}`)
      if (types.includes('Organization')) {
        counts.Organization++
        if (n['@id'] !== ORG) fail(`Organization @id is ${n['@id']}`)
      }
      if (types.includes('Person') && n['@id'] === FOUNDER) counts.founder++
      if (types.includes('WebSite')) {
        counts.WebSite++
        if (n['@id'] !== WEBSITE) fail(`WebSite @id is ${n['@id']}`)
        if (n.publisher?.['@id'] !== ORG) fail('WebSite publisher is not the Organization')
      }
      if (types.includes('BreadcrumbList')) {
        const items = n.itemListElement ?? []
        if (items.at(-1)?.item !== url) fail(`BreadcrumbList ends at ${items.at(-1)?.item}, not this page`)
        items.forEach((it, i) => {
          if (it.position !== i + 1) fail('BreadcrumbList positions are not 1..n')
          if (it.item !== `${CANON}/${lang}` && !published.has(it.item)) fail(`BreadcrumbList item ${it.item} is not a published page`)
        })
      }
      if (types.includes('Service')) {
        if (n.provider?.['@id'] !== ORG) fail('Service provider is not the Organization')
        if (n.url !== url) fail(`Service url is ${n.url}`)
      }
      if (types.some((t) => t === 'Article' || t === 'BlogPosting')) {
        if (!isPastDate(n.datePublished, now)) fail(`${types[0]} datePublished "${n.datePublished}" is not a real past date`)
        if (n.dateModified !== undefined && !isPastDate(n.dateModified, now)) fail(`${types[0]} dateModified "${n.dateModified}" is not a real past date`)
        if (!n.author || !n.publisher) fail(`${types[0]} without author or publisher`)
        const main = typeof n.mainEntityOfPage === 'string' ? n.mainEntityOfPage : n.mainEntityOfPage?.['@id']
        if (main !== url) fail(`${types[0]} mainEntityOfPage is ${main}`)
      }
    }
  }
  if (counts.Organization !== 1) fail(`${counts.Organization} Organization nodes, expected 1`)
  if (counts.founder !== 1) fail(`${counts.founder} founder Person nodes, expected 1`)
  if (counts.WebSite !== 1) fail(`${counts.WebSite} WebSite nodes, expected 1`)
  for (const r of refs) if (r.startsWith(`${CANON}/#`) && !ids.has(r)) fail(`JSON-LD refers to ${r}, which the page does not define`)

  const leak = h.headHtml.match(/localhost|\.vercel\.app|C:\\|\/Users\//)
  if (leak) fail(`head contains ${leak[0]}`)
  if (STREET.test(h.html) && !LEGAL.test(path)) fail('street address printed outside the legal pages')
  return out
}

/** Rules that need every page at once. */
export function checkSet(pages) {
  const out = []
  const byUrl = new Map(pages.map((p) => [p.url, p]))
  for (const p of pages) {
    for (const [l, target] of Object.entries(p.page.hreflang)) {
      if (l === 'x-default') continue
      const other = byUrl.get(target)
      if (other && other.page.hreflang[p.lang] !== p.url) out.push(`${p.url}  hreflang ${l} → ${target}, which does not point back`)
    }
  }
  for (const field of ['title', 'description']) {
    const seen = new Map()
    for (const p of pages) {
      const v = p.page[field]
      if (!v) continue
      const k = `${p.lang}|${v}`
      if (seen.has(k)) out.push(`${p.url}  ${field} duplicates ${seen.get(k)}`)
      else seen.set(k, p.url)
    }
  }
  return out
}

/** The sitemap's own claims. `fetchedAt` is when it was downloaded. */
export function checkSitemap(xml, fetchedAt = Date.now()) {
  const out = []
  const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => {
    const body = m[1]
    return {
      loc: body.match(/<loc>([^<]+)<\/loc>/)?.[1] ?? '',
      lastmod: body.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] ?? null,
      alternates: Object.fromEntries([...body.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map((a) => [a[1], a[2]])),
    }
  })
  const seen = new Set()
  for (const e of entries) {
    if (!e.loc.startsWith(`${CANON}/`)) out.push(`sitemap  ${e.loc} is not on the canonical host`)
    if (seen.has(e.loc)) out.push(`sitemap  ${e.loc} is listed twice`)
    seen.add(e.loc)
    if (PRIVATE.test(e.loc.slice(CANON.length))) out.push(`sitemap  private route ${e.loc}`)
    if (e.lastmod) {
      const t = Date.parse(e.lastmod)
      if (Number.isNaN(t) || t > fetchedAt) out.push(`sitemap  ${e.loc} lastmod ${e.lastmod} is in the future or invalid`)
      else if (fetchedAt - t < 5 * 60_000) out.push(`sitemap  ${e.loc} lastmod is the request time, not a modification date`)
    }
  }
  return { entries, failures: out }
}

export function checkRobots(txt) {
  const out = []
  if (/^Disallow:\s*\/\s*$/m.test(txt)) out.push('robots.txt  disallows the whole site')
  for (const p of ['/os', '/api/', '/demo', '/portfolio', '/data-deletion']) {
    if (!txt.includes(`Disallow: ${p}`)) out.push(`robots.txt  does not disallow ${p}`)
  }
  if (!txt.includes(`Sitemap: ${CANON}/sitemap.xml`)) out.push('robots.txt  does not name the canonical sitemap')
  return out
}

/** The request profiles routing must not depend on. */
export const PROFILES = {
  'curl':          {},
  'googlebot':     { 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
  'googlebot-en':  { 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', 'accept-language': 'en' },
  'bingbot':       { 'user-agent': 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)' },
  'chrome-de':     { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36', 'accept-language': 'de-DE,de;q=0.9' },
  'chrome-en':     { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36', 'accept-language': 'en-GB,en;q=0.9' },
  'cookie-en':     { 'accept-language': 'en', cookie: 'NEXT_LOCALE=en' },
}

/**
 * Routing invariants, from response records:
 *   { kind: 'unprefixed'|'page'|'machine'|'endpoint', path, profile, status, location, setCookie, link, contentType, expect? }
 * `unprefixed` must 308 to `/de<path>` for every profile; `page` must be 200
 * with no hreflang in its Link header; `machine` must answer 200 with the
 * content type it names in `expect`, never a redirect; an `endpoint` (an API
 * route, whose status reports its own health) may answer any status but a
 * redirect, in its own content type. No response may set the locale cookie.
 */
export function checkRouting(records) {
  const out = []
  for (const r of records) {
    const where = `${r.path} [${r.profile}]`
    if (/NEXT_LOCALE=/.test(r.setCookie ?? '')) out.push(`${where}  sets the NEXT_LOCALE cookie`)
    if (r.kind === 'unprefixed') {
      const want = `/de${r.path === '/' ? '' : r.path}`
      const loc = (r.location ?? '').replace(/^https?:\/\/[^/]+/, '')
      if (r.status !== 308) out.push(`${where}  unprefixed URL answers ${r.status}, not a permanent 308`)
      else if (loc.split('?')[0] !== want) out.push(`${where}  unprefixed URL redirects to ${loc}, not ${want}`)
    }
    if (r.kind === 'page') {
      if (r.status !== 200) out.push(`${where}  locale page answers ${r.status}`)
      if (/hreflang/i.test(r.link ?? '')) out.push(`${where}  HTTP Link header declares hreflang alternates`)
    }
    if (r.kind === 'endpoint') {
      if (r.status >= 300 && r.status < 400) out.push(`${where}  API route redirected ${r.status} → ${r.location}`)
      else if (r.expect && !(r.contentType ?? '').includes(r.expect)) out.push(`${where}  content type ${r.contentType}, expected ${r.expect}`)
    }
    if (r.kind === 'machine') {
      if (r.status !== 200) out.push(`${where}  answers ${r.status}${r.location ? ` → ${r.location}` : ''}`)
      else if (r.expect && !(r.contentType ?? '').includes(r.expect)) out.push(`${where}  content type ${r.contentType}, expected ${r.expect}`)
    }
  }
  return out
}

async function main() {
  const args = process.argv.slice(2)
  const BASE = (args.find((a) => /^https?:\/\//.test(a)) ?? 'http://localhost:3020').replace(/\/$/, '')
  const invAt = args.indexOf('--inventory')
  const INVENTORY = invAt >= 0 ? args[invAt + 1] : null
  const local = (u) => u.replace(CANON, BASE)

  const fetchedAt = Date.now()
  const smRes = await fetch(`${BASE}/sitemap.xml`).catch(() => null)
  if (!smRes || smRes.status !== 200) {
    console.error(`audit:seo: ${BASE}/sitemap.xml did not answer — is the server running?`)
    process.exit(1)
  }
  const { entries, failures: smFailures } = checkSitemap(await smRes.text(), fetchedAt)
  const published = new Set(entries.map((e) => e.loc))
  const failures = [...smFailures]
  const pages = []
  const images = new Map()

  for (const e of entries) {
    const url = e.loc
    const res = await fetch(local(url), { redirect: 'manual' })
    if (res.status !== 200) { failures.push(`${url}  sitemap URL answers ${res.status}`); continue }
    const page = readPage(await res.text())
    const lang = url.slice(CANON.length).split('/')[1]
    pages.push({ url, lang, page })
    for (const f of checkPage({ url, page, headers: Object.fromEntries(res.headers), published })) failures.push(`${url}  ${f}`)

    for (const [l, href] of Object.entries(e.alternates)) {
      if (page.hreflang[l] !== href) failures.push(`${url}  sitemap alternate ${l} is ${href}, page says ${page.hreflang[l] ?? 'nothing'}`)
    }
    for (const l of Object.keys(page.hreflang)) if (!e.alternates[l]) failures.push(`${url}  page declares hreflang ${l}, sitemap does not`)

    for (const img of [page.og.image, page.twitter.image]) {
      if (!img?.startsWith(`${CANON}/`)) continue
      if (!images.has(img)) {
        const r = await fetch(local(img))
        images.set(img, { status: r.status, type: r.headers.get('content-type') ?? '' })
      }
      const s = images.get(img)
      if (s.status !== 200 || !s.type.startsWith('image/')) failures.push(`${url}  ${img} answers ${s.status} ${s.type}`)
    }
  }

  /* URL variants on a sample: one page per route family is enough to prove
     the platform behaviour, without doubling the crawl. */
  const families = new Map()
  for (const p of pages) families.set(p.url.slice(CANON.length).split('/').slice(0, 3).join('/'), p.url)
  for (const url of families.values()) {
    const slash = await fetch(`${local(url)}/`, { redirect: 'manual' })
    if (slash.status !== 308 || !(slash.headers.get('location') ?? '').endsWith(url.slice(CANON.length))) {
      failures.push(`${url}  trailing slash answers ${slash.status} ${slash.headers.get('location') ?? ''}, not 308 to the page`)
    }
    const q = readPage(await (await fetch(`${local(url)}?utm_source=audit&ref=x`)).text())
    if (q.canonical !== url) failures.push(`${url}  a tracking query changes the canonical to ${q.canonical}`)
  }

  /* Routing: one destination per unprefixed URL, whoever asks. */
  const records = []
  const probe = async (kind, path, expect) => {
    for (const [profile, headers] of Object.entries(PROFILES)) {
      const res = await fetch(`${BASE}${path}`, { redirect: 'manual', headers })
      records.push({
        kind, path, profile, expect,
        status: res.status,
        location: res.headers.get('location'),
        setCookie: res.headers.get('set-cookie'),
        link: res.headers.get('link'),
        contentType: res.headers.get('content-type'),
      })
      await res.arrayBuffer().catch(() => {})
    }
  }
  for (const url of families.values()) {
    const path = url.slice(CANON.length)
    await probe('page', path)
    await probe('unprefixed', path.replace(/^\/(de|en)/, '') || '/')
  }
  await probe('unprefixed', '/')
  await probe('unprefixed', '/solutions?utm_source=audit')
  await probe('machine', '/robots.txt', 'text/plain')
  await probe('machine', '/sitemap.xml', 'xml')
  await probe('endpoint', '/api/health', 'json')
  await probe('machine', '/favicon.ico', 'image')
  await probe('machine', '/logo.png', 'image/png')
  await probe('machine', '/og?title=Audit&family=company&locale=de', 'image')
  failures.push(...checkRouting(records.map((r) => r.path.includes('?') ? { ...r, path: r.path.split('?')[0] } : r)))

  failures.push(...checkSet(pages))
  failures.push(...checkRobots(await (await fetch(`${BASE}/robots.txt`)).text()))

  if (INVENTORY) {
    writeFileSync(INVENTORY, JSON.stringify(pages.map(({ url, lang, page }) => ({
      url, lang, title: page.title, description: page.description, canonical: page.canonical,
      hreflang: page.hreflang, robots: page.robots, h1: page.h1, og: page.og, twitter: page.twitter, ld: page.ld.length,
    })), null, 2))
  }

  console.log('='.repeat(74))
  console.log(`SEO — ${pages.length} sitemap URLs, ${images.size} distinct share images, ${families.size} URL variants, ${records.length} routing probes, against ${BASE}`)
  if (failures.length === 0) {
    console.log('\nSEO: clean — every published page states what it is, once, in both languages')
  } else {
    console.log(`\nSEO: ${failures.length} finding(s)\n`)
    for (const f of failures) console.log(`  ${f}`)
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main()
