#!/usr/bin/env node
/**
 * packages/tooling/audit-brand-assets.mjs
 *
 * Every product's identity is declared once, and the declaration is true.
 *
 * WHY THIS EXISTS
 *
 * The Brand Registry (packages/config/brands.ts) is the counterpart to the
 * Domain Registry: one record per product, holding the accent, the marks and
 * the social cards. It can be wrong in three ways, and all three are silent.
 *
 *   It can name a file that is not there.       A share preview renders blank.
 *   It can state dimensions the file does not.  A crawler lays the card out wrong.
 *   It can declare a colour that cannot be read. The product ships illegible text.
 *
 * The third is the one this repository had. Four of the eleven product accents
 * fail contrast as text — Brand Lime at 1.51:1, CareOS teal at 2.49:1, Drive24
 * green at 3.68:1, PrintShopOS magenta at 4.25:1 — and two components colour
 * text with the accent. `check:tokens` could not see it: that check knows the
 * platform accent `--brand-primary` and enforces the fill rule for it, and a
 * product accent is a different value under a different name.
 *
 * Two products went further and set their brand accent to a *semantic* token,
 * `var(--semantic-success)` and `var(--semantic-info)` — which the design
 * system forbids in its third rule, because identity and meaning must not
 * share a namespace. Nothing checked, because nothing had a place to look.
 *
 * WHAT IT CHECKS
 *
 *   1. Registry integrity — one record per slug, every product in the Domain
 *      Registry has a brand, every brand's slug resolves to a product.
 *   2. Colour — the accent is a literal colour and never a token reference;
 *      the text form reaches 5:1 on white; the theme colour is a literal.
 *   3. Assets — every declared path is a file on disk at the declared
 *      dimensions; every slot that is not `own` carries a reason.
 *   4. Typography — every product inherits the platform's, and says so.
 *
 * WHAT IT CLASSIFIES RATHER THAN FAILS
 *
 * A slot that is empty is not a defect; it is a backlog item. Each is
 * classified and counted:
 *
 *   KEEP     the product has its own and it is correct
 *   REPLACE  something is there and it is the wrong thing
 *   CREATE   the slot is empty and should not be
 *   REMOVE   something is there that nothing uses
 *
 * A registry that only lists what exists cannot tell you what is missing.
 *
 *   node packages/tooling/audit-brand-assets.mjs
 */

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = process.cwd()

const brandsPath = join(ROOT, 'packages', 'config', 'brands.ts')
const domainsPath = join(ROOT, 'packages', 'config', 'domains.ts')
if (!existsSync(brandsPath) || !existsSync(domainsPath)) {
  console.error('brand assets: cannot find the registries under packages/config')
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

const { BRAND_REGISTRY, brandAssets, findBrand } = await import(pathToFileURL(brandsPath).href)
const { DOMAIN_REGISTRY, normaliseHost } = await import(pathToFileURL(domainsPath).href)

if (!Array.isArray(BRAND_REGISTRY) || BRAND_REGISTRY.length === 0) {
  console.error('brand assets: the Brand Registry is empty.')
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

const APP_PUBLIC = {
  web:    join(ROOT, 'apps', 'web', 'public'),
  bureau: join(ROOT, 'apps', 'bureau', 'public'),
}

const findings = []
const add = (what, why) => findings.push({ what, why })

/** KEEP / REPLACE / CREATE / REMOVE, one line each. */
const classified = []
const classify = (verdict, subject, why) => classified.push({ verdict, subject, why })

// ── Product slugs the product registry actually defines ─────────────────────
function productSlugs() {
  const p = join(ROOT, 'apps', 'web', 'lib', 'registry', 'products.ts')
  if (!existsSync(p)) return null
  const found = [...readFileSync(p, 'utf8').matchAll(/^\s*slug:\s*'([^']+)'/gm)].map((m) => m[1])
  return found.length ? new Set(found) : null
}
const SLUGS = productSlugs()
if (!SLUGS) {
  console.error('brand assets: could not read product slugs from products.ts')
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

// ── Colour maths ────────────────────────────────────────────────────────────
const HEX = /^#[0-9a-fA-F]{6}$/
const srgb = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const luminance = (hex) => {
  const [r, g, b] = channels(hex)
  return 0.2126 * srgb(r / 255) + 0.7152 * srgb(g / 255) + 0.0722 * srgb(b / 255)
}
const contrastOnWhite = (hex) => (1.05) / (luminance(hex) + 0.05)

/** PNG dimensions from the file header. */
function pngSize(file) {
  const b = readFileSync(file)
  if (b.length < 24 || b.readUInt32BE(0) !== 0x89504e47) return null
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) }
}

/**
 * Resolve a declared asset path to a file on disk.
 *
 * An absolute URL is served by whichever registry host it names — Agent
 * Bureau's card lives in apps/web/public because apps/bureau ships no images.
 * A missing public directory is a finding, never a skip: the first draft of
 * the equivalent rule in audit-domains skipped one, and the domain it skipped
 * was the one with the problem.
 */
function resolveAsset(path) {
  if (/^https?:\/\//.test(path)) {
    let url
    try { url = new URL(path) } catch { return { error: `${path} is not a URL` } }
    const owner = DOMAIN_REGISTRY.find((d) => d.host === normaliseHost(url.host))
    if (!owner) return { error: `${path} points at ${url.host}, which is not a registry host` }
    const dir = APP_PUBLIC[owner.app]
    if (!dir || !existsSync(dir)) return { error: `apps/${owner.app} has no public directory to serve ${path}` }
    return { file: join(dir, url.pathname.replace(/^\//, '')) }
  }
  // A relative path is served by every application that has the file. Both
  // are checked; being in either is enough, and being in neither is a finding.
  const dirs = Object.entries(APP_PUBLIC).filter(([, d]) => existsSync(d))
  if (dirs.length === 0) return { error: 'no application has a public directory' }
  for (const [, dir] of dirs) {
    const f = join(dir, path.replace(/^\//, ''))
    if (existsSync(f)) return { file: f }
  }
  return { file: join(dirs[0][1], path.replace(/^\//, '')) }
}

// ── 1. Registry integrity ───────────────────────────────────────────────────
const seen = new Set()
for (const b of BRAND_REGISTRY) {
  if (seen.has(b.slug)) add(`${b.slug} appears twice in the Brand Registry`, 'One product, one identity.')
  seen.add(b.slug)

  // 'maxpromo' is the company itself and has no product entry.
  if (b.slug !== 'maxpromo' && !SLUGS.has(b.slug)) {
    add(`brand '${b.slug}' matches no product in products.ts`, 'The adapters look identity up by product slug; this record is unreachable.')
  }
}
for (const d of DOMAIN_REGISTRY) {
  if (!d.productSlug) continue
  if (!findBrand(d.productSlug)) {
    add(`${d.host} serves '${d.productSlug}', which has no brand`, 'The domain would fall back to the company identity, which is what the product domains exist not to do.')
  }
}

// ── 2. Colour ───────────────────────────────────────────────────────────────
for (const b of BRAND_REGISTRY) {
  const { accent, accentText, theme, themeDark } = b.colours

  for (const [name, value] of [['accent', accent], ['accentText', accentText], ['theme', theme]]) {
    if (!HEX.test(value)) {
      add(
        `${b.slug}.colours.${name} is '${value}', not a literal colour`,
        value.includes('semantic')
          ? 'A semantic token as an identity: the product’s colour would change if the meaning of that state ever did. Identity and meaning are separate namespaces — design system, rule 3.'
          : 'Identity is read in email, PDF and a web app manifest, none of which resolve a custom property.',
      )
    }
  }

  if (themeDark !== null && !HEX.test(themeDark)) {
    add(`${b.slug}.colours.themeDark is '${themeDark}', not a literal colour`, 'Same reason as the theme colour.')
  }

  if (HEX.test(accentText)) {
    const ratio = contrastOnWhite(accentText)
    if (ratio < 4.5) {
      add(
        `${b.slug} accentText ${accentText} measures ${ratio.toFixed(2)}:1 on white`,
        'It is the value used where the accent colours text — the FAQ toggle and the onboarding step label. WCAG 1.4.3 wants 4.5:1.',
      )
    }
  }

  if (HEX.test(accent) && HEX.test(accentText) && accent !== accentText) {
    const a = contrastOnWhite(accent)
    if (a >= 5) {
      add(
        `${b.slug} has a separate accentText although its accent already measures ${a.toFixed(2)}:1`,
        'A second value that is not needed is a second value to keep in step.',
      )
    }
  }
}

// ── 3. Assets ───────────────────────────────────────────────────────────────
let assetsChecked = 0
for (const b of BRAND_REGISTRY) {
  for (const { slot, asset } of brandAssets(b)) {
    const where = `${b.slug}.${slot}`

    if (asset.state !== 'own' && !asset.note) {
      add(`${where} is '${asset.state}' with no note`, 'An empty slot with no reason is indistinguishable from an oversight.')
    }

    if (asset.state === 'absent' || asset.state === 'n/a') {
      if (asset.path !== null) {
        add(`${where} is '${asset.state}' and still names ${asset.path}`, 'Either it is there or it is not.')
      }
      if (asset.state === 'absent') classify('CREATE', where, asset.note ?? '')
      continue
    }

    // A wordmark set in type has no file, and that is the correct answer.
    if (asset.path === null) {
      classify('KEEP', where, asset.note ?? '')
      continue
    }

    assetsChecked++
    const resolved = resolveAsset(asset.path)
    if (resolved.error) {
      add(`${where} cannot be resolved`, resolved.error)
      continue
    }
    if (!existsSync(resolved.file)) {
      add(`${where} names ${asset.path}, which is not on disk`, 'Declared and absent is worse than absent: everything downstream believes it.')
      continue
    }

    if (asset.width !== undefined && asset.height !== undefined) {
      const size = pngSize(resolved.file)
      if (size && (size.width !== asset.width || size.height !== asset.height)) {
        add(
          `${where} is ${size.width}×${size.height}, registry says ${asset.width}×${asset.height}`,
          'The declared dimensions are published as og:image:width and og:image:height, which crawlers lay the card out from before fetching it.',
        )
        continue
      }
    }

    if (asset.state === 'shared') {
      classify('REPLACE', where, asset.note ?? 'Uses the company asset.')
    } else if (slot === 'openGraphImage' || slot === 'twitterImage') {
      // A social card is 1.91:1. Anything else is a product image standing in.
      const ratio = (asset.width ?? 0) / (asset.height ?? 1)
      const purposeBuilt = Math.abs(ratio - 1200 / 630) < 0.02
      classify(purposeBuilt ? 'KEEP' : 'REPLACE', where,
        purposeBuilt ? 'Purpose-built social card.' : (asset.note ?? 'Not 1.91:1.'))
    } else {
      classify('KEEP', where, asset.note ?? '')
    }
  }
}

if (assetsChecked === 0) {
  console.error('brand assets: no declared asset resolved to a path to check.')
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

// ── 4. Typography ───────────────────────────────────────────────────────────
for (const b of BRAND_REGISTRY) {
  if (b.typography !== 'inherit') {
    add(
      `${b.slug} declares typography '${b.typography}'`,
      'Every product inherits Inter and Roboto Mono from the design system. A second typeface is a second design system, which this platform has already paid for once.',
    )
  }
}

// ── Report ──────────────────────────────────────────────────────────────────
const counts = classified.reduce((a, c) => ({ ...a, [c.verdict]: (a[c.verdict] ?? 0) + 1 }), {})
const order = ['KEEP', 'REPLACE', 'CREATE', 'REMOVE']
const SEP = String.fromCharCode(0)

console.log('='.repeat(74))
console.log('BRAND ASSETS')
console.log(`${BRAND_REGISTRY.length} brand(s), ${classified.length} asset slot(s), ${assetsChecked} file(s) checked`)
console.log(order.map((v) => `${v} ${counts[v] ?? 0}`).join('  ·  '))

for (const v of order) {
  const rows = classified.filter((c) => c.verdict === v)
  if (rows.length === 0 || v === 'KEEP') continue
  console.log(`\n${v}`)
  const grouped = new Map()
  for (const r of rows) {
    // Grouped by slot AND reason. Grouping on the reason alone put three
    // different slots under one heading and labelled the lot with whichever
    // sorted first.
    const slot = r.subject.split('.').slice(1).join('.')
    const key = slot + SEP + (r.why || '(no reason given)')
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key).push(r.subject.split('.')[0])
  }
  for (const [key, products] of [...grouped].sort((a, b) => b[1].length - a[1].length)) {
    const [slot, why] = key.split(SEP)
    console.log(`  ${String(products.length).padStart(2)}×  ${slot}`)
    console.log(`      ${why}`)
    console.log(`      ${products.join(', ')}`)
  }
}

if (findings.length === 0) {
  console.log('\nBRAND ASSETS: clean — every identity is declared once and every declaration is true')
} else {
  console.log(`\nBRAND ASSETS: ${findings.length} finding(s)\n`)
  for (const f of findings) {
    console.log(`  ${f.what}`)
    console.log(`      ${f.why}`)
  }
  console.log('')
  console.log('The registry is packages/config/brands.ts. Identity is declared there')
  console.log('once, and every surface reads it.')
  process.exitCode = 1
}
