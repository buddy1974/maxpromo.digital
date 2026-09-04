#!/usr/bin/env node
/**
 * packages/tooling/audit-typography.mjs
 *
 * What type sizes, weights and rhythms are actually in use.
 *
 * The design system defines a scale in packages/design-tokens/brand.css. This
 * measures whether anything uses it. The first run answered: mostly not — 927
 * inline font sizes across 31 distinct values, of which 21 referenced a token.
 *
 * REPORT, THEN ENFORCE
 *
 * This reports by default and fails only on the two rules that are not matters
 * of taste:
 *
 *   1. Nothing below the legibility floor. Type under 10px is not small, it is
 *      unreadable, and it appears in this codebase at 9px in uppercase mono
 *      with 0.2em tracking — the least legible combination available.
 *
 *   2. No sub-pixel sizes. 9.5px, 10.5px, 11.5px, 12.5px are not decisions,
 *      they are the residue of someone nudging a value until a specific line
 *      broke where they wanted on a specific screen. They do not survive a
 *      font change and they are invisible to a reviewer.
 *
 * Everything else — the long tail of raw px sizes, and heading weights that
 * disagree with the token — is counted and printed, so the number moves in one
 * direction over time and a regression is visible in a diff.
 *
 *   node packages/tooling/audit-typography.mjs           report
 *   node packages/tooling/audit-typography.mjs --strict  also fail on raw px
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { stripComments } from './strip-comments.mjs'

const ROOT = process.cwd()
const STRICT = process.argv.includes('--strict')

const APP_DIRS = ['app', 'components', 'lib']
const SCAN_DIRS = (() => {
  const out = []
  if (existsSync(join(ROOT, 'apps'))) {
    for (const app of readdirSync(join(ROOT, 'apps'))) {
      for (const d of APP_DIRS) {
        const p = join('apps', app, d)
        if (existsSync(join(ROOT, p))) out.push(p)
      }
    }
    if (existsSync(join(ROOT, 'packages'))) {
      for (const pkg of readdirSync(join(ROOT, 'packages'))) {
        if (pkg === 'tooling' || pkg === 'design-tokens') continue
        out.push(join('packages', pkg))
      }
    }
  }
  for (const d of APP_DIRS) if (existsSync(join(ROOT, d))) out.push(d)
  return out
})()

if (SCAN_DIRS.length === 0) {
  console.error('typography: no scan targets found under ' + ROOT)
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

/** Below this, type is not small — it is unreadable. */
const FLOOR_PX = 10

const SKIP_DIRS = new Set(['node_modules', '.next', 'dist', 'build', '.turbo', '.git'])
const EXT = /\.(tsx?)$/

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (EXT.test(entry)) out.push(p)
  }
  return out
}

const SIZE_INLINE = /fontSize:\s*'([^']+)'/g
const SIZE_CLASS = /text-\[(\d+(?:\.\d+)?px)\]/g
const WEIGHT = /fontWeight:\s*'?(\d{3}|bold)'?/g

const sizes = new Map()   // value -> { count, files:Set }
const weights = new Map()
const violations = []
let scanned = 0

const note = (map, key, file) => {
  if (!map.has(key)) map.set(key, { count: 0, files: new Set() })
  const e = map.get(key)
  e.count++
  e.files.add(file)
}

for (const dir of SCAN_DIRS) {
  let files
  try {
    files = walk(join(ROOT, dir))
  } catch {
    continue
  }
  for (const file of files) {
    const rel = relative(ROOT, file).split(sep).join('/')
    scanned++
    const lines = stripComments(readFileSync(file, 'utf8')).split('\n')
    lines.forEach((line, i) => {
      for (const re of [SIZE_INLINE, SIZE_CLASS]) {
        re.lastIndex = 0
        let m
        while ((m = re.exec(line)) !== null) {
          const value = m[1]
          note(sizes, value, rel)

          const px = /^(\d+(?:\.\d+)?)px$/.exec(value)
          if (!px) continue
          const n = parseFloat(px[1])
          if (n < FLOOR_PX) {
            violations.push({ file: rel, line: i + 1, kind: 'below the ' + FLOOR_PX + 'px floor', value })
          } else if (!Number.isInteger(n)) {
            violations.push({ file: rel, line: i + 1, kind: 'sub-pixel size', value })
          } else if (STRICT) {
            violations.push({ file: rel, line: i + 1, kind: 'raw px, not on the scale', value })
          }
        }
      }
      WEIGHT.lastIndex = 0
      let w
      while ((w = WEIGHT.exec(line)) !== null) note(weights, w[1], rel)
    })
  }
}

const sorted = [...sizes.entries()].sort((a, b) => b[1].count - a[1].count)
const total = sorted.reduce((n, [, e]) => n + e.count, 0)
const tokenised = sorted.filter(([v]) => v.startsWith('var(')).reduce((n, [, e]) => n + e.count, 0)

const pad = (s, n) => String(s).padEnd(n)
console.log('TYPOGRAPHY\n')
console.log(pad('size', 24) + pad('uses', 7) + 'files')
console.log('-'.repeat(44))
for (const [v, e] of sorted) console.log(pad(v, 24) + pad(e.count, 7) + e.files.size)

console.log('\n' + pad('weight', 24) + pad('uses', 7) + 'files')
console.log('-'.repeat(44))
for (const [v, e] of [...weights.entries()].sort((a, b) => b[1].count - a[1].count)) {
  console.log(pad(v, 24) + pad(e.count, 7) + e.files.size)
}

const pct = total ? Math.round((tokenised / total) * 100) : 0
console.log('\n' + '='.repeat(74))
console.log(`${scanned} files · ${total} size declarations · ${sorted.length} distinct values`)
console.log(`${tokenised} of ${total} reference a token (${pct}%)`)

if (violations.length) {
  const byKind = new Map()
  for (const v of violations) byKind.set(v.kind, (byKind.get(v.kind) ?? 0) + 1)
  console.log('\nTYPOGRAPHY: ' + violations.length + ' violation(s)')
  for (const [k, n] of byKind) console.log(`  ${n} ${k}`)
  console.log('')
  for (const v of violations.slice(0, 40)) {
    console.log(`  ${v.file}:${v.line}  ${v.value}  (${v.kind})`)
  }
  if (violations.length > 40) console.log(`  ... and ${violations.length - 40} more`)
  process.exitCode = 1
} else {
  console.log('\nTYPOGRAPHY: no size below the floor, no sub-pixel size')
}
