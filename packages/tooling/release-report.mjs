#!/usr/bin/env node
/**
 * packages/tooling/release-report.mjs
 *
 * What this deployment changes, and whether it is safe to make.
 *
 * WHY THIS EXISTS
 *
 * A deployment on this platform changes ten public domains at once. Until now
 * the only artefact it produced was a commit range: a reviewer could see which
 * files moved but not which *routes* that touched, what it cost, or whether the
 * gates had been run against exactly this tree.
 *
 * "Independent rollback per application is worth more than a single pipeline"
 * is ADR-0001's stated reason for two Vercel projects. Rollback is only worth
 * anything if someone can tell, quickly, what they are rolling back — and that
 * is a document, not a memory.
 *
 * WHAT IT PRODUCES
 *
 *   files changed        against a base ref, grouped by what they affect
 *   routes affected      derived from the files, not guessed
 *   domains affected     the routes, resolved through the Domain Registry
 *   bundle impact        this build against the budget baseline
 *   certification        which gates were run against this tree, and when
 *   rollback readiness   whether the previous release is still deployable
 *
 *   node packages/tooling/release-report.mjs
 *   node packages/tooling/release-report.mjs --base main --json
 *
 * WHAT IT DOES NOT DO
 *
 * Deploy anything, approve anything, or decide anything. It reads.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const ROOT = process.cwd()
const args = process.argv.slice(2)
const JSON_OUT = args.includes('--json')
const baseArg = args.indexOf('--base')
const BASE = baseArg !== -1 && args[baseArg + 1] ? args[baseArg + 1] : 'main'

function git(...a) {
  try {
    return execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return null
  }
}

if (git('rev-parse', '--git-dir') === null) {
  console.error('release: not a git repository.')
  process.exit(1)
}

const head = git('rev-parse', '--short', 'HEAD')
const branch = git('rev-parse', '--abbrev-ref', 'HEAD')

// ── Files changed ───────────────────────────────────────────────────────────
/**
 * Against the merge base, not against the tip of the base branch.
 *
 * `git diff main` on a branch that is behind reports every change *main* has
 * made as though this release were undoing them. The merge base is what this
 * branch actually adds.
 */
const mergeBase = git('merge-base', 'HEAD', BASE) ?? git('rev-parse', 'HEAD~1')
const committed = mergeBase ? (git('diff', '--name-only', mergeBase, 'HEAD') ?? '') : ''
const uncommitted = git('status', '--porcelain') ?? ''

const changed = new Set(
  committed.split('\n').map((l) => l.trim()).filter(Boolean),
)
for (const line of uncommitted.split('\n')) {
  const p = line.slice(3).trim()
  if (p) changed.add(p.replace(/^"|"$/g, ''))
}

const files = [...changed].sort()

// ── What each file affects ──────────────────────────────────────────────────
const CLASSES = [
  { id: 'routes',        test: (f) => /^apps\/[^/]+\/app\/.*\/(page|route|layout|error|not-found)\.(tsx?|mdx)$/.test(f) },
  { id: 'middleware',    test: (f) => /^apps\/[^/]+\/middleware\.ts$/.test(f) },
  { id: 'registries',    test: (f) => /^packages\/config\//.test(f) },
  { id: 'design system', test: (f) => /^packages\/(design-tokens|ui)\//.test(f) },
  { id: 'observability', test: (f) => /^packages\/observability\//.test(f) },
  { id: 'components',    test: (f) => /^apps\/[^/]+\/components\//.test(f) },
  { id: 'content',       test: (f) => /^apps\/[^/]+\/(messages|content)\//.test(f) },
  { id: 'library',       test: (f) => /^apps\/[^/]+\/lib\//.test(f) },
  { id: 'tooling',       test: (f) => /^packages\/tooling\//.test(f) },
  { id: 'documentation', test: (f) => /^docs\//.test(f) },
  { id: 'assets',        test: (f) => /^apps\/[^/]+\/public\//.test(f) },
  { id: 'configuration', test: (f) => /package(-lock)?\.json$|tsconfig|next\.config|\.github\//.test(f) },
]

const byClass = new Map()
for (const f of files) {
  const c = CLASSES.find((c) => c.test(f))?.id ?? 'other'
  if (!byClass.has(c)) byClass.set(c, [])
  byClass.get(c).push(f)
}

// ── Routes affected ─────────────────────────────────────────────────────────
/** A changed page/route file maps to the URL it serves. Derived, not guessed. */
function routeOf(file) {
  const m = file.match(/^apps\/([^/]+)\/app\/(.*)\/(page|route)\.(tsx?|mdx)$/)
  if (!m) return null
  const [, app, segments] = m
  const path = segments
    .split('/')
    .filter((s) => !s.startsWith('(') && s !== '')
    .map((s) => (s === '[locale]' ? '' : s))
    .filter(Boolean)
    .join('/')
  return { app, route: '/' + path }
}

const routes = [...new Set(files.map(routeOf).filter(Boolean).map((r) => `${r.app}:${r.route}`))].sort()

// ── Domains affected ────────────────────────────────────────────────────────
const domainsPath = join(ROOT, 'packages', 'config', 'domains.ts')
let domainsAffected = []
if (existsSync(domainsPath)) {
  const { DOMAIN_REGISTRY, servesRoute } = await import(pathToFileURL(domainsPath).href)
  const touchedWeb = routes.filter((r) => r.startsWith('web:')).map((r) => r.slice(4))
  const platformWide =
    byClass.has('middleware') || byClass.has('registries') ||
    byClass.has('design system') || byClass.has('observability')

  domainsAffected = DOMAIN_REGISTRY.filter((d) => {
    if (platformWide) return true
    if (d.app !== 'web') return false
    return touchedWeb.some((r) => servesRoute(d, r === '/' ? '/' : r))
  }).map((d) => d.host)
}

// ── Bundle impact ───────────────────────────────────────────────────────────
const budgetsPath = join(ROOT, 'packages', 'config', 'budgets.ts')
const bundle = []
if (existsSync(budgetsPath)) {
  const { BUDGETS } = await import(pathToFileURL(budgetsPath).href)
  for (const app of readdirSync(join(ROOT, 'apps'))) {
    const nextDir = join(ROOT, 'apps', app, '.next')
    if (!existsSync(join(nextDir, 'BUILD_ID'))) { bundle.push({ app, built: false }); continue }
    const manifest = join(nextDir, 'build-manifest.json')
    let shared = 0
    if (existsSync(manifest)) {
      const m = JSON.parse(readFileSync(manifest, 'utf8'))
      for (const f of [...(m.rootMainFiles ?? []), ...(m.polyfillFiles ?? [])]) {
        const p = join(nextDir, f)
        if (existsSync(p)) shared += statSync(p).size
      }
    }
    const b = BUDGETS.find((x) => x.id === `${app}.shared-js`)
    bundle.push({
      app, built: true,
      sharedKb: Math.round(shared / 1024),
      baselineKb: b?.measured ?? null,
      limitKb: b?.limit ?? null,
    })
  }
}

// ── Certification status ────────────────────────────────────────────────────
/**
 * Whether the gates ran, and against what.
 *
 * This reports what it can verify from the tree — a build exists and how old
 * it is — and refuses to assert anything about gates it did not watch run. A
 * release report that says "certified" because a script said so, without
 * evidence, is worse than one that says "unknown".
 */
const certification = (() => {
  const built = readdirSync(join(ROOT, 'apps'))
    .map((app) => {
      const id = join(ROOT, 'apps', app, '.next', 'BUILD_ID')
      return existsSync(id)
        ? { app, buildId: readFileSync(id, 'utf8').trim(), builtAt: statSync(id).mtime.toISOString() }
        : { app, buildId: null, builtAt: null }
    })
  const verify = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).scripts?.verify ?? ''
  const gates = verify.split('&&').map((s) => s.trim()).filter((s) => s.startsWith('npm run ')).length
  return { gates, built }
})()

// ── Rollback readiness ──────────────────────────────────────────────────────
const rollback = (() => {
  const previous = mergeBase ? git('rev-parse', '--short', mergeBase) : null
  const dirty = uncommitted.split('\n').filter(Boolean).length
  const dataChanges = files.filter((f) => /migrations?\//.test(f) || /\.sql$/.test(f))
  return {
    previous,
    uncommittedFiles: dirty,
    // A schema change is the one thing a code rollback does not undo.
    irreversible: dataChanges,
  }
})()

// ── Output ──────────────────────────────────────────────────────────────────
const report = {
  generatedAt: new Date().toISOString(),
  branch, head, base: BASE, mergeBase,
  files: files.length,
  byClass: Object.fromEntries([...byClass].map(([k, v]) => [k, v.length])),
  routes, domainsAffected, bundle, certification, rollback,
}

if (JSON_OUT) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log('='.repeat(74))
  console.log('RELEASE REPORT')
  console.log(`${branch} @ ${head}  ·  against ${BASE} (merge base ${rollback.previous ?? '?'})`)
  console.log('')

  console.log(`FILES — ${files.length} changed`)
  for (const [c, list] of [...byClass].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${String(list.length).padStart(4)}  ${c}`)
  }

  console.log(`\nROUTES — ${routes.length} affected`)
  for (const r of routes.slice(0, 20)) console.log(`  ${r}`)
  if (routes.length > 20) console.log(`  … and ${routes.length - 20} more`)
  if (routes.length === 0) console.log('  none — no page or route file changed')

  console.log(`\nDOMAINS — ${domainsAffected.length} of the registry`)
  if (domainsAffected.length) {
    const wide = byClass.has('middleware') || byClass.has('registries') ||
      byClass.has('design system') || byClass.has('observability')
    console.log(`  ${domainsAffected.join(', ')}`)
    if (wide) console.log('  (every domain: this release touches the middleware, a registry,')
    if (wide) console.log('   the design system or observability — all of which every host reads)')
  }

  console.log('\nBUNDLE')
  for (const b of bundle) {
    if (!b.built) { console.log(`  ${b.app.padEnd(8)} not built — bundle impact unknown`); continue }
    const delta = b.baselineKb === null ? '' :
      `  ${b.sharedKb - b.baselineKb >= 0 ? '+' : ''}${b.sharedKb - b.baselineKb} KB vs baseline`
    console.log(`  ${b.app.padEnd(8)} shared root JS ${String(b.sharedKb).padStart(4)} KB` +
      (b.limitKb ? ` of ${b.limitKb} KB budget` : '') + delta)
  }

  console.log('\nCERTIFICATION')
  console.log(`  merge gate defines ${certification.gates} gates`)
  for (const b of certification.built) {
    console.log(`  ${b.app.padEnd(8)} ${b.buildId ? `build ${b.buildId} at ${b.builtAt}` : 'NOT BUILT'}`)
  }
  console.log('  This report does not assert the gates passed. Run `npm run certify`')
  console.log('  and read its output — a status nobody watched is not a status.')

  console.log('\nROLLBACK')
  console.log(`  previous release  ${rollback.previous ?? 'unknown'}`)
  console.log(`  uncommitted files ${rollback.uncommittedFiles}` +
    (rollback.uncommittedFiles ? '  — commit or stash before deploying' : ''))
  if (rollback.irreversible.length) {
    console.log(`  IRREVERSIBLE      ${rollback.irreversible.length} schema or data file(s):`)
    for (const f of rollback.irreversible) console.log(`                    ${f}`)
    console.log('                    A code rollback does not undo these.')
  } else {
    console.log('  irreversible      none — no schema or data migration in this release')
  }
}
