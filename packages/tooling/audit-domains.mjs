#!/usr/bin/env node
/**
 * packages/tooling/audit-domains.mjs
 *
 * Every domain is a governed property, and the registry that says so is true.
 *
 * WHY THIS EXISTS
 *
 * v13.0 moved domain identity into one record. That closes the four RC1
 * blockers on the day it lands, and it opens a new way to be wrong: a registry
 * entry that says something the repository cannot deliver. A domain declaring
 * a language it has no copy for, an OpenGraph image that is not on disk, a
 * route allowlist naming a page that does not exist, a product slug that
 * matches nothing — each of those is silent, and each undoes exactly the
 * failure the registry was built to prevent.
 *
 * So the registry is checked against the repository, not trusted.
 *
 * WHAT IT CHECKS
 *
 *   1. Registry integrity — one normalised key per host, an origin that agrees
 *      with it, a primary language inside the supported set, and a product slug
 *      that resolves.
 *   2. Language governance — a domain may only declare a language the product
 *      has complete copy in. This is the rule that would have caught RC1-04:
 *      the product registry falls back from German to English field by field
 *      and says nothing, so publishers24.org served English product copy inside
 *      German section headings under lang="de".
 *   3. Social assets — the declared OpenGraph image exists, and its real pixel
 *      dimensions are the ones the registry states. Each language a domain
 *      serves has its own card, because the metadata builder uses the card for
 *      the language being served.
 *   4. Route isolation and contact routing — every path a domain admits is a
 *      page that exists, the contact path it sends every call to action to is
 *      one of them, and the product context that path carries is one the
 *      contact page recognises.
 *
 * It also reports, without failing, the gaps that are content rather than code:
 * domains still sharing the company favicon, and OpenGraph images that are
 * product cards rather than purpose-built social cards.
 *
 * ADR-0004: every rule below was demonstrated failing against a deliberately
 * broken registry before it was trusted. A count of zero findings is only
 * meaningful from a rule that has been seen to produce one.
 *
 *   node packages/tooling/audit-domains.mjs
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = process.cwd()

// ── Load the registry itself, rather than a second reading of it ────────────
const registryPath = join(ROOT, 'packages', 'config', 'domains.ts')
if (!existsSync(registryPath)) {
  console.error('domains: no registry at packages/config/domains.ts')
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}
const { DOMAIN_REGISTRY, normaliseHost, FALLBACK_DOMAIN, contactUrl } = await import(pathToFileURL(registryPath).href)

if (!Array.isArray(DOMAIN_REGISTRY) || DOMAIN_REGISTRY.length === 0) {
  console.error('domains: the registry is empty.')
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

const APP_PUBLIC = { web: join(ROOT, 'apps', 'web', 'public'), bureau: join(ROOT, 'apps', 'bureau', 'public') }
const WEB_ROUTES_DIR = join(ROOT, 'apps', 'web', 'app', '[locale]')
/**
 * Where each application's public pages live.
 *
 * apps/web nests every page under the [locale] segment; apps/bureau serves
 * unprefixed paths straight off app/. This map exists because the contact rule
 * below used to assume apps/web for every domain and therefore skipped the one
 * host whose declaration was false.
 */
const APP_ROUTES_DIR = {
  web: WEB_ROUTES_DIR,
  bureau: join(ROOT, 'apps', 'bureau', 'app'),
}
const PRODUCTS_PATH = join(ROOT, 'apps', 'web', 'lib', 'registry', 'products.ts')

const findings = []
const notes = []
const add = (what, why) => findings.push({ what, why })

// ── Product locale coverage, read from products.ts ──────────────────────────
/**
 * Per product slug: how many localised fields carry `en`, and how many carry
 * `de`.
 *
 * The registry's localised values are `{ en, de }` objects where `de` is
 * optional, and `pickLocale` returns `field.en` when `de` is absent. Counting
 * the two keys inside each product's block is therefore an exact measure of
 * how many fields would fall back — one `en:` with no matching `de:` is one
 * English string served on a German page.
 *
 * A parse rather than a pattern match: product blocks are found by their
 * declaration line and bounded by the next one, and line comments are stripped
 * before counting so the prose in this repository's comments cannot register
 * as data. (v7.0 lost a whole token audit to exactly that.)
 */
function productLocaleCoverage() {
  if (!existsSync(PRODUCTS_PATH)) return null
  const lines = readFileSync(PRODUCTS_PATH, 'utf8').split(/\r?\n/)

  const starts = []
  lines.forEach((l, i) => {
    if (/^const [A-Z0-9_]+\s*(:[^=]*)?=\s*\{/.test(l)) starts.push(i)
  })
  const end = lines.findIndex((l) => /^export const PRODUCTS/.test(l))
  if (starts.length === 0 || end === -1) return null
  starts.push(end)

  const coverage = new Map()
  for (let k = 0; k < starts.length - 1; k++) {
    const block = lines.slice(starts[k], starts[k + 1])
    let slug = null
    let en = 0
    let de = 0
    for (const raw of block) {
      const code = raw.replace(/\/\/.*$/, '')
      if (slug === null) {
        const m = code.match(/^\s*slug:\s*'([^']+)'/)
        if (m) slug = m[1]
      }
      en += (code.match(/(?:^|[{\s])en:/g) || []).length
      de += (code.match(/(?:^|[{\s])de:/g) || []).length
    }
    if (slug) coverage.set(slug, { en, de })
  }
  return coverage
}

const coverage = productLocaleCoverage()
if (!coverage) {
  console.error('domains: could not read product locale coverage from products.ts')
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

// ── PNG dimensions, from the file header ────────────────────────────────────
function pngSize(file) {
  const b = readFileSync(file)
  if (b.length < 24 || b.readUInt32BE(0) !== 0x89504e47) return null
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) }
}

// ── Which paths each application actually serves ────────────────────────────
function routePaths(dir) {
  const paths = new Set()
  if (!existsSync(dir)) return paths
  const walk = (d, prefix) => {
    for (const name of readdirSync(d)) {
      const full = join(d, name)
      if (!statSync(full).isDirectory()) {
        if (/^page\.(tsx|mdx)$/.test(name)) paths.add(prefix === '' ? '/' : prefix)
        continue
      }
      // Route groups (parenthesised) contribute no URL segment; dynamic
      // segments cannot be compared against a literal allowlist.
      if (name.startsWith('(')) { walk(full, prefix); continue }
      if (name.startsWith('[')) continue
      walk(full, `${prefix}/${name}`)
    }
  }
  walk(dir, '')
  return paths
}

/** app name → the set of literal paths it serves. */
const SERVED_BY_APP = Object.fromEntries(
  Object.entries(APP_ROUTES_DIR).map(([app, dir]) => [app, routePaths(dir)]),
)
for (const [app, paths] of Object.entries(SERVED_BY_APP)) {
  if (paths.size === 0) {
    console.error(`domains: found no pages under ${APP_ROUTES_DIR[app]}`)
    console.error('Refusing to report clean without having checked anything.')
    process.exit(1)
  }
}
// Kept for the rules that are genuinely about apps/web's own route surface.
const servedPaths = SERVED_BY_APP.web

/**
 * Which application serves a domain's contact page, and the paths it has.
 * A `hub` strategy means the path belongs to the fallback domain's app, not to
 * this domain's — that distinction is the whole point of the field.
 */
function contactSurface(d) {
  const target = d.contactStrategy === 'hub' ? FALLBACK_DOMAIN : d
  return { target, paths: SERVED_BY_APP[target.app] ?? new Set() }
}

// ── 1. Registry integrity ───────────────────────────────────────────────────
const seen = new Set()
for (const d of DOMAIN_REGISTRY) {
  if (seen.has(d.host)) add(`${d.host} appears twice in the registry`, 'One host, one record. A second entry is a second answer nobody chose between.')
  seen.add(d.host)

  if (normaliseHost(d.host) !== d.host) {
    add(`${d.host} is not a normalised key`, 'Keys are lowercase, without a port and without a www. prefix — resolveDomain normalises before lookup, so an unnormalised key can never be found.')
  }

  let originHost = null
  try {
    originHost = normaliseHost(new URL(d.origin).host)
  } catch {
    add(`${d.host} has an unparseable origin: ${d.origin}`, 'The origin is written into every canonical URL, sitemap entry and robots directive this domain serves.')
  }
  if (originHost !== null && originHost !== d.host) {
    add(`${d.host} declares origin ${d.origin}`, `That origin normalises to ${originHost}. The domain would canonicalise its own pages to a different property — which is the RC1-01 defect, written down instead of inherited.`)
  }

  if (d.languages.length === 0) {
    add(`${d.host} declares no languages`, 'A domain that speaks nothing serves nothing: the middleware redirects every locale away from it.')
  } else if (!d.languages.includes(d.primaryLanguage)) {
    add(`${d.host} leads with ${d.primaryLanguage}, which is not in its supported set`, 'Every path that strips a locale prefix redirects to the primary language, so it must be one the domain serves.')
  }

  if (d.mode === 'showcase') {
    if (!d.productSlug) {
      add(`${d.host} is a showcase domain with no product slug`, 'Nothing would render at its root.')
    } else if (!coverage.has(d.productSlug)) {
      add(`${d.host} names product '${d.productSlug}', which is not in products.ts`, 'The landing engine resolves this slug at request time and would 404 the domain’s only page.')
    }
  }
}

// ── 2. Language governance ──────────────────────────────────────────────────
// A domain may declare a language only when the product has copy in it.
for (const d of DOMAIN_REGISTRY) {
  if (d.mode !== 'showcase' || !d.productSlug) continue
  const c = coverage.get(d.productSlug)
  if (!c) continue

  const gap = c.en - c.de
  if (d.languages.includes('de') && gap > 0) {
    add(
      `${d.host} declares German, and ${d.productSlug} has ${gap} field(s) with no German`,
      'Those fields fall back to English silently, producing German section headings around English product copy under lang="de". Either write the copy or take the language off the domain.',
    )
  }
  // There is deliberately no mirror-image rule for English. `en` is the
  // required half of every localised value in products.ts and `de` is the
  // optional one, so an English gap cannot occur — and a rule that cannot fire
  // is the thing ADR-0004 exists to stop being written.
}

// ── 3. Social assets ────────────────────────────────────────────────────────
let assetsChecked = 0
// Resolve a declared asset path to a file on disk.
//
// The first draft of this rule skipped a domain whose application had no
// public directory — and apps/bureau had none, so agents.maxpromo.digital was
// the one host in the registry the asset rule never examined. It reported
// clean by not looking, which is the failure this repository has now found
// nine times in its own tooling (ADR-0004). A missing public directory is a
// finding.
function assetFile(d, assetPath) {
  if (/^https?:\/\//.test(assetPath)) {
    // An absolute URL is served by whichever registry host it names.
    let url
    try { url = new URL(assetPath) } catch { return { error: `${assetPath} is not a URL` } }
    const owner = DOMAIN_REGISTRY.find((x) => x.host === normaliseHost(url.host))
    if (!owner) return { error: `${assetPath} points at ${url.host}, which is not a registry host` }
    const dir = APP_PUBLIC[owner.app]
    if (!dir || !existsSync(dir)) return { error: `apps/${owner.app} has no public directory to serve ${assetPath}` }
    return { file: join(dir, url.pathname.replace(/^\//, '')) }
  }
  const dir = APP_PUBLIC[d.app]
  if (!dir || !existsSync(dir)) return { error: `apps/${d.app} has no public directory, so ${assetPath} is served by nothing` }
  return { file: join(dir, assetPath.replace(/^\//, '')) }
}

for (const d of DOMAIN_REGISTRY) {
  const resolved = assetFile(d, d.openGraph.path)
  assetsChecked++
  if (resolved.error) {
    add(`${d.host}: og:image cannot be resolved`, resolved.error)
    continue
  }
  const file = resolved.file
  if (!existsSync(file)) {
    add(`${d.host}: og:image ${d.openGraph.path} is not on disk`, 'Every share of this domain would render a broken preview card.')
    continue
  }
  const size = pngSize(file)
  if (!size) {
    add(`${d.host}: og:image ${d.openGraph.path} is not a readable PNG`, 'The registry states pixel dimensions for it; nothing can confirm them.')
  } else if (size.width !== d.openGraph.width || size.height !== d.openGraph.height) {
    add(
      `${d.host}: og:image is ${size.width}×${size.height}, registry says ${d.openGraph.width}×${d.openGraph.height}`,
      'The declared dimensions are written into og:image:width and og:image:height, which crawlers use to lay the card out before fetching the file.',
    )
  }
  if (!d.openGraph.purposeBuilt) {
    notes.push(`${d.host} shares a product card as its social image (${d.openGraph.width}×${d.openGraph.height}, not 1.91:1)`)
  }
  const fav = assetFile(d, d.favicon)
  assetsChecked++
  if (fav.error) {
    add(`${d.host}: favicon cannot be resolved`, fav.error)
  } else if (!existsSync(fav.file)) {
    add(`${d.host}: favicon ${d.favicon} is not on disk`, 'Every tab on this domain shows the browser’s default mark.')
  } else if (d.favicon === '/favicon.ico' && d.mode !== 'hub') {
    notes.push(`${d.host} uses the company favicon`)
  }

  // The metadata builder serves the card for the language being rendered, so
  // every declared language needs one at the same dimensions.
  if (d.mode === 'showcase' && d.languages.length > 1) {
    for (const locale of d.languages) {
      const sibling = d.openGraph.path.replace(/-(de|en)\.png$/, `-${locale}.png`)
      if (sibling === d.openGraph.path) continue
      const sibResolved = assetFile(d, sibling)
      assetsChecked++
      if (sibResolved.error) {
        add(`${d.host}: the ${locale.toUpperCase()} card cannot be resolved`, sibResolved.error)
        continue
      }
      const sibFile = sibResolved.file
      if (!existsSync(sibFile)) {
        add(`${d.host}: no ${locale.toUpperCase()} card at ${sibling}`, `The ${locale} page sets og:image from the product's card for that language.`)
        continue
      }
      const sibSize = pngSize(sibFile)
      if (sibSize && (sibSize.width !== d.openGraph.width || sibSize.height !== d.openGraph.height)) {
        add(
          `${d.host}: the ${locale.toUpperCase()} card is ${sibSize.width}×${sibSize.height}, not ${d.openGraph.width}×${d.openGraph.height}`,
          'Both languages publish the registry’s declared dimensions, so they have to share them.',
        )
      }
    }
  }
}

// ── 4. Route isolation and contact routing ──────────────────────────────────
/**
 * The `?system=` values the contact page will act on.
 *
 * Read from the page rather than restated: the page falls back to generic copy
 * for a value it does not recognise, silently and without an error, so a
 * mismatch here is invisible from either side. RealEstateOS is keyed
 * `realestate-os` in the product registry and `real-estate-os` on the contact
 * page, which is exactly the kind of divergence that produces one.
 */
function knownContactSystems() {
  const p = join(ROOT, 'apps', 'web', 'app', '[locale]', 'contact', 'page.tsx')
  if (!existsSync(p)) return null
  const src = readFileSync(p, 'utf8')
  const start = src.indexOf('const KNOWN_CONTACT_SYSTEMS')
  if (start === -1) return null
  const open = src.indexOf('[', start)
  const close = src.indexOf(']', open)
  if (open === -1 || close === -1) return null
  return new Set([...src.slice(open, close).matchAll(/'([^']+)'/g)].map((m) => m[1]))
}
const contactSystems = knownContactSystems()
if (!contactSystems || contactSystems.size === 0) {
  console.error('domains: could not read KNOWN_CONTACT_SYSTEMS from the contact page')
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

for (const d of DOMAIN_REGISTRY) {
  // Route-allowlist integrity is an apps/web concern: only that application
  // has an isolation matcher comparing literal paths against `routes`.
  if (d.app === 'web' && !d.routes.includes('*')) {
    for (const r of d.routes) {
      if (!servedPaths.has(r)) {
        add(`${d.host} admits ${r}, which apps/web does not serve`, 'A route in the allowlist that has no page is a 404 the isolation rule protects.')
      }
    }
  }

  // ── Contact contract — every registered domain, whichever app serves it ──
  //
  // This used to sit behind `if (d.app !== 'web') continue`, so the one host
  // whose declaration was false was the one host it never examined:
  // agents.maxpromo.digital declared /kontakt, served no such page, and linked
  // its footer to the hub. The rule was correct and looked at nothing.
  const contactPath = d.contactPath.split('?')[0]
  const { target, paths: contactPaths } = contactSurface(d)

  if (!contactPaths.has(contactPath)) {
    add(
      `${d.host}: contact path ${contactPath} is not a page in apps/${target.app}`,
      d.contactStrategy === 'hub'
        ? `Declared contactStrategy 'hub', so it must be a page on ${target.host}.`
        : 'Every CTA on the domain points at it.',
    )
  }

  // A self-served contact page must also survive route isolation on its own
  // domain. A hub-bound one is a different origin and is not isolated here.
  if (d.contactStrategy === 'self') {
    const admitted = d.routes.includes('*') || d.routes.includes(contactPath)
    if (!admitted) {
      add(
        `${d.host} sends every call to action to ${d.contactPath}, which it does not serve`,
        'Route isolation would redirect the domain’s own conversion path to the hub.',
      )
    }
  } else if (d.routes.includes(contactPath) && !d.routes.includes('*')) {
    add(
      `${d.host} declares contactStrategy 'hub' but also admits ${contactPath} locally`,
      'Two destinations for one call to action. Pick the one the footer uses.',
    )
  }

  // The resolver must produce a URL on the property that actually serves it.
  const resolved = contactUrl(d, d.primaryLanguage)
  if (!resolved.startsWith(target.origin)) {
    add(
      `${d.host}: contactUrl() resolves to ${resolved}, which is not on ${target.origin}`,
      'The resolver and the declared strategy disagree.',
    )
  }

  // ?system= is an apps/web contact-form concern; only that page reads it.
  const system = (d.contactPath.split('system=')[1] ?? '').split('&')[0]
  if (system && !contactSystems.has(system)) {
    add(
      `${d.host} sends its enquiries as ?system=${system}, which the contact page does not recognise`,
      'The page falls back to generic copy for an unknown value rather than erroring, so the enquiry arrives with no product context and nothing reports it.',
    )
  }
}

// ── Report ──────────────────────────────────────────────────────────────────
const modes = DOMAIN_REGISTRY.reduce((acc, d) => ({ ...acc, [d.mode]: (acc[d.mode] ?? 0) + 1 }), {})

console.log('='.repeat(74))
console.log('DOMAINS')
console.log(
  `${DOMAIN_REGISTRY.length} host(s) — ` +
  Object.entries(modes).map(([m, n]) => `${n} ${m}`).join(', '),
)
console.log(
  `${assetsChecked} social asset(s) checked, ` +
  Object.entries(SERVED_BY_APP).map(([app, p]) => `${p.size} page path(s) in apps/${app}`).join(', ') + ', ' +
  `${DOMAIN_REGISTRY.length} contact contract(s) resolved, ` +
  `${coverage.size} product(s) measured for locale coverage`,
)

if (notes.length) {
  console.log('\nContent gaps — declared, not defects:')
  for (const n of notes) console.log(`  · ${n}`)
}

if (findings.length === 0) {
  console.log('\nDOMAINS: clean — every host resolves to one record, and the record is true')
} else {
  console.log(`\nDOMAINS: ${findings.length} finding(s)\n`)
  for (const f of findings) {
    console.log(`  ${f.what}`)
    console.log(`      ${f.why}`)
  }
  console.log('')
  console.log('The registry is packages/config/domains.ts. Every domain is declared')
  console.log('there once, and everything else in the platform reads it.')
  process.exitCode = 1
}
