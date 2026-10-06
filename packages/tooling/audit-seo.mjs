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
 * WHAT FAILS (each one a defect a searcher or a sharer would see)
 *
 *   - a missing title, description, canonical, og:title, og:description,
 *     og:url, og:image or twitter:card
 *   - a canonical or og:url that is not this page on https://www.maxpromo.digital
 *   - a title or description used by two pages, or a title that carries the
 *     brand twice (a metaTitle that already ends in it, then the template)
 *   - an hreflang pair that is missing, points at a URL the sitemap does not
 *     publish, or is not returned by the other language
 *   - an og:image that does not answer 200 with an image
 *   - JSON-LD that does not parse, an Organization without its stable @id,
 *     a second Organization node on a page (articles and services point at
 *     #organization, they do not restate it), a BreadcrumbList whose last item
 *     is not this page, a Service without the Organization as provider, or
 *     an offer or price anywhere
 *   - localhost, a Vercel preview host or an internal path in the head
 *   - the street address outside the legal pages that must carry it
 *   - a private route (/os, /api, /demo, /portfolio, /data-deletion) in the
 *     sitemap, or a sitemap URL that is not 200 or carries noindex
 *
 * WHAT ONLY WARNS
 *
 *   The legal pages (Impressum, privacy notice, AGB) are frozen: their copy and
 *   metadata change only on the owner's explicit authorisation. Their missing
 *   canonical, missing hreflang and homepage og:url are known and recorded in
 *   docs/governance/seo-inventory.md, so they are reported here as warnings,
 *   every run, rather than failing a gate this package may not fix.
 *
 *   Lengths: a title over 65 characters or a description outside 70–170 is
 *   worth a look, not a failure — the right length is a judgement.
 *
 *   node packages/tooling/audit-seo.mjs [baseUrl] [--inventory out.json]
 *
 * Needs a running server (default http://localhost:3020), like audit:a11y.
 */

import { writeFileSync } from 'node:fs'

const args = process.argv.slice(2)
const BASE = (args.find((a) => /^https?:\/\//.test(a)) ?? 'http://localhost:3020').replace(/\/$/, '')
const invAt = args.indexOf('--inventory')
const INVENTORY = invAt >= 0 ? args[invAt + 1] : null
const CANON = 'https://www.maxpromo.digital'

/* The legal pages carry the postal address because the law requires it
   (§ 5 DDG for the Impressum, Art. 13 GDPR for the privacy notice, the
   contracting party in the AGB). Nowhere else on the public site may print it. */
const LEGAL = /\/(impressum|privacy|agb)$/
const STREET = /Körnerstr|Koernerstr/i
const PRIVATE = /\/(os|api|demo|portfolio|data-deletion)(\/|$)/

const failures = []
const warnings = []
const fail = (url, what) => failures.push(`${url}  ${what}`)
/* A metadata defect on a frozen legal page: recorded, not failed. */
const meta = (url, what) => LEGAL.test(url) ? warnings.push(`${url}  ${what}  [legal page, frozen — recorded]`) : fail(url, what)
const warn = (url, what) => warnings.push(`${url}  ${what}`)

const decode = (s) => s
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')

function head(html) {
  const meta = (attr, key) => {
    const re = new RegExp(`<meta\\s+${attr}="${key.replace(/[:.]/g, '\\$&')}"\\s+content="([^"]*)"`, 'i')
    const m = html.match(re)
    return m ? decode(m[1]) : null
  }
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1]
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? null
  const hreflang = Object.fromEntries(
    [...html.matchAll(/<link rel="alternate" hrefLang="([a-zA-Z-]+)" href="([^"]+)"/g)].map((m) => [m[1], m[2]]),
  )
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]?.replace(/<[^>]+>/g, '').trim() ?? null
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1])
  const headHtml = html.slice(0, html.indexOf('</head>') > 0 ? html.indexOf('</head>') : 20000)
  return {
    title: title ? decode(title) : null,
    description: meta('name', 'description'),
    canonical,
    hreflang,
    robots: meta('name', 'robots'),
    h1,
    ogTitle: meta('property', 'og:title'),
    ogDescription: meta('property', 'og:description'),
    ogUrl: meta('property', 'og:url'),
    ogType: meta('property', 'og:type'),
    ogImage: meta('property', 'og:image'),
    twitterCard: meta('name', 'twitter:card'),
    twitterImage: meta('name', 'twitter:image'),
    ld,
    headHtml,
  }
}

const sitemapXml = await (await fetch(`${BASE}/sitemap.xml`)).text()
const urls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
if (urls.length === 0) {
  console.error(`audit:seo: no URLs in ${BASE}/sitemap.xml — is the server running?`)
  process.exit(1)
}
const published = new Set(urls)
const local = (u) => u.replace(CANON, BASE)

const inventory = []
const imageStatus = new Map()

for (const url of urls) {
  if (!url.startsWith(`${CANON}/`)) fail(url, 'sitemap URL is not on the canonical host')
  const path = url.slice(CANON.length)
  if (PRIVATE.test(path)) fail(url, 'private route published in the sitemap')

  const res = await fetch(local(url), { redirect: 'manual' })
  const html = res.status === 200 ? await res.text() : ''
  if (res.status !== 200) { fail(url, `sitemap URL answers ${res.status}`); continue }
  const h = head(html)
  const lang = path.split('/')[1]
  inventory.push({ url, lang, status: res.status, ...h, ld: h.ld.length, headHtml: undefined })

  if (h.robots && /noindex/i.test(h.robots)) fail(url, `sitemap URL is noindex (${h.robots})`)
  for (const [k, v] of Object.entries({ title: h.title, description: h.description, canonical: h.canonical, 'og:title': h.ogTitle, 'og:description': h.ogDescription, 'og:url': h.ogUrl, 'og:image': h.ogImage, 'twitter:card': h.twitterCard })) {
    if (!v) meta(url, `missing ${k}`)
  }
  if (h.canonical && h.canonical !== url) meta(url, `canonical is ${h.canonical}`)
  if (h.ogUrl && h.ogUrl !== url) meta(url, `og:url is ${h.ogUrl}`)

  /* hreflang: both languages, each a published URL. Reciprocity is checked
     after the crawl, once every page's own pair is known. */
  for (const l of ['de', 'en']) {
    if (!h.hreflang[l]) meta(url, `missing hreflang ${l}`)
    else if (!published.has(h.hreflang[l])) fail(url, `hreflang ${l} points at ${h.hreflang[l]}, not a published URL`)
  }
  if (h.hreflang[lang] && h.hreflang[lang] !== url) fail(url, `hreflang ${lang} does not point at itself`)
  if (h.hreflang.de && h.hreflang['x-default'] !== h.hreflang.de) meta(url, `hreflang x-default is ${h.hreflang['x-default'] ?? 'missing'}, not the German page`)

  if (h.ogImage) {
    if (!h.ogImage.startsWith(`${CANON}/`)) fail(url, `og:image is not absolute on the canonical host: ${h.ogImage}`)
    const key = local(h.ogImage)
    if (!imageStatus.has(key)) {
      const r = await fetch(key)
      imageStatus.set(key, { status: r.status, type: r.headers.get('content-type') ?? '' })
    }
    const s = imageStatus.get(key)
    if (s.status !== 200 || !s.type.startsWith('image/')) fail(url, `og:image answers ${s.status} ${s.type}`)
  }

  let organizations = 0
  for (const block of h.ld) {
    let data
    try { data = JSON.parse(block) } catch { fail(url, 'JSON-LD does not parse'); continue }
    const nodes = (Array.isArray(data) ? data : data['@graph'] ?? [data]).flatMap((n) => n['@graph'] ?? [n])
    for (const n of nodes) {
      if (n['@type'] === 'Organization') {
        if (n['@id'] !== `${CANON}/#organization`) fail(url, 'Organization without the stable @id')
        organizations++
      }
      if (n['@type'] === 'BreadcrumbList') {
        const last = n.itemListElement?.at(-1)?.item
        if (last !== url) fail(url, `BreadcrumbList ends at ${last}, not this page`)
      }
      if (n['@type'] === 'Service' && n.provider?.['@id'] !== `${CANON}/#organization`) fail(url, 'Service without the Organization as provider')
      if (/"(offers|price|priceRange|aggregateRating|review)"/.test(JSON.stringify(n))) fail(url, `${n['@type']} carries an offer, price or rating`)
    }
  }
  if (organizations > 1) fail(url, `${organizations} Organization nodes on one page`)
  if (h.title && (h.title.match(/Maxpromo Digital/g) ?? []).length > 1) fail(url, 'title carries the brand twice')

  const leak = h.headHtml.match(/localhost|\.vercel\.app|C:\\|\/Users\//)
  if (leak) fail(url, `head contains ${leak[0]}`)
  if (STREET.test(html) && !LEGAL.test(path)) fail(url, 'street address printed outside the legal pages')

  if (h.title && h.title.length > 65) warn(url, `title ${h.title.length} chars`)
  if (h.description && (h.description.length < 70 || h.description.length > 170)) warn(url, `description ${h.description.length} chars`)
}

/* Reciprocity: if /de/x says its English version is /en/x, /en/x must say its
   German version is /de/x. */
const byUrl = new Map(inventory.map((p) => [p.url, p]))
for (const p of inventory) {
  for (const [l, target] of Object.entries(p.hreflang)) {
    if (l === 'x-default') continue
    const other = byUrl.get(target)
    if (other && other.hreflang[p.lang] !== p.url) fail(p.url, `hreflang ${l} → ${target}, which does not point back`)
  }
}

/* Duplicates within a language. Two pages answering the same query with the
   same words compete with each other. */
for (const field of ['title', 'description']) {
  const seen = new Map()
  for (const p of inventory) {
    const k = `${p.lang}|${p[field]}`
    if (!p[field]) continue
    if (seen.has(k)) fail(p.url, `${field} duplicates ${seen.get(k)}`)
    else seen.set(k, p.url)
  }
}

/* robots.txt keeps the private surfaces out. */
const robots = await (await fetch(`${BASE}/robots.txt`)).text()
for (const p of ['/os', '/api/', '/demo']) {
  if (!robots.includes(`Disallow: ${p}`)) fail('robots.txt', `does not disallow ${p}`)
}
if (!robots.includes(`Sitemap: ${CANON}/sitemap.xml`)) fail('robots.txt', 'does not name the canonical sitemap')

if (INVENTORY) writeFileSync(INVENTORY, JSON.stringify(inventory, null, 2))

console.log('='.repeat(74))
console.log(`SEO — ${urls.length} sitemap URLs, ${imageStatus.size} distinct share images, against ${BASE}`)
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`)
  for (const w of warnings) console.log(`  · ${w}`)
}
if (failures.length === 0) {
  console.log('\nSEO: clean — every published page states what it is, once, in both languages')
} else {
  console.log(`\nSEO: ${failures.length} finding(s)\n`)
  for (const f of failures) console.log(`  ${f}`)
  process.exitCode = 1
}
