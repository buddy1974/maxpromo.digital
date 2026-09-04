#!/usr/bin/env node
/**
 * packages/tooling/check-design-tokens.mjs
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
 *   node packages/tooling/check-design-tokens.mjs           # report and exit non-zero
 *   node packages/tooling/check-design-tokens.mjs --warn    # report and exit zero
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { stripComments } from './strip-comments.mjs'
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
    // the TypeScript mirror in @maxpromo/design-tokens instead, and the check
    // confirms they import it.
    match: /^#/,
    files: [/lib[\\/]documents[\\/]/, /lib[\\/]email\.ts$/],
    // This said '@/design/tokens' until v7.0 — a path that stopped existing at
    // the consolidation. A requireImport that can never be satisfied does not
    // fail; it quietly withdraws the allowlist entry, which is the same shape
    // as the Windows-only allowlist regex in ADR-0004. Nothing was hiding
    // behind it — both files are clean — but the next hex added to a print
    // template would have been reported as a violation of a rule it is
    // explicitly exempt from.
    requireImport: '@maxpromo/design-tokens',
  },
]

/**
 * The brand accent used as a TEXT colour. It is a fill: on white it measures
 * 1.51:1, so the text is effectively invisible. This has now regressed three
 * separate times — in the internal OS, in Agent Bureau, and on the contact
 * form — each time through a different syntax. It is checked rather than
 * remembered. --brand-primary-text is the accessible one (5.00:1).
 *
 * The token is matched anywhere inside the property value, not only at its
 * start. The first version of this rule required it to follow `color:`
 * immediately, so a conditional walked straight past:
 *
 *     color: isOpen ? 'var(--brand-primary)' : 'var(--brand-text-secondary)'
 *
 * Four of those were live when the rule was widened — an FAQ marker on the
 * homepage and three toggles in the internal OS — and the check had reported
 * clean over every one. The scan window stops at the first `,`, `;` or `}`,
 * so a legitimate accent fill later in the same style object is not swept in.
 */
const ACCENT_TEXT = /text-\[var\(--(?:color|brand)-primary\)\]|(?<![-\w])(?:color|stroke)\s*:\s*[^;,}\n]*var\(--(?:color|brand)-primary\)/g

/**
 * The accent bound to a local identifier.
 *
 * The rule above matches the token at the point of use. Binding it to a name
 * first — `const ORANGE = 'var(--color-primary)'`, then `color: ORANGE` —
 * slips past it, and did: three contrast failures lived on the homepage behind
 * exactly that alias, under a name that had outlived the colour it described
 * by two brand generations.
 *
 * There is no legitimate reason to rename a token that is already short and
 * already the canonical name. Reference it directly, or, if a component
 * genuinely needs a semantic of its own, add one to the token package.
 */
const ACCENT_ALIAS = /\b(?:const|let|var)\s+\w+\s*(?::[^=]+)?=\s*'?"?var\(--(?:color|brand)-primary\)/g

/**
 * The accent bound to a *field* whose name says it is text.
 *
 * The rule above catches a `const`. It does not catch a style map, and a style
 * map is where the site header's language toggle kept it:
 *
 *     const VARIANT_COLORS = { light: { hoverText: 'var(--color-primary)' } }
 *     onMouseEnter={(e) => { e.currentTarget.style.color = colors.hoverText }}
 *
 * Hovering that control turned its label Brand Lime on white — 1.51:1, on
 * every page of the site — and no rule here could see it: the binding is a
 * property and the use is a DOM assignment two functions away.
 *
 * Flagging every property bound to the accent would be wrong, because
 * `background`, `borderColor` and `fill` are what the accent is for. So the
 * rule keys on the name claiming to be text: a field called `hoverText` or
 * `inkActive` holding a fill-only token is a contradiction on its face,
 * wherever it is eventually applied.
 */
const ACCENT_TEXT_FIELD = /(?<![-\w])\w*(?:[Tt]ext|[Ii]nk|[Ff]oreground)\w*\s*:\s*'?"?var\(--(?:color|brand)-primary\)/g

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

    // Comments document history and legitimately name retired colours, so they
    // are removed before scanning. That is done by a string-aware pass rather
    // than line-by-line flags: the previous implementation could be switched
    // off for the remainder of a file by an ordinary line comment containing a
    // path glob, and was. See packages/tooling/strip-comments.mjs.
    const lines = stripComments(source).split('\n')

    lines.forEach((line, i) => {
      const trimmed = line.trim()

      for (const [re, label] of [
        [HEX, 'hex literal'],
        [PALETTE, 'palette class'],
        [RGBA, 'rgba literal'],
        [ACCENT_TEXT, 'accent used as text (1.51:1)'],
        [ACCENT_ALIAS, 'accent aliased to a local name (hides it from the rule above)'],
        [ACCENT_TEXT_FIELD, 'accent bound to a field named as text (1.51:1 wherever it lands)'],
      ]) {
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
console.log('Use a token from @maxpromo/design-tokens/brand.css. For a tint, use')
console.log('color-mix(in srgb, var(--brand-primary) 12%, transparent) so it')
console.log('follows the brand instead of pinning it.')

process.exit(WARN_ONLY ? 0 : 1)
