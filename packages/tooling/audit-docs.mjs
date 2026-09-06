#!/usr/bin/env node
/**
 * packages/tooling/audit-docs.mjs
 *
 * Every fact has one authoritative location, and every pointer to it resolves.
 *
 * WHY THIS EXISTS
 *
 * This repository's documentation is unusually load-bearing: chat history is
 * not a source of truth, so `docs/` is where decisions, risks and reasoning
 * actually live. That makes documentation drift a correctness problem rather
 * than a tidiness one — and drift here is silent in a way code drift is not,
 * because nothing compiles a paragraph.
 *
 * Three shapes of it have already happened:
 *
 *   A link to a file that moved.  `history/` is full of documents that
 *   referenced each other by path, and paths changed at the consolidation.
 *
 *   A count that stopped being true.  `brand/design-system.md` said the merge
 *   gate had eight gates while it had ten. The sentence was correct when it
 *   was written, which is exactly why nobody re-read it.
 *
 *   A product list that fell behind the registry.  `openclaw/core-memory.md`
 *   lists the operating systems the company builds; the Brand Registry lists
 *   the ones it has. They disagreed on four.
 *
 * WHAT IT CHECKS
 *
 *   1. Every file this documentation names — as a Markdown link or, far more
 *      often here, as a backticked path — exists.
 *   2. Every gate count stated beside `npm run verify` matches it.
 *   3. Every product named in the registries appears in the company's own
 *      ecosystem list, and vice versa.
 *   4. Every document under docs/ is reachable — from the constitution, the
 *      README, or another document. An unreferenced document is one nobody
 *      will find and nobody will update.
 *
 * Rules 3 and 4 report rather than fail: what the company says it builds is a
 * business statement, and an orphan document may be deliberate. Rules 1 and 2
 * fail the run.
 *
 *   node packages/tooling/audit-docs.mjs
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, dirname, relative, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = process.cwd()
const DOCS = join(ROOT, 'docs')

if (!existsSync(DOCS)) {
  console.error('docs: no docs/ directory under ' + ROOT)
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (name.endsWith('.md')) out.push(p)
  }
  return out
}

const FILES = walk(DOCS)
if (FILES.length === 0) {
  console.error('docs: found no Markdown under docs/')
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

const rel = (p) => relative(ROOT, p).split(sep).join('/')

const findings = []
const notes = []
const add = (what, why) => findings.push({ what, why })

// ── Strip fenced code, so an example path is not read as a link ─────────────
const stripCode = (src) => src.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '')

// ── 1. References resolve ───────────────────────────────────────────────────
/**
 * This repository does not use Markdown links. It references files by
 * backticked path — `architecture/platform.md`, `packages/config/domains.ts` —
 * and there are hundreds of them.
 *
 * The first draft of this rule checked Markdown links only, found zero of them,
 * and reported clean. A rule that examines nothing looks exactly like a rule
 * that examines everything and finds nothing (ADR-0004), so both forms are
 * checked and a run that resolves no reference at all is a failure.
 */
const REPO_ROOTS = ['docs/', 'apps/', 'packages/', '.github/']
const CODE_EXT = /\.(md|ts|tsx|mjs|css|json|yml|yaml)$/

/**
 * Every root a reader would try, in the order they would try it.
 *
 * Documentation here writes paths from whichever perspective the sentence is
 * in: repository-relative (`packages/config/domains.ts`), docs-relative
 * (`architecture/platform.md`), or application-relative (`lib/db/queries.ts`,
 * meaning `apps/bureau/lib/...`). All three are legitimate and all three are
 * findable, so all three resolve. Only a path that exists under none of them
 * is a broken reference.
 */
/**
 * Markers that a sentence is about a file's absence rather than pointing at it.
 *
 * Deliberately narrow and listed rather than inferred: each word here is one
 * this repository's documentation actually uses when recording a removal.
 */
const GONE = /\b(removed|deleted|retired|superseded|no longer|do not exist|does not exist|not present|missing|replaced by|is gone|used to|previously|before this|until v\d)/i

const APP_ROOTS = existsSync(join(ROOT, 'apps'))
  ? readdirSync(join(ROOT, 'apps')).map((a) => join(ROOT, 'apps', a))
  : []

function resolveReference(file, target) {
  if (REPO_ROOTS.some((r) => target.startsWith(r))) return join(ROOT, target)
  const candidates = [
    resolve(dirname(file), target),
    resolve(DOCS, target),
    join(ROOT, target),
    ...APP_ROOTS.map((a) => join(a, target)),
  ]
  return candidates.find((c) => existsSync(c)) ?? candidates[0]
}

let linksChecked = 0
for (const file of FILES) {
  // history/ describes how things were. A superseded document naming a file
  // that has since been deleted is correct — that is what supersession means.
  // Holding it to the current tree would either produce permanent noise or
  // pressure someone to edit the record of a decision.
  if (rel(file).startsWith('docs/history/')) continue
  const raw = readFileSync(file, 'utf8')

  for (const m of stripCode(raw).matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = m[1].trim()
    if (/^(https?:|mailto:|#)/.test(target)) continue
    const path = target.split('#')[0]
    if (!path) continue
    linksChecked++
    if (!existsSync(resolveReference(file, path))) {
      add(`${rel(file)} links to ${target}`, 'The file is not there. A pointer that does not resolve is worse than no pointer: it reads as an answer.')
    }
  }

  raw.split(/\r?\n/).forEach((line, i) => {
    // A path in a sentence about its removal is not a pointer.
    //
    // Current documents legitimately name files that no longer exist —
    // "(`lib/host/HOST_MAP.ts`) is deleted", "recorded when `tenancy.ts` was
    // removed as unused". Those sentences are the record of the removal, and
    // requiring prose to avoid naming what it is about would distort the
    // writing rather than improve the accuracy.
    if (GONE.test(line)) return
    for (const m of line.matchAll(/`([A-Za-z0-9_@./-]+)`/g)) {
      const target = m[1]
      if (!target.includes('/') || !CODE_EXT.test(target)) continue
      linksChecked++
      if (!existsSync(resolveReference(file, target))) {
        add(`${rel(file)}:${i + 1} references ${target}`, 'No such file. Documentation that names a path readers will try has to be right about it.')
      }
    }
  })
}

if (linksChecked === 0) {
  console.error('docs: resolved no file reference at all.')
  console.error('Either the documentation stopped naming files or the rule stopped matching.')
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

// ── 2. Gate-count claims match the merge gate ───────────────────────────────
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
const verify = pkg.scripts?.verify ?? ''
const GATES = verify.split('&&').map((s) => s.trim()).filter((s) => s.startsWith('npm run ')).length
if (GATES === 0) {
  console.error('docs: parsed no gates out of the verify chain.')
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

const WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
}
let claimsChecked = 0
for (const file of FILES) {
  // history/ describes how things were; a stale count there is the point.
  if (rel(file).startsWith('docs/history/')) continue
  const src = readFileSync(file, 'utf8')
  src.split(/\r?\n/).forEach((line, i) => {
    // Only a count stated beside the command that runs it.
    //
    // The first draft matched any "N gates" and reported five findings, all
    // five of them historical narration — "the root ran eight gates", "three
    // gates had never run". The documentation was right and the rule was
    // wrong. A number next to `npm run verify` is a claim about `npm run
    // verify`; a number in a sentence about what used to happen is not.
    if (!line.includes('npm run verify')) return
    for (const m of line.matchAll(/\b(\d+|[a-z]+)\s+gates?\b/gi)) {
      const raw = m[1].toLowerCase()
      const n = /^\d+$/.test(raw) ? Number(raw) : WORDS[raw]
      if (n === undefined) continue
      claimsChecked++
      if (n !== GATES) {
        add(
          `${rel(file)}:${i + 1} says "${m[0]}"`,
          `The merge gate runs ${GATES}. A count that was true when it was written is exactly the sentence nobody re-reads.`,
        )
      }
    }
  })
}
if (claimsChecked === 0) {
  console.error('docs: no document states a gate count beside `npm run verify`.')
  console.error('Either the wording changed or the rule stopped matching. Refusing to report clean.')
  process.exit(1)
}

// ── 3. The company's ecosystem list against the registries ──────────────────
const brandsPath = join(ROOT, 'packages', 'config', 'brands.ts')
let productNames = null
if (existsSync(brandsPath)) {
  const { BRAND_REGISTRY } = await import(pathToFileURL(brandsPath).href)
  productNames = BRAND_REGISTRY
    .filter((b) => b.slug !== 'maxpromo' && b.slug !== 'maxpromo-os')
    .map((b) => b.name)
}

const memoryPath = join(DOCS, 'openclaw', 'core-memory.md')
if (productNames && existsSync(memoryPath)) {
  const memory = readFileSync(memoryPath, 'utf8')
  const section = memory.slice(memory.indexOf('# CURRENT ECOSYSTEM'))
  if (section) {
    const listed = [...section.matchAll(/^- (.+)$/gm)].map((m) => m[1].trim())
    const missing = productNames.filter((n) => !listed.includes(n))
    const extra = listed.filter(
      (n) => !productNames.includes(n) && !['Maxpromo Digital', 'OpenClaw'].includes(n),
    )
    if (missing.length) notes.push(`core-memory's ecosystem list does not name: ${missing.join(', ')}`)
    if (extra.length) notes.push(`core-memory names products the Brand Registry does not have: ${extra.join(', ')}`)
  }
}

// ── 4. Reachability ─────────────────────────────────────────────────────────
const referenced = new Set()
const BASENAMES = new Map(FILES.map((f) => [f.split(sep).pop(), f]))
for (const file of FILES) {
  const raw = readFileSync(file, 'utf8')
  for (const m of stripCode(raw).matchAll(/\[[^\]]*\]\(([^)#]+)/g)) {
    referenced.add(resolveReference(file, m[1].trim()))
  }
  for (const m of raw.matchAll(/`([A-Za-z0-9_./-]+\.md)`/g)) {
    const target = m[1]
    // The same resolution rule as rule 1, so a document counted as reachable
    // and a reference counted as resolving cannot disagree.
    referenced.add(resolveReference(file, target))
    // A bare filename — `domain-strategy.md` inside a sentence naming its
    // directory — is how this documentation refers to a document it has just
    // located for the reader. It is a reference.
    if (!target.includes('/') && BASENAMES.has(target)) referenced.add(BASENAMES.get(target))
  }
}
const orphans = FILES.filter(
  (f) => !referenced.has(f) &&
    rel(f) !== 'docs/README.md' &&
    rel(f) !== 'docs/PLATFORM-CONSTITUTION.md',
)
for (const o of orphans) notes.push(`${rel(o)} is referenced by no other document`)

// ── Report ──────────────────────────────────────────────────────────────────
console.log('='.repeat(74))
console.log('DOCUMENTATION')
console.log(`${FILES.length} document(s), ${linksChecked} relative link(s), ${claimsChecked} gate-count claim(s)`)
console.log(`merge gate: ${GATES} gates`)

if (notes.length) {
  console.log('\nReported, not failed:')
  for (const n of notes) console.log(`  · ${n}`)
}

if (findings.length === 0) {
  console.log('\nDOCUMENTATION: clean — every pointer resolves and every stated count is current')
} else {
  console.log(`\nDOCUMENTATION: ${findings.length} finding(s)\n`)
  for (const f of findings) {
    console.log(`  ${f.what}`)
    console.log(`      ${f.why}`)
  }
  process.exitCode = 1
}
