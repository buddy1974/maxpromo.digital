#!/usr/bin/env node
/**
 * packages/tooling/audit-domain-experience.mjs
 *
 * Walk every registered domain over HTTP and score what it actually serves.
 *
 * NOT A MERGE GATE. `check:domains` is the gate: it reads the registry and the
 * repository and can run anywhere. This one needs a server, so it is a review
 * tool — the equivalent of opening all eleven domains in a browser, except it
 * reads the head as well as the page.
 *
 *   npm run dev:web         # in another terminal
 *   node packages/tooling/audit-domain-experience.mjs
 *   node packages/tooling/audit-domain-experience.mjs --app bureau --base http://localhost:3021
 *
 * `--app` selects which application's domains to walk, because the registry
 * spans two deployments and each answers on its own port.
 *
 * WHY IT EXISTS
 *
 * Every RC1 blocker was invisible in the source and obvious in the response.
 * The metadata defect was one missing branch in one function; on the wire it
 * was nine domains introducing themselves as a tenth. Route isolation was an
 * absent rule; on the wire it was fifteen consultancy pages answering 200 on a
 * product domain. This script asks the only question that settles either: what
 * does the domain send back.
 *
 * One caution, learned the hard way while writing this file's predecessor:
 * `fetch` will not send a `Host` header — it is a forbidden header name, and
 * undici drops it without a word, so every request lands on the default host
 * and every domain looks identical. This uses the raw `http` module and writes
 * the header itself.
 */

import { request } from 'node:http'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = process.cwd()
const args = process.argv.slice(2)
const baseArg = args.indexOf('--base')
const BASE = baseArg !== -1 ? args[baseArg + 1] : 'http://localhost:3020'
const appArg = args.indexOf('--app')
const APP = appArg !== -1 ? args[appArg + 1] : 'web'
const { hostname: BASE_HOST, port: BASE_PORT } = new URL(BASE)

const registryPath = join(ROOT, 'packages', 'config', 'domains.ts')
if (!existsSync(registryPath)) {
  console.error('domain experience: no registry at packages/config/domains.ts')
  process.exit(1)
}
const { DOMAIN_REGISTRY } = await import(pathToFileURL(registryPath).href)

/** One request, with a Host header the platform will actually honour. */
function get(host, path) {
  return new Promise((resolve, reject) => {
    const req = request(
      { hostname: BASE_HOST, port: BASE_PORT || 80, path, method: 'GET', headers: { Host: host } },
      (res) => {
        let body = ''
        res.setEncoding('utf8')
        res.on('data', (c) => { body += c })
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }))
      },
    )
    req.on('error', reject)
    req.setTimeout(60000, () => { req.destroy(new Error('timeout')); })
    req.end()
  })
}

const pick = (html, re) => (html.match(re) || [])[1] ?? null
const title      = (h) => pick(h, /<title>([^<]*)<\/title>/)
const canonical  = (h) => pick(h, /rel="canonical" href="([^"]*)"/)
const ogImage    = (h) => pick(h, /property="og:image" content="([^"]*)"/)
const ogSite     = (h) => pick(h, /property="og:site_name" content="([^"]*)"/)
const htmlLang   = (h) => pick(h, /<html lang="([^"]*)"/)
const anchors    = (h) => [...h.matchAll(/<a [^>]*href="([^"]*)"/g)].map((m) => m[1])

const results = []

for (const d of DOMAIN_REGISTRY) {
  // The registry spans two deployments; only one of them is at this base URL.
  if (d.app !== APP) continue

  const checks = []
  const check = (name, ok, detail) => checks.push({ name, ok, detail })

  // The hub redirects a bare `/` to its locale prefix — that is its canonical
  // shape, not a failure — so follow one hop before reading the document.
  let root = await get(d.host, '/')
  if ((root.status === 307 || root.status === 308) && typeof root.headers.location === 'string' && root.headers.location.startsWith('/')) {
    root = await get(d.host, root.headers.location)
  }
  check('root responds 200', root.status === 200, `HTTP ${root.status}`)

  const t = title(root.body) ?? ''
  const c = canonical(root.body) ?? ''
  const site = ogSite(root.body) ?? ''
  const img = ogImage(root.body) ?? ''
  const lang = htmlLang(root.body) ?? ''
  const links = anchors(root.body)

  check('title names this property', t.includes(d.siteName), t || '(none)')
  // Naming the parent company is a per-domain decision the registry records,
  // not a blanket rule: it is right for the hub and for Agent Bureau, and it is
  // RC1-01 on a protected product domain.
  check('title names the parent only if the registry says so',
    d.parentInTitle || !t.includes(d.parentCompany), t || '(none)')
  check('canonical is its own origin', c.startsWith(d.origin), c || '(none)')
  check('og:site_name is its own', site === d.siteName, site || '(none)')
  // The registry declares this domain's social card; the page must emit it.
  // A registry entry naming an image no page references is true and useless.
  const declaredImage = /^https?:\/\//.test(d.openGraph.path)
    ? d.openGraph.path
    : `${d.origin}${d.openGraph.path}`
  check('og:image is the one the registry declares',
    img === declaredImage || (d.mode === 'showcase' && img.startsWith(d.origin) && img.includes('/card/')),
    img || '(none)')
  check('html lang is the primary language', lang === d.primaryLanguage, lang || '(none)')

  if (d.mode === 'showcase') {
    check('root carries navigation and footer',
      links.some((h) => h === '#top') && links.some((h) => h.includes('impressum')),
      `${links.length} link(s)`)

    // The conversion path: every CTA on the domain arrives here.
    const contact = await get(d.host, d.contactPath)
    const cl = anchors(contact.body)
    check('contact responds 200', contact.status === 200, `HTTP ${contact.status}`)
    check('contact links to Impressum', cl.some((h) => h.includes('impressum')), `${cl.length} link(s)`)
    check('contact links to privacy',   cl.some((h) => h.includes('privacy')),   `${cl.length} link(s)`)
    check('contact is not a dead end',  cl.length > 2, `${cl.length} link(s)`)

    // Isolation: a consultancy page is not this domain's page.
    const leak = await get(d.host, '/about')
    check('consultancy pages are not served',
      leak.status === 308 && String(leak.headers.location ?? '').startsWith('https://www.maxpromo.digital'),
      `HTTP ${leak.status} → ${leak.headers.location ?? '—'}`)

    // Staff authentication has one address.
    const os = await get(d.host, '/os/login')
    check('staff login is not served', os.status === 308, `HTTP ${os.status}`)

    // A language the domain does not declare is redirected, never rendered.
    const absent = ['de', 'en'].find((l) => !d.languages.includes(l))
    if (absent) {
      const other = await get(d.host, `/${absent}`)
      check(`/${absent} redirects rather than renders`, other.status === 308, `HTTP ${other.status}`)
    }
  }

  const robots = await get(d.host, '/robots.txt')
  check('robots names this host', robots.body.includes(`Host: ${d.origin}`), (robots.body.match(/Host: \S+/) || ['(none)'])[0])
  check('robots points at its own sitemap',
    d.sitemap === 'none' || robots.body.includes(`Sitemap: ${d.origin}/sitemap.xml`),
    (robots.body.match(/Sitemap: \S+/) || ['(none)'])[0])

  const sitemap = await get(d.host, '/sitemap.xml')
  const locs = [...sitemap.body.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1])
  check('sitemap lists only its own URLs',
    locs.length > 0 && locs.every((u) => u.startsWith(d.origin)),
    `${locs.length} URL(s)`)

  const manifest = await get(d.host, '/manifest.webmanifest')
  let manifestName = null
  try { manifestName = JSON.parse(manifest.body).name } catch { /* reported below */ }
  check('manifest names this property', manifestName === d.product, manifestName ?? '(unparseable)')

  results.push({ domain: d, checks })
}

// ── Report ──────────────────────────────────────────────────────────────────
console.log('='.repeat(74))
console.log(`DOMAIN EXPERIENCE — apps/${APP} at ${BASE}`)
console.log('')

let totalPassed = 0
let totalChecks = 0
for (const { domain, checks } of results) {
  const passed = checks.filter((c) => c.ok).length
  totalPassed += passed
  totalChecks += checks.length
  const failed = checks.filter((c) => !c.ok)
  console.log(`${domain.host.padEnd(26)} ${String(passed).padStart(2)}/${checks.length}  ${failed.length === 0 ? 'clean' : `${failed.length} failing`}`)
  for (const f of failed) console.log(`    ✗ ${f.name.padEnd(42)} ${f.detail}`)
}

console.log('')
console.log(`${totalPassed}/${totalChecks} checks passed across ${results.length} domain(s).`)
if (totalPassed !== totalChecks) process.exitCode = 1
