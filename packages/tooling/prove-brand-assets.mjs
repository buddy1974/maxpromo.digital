#!/usr/bin/env node
/**
 * packages/tooling/prove-brand-assets.mjs
 *
 * The ADR-0004 harness for audit-brand-assets.mjs: break the Brand Registry
 * one way at a time, and check that the audit says so.
 *
 *   npm run prove:brands
 *
 * WARNING — this script EDITS packages/config/brands.ts in place, once per
 * case, and restores it in a `finally`. Run it on a clean tree and check
 * `git diff packages/config/brands.ts` is empty afterwards. It is deliberately
 * not part of `verify` for that reason.
 *
 * Its sibling `prove-domains.mjs` explains why a demonstration is checked in
 * rather than performed once by hand. The short version: this audit found a
 * defect in its own registry on its first run — thirty-five asset slots with
 * no stated reason — and a rule that has caught something once is exactly the
 * kind that quietly stops catching anything.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const REGISTRY = 'packages/config/brands.ts'
const original = readFileSync(REGISTRY, 'utf8')

const CASES = [
  {
    rule: '1a duplicate product in the registry',
    from: "    slug: 'care-os', name: 'CareOS', shortName: 'CareOS',",
    to:   "    slug: 'drive24', name: 'CareOS', shortName: 'CareOS',",
    expect: 'appears twice in the Brand Registry',
  },
  {
    rule: '1b brand names a product that does not exist',
    from: "    slug: 'taxkontrol', name: 'TaxKontrol', shortName: 'TaxKontrol',",
    to:   "    slug: 'taxkontroll', name: 'TaxKontrol', shortName: 'TaxKontrol',",
    expect: 'matches no product in products.ts',
  },
  {
    rule: '2a a semantic token used as an identity',
    from: "    accent: '#047857', accentText: '#047857',",
    to:   "    accent: 'var(--semantic-success)', accentText: '#047857',",
    expect: 'not a literal colour',
  },
  {
    rule: '2b the accent-as-text form fails contrast',
    from: "    accent: '#14B8A6', accentText: '#0E7D71',",
    to:   "    accent: '#14B8A6', accentText: '#14B8A6',",
    expect: 'on white',
  },
  {
    rule: '2c a text form that is not needed',
    from: "    accent: '#1E3A5F', accentText: '#1E3A5F',",
    to:   "    accent: '#1E3A5F', accentText: '#12243B',",
    expect: 'although its accent already measures',
  },
  {
    rule: '3a a declared asset is not on disk',
    from: "    card: '/images/systems/publishing-os/card/publishing-os-en.png',",
    to:   "    card: '/images/systems/publishing-os/card/publishing-os-xx.png',",
    expect: 'is not on disk',
  },
  {
    rule: '3b declared dimensions are wrong',
    from: 'const CARD = { width: 1536, height: 1024 } as const',
    to:   'const CARD = { width: 1200, height: 630 } as const',
    expect: 'registry says 1200×630',
  },
  {
    rule: '3c an empty slot with no stated reason',
    from: "const NO_LOGO = absent(\n  'CREATE — no product mark exists.",
    to:   "const NO_LOGO = ({ state: 'absent', path: null })\nconst UNUSED_NOTE = String(\n  'CREATE — no product mark exists.",
    expect: "with no note",
  },
  {
    rule: '3d an asset that is absent and still names a file',
    from: "const absent = (note: string): BrandAsset => ({ state: 'absent', path: null, note })",
    to:   "const absent = (note: string): BrandAsset => ({ state: 'absent', path: '/logo.png', note })",
    expect: 'and still names',
  },
  {
    rule: '3e an asset pointing at a host nobody serves',
    from: "      path: 'https://www.maxpromo.digital/images/systems/agent-bureau/card/agent-bureau-de.png',",
    to:   "      path: 'https://cdn.example.com/images/systems/agent-bureau/card/agent-bureau-de.png',",
    expect: 'which is not a registry host',
  },
  {
    rule: '4  a product bringing its own typography',
    from: "    typography: 'inherit',\n  },\n\n  // ── Agent Bureau",
    to:   "    typography: 'Helvetica' as 'inherit',\n  },\n\n  // ── Agent Bureau",
    expect: 'declares typography',
  },
]

const results = []
try {
  for (const c of CASES) {
    if (!original.includes(c.from)) {
      results.push([c.rule, 'ANCHOR MISSING', c.from.slice(0, 60)])
      continue
    }
    writeFileSync(REGISTRY, original.replace(c.from, c.to), 'utf8')
    let out = ''
    try {
      execFileSync('node', ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON', 'packages/tooling/audit-brand-assets.mjs'], { encoding: 'utf8' })
      results.push([c.rule, 'DID NOT FAIL', 'audit exited 0'])
      continue
    } catch (e) {
      out = (e.stdout ?? '') + (e.stderr ?? '')
    }
    results.push([c.rule, out.includes(c.expect) ? 'fires' : 'WRONG FINDING', c.expect])
  }
} finally {
  writeFileSync(REGISTRY, original, 'utf8')
}

let bad = 0
for (const [rule, verdict, detail] of results) {
  const ok = verdict === 'fires'
  if (!ok) bad++
  console.log(`${ok ? '  ' : '!!'} ${rule.padEnd(46)} ${verdict}${ok ? '' : '  — ' + detail}`)
}
console.log(`\n${results.length - bad}/${results.length} rules demonstrated failing.`)
process.exitCode = bad === 0 ? 0 : 1
