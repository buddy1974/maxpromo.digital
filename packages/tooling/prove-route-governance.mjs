#!/usr/bin/env node
/**
 * packages/tooling/prove-route-governance.mjs
 *
 * A new public route is covered, or excluded on purpose. Never merely missed.
 *
 * WHY THIS EXISTS
 *
 * Two silent omissions, found on the same afternoon, neither caught by
 * anything:
 *
 *   `/solutions/custom-applications` — a live Phase A commercial page — was
 *   absent from the sitemap. Nobody had noticed because nothing compares the
 *   routes that exist with the routes that are registered.
 *
 *   The Friction Check shipped without accessibility coverage, because
 *   `audit-a11y.mjs` enumerates its routes by hand and its own comment warns
 *   that "a new public page is unchecked until somebody remembers this file".
 *
 * Both are the same failure: a list maintained by memory beside a directory
 * maintained by the compiler. This compares them.
 *
 * WHAT IT DOES NOT DO
 *
 * It does not force every route into the sitemap. A redirect, a legal page and
 * an archive page each have good reasons not to be there, and a gate that
 * pushed them in would be worse than none. It requires a *decision*: a route is
 * registered, or it is named below with a reason. Adding to that list is the
 * act of deciding, which is the point.
 *
 * It does not require every route in the accessibility audit either. That list
 * is a curated bilingual sample by design, and its author said so. What this
 * requires is that a route appears in at least one locale, or is named below.
 *
 *   node packages/tooling/prove-route-governance.mjs
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()

/**
 * Routes deliberately absent from the sitemap, each with the reason.
 *
 * A route here is a decision somebody made and wrote down. A route missing
 * from both here and the sitemap is an omission, and fails.
 */
const SITEMAP_EXCLUDED = {
  '/ai-websites': '308 redirect to /solutions/websites-platforms; a redirect target is not a destination',
  '/data-deletion': 'disallowed in robots.txt — a compliance endpoint, not a page to find',
  '/portfolio': 'disallowed in robots.txt — superseded by /work',
  '/[...rest]': 'the localised catch-all; it renders 404 and has no URL of its own',
  '/blog/[slug]': 'dynamic; the sitemap enumerates published slugs rather than the route',
  '/industries/[slug]': 'dynamic; the sitemap enumerates the six industry slugs',
  '/solutions/[slug]': 'dynamic; the sitemap enumerates the solution slugs',
}

/**
 * Routes deliberately outside the accessibility sample, each with the reason.
 *
 * Far shorter than the sitemap list on purpose: almost everything public should
 * be audited in at least one locale, and "it is similar to another page" is not
 * a reason, because similar pages are exactly where a regression hides.
 */
const A11Y_EXCLUDED = {
  '/ai-websites': 'a redirect; there is no rendered page to audit',
  '/[...rest]': 'renders 404, audited as a route rather than a page',
  '/blog/[slug]': 'dynamic; a representative article would need choosing, and the index is audited',
  '/industries/[slug]': 'dynamic; all six concrete slugs are audited directly',
  '/solutions/[slug]': 'dynamic; the concrete solution pages are audited directly',
  '/portfolio': 'disallowed in robots.txt and superseded by /work',
  '/data-deletion': 'audited in English only, which the sample already covers',
}

const results = []
const check = (name, ok, detail = '') => {
  results.push(ok)
  console.log(`  ${ok ? 'pass' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)
}

console.log('='.repeat(74))
console.log('ROUTE GOVERNANCE')
console.log('')

/* ── What exists ────────────────────────────────────────────────────────── */
const base = join(ROOT, 'apps', 'web', 'app', '[locale]')
if (!existsSync(base)) {
  console.error('route governance: no localised app directory')
  process.exit(1)
}
const routes = []
;(function walk(dir, prefix) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.next') continue
    const full = join(dir, e.name)
    if (e.isDirectory()) walk(full, `${prefix}/${e.name}`)
    else if (e.name === 'page.tsx') routes.push(prefix || '/')
  }
})(base, '')

console.log(`  ${routes.length} public route(s) found on disk`)

/* ── The sitemap ────────────────────────────────────────────────────────── */
console.log('')
console.log('Every route is registered or excluded with a reason')

const sitemapSrc = readFileSync(join(ROOT, 'apps', 'web', 'app', 'sitemap.ts'), 'utf8')
const entries = [...sitemapSrc.matchAll(/path: '([^']*)'/g)].map((m) => m[1])

/* The homepage is `path: ''`, so compare it as such rather than as '/'. */
const registered = new Set(entries.map((e) => (e === '' ? '/' : e)))

const unregistered = routes.filter((r) => !registered.has(r) && !(r in SITEMAP_EXCLUDED))
check(
  'no route is missing from both the sitemap and the exclusion list',
  unregistered.length === 0,
  unregistered.join(', '),
)

const dupes = [...new Set(entries.filter((e, i) => entries.indexOf(e) !== i))]
check('the sitemap has no duplicate entries', dupes.length === 0, dupes.map((d) => d || "''").join(', '))

/* An exclusion for a route that no longer exists is stale documentation. */
const staleSitemap = Object.keys(SITEMAP_EXCLUDED).filter((r) => !routes.includes(r))
check(
  'every sitemap exclusion names a route that exists',
  staleSitemap.length === 0,
  staleSitemap.join(', '),
)

/* ── Accessibility coverage ─────────────────────────────────────────────── */
console.log('')
console.log('Every route is audited in at least one locale, or excluded with a reason')

const a11ySrc = readFileSync(join(ROOT, 'packages', 'tooling', 'audit-a11y.mjs'), 'utf8')
const audited = new Set(
  [...a11ySrc.matchAll(/'\/(?:de|en)(\/[^']*)?'/g)].map((m) => m[1] ?? '/'),
)

const unaudited = routes.filter((r) => !audited.has(r) && !(r in A11Y_EXCLUDED))
check(
  'no route is missing from both the audit and the exclusion list',
  unaudited.length === 0,
  unaudited.join(', '),
)

const staleA11y = Object.keys(A11Y_EXCLUDED).filter((r) => !routes.includes(r))
check(
  'every accessibility exclusion names a route that exists',
  staleA11y.length === 0,
  staleA11y.join(', '),
)

/* ── Report ─────────────────────────────────────────────────────────────── */
console.log('')
console.log(`  sitemap: ${registered.size} registered · ${Object.keys(SITEMAP_EXCLUDED).length} excluded by decision`)
console.log(`  a11y:    ${routes.filter((r) => audited.has(r)).length} audited · ${Object.keys(A11Y_EXCLUDED).length} excluded by decision`)

console.log('')
const bad = results.filter((r) => !r).length
console.log('='.repeat(74))
if (bad === 0) {
  console.log(`ROUTE GOVERNANCE: clean — ${results.length} propert(ies) proved`)
} else {
  console.log(`ROUTE GOVERNANCE: ${bad} of ${results.length} FAILED\n`)
  console.log('A public route belongs in the sitemap and the accessibility audit,')
  console.log('or in the exclusion list in this file with the reason written down.')
  console.log('Being forgotten is not one of the options.')
  process.exitCode = 1
}
