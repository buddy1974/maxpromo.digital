#!/usr/bin/env node
/**
 * packages/tooling/check-claims.mjs
 *
 * An unevidenced claim may not appear on a page whose job is to persuade.
 *
 * WHY THIS BLOCKS WHEN audit-claims DOES NOT
 *
 * `audit-claims.mjs` discovers problems nobody has noticed: the same magnitude
 * in two currencies, a hedge inside a result. It reports and never blocks,
 * because resolving what it finds needs knowledge of delivered work that a tool
 * does not have. Choosing a currency states something about a client. ADR-0007.
 *
 * This checks the other half, and it is mechanical. The claims registry in
 * `packages/config/claims.ts` records decisions already made about what each
 * figure is worth as evidence. Enforcing "this one is not allowed on a
 * commercial page" needs no judgement, and the fix is always the same: take it
 * off the page. So it fails the build.
 *
 * The distinction matters because the failure this prevents is not someone
 * inventing a number. It is someone reaching for an existing message key while
 * building a new page, six months from now, with no idea that the figure behind
 * it was never evidenced. That is exactly how 78% reached the homepage.
 *
 * WHAT COUNTS AS A COMMERCIAL SURFACE
 *
 * Derived from the route, not listed: anything under `app/[locale]` that is not
 * the case studies, the blog or a legal page. A new commercial page is covered
 * the day it is created, which is the property the token gate had to be rebuilt
 * to get (ADR-0015).
 *
 *   node packages/tooling/check-claims.mjs
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { stripComments } from './strip-comments.mjs'

const ROOT = process.cwd()

const registryPath = join(ROOT, 'packages', 'config', 'claims.ts')
if (!existsSync(registryPath)) {
  console.error('claims: no registry at packages/config/claims.ts')
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}
const { CLAIMS, CLAIM_RULE } = await import(pathToFileURL(registryPath).href)

if (!Array.isArray(CLAIMS) || CLAIMS.length === 0) {
  console.error('claims: the registry is empty.')
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

/**
 * Pages that record rather than persuade. A claim keeps its place here: the
 * governance rule is that history stays legible, and deleting the case studies
 * to make a figure disappear would be worse than the figure.
 */
const ARCHIVE = /(case-studies|blog|impressum|privacy|agb|data-deletion)/

const SKIP = new Set(['node_modules', '.next', '.git', 'dist', 'build', '.turbo'])
function walk(dir, out = []) {
  let entries
  try { entries = readdirSync(dir) } catch { return out }
  for (const e of entries) {
    if (SKIP.has(e)) continue
    const p = join(dir, e)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(tsx?|json)$/.test(e)) out.push(p)
  }
  return out
}

/**
 * Where a commercial page's text can come from.
 *
 * `app/[locale]` alone is not enough, and the first draft of this check proved
 * it by reporting clean while the Work page was rendering five of these
 * claims. Work reaches them through `lib/work-entries.ts`, a registry the page
 * imports, so the keys never appear in the route file at all. A component or a
 * lib module that feeds a commercial page is part of that page.
 */
const SOURCE_DIRS = [
  join(ROOT, 'apps', 'web', 'app'),
  join(ROOT, 'apps', 'web', 'lib'),
  join(ROOT, 'apps', 'web', 'components'),
]
const present = SOURCE_DIRS.filter(existsSync)
if (present.length !== SOURCE_DIRS.length) {
  console.error('claims: expected app, lib and components under apps/web.')
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

// `flatMap(walk)` would pass the index as walk's `out` accumulator.
const commercialFiles = present.flatMap((d) => walk(d)).filter((f) => {
  const rel = relative(ROOT, f).split(sep).join('/')
  if (rel.endsWith('.json')) return false
  // An archive route, and the components built only for it, may carry these.
  return !ARCHIVE.test(rel)
})

if (commercialFiles.length === 0) {
  console.error('claims: no commercial route sources found.')
  console.error('Either the route layout moved or the filter is wrong. Refusing to report clean.')
  process.exit(1)
}

/**
 * A claim reaches a page through its message key. Matching the key rather than
 * the rendered text is what makes this survive translation: the German string
 * differs, the key does not.
 */
const forbidden = CLAIMS.filter((c) => !CLAIM_RULE[c.status].includes('commercial'))

const findings = []
const unclassified = []
let filesChecked = 0

for (const f of commercialFiles) {
  const rel = relative(ROOT, f).split(sep).join('/')
  const src = stripComments(readFileSync(f, 'utf8'))
  filesChecked++
  for (const claim of forbidden) {
    for (const key of claim.keys) {
      // `caseStudies.cs1Result1` reaches a page as t('cs1Result1') under a
      // namespace, or as a bare key in a registry array. Both are the leaf.
      const leaf = key.split('.').pop()
      // The leaf alone, with no namespace co-location test. The second draft
      // required the namespace string in the same file and reported clean over
      // five live claims: `lib/work-entries.ts` lists the keys as bare strings
      // and names `caseStudies` only in a comment, which this check strips
      // before reading. Keys like `cs1Result1` are distinctive enough that a
      // coincidental match is not a real risk, and a false positive costs one
      // path in ARCHIVE while a false negative costs a claim on a live page.
      if (!new RegExp(`['"\`]${leaf}['"\`]`).test(src)) continue
      findings.push({ where: rel, key, claim })
    }
  }
}

/**
 * PART TWO — a quantity from the case studies that nobody has classified.
 *
 * Part one enforces the registry. This catches the case the registry cannot:
 * someone builds a page next year, reaches for a `caseStudies` key that has a
 * number in it, and nobody ever recorded that number as a claim. The registry
 * only protects what is in it, which is the enumeration failure ADR-0015 is
 * about, one level up.
 *
 * Scope is deliberately narrow. Only the `caseStudies` namespace, because that
 * is where statements about delivered client work live, and a general
 * numbers-in-copy detector would flag "five kinds of work" and "fifteen years"
 * and be switched off within a week.
 *
 * A counting word doing grammatical work is not a claim: "into one pipeline"
 * asserts nothing about an outcome. Digits, and the written numbers above two,
 * are what get flagged.
 */
const QUANTITY = /\d|\b(three|four|five|six|seven|eight|nine|ten|dozen|hundred|thousand)\b/i

const catalogue = JSON.parse(
  readFileSync(join(ROOT, 'apps', 'web', 'messages', 'en.json'), 'utf8'),
)
const registered = new Set(CLAIMS.flatMap((c) => c.keys.map((k) => k.split('.').pop())))

for (const f of commercialFiles) {
  const rel = relative(ROOT, f).split(sep).join('/')
  const src = stripComments(readFileSync(f, 'utf8'))
  for (const [leaf, text] of Object.entries(catalogue.caseStudies ?? {})) {
    if (typeof text !== 'string') continue
    if (registered.has(leaf)) continue
    if (!QUANTITY.test(text)) continue
    if (!new RegExp(`['"\`]${leaf}['"\`]`).test(src)) continue
    unclassified.push({ where: rel, leaf, text })
  }
}

console.log('='.repeat(74))
console.log('CLAIMS REGISTRY')
console.log(`${CLAIMS.length} claim(s) recorded · ${forbidden.length} not permitted on a commercial page`)
console.log(`${filesChecked} commercial route source(s) checked`)

const byStatus = {}
for (const c of CLAIMS) byStatus[c.status] = (byStatus[c.status] ?? 0) + 1
for (const [s, n] of Object.entries(byStatus)) console.log(`  ${s.padEnd(28)} ${n}`)

const total = findings.length + unclassified.length

if (total === 0) {
  console.log('\nCLAIMS: clean — no unevidenced claim is rendered on a page that persuades')
} else {
  console.log(`\nCLAIMS: ${total} finding(s)\n`)
  for (const u of unclassified) {
    console.log(`  caseStudies.${u.leaf} is used by ${u.where} and carries a quantity`)
    console.log(`      "${u.text.slice(0, 88)}"`)
    console.log('      Nothing in the registry says whether this can be evidenced, so')
    console.log('      nobody has decided it may persuade. Classify it in')
    console.log('      packages/config/claims.ts.')
    console.log('')
  }
  for (const f of findings) {
    console.log(`  ${f.key} is used by ${f.where}`)
    console.log(`      "${f.claim.claim}" — ${f.claim.status}`)
    console.log(`      ${f.claim.source}`)
    console.log(`      To publish it commercially: ${f.claim.toUpgrade}`)
    console.log('')
  }
  console.log('A claim below VERIFIED belongs on the case studies, where the page')
  console.log('records what was said, and not on a page whose job is to persuade.')
  console.log('Status lives in packages/config/claims.ts and is a business decision,')
  console.log('never something to edit so that a build goes green.')
  process.exitCode = 1
}
