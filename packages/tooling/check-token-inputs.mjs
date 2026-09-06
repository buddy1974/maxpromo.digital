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
 * It also checks the other direction, added v14.0: a `var()` written into
 * output that leaves the browser. An email client does not implement CSS
 * custom properties, and neither does most PDF tooling, so a custom property
 * in an email's inline style resolves to nothing — with exactly the same
 * silence as an undefined one. The colour is simply not applied and the
 * element inherits; the padding is simply not applied and the layout collapses.
 *
 * This is not hypothetical. `lib/email.ts` wrote `var(--space-2)` and friends
 * seventy-one times into transactional email markup, and `emailHtml.ts` set
 * the company name on the invoice letterhead to `var(--brand-surface)` — white
 * text on a near-black band, which without the variable renders as the
 * inherited colour on that band. Every one of those variables is correctly
 * defined by the web application, so the rule above could not see them: they
 * do not dangle, they travel.
 *
 * @maxpromo/design-tokens exports a TypeScript mirror (`token`, `space`,
 * `type`) for precisely these surfaces. That mirror is the answer.
 *
 *   node packages/tooling/check-token-inputs.mjs
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { stripComments } from './strip-comments.mjs'

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

/**
 * PART TWO — a var() an application references and nothing defines.
 *
 * Part one checks the contract the token package declares. This checks the
 * looser version of the same failure: any custom property referenced anywhere
 * in an application that no stylesheet, package or font binding defines.
 *
 * It is the same silence. `var(--font-mono, monospace)` survived the v7.0
 * alias retirement in the chat panel because the fallback made it look
 * deliberate, and a reference with no fallback simply renders as nothing —
 * `color: var(--gone)` is an invalid declaration the browser drops, so the
 * element inherits and the page still looks plausible.
 */
const DEFINE_SOURCES = [
  join(ROOT, 'packages'),
  ...APPS.map((a) => join(ROOT, 'apps', a)),
]
const DEFINED = new Set()
const REFERENCED = new Map()   // name -> first "file:line" that reads it

/** Tailwind writes its own bookkeeping properties at build time. */
const FRAMEWORK = /^--(tw|radix|next|headlessui)-/

for (const dir of DEFINE_SOURCES) {
  for (const f of walk(dir)) {
    const src = readFileSync(f, 'utf8')
    // A CSS declaration, a quoted key in a React style object (which is how the
    // showcase engine sets its per-product theme), or a next/font binding.
    for (const m of src.matchAll(/(--[\w-]+)\s*:/g)) DEFINED.add(m[1])
    for (const m of src.matchAll(/['"`](--[\w-]+)['"`]\s*:/g)) DEFINED.add(m[1])
    for (const m of src.matchAll(/variable:\s*['"`](--[\w-]+)['"`]/g)) DEFINED.add(m[1])
  }
}
for (const app of APPS) {
  for (const f of walk(join(ROOT, 'apps', app))) {
    const rel = relative(ROOT, f).split(sep).join('/')
    // Comments stripped first. This rule read raw source, so a doc comment
    // explaining that a component avoids `var(--brand-*)` registered as a
    // reference to a custom property named `--brand-` and was reported as
    // dangling. Prose about a rule is not an instance of it — the standards
    // have required strip-comments.mjs for exactly this since ADR-0004, and
    // this check had not been using it.
    const lines = stripComments(readFileSync(f, 'utf8')).split('\n')
    lines.forEach((line, i) => {
      for (const m of line.matchAll(/var\(\s*(--[\w-]+)/g)) {
        if (!REFERENCED.has(m[1])) REFERENCED.set(m[1], rel + ':' + (i + 1))
      }
    })
  }
}
const dangling = [...REFERENCED.entries()]
  .filter(([name]) => !DEFINED.has(name) && !FRAMEWORK.test(name))
  .sort()

/**
 * Files whose output is read somewhere that has no CSS engine of ours.
 *
 * Listed rather than inferred, and each with its reason, because the
 * distinction is about where the bytes end up and nothing in the path says so.
 * `lib/documents/printCss.ts` is deliberately absent: it is injected into a
 * page in the browser via <style>, where custom properties resolve normally.
 */
const NO_CUSTOM_PROPERTIES = [
  { file: /lib[\/]email\.ts$/,                 why: 'transactional email markup' },
  { file: /lib[\/]documents[\/]emailHtml\.ts$/, why: 'invoice and quotation email markup' },
]

let travellingChecked = 0
const travelling = []
for (const app of APPS) {
  const base = join(ROOT, 'apps', app)
  if (!existsSync(base)) continue
  for (const f of walk(base)) {
    const rel = relative(ROOT, f).split(sep).join('/')
    const rule = NO_CUSTOM_PROPERTIES.find((r) => r.file.test(rel))
    if (!rule) continue
    travellingChecked++
    stripComments(readFileSync(f, 'utf8')).split('\n').forEach((line, i) => {
      for (const m of line.matchAll(/var\(\s*(--[\w-]+)/g)) {
        travelling.push({ where: rel + ':' + (i + 1), name: m[1], why: rule.why })
      }
    })
  }
}

// A rule that examines no files reports nothing and looks identical to a rule
// that examines many and finds nothing. ADR-0004.
if (travellingChecked === 0) {
  console.error('token inputs: no file matched the no-custom-properties list.')
  console.error('Either the list is stale or the files moved. Refusing to report clean.')
  process.exit(1)
}

console.log('='.repeat(74))
console.log(`token inputs: ${inputs.length} expected by the token package — ${inputs.join(', ')}`)
console.log(`${APPS.length} application(s), ${filesChecked} file(s) checked`)

console.log(`custom properties: ${DEFINED.size} defined, ${REFERENCED.size} referenced by an application`)
console.log(`${travellingChecked} file(s) whose output leaves the browser checked for custom properties`)

for (const [name, where] of dangling) {
  findings.push({ app: where, name, dangling: true })
}
for (const t of travelling) {
  findings.push({ app: t.where, name: t.name, travelling: true, why: t.why })
}

if (findings.length === 0) {
  console.log('TOKEN INPUTS: clean — every application defines what the token package reads,')
  console.log('              and every var() it uses resolves to something')
} else {
  console.log(`\nTOKEN INPUTS: ${findings.length} finding(s)\n`)
  for (const f of findings) {
    if (f.travelling) {
      console.log(`  ${f.name} at ${f.app} is written into ${f.why}`)
      console.log(`      Email clients do not implement custom properties. The declaration is`)
      console.log(`      dropped and the element inherits — silently, exactly as an undefined`)
      console.log(`      var() would. Use the TypeScript mirror: token, space, type from`)
      console.log(`      @maxpromo/design-tokens.`)
    } else if (f.dangling) {
      console.log(`  ${f.name} is referenced at ${f.app} and defined nowhere`)
      console.log(`      An undefined var() does not warn. With a fallback it silently uses it;`)
      console.log(`      without one the whole declaration is dropped and the element inherits.`)
    } else {
      console.log(`  apps/${f.app} never defines ${f.name}`)
      console.log(`      @maxpromo/design-tokens reads it. Undefined, it falls through to the`)
      console.log(`      fallback stack silently — no warning, no build error, a different face.`)
    }
  }
  console.log('\nIn Next, define it where the font is loaded:')
  console.log("  Inter({ subsets: ['latin'], variable: '--font-inter' })")
  process.exitCode = 1
}
