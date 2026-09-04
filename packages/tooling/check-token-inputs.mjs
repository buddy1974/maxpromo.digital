#!/usr/bin/env node
/**
 * packages/tooling/check-token-inputs.mjs
 *
 * Every variable the token package reads, some application has to write.
 *
 * WHY THIS EXISTS
 *
 * @maxpromo/design-tokens is deliberately dependency-free, so it cannot load a
 * webfont. It names one instead:
 *
 *     --brand-font-sans: var(--font-inter), ui-sans-serif, system-ui, ...
 *
 * and each application is expected to define `--font-inter` — in Next, by
 * passing `variable: '--font-inter'` to next/font. Agent Bureau passed
 * `variable: '--font-sans'` instead, and loaded JetBrains Mono under
 * `--font-mono`. Neither name is one the token package reads.
 *
 * Nothing failed. A `var()` whose variable is undefined does not warn, does not
 * log, and does not break a build — it silently falls through to the rest of
 * the list. So --brand-font-sans resolved to `ui-sans-serif`, and Agent Bureau
 * rendered in Segoe UI on Windows while maxpromo.digital rendered in Inter.
 * Two applications of one brand, in two typefaces, with both of Agent Bureau's
 * downloaded webfonts sitting unused in the bundle. It survived a design
 * system, a consolidation, a brand migration and six audits, because every one
 * of them looked at one application at a time and each was internally
 * consistent.
 *
 * This is the same shape as the icon vocabulary in ADR-0003 and the reason
 * audit-consistency exists: the defect is not inside either application, it is
 * between them.
 *
 * WHAT IT CHECKS
 *
 * Reads the token package, collects every custom property it *references* but
 * does not *define*, and requires each application to define all of them.
 *
 *   node packages/tooling/check-token-inputs.mjs
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const ROOT = process.cwd()
const TOKENS = join(ROOT, 'packages', 'design-tokens', 'brand.css')

if (!existsSync(TOKENS)) {
  console.error('token inputs: cannot find packages/design-tokens/brand.css under ' + ROOT)
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

const css = readFileSync(TOKENS, 'utf8')
const defined = new Set([...css.matchAll(/^\s*(--[\w-]+)\s*:/gm)].map((m) => m[1]))
const referenced = new Set([...css.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]))
const inputs = [...referenced].filter((v) => !defined.has(v)).sort()

if (inputs.length === 0) {
  console.error('token inputs: the token package references nothing it does not define.')
  console.error('That is either a real change or a broken parse. Confirm before removing this check.')
  process.exit(1)
}

const APPS = existsSync(join(ROOT, 'apps')) ? readdirSync(join(ROOT, 'apps')) : []
if (APPS.length === 0) {
  console.error('token inputs: no applications found under ' + ROOT + '/apps')
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

const SKIP = new Set(['node_modules', '.next', '.git', 'dist', 'build', '.turbo'])
const EXT = /\.(tsx?|css|mjs)$/

function walk(dir, out = []) {
  let entries
  try { entries = readdirSync(dir) } catch { return out }
  for (const e of entries) {
    if (SKIP.has(e)) continue
    const p = join(dir, e)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (EXT.test(e)) out.push(p)
  }
  return out
}

/**
 * A definition is either a CSS declaration (`--font-inter: ...`) or a framework
 * binding that produces one. next/font's `variable: '--font-inter'` is the
 * second kind and is what both applications actually use.
 *
 * Written with string matching rather than a constructed RegExp on purpose.
 * The first draft built the pattern with `new RegExp(\`variable:\s*...\`)`,
 * and a template literal eats `\s` before RegExp ever sees it — the pattern
 * became `variable:s*` and matched nothing, so the check reported both
 * applications broken while one of them was correct. That is ADR-0004's rule
 * (4) doing its job: the rule was watched, and it was wrong in a way no
 * amount of reading would have shown.
 */
const CSS_DECLARATION = (name) => name + ':'
const BINDINGS = (name) => [
  "variable: '" + name + "'",
  'variable: "' + name + '"',
  "variable:'" + name + "'",
  'variable:"' + name + '"',
  'variable: `' + name + '`',
]
const defines = (src, name) =>
  src.includes(CSS_DECLARATION(name)) || BINDINGS(name).some((b) => src.includes(b))

const findings = []
let filesChecked = 0

for (const app of APPS) {
  const files = walk(join(ROOT, 'apps', app))
  filesChecked += files.length
  const sources = files.map((f) => readFileSync(f, 'utf8'))
  for (const name of inputs) {
    if (!sources.some((s) => defines(s, name))) {
      findings.push({ app, name })
    }
  }
}

console.log('='.repeat(74))
console.log(`token inputs: ${inputs.length} expected by the token package — ${inputs.join(', ')}`)
console.log(`${APPS.length} application(s), ${filesChecked} file(s) checked`)

if (findings.length === 0) {
  console.log('TOKEN INPUTS: clean — every application defines what the token package reads')
} else {
  console.log(`\nTOKEN INPUTS: ${findings.length} finding(s)\n`)
  for (const f of findings) {
    console.log(`  apps/${f.app} never defines ${f.name}`)
    console.log(`      @maxpromo/design-tokens reads it. Undefined, it falls through to the`)
    console.log(`      fallback stack silently — no warning, no build error, a different face.`)
  }
  console.log('\nIn Next, define it where the font is loaded:')
  console.log("  Inter({ subsets: ['latin'], variable: '--font-inter' })")
  process.exitCode = 1
}
