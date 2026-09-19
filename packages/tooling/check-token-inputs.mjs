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
import { join, relative, sep, dirname } from 'node:path'
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
 * PART THREE - a var() in markup that leaves the browser.
 *
 * WHY THIS IS A GRAPH AND NOT A LIST OF FILENAMES
 *
 * It was a list of two filenames, `lib/email.ts` and
 * `lib/documents/emailHtml.ts`, and both were clean, because both were where
 * the defect was found the first time. The list was pinned to the two known
 * offenders rather than to the property that defines the class. When the same
 * markup was later written inside three API route handlers, this check
 * examined them zero times and reported clean over thirty-eight unresolved
 * custom properties in invoice, quotation and newsletter email.
 *
 * That is the ADR-0004 failure mode wearing a different coat. The check did not
 * pass because it looked and found nothing. It passed because it only ever
 * looked where the bug had already been fixed. A gate that must be extended by
 * hand every time someone builds a new surface is a reminder, not a gate.
 *
 * THE INVARIANT THAT ACTUALLY MATTERS
 *
 * Not "this file is named email.ts". It is:
 *
 *   markup that reaches the mail transport must not reference a CSS custom
 *   property, because nothing on the other side defines one.
 *
 * So the class is computed from the architecture. The transport is found by
 * what it does, the module that posts to the Resend API, and the outbound set
 * is everything that can reach it through local imports. A future route that
 * imports `sendEmail` and writes `var(--brand-text)` joins the set the moment
 * it is written, with nobody editing this file.
 *
 * WHAT IS EXCLUDED, AND WHY IT NEEDS NO EXCLUSION ENTRY
 *
 * `lib/documents/printCss.ts` uses `var(--brand-surface)` and is correct: it is
 * injected into a page in the browser through a <style> element by
 * `components/documents/DocumentPage.tsx`, where custom properties resolve
 * normally. The old list had to name it in a comment to keep it out. The graph
 * never reaches it, because no mail route imports it. The architecture does the
 * classifying.
 */

/** Evidence of the transport itself: the module that posts to the mail API. */
const TRANSPORT = /api\.resend\.com/

/**
 * Local import specifiers only. A package cannot be part of this app's graph.
 *
 * `[^'"]*?` rather than `[^'"\n]*` because an import statement wraps. The first
 * draft of this regex forbade newlines, and `send-invoice/route.ts` imports
 * eight named exports from `lib/documents/emailHtml` across four lines, so the
 * edge was invisible and the file that builds the invoice letterhead sat
 * outside the graph. A detector that silently sees less than it claims is the
 * thing this whole part exists to stop, so it is worth saying twice: the bug
 * was found by listing the set and reading it, not by the check going red.
 */
const IMPORTS = /(?:^|\n)\s*(?:import|export)[^'"]*?['"](@\/[^'"]+|\.[^'"]+)['"]/g

/** A file is outbound markup only if it actually contains markup or style text. */
const MARKUP = /<(?:div|p|td|tr|table|span|a|body|html|h[1-6])[\s>]|style="/

/**
 * Genuine browser-rendered sources that the graph reaches anyway.
 *
 * Empty, and it should stay that way. An entry here is a claim that a file
 * reachable from the mail transport is nevertheless rendered by a browser, and
 * it has to say who renders it. If you are adding one to make a build pass,
 * the defect is real.
 */
const BROWSER_RENDERED = []

/** Resolve a local specifier to a file on disk, or null. */
function resolveLocal(spec, fromFile, appBase) {
  const base = spec.startsWith('@/')
    ? join(appBase, spec.slice(2))
    : join(dirname(fromFile), spec)
  const candidates = [base, base + '.ts', base + '.tsx', base + '.mjs',
                      join(base, 'index.ts'), join(base, 'index.tsx')]
  for (const cand of candidates) {
    try { if (statSync(cand).isFile()) return cand } catch { /* not this one */ }
  }
  return null
}

let travellingChecked = 0
let transportsFound = 0
const travelling = []
/**
 * Which files the outbound rule actually covers.
 *
 * Printed on request, because "how many" is not an answer to "is my new email
 * surface protected". The set is derived, so the only way to know what is in
 * it is to ask:  TOKEN_INPUTS_LIST=1 npm run check:token-inputs
 */
const outboundFiles = []

for (const app of APPS) {
  const appBase = join(ROOT, 'apps', app)
  if (!existsSync(appBase)) continue
  const files = walk(appBase)

  // 1. The transport, by behaviour rather than by name.
  const transports = files.filter((f) => TRANSPORT.test(readFileSync(f, 'utf8')))
  if (transports.length === 0) continue
  transportsFound += transports.length

  // 2. Everything that can reach it. The question is "does this file's markup
  //    end up in an email", and that is answered by what it flows into.
  const importsOf = new Map()
  for (const f of files) {
    const src = stripComments(readFileSync(f, 'utf8'))
    const targets = []
    for (const m of src.matchAll(IMPORTS)) {
      const r = resolveLocal(m[1], f, appBase)
      if (r) targets.push(r)
    }
    importsOf.set(f, targets)
  }

  //    Two directions, and both are needed.
  //
  //    Upstream, by importer: a route that imports the transport sends mail, so
  //    its own markup travels. That catches the three API handlers.
  //
  //    Downstream, by import: a module that a sender pulls in to build the
  //    message also travels, even though it imports nothing itself. That
  //    catches `lib/documents/emailHtml.ts`, which builds the invoice
  //    letterhead and is one of the two files the old list named. Walking only
  //    one direction would have quietly dropped it while appearing to widen
  //    coverage.
  const outbound = new Set(transports)
  let grew = true
  while (grew) {
    grew = false
    for (const [f, targets] of importsOf) {
      if (outbound.has(f)) continue
      if (targets.some((t) => outbound.has(t))) { outbound.add(f); grew = true }
    }
  }
  grew = true
  while (grew) {
    grew = false
    for (const f of [...outbound]) {
      for (const t of importsOf.get(f) ?? []) {
        if (!outbound.has(t)) { outbound.add(t); grew = true }
      }
    }
  }

  // 3. Of those, the ones that actually produce markup.
  for (const f of outbound) {
    const rel = relative(ROOT, f).split(sep).join('/')
    if (BROWSER_RENDERED.some((r) => r.file.test(rel))) continue
    const src = stripComments(readFileSync(f, 'utf8'))
    if (!MARKUP.test(src)) continue
    travellingChecked++
    outboundFiles.push(rel)
    src.split('\n').forEach((line, i) => {
      for (const m of line.matchAll(/var\(\s*(--[\w-]+)/g)) {
        travelling.push({
          where: rel + ':' + (i + 1),
          name: m[1],
          why: 'markup that reaches the mail transport',
        })
      }
    })
  }
}

// A rule that examines no files reports nothing and looks identical to a rule
// that examines many and finds nothing. ADR-0004.
if (transportsFound === 0) {
  console.error('token inputs: no mail transport found in any application.')
  console.error('The outbound check has nothing to anchor to. Either the transport moved or')
  console.error('its API host changed. Refusing to report clean.')
  process.exit(1)
}
if (travellingChecked === 0) {
  console.error('token inputs: the mail transport is reachable from no markup at all.')
  console.error('That is not plausible while the application sends email. Refusing to report clean.')
  process.exit(1)
}

console.log('='.repeat(74))
console.log(`token inputs: ${inputs.length} expected by the token package — ${inputs.join(', ')}`)
console.log(`${APPS.length} application(s), ${filesChecked} file(s) checked`)

console.log(`custom properties: ${DEFINED.size} defined, ${REFERENCED.size} referenced by an application`)
console.log(`${travellingChecked} file(s) whose output leaves the browser checked for custom properties`)
if (process.env.TOKEN_INPUTS_LIST) {
  for (const f of outboundFiles.sort()) console.log(`    ${f}`)
}

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
