#!/usr/bin/env node
/**
 * packages/tooling/check-icons.mjs
 *
 * One icon language, enforced.
 *
 * An audit found 36 distinct Unicode marks doing the work of icons across 68
 * files — geometric shapes, dingbats and box drawing, mixed freely, with three
 * navigations that had each invented their own vocabulary and disagreed with
 * each other on what six of the marks meant. They are now one SVG set in
 * @maxpromo/ui.
 *
 * That kind of thing comes back one commit at a time, because reaching for a
 * character is always easier than adding a path. So it is checked.
 *
 * WHAT IS ALLOWED
 *
 * Typography, not iconography. An arrow inside a line of text — "Back to home
 * →" — is a typographic convention, sets with the text, inherits its colour and
 * size, and is not pretending to be an icon. The same goes for a real minus
 * sign in a currency amount, mathematical comparators in prose, and the box
 * drawing that renders a monospace tree. Those are listed below.
 *
 * Everything else in the icon-ish ranges is a finding. If a component needs a
 * mark that is not in the list, the answer is a path in Icon.tsx.
 *
 *   node packages/tooling/check-icons.mjs
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { stripComments } from './strip-comments.mjs'

const ROOT = process.cwd()
const SELF = fileURLToPath(import.meta.url)

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
        if (pkg === 'tooling') continue
        out.push(join('packages', pkg))
      }
    }
  }
  for (const d of APP_DIRS) if (existsSync(join(ROOT, d))) out.push(d)
  return out
})()

// The same refusal the token check makes. A checker that finds nothing to
// check must not report success — that has happened here twice.
if (SCAN_DIRS.length === 0) {
  console.error('icons: no scan targets found under ' + ROOT)
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

/** Ranges where a character is likely standing in for an icon. */
const RANGES = [
  [0x2190, 0x21ff], // arrows
  [0x2300, 0x23ff], // technical
  [0x2500, 0x257f], // box drawing
  [0x25a0, 0x25ff], // geometric shapes
  [0x2600, 0x27bf], // symbols and dingbats
  [0x2b00, 0x2bff], // more arrows and shapes
  [0x1f300, 0x1faff], // emoji
]

/**
 * Typographic characters that set with text. Each is here because it is doing
 * a typographic job, not an iconographic one.
 */
const ALLOWED = new Set([
  '→', // → in a call to action, inside the text
  '←', // ← on a back link, likewise
  '−', // − the real minus sign, in currency amounts
  '≥', '≤', // ≥ ≤ in prose and in comments about breakpoints
  '─', '│', '└', '├', '┐', '┌', '┘', '┤',
  // Box drawing above: the monospace org tree, and the section rules that run
  // through this codebase's own comments.
])

/**
 * Files whose characters are not interface.
 *
 * Narrow on purpose, and each entry states why — the same discipline the token
 * check's allowlist keeps. Text sent to a language model is not rendered to
 * anyone; it is an instruction, and one of these instructions has to name the
 * characters it is telling the model to strip out.
 */
const ALLOWED_FILES = [
  {
    // Section rules inside a system prompt. Never rendered.
    match: /apps\/web\/app\/api\/chat\/route\.ts$/,
    reason: 'system prompt formatting, not UI',
  },
  {
    // The extraction prompt lists the decorations a model must discard, so it
    // must be able to write them down.
    match: /apps\/web\/lib\/prompts\.ts$/,
    reason: 'prompt text that enumerates the marks it strips',
  },
]

const SKIP_DIRS = new Set(['node_modules', '.next', 'dist', 'build', '.turbo', '.git'])
const EXT = /\.(tsx?|css)$/

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (EXT.test(entry)) out.push(p)
  }
  return out
}

const isIconish = (ch) => {
  const o = ch.codePointAt(0)
  return RANGES.some(([a, b]) => o >= a && o <= b) && !ALLOWED.has(ch)
}

const findings = []
let scanned = 0

for (const dir of SCAN_DIRS) {
  let files
  try {
    files = walk(join(ROOT, dir))
  } catch {
    continue
  }
  for (const file of files) {
    if (file === SELF) continue
    const rel = relative(ROOT, file).split(sep).join('/')
    if (ALLOWED_FILES.some((a) => a.match.test(rel))) continue
    scanned++
    const lines = stripComments(readFileSync(file, 'utf8')).split('\n')
    lines.forEach((line, i) => {
      const marks = [...new Set([...line].filter(isIconish))]
      if (marks.length) {
        findings.push({ file: rel, line: i + 1, marks: marks.join(' '), text: line.trim().slice(0, 100) })
      }
    })
  }
}

console.log('=' .repeat(74))
if (!findings.length) {
  console.log(`ICONS: clean — ${scanned} file(s) checked, no Unicode mark standing in for an icon`)
} else {
  console.log(`ICONS: ${findings.length} finding(s) across ${scanned} file(s)\n`)
  for (const f of findings) console.log(`  ${f.file}:${f.line}  [${f.marks}]  ${f.text}`)
  console.log('\nUse <Icon name="..."> from @maxpromo/ui. If the icon you need is not')
  console.log('there, add a path to packages/ui/primitives/Icon.tsx — one stroke')
  console.log('weight, one size system, drawn on the same 24x24 grid as the rest.')
  process.exitCode = 1
}
