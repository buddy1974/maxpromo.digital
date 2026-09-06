#!/usr/bin/env node
/**
 * packages/tooling/prove-domains.mjs
 *
 * The ADR-0004 harness for audit-domains.mjs: break the registry one way at a
 * time, and check that the audit says so.
 *
 *   npm run prove:domains
 *
 * WARNING — this script EDITS packages/config/domains.ts and brands.ts in place,
 * once per case, and restores both in a `finally`. Run it on a clean tree and
 * check `git diff packages/config` is empty afterwards. It is deliberately
 * not part of `verify` for that reason.
 *
 * WHY IT IS CHECKED IN
 *
 * "Every check must be able to fail" has been a standard here since ADR-0004,
 * and it has been honoured by hand — a defect reintroduced, the check watched,
 * the defect removed. That works exactly once, for the person who did it. Nine
 * times this repository has found a rule that looked correct and examined
 * nothing, and two of those were rules written *in the sprint that added the
 * discipline*. A demonstration nobody can re-run is a claim, not evidence.
 *
 * Each case names the rule it exercises and the text it expects. A case whose
 * anchor no longer exists in the registry reports ANCHOR MISSING rather than
 * passing quietly, because a harness that silently stops testing is the same
 * failure it exists to catch.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

/**
 * The registries a case may break.
 *
 * Asset declarations moved from domains.ts to brands.ts in v14.0 — the Domain
 * Registry derives its social card and favicon from the Brand Registry rather
 * than restating them. audit-domains still checks those assets, through its own
 * code path, so the rules still need proving; they are simply broken from the
 * file the values now live in.
 *
 * Five cases here reported ANCHOR MISSING rather than passing quietly once the
 * values moved, which is exactly what that guard is for.
 */
const FILES = {
  domains: 'packages/config/domains.ts',
  brands:  'packages/config/brands.ts',
}
const ORIGINALS = Object.fromEntries(
  Object.entries(FILES).map(([k, f]) => [k, readFileSync(f, 'utf8')]),
)

const CASES = [
  {
    rule: '1a duplicate host',
    from: "  productDomain({\n    host: 'superhandwerk.de',",
    to:   "  productDomain({\n    host: 'restaurant-os.de',",
    expect: 'appears twice in the registry',
  },
  {
    rule: '1b unnormalised key',
    from: "host: 'taxkontrol.de',     product: 'TaxKontrol'",
    to:   "host: 'www.TaxKontrol.de', product: 'TaxKontrol'",
    expect: 'is not a normalised key',
  },
  {
    rule: '1c origin disagrees with host',
    from: "origin: 'https://www.super-praxis.de',",
    to:   "origin: 'https://www.maxpromo.digital',",
    expect: 'declares origin https://www.maxpromo.digital',
  },
  {
    rule: '1d primary language outside supported set',
    from: "slug: 'care-os',           primaryLanguage: 'de',   languages: ['de', 'en'],",
    to:   "slug: 'care-os',           primaryLanguage: 'de',   languages: ['en'],",
    expect: 'which is not in its supported set',
  },
  {
    rule: '1e product slug resolves to nothing',
    from: "slug: 'printshop-os',      primaryLanguage: 'de',",
    to:   "slug: 'printshop-oss',     primaryLanguage: 'de',",
    expect: "is not in products.ts",
  },
  {
    rule: '2  language declared without copy',
    from: "slug: 'publishing-os',     primaryLanguage: 'en',   languages: ['en'],",
    to:   "slug: 'publishing-os',     primaryLanguage: 'en',   languages: ['en', 'de'],",
    expect: 'field(s) with no German',
  },
  {
    rule: '3a og:image not on disk',
    file: 'brands',
    from: "card: '/images/systems/handwerk-os/card/handwerk-os-de.png',",
    to:   "card: '/images/systems/handwerk-os/card/handwerk-os-xx.png',",
    expect: 'is not on disk',
  },
  {
    rule: '3b declared dimensions are wrong',
    file: 'brands',
    from: 'const CARD = { width: 1536, height: 1024 } as const',
    to:   'const CARD = { width: 1200, height: 630 } as const',
    expect: 'registry says 1200×630',
  },
  {
    rule: '3c a declared language has no card',
    file: 'brands',
    from: "card: '/images/systems/real-estate-os/card/real-estate-os-de.png',",
    to:   "card: '/images/systems/drive24/card/drive24-en.png',",
    expect: 'no DE card at',
  },
  {
    rule: '3d asset points at a host nobody serves',
    file: 'brands',
    from: "      path: 'https://www.maxpromo.digital/images/systems/agent-bureau/card/agent-bureau-de.png',",
    to:   "      path: 'https://cdn.example.com/images/systems/agent-bureau/card/agent-bureau-de.png',",
    expect: 'which is not a registry host',
  },
  {
    rule: '3e favicon not on disk',
    file: 'brands',
    from: "  state: 'shared', path: '/favicon.ico', note,",
    to:   "  state: 'shared', path: '/favicon-none.ico', note,",
    expect: 'is not on disk',
  },
  {
    rule: '4a route allowlist names a page that does not exist',
    from: "const PRODUCT_ROUTES = ['/', '/contact', '/impressum', '/privacy'] as const",
    to:   "const PRODUCT_ROUTES = ['/', '/contact', '/impressum', '/privacy', '/features'] as const",
    expect: 'which apps/web does not serve',
  },
  {
    rule: '4c enquiry carries a context the contact page ignores',
    from: "    contactSlug: 'real-estate-os',",
    to:   "",
    expect: 'which the contact page does not recognise',
  },
  {
    rule: '4b contact path is not admitted by the domain',
    from: "    contactPath:       `/contact?system=${e.contactSlug ?? e.slug}`,",
    to:   "    contactPath:       `/about?system=${e.contactSlug ?? e.slug}`,",
    expect: 'which it does not serve',
  },
]

const results = []
try {
  for (const c of CASES) {
    const which = c.file ?? 'domains'
    const file = FILES[which]
    const original = ORIGINALS[which]
    if (!original.includes(c.from)) {
      results.push([c.rule, 'ANCHOR MISSING', c.from.slice(0, 50)])
      continue
    }
    writeFileSync(file, original.replace(c.from, c.to), 'utf8')
    let out = ''
    try {
      out = execFileSync('node', ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON', 'packages/tooling/audit-domains.mjs'], { encoding: 'utf8' })
      results.push([c.rule, 'DID NOT FAIL', 'audit exited 0'])
      continue
    } catch (e) {
      out = (e.stdout ?? '') + (e.stderr ?? '')
    }
    results.push([c.rule, out.includes(c.expect) ? 'fires' : 'WRONG FINDING', c.expect])
  }
} finally {
  for (const [k, f] of Object.entries(FILES)) writeFileSync(f, ORIGINALS[k], 'utf8')
}

let bad = 0
for (const [rule, verdict, detail] of results) {
  const ok = verdict === 'fires'
  if (!ok) bad++
  console.log(`${ok ? '  ' : '!!'} ${rule.padEnd(52)} ${verdict}${ok ? '' : '  — ' + detail}`)
}
console.log(`\n${results.length - bad}/${results.length} rules demonstrated failing.`)
process.exitCode = bad === 0 ? 0 : 1
