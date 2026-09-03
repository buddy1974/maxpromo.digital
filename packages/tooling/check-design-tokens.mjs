#!/usr/bin/env node
/**
 * scripts/check-design-tokens.mjs
 *
 * Fails the build when a colour is hardcoded outside the token layer.
 *
 * WHY THIS EXISTS
 * The v2.1 design system was specified in August 2026, implemented twice, and
 * still left 1252 hardcoded colour values and three parallel token systems in
 * the codebase. Writing "no hardcoded colours" in a design document has already
 * been tried here and has already failed. The only version of that rule that
 * survives contact with a deadline is one the build enforces.
 *
 * WHAT IT CHECKS
 *   1. No hex colour literals outside design/tokens (with a narrow, documented
 *      allowlist for third-party brand colours and print/PDF output).
 *   2. No raw Tailwind palette classes (text-orange-500, bg-amber-50, ...).
 *      The palette is the token layer's business, not a component's.
 *   3. No rgba() colour literals — use color-mix() over a token instead, so a
 *      tint follows the brand rather than pinning it.
 *
 * Usage:
 *   node scripts/check-design-tokens.mjs           # report and exit non-zero
 *   node scripts/check-design-tokens.mjs --warn    # report and exit zero
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const ROOT = process.cwd()
const WARN_ONLY = process.argv.includes('--warn')

/**
 * Scan targets.
 *
 * In the monorepo this runs from the workspace root and must reach into every
 * application; run from inside an application it scans that one. Getting this
 * wrong is not a loud failure — the check simply finds nothing and reports
 * clean, which is exactly how the Agent Bureau lint passed for months while
 * checking nothing at all. So the resolved target list is printed on every run.
 */
const APP_DIRS = ['app', 'components', 'lib', 'config']
const SCAN_DIRS = (() => {
  const out = []
  // Workspace root: apps/<name>/<dir>
  if (existsSync(join(ROOT, 'apps'))) {
    for (const app of readdirSync(join(ROOT, 'apps'))) {
      for (const d of APP_DIRS) {
        const p = join('apps', app, d)
        if (existsSync(join(ROOT, p))) out.push(p)
      }
    }
    // Shared packages are held to the same rule, minus the token package.
    if (existsSync(join(ROOT, 'packages'))) {
      for (const pkg of readdirSync(join(ROOT, 'packages'))) {
        if (pkg === 'design-tokens' || pkg === 'tooling') continue
        out.push(join('packages', pkg))
      }
    }
  }
  // Inside a single application.
  for (const d of APP_DIRS) {
    if (existsSync(join(ROOT, d))) out.push(d)
  }
  return out
})()

if (SCAN_DIRS.length === 0) {
  console.error('design tokens: no scan targets found under ' + ROOT)
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'design', 'design-tokens'])
const EXT = /\.(tsx?|css)$/

/**
 * Allowlist. Every entry needs a reason, because an allowlist without reasons
 * becomes the new place colours hide.
 */
const ALLOW = [
  {
    // Colours belonging to other companies, kept in one documented module.
    match: /^#/,
    files: [/(?:^|\/)lib\/third-party-brands\.ts$/],
  },
  {
    // Per-product brand accents are DATA, not styling: the registry stores the
    // accent each product shows on its own domain, and the two-tier brand
    // reads it at render time. A token cannot express "this product's colour".
    match: /^#/,
    files: [/(?:^|\/)lib\/registry\/products\.ts$/],
  },
  {
    // WhatsApp's own brand colour on a WhatsApp button. A third-party button
    // has to look like that platform's button to be recognised.
    match: /#25D366/i,
    files: [/app[\\/]os[\\/].*print[\\/]page\.tsx$/],
  },
  {
    // Print and PDF output cannot resolve CSS custom properties, and email
    // clients do not support them reliably. These read the token values from
    // design/tokens/index.ts instead; the check confirms they import it.
    match: /^#/,
    files: [/lib[\\/]documents[\\/]/, /lib[\\/]email\.ts$/],
    requireImport: '@/design/tokens',
  },
]

/**
 * The brand accent used as a TEXT colour. It is a fill: on white it measures
 * 1.51:1, so the text is effectively invisible. This has now regressed three
 * separate times — in the internal OS, in Agent Bureau, and on the contact
 * form — each time through a different syntax. It is checked rather than
 * remembered. --brand-primary-text is the accessible one (5.00:1).
 */
const ACCENT_TEXT = /text-\[var\(--(?:color|brand)-primary\)\]|(?<![-\w])(?:color|stroke):\s*'?var\(--(?:color|brand)-primary\)'?/g

// A colour literal is not preceded by `&` (an HTML numeric entity such as
// &#039;) or by a word character.
const HEX = /(?<![&\w])#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\b/g
const PALETTE = /\b(?:text|bg|border|ring|fill|stroke|from|to|via|decoration|outline|accent|shadow|divide|placeholder)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g
const RGBA = /\brgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+/g

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (EXT.test(entry)) out.push(p)
  }
  return out
}

function allowed(file, value, source) {
  // Normalised to forward slashes so the patterns above are identical on
  // Windows and POSIX. Getting this wrong silently disables the allowlist.
  const rel = relative(ROOT, file).split(sep).join('/')
  for (const rule of ALLOW) {
    if (!rule.match.test(value)) continue
    if (!rule.files.some((re) => re.test(rel))) continue
    if (rule.requireImport && !source.includes(rule.requireImport)) continue
    return true
  }
  return false
}

const findings = []

for (const dir of SCAN_DIRS) {
  let files
  try {
    files = walk(join(ROOT, dir))
  } catch {
    continue
  }
  for (const file of files) {
    const source = readFileSync(file, 'utf8')
    const lines = source.split('\n')

    // Comments document history and legitimately name retired colours, so
    // they are skipped — including the interior of a block comment, which does
    // not necessarily start its line with an asterisk.
    let inBlock = false

    lines.forEach((line, i) => {
      const trimmed = line.trim()
      const opens = line.includes('/*')
      const closes = line.includes('*/')
      if (inBlock) {
        if (closes) inBlock = false
        return
      }
      if (opens && !closes) { inBlock = true; return }
      if (trimmed.startsWith('*') || trimmed.startsWith('//') || trimmed.startsWith('/*')) return

      for (const [re, label] of [[HEX, 'hex literal'], [PALETTE, 'palette class'], [RGBA, 'rgba literal'], [ACCENT_TEXT, 'accent used as text (1.51:1)']]) {
        re.lastIndex = 0
        let m
        while ((m = re.exec(line)) !== null) {
          if (label === 'hex literal' && allowed(file, m[0], source)) continue
          findings.push({
            file: relative(ROOT, file).split(sep).join('/'),
            line: i + 1,
            label,
            value: m[0],
            text: trimmed.slice(0, 110),
          })
        }
      }
    })
  }
}

if (findings.length === 0) {
  console.log(`design tokens: clean — ${SCAN_DIRS.length} target(s) checked, no hardcoded colours outside the token package`)
  process.exit(0)
}

const byLabel = findings.reduce((acc, f) => {
  acc[f.label] = (acc[f.label] ?? 0) + 1
  return acc
}, {})

console.log(`design tokens: ${findings.length} finding(s) across ${SCAN_DIRS.length} target(s)`)
for (const [label, n] of Object.entries(byLabel)) console.log(`  ${label}: ${n}`)
console.log('')
for (const f of findings.slice(0, 400)) {
  console.log(`  ${f.file}:${f.line}  ${f.value}  (${f.label})`)
  console.log(`      ${f.text}`)
}
if (findings.length > 400) console.log(`  ... and ${findings.length - 400} more`)
console.log('')
console.log('Use a token from design/tokens/brand.css. For a tint, use')
console.log('color-mix(in srgb, var(--brand-primary) 12%, transparent) so it')
console.log('follows the brand instead of pinning it.')

process.exit(WARN_ONLY ? 0 : 1)
