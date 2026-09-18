#!/usr/bin/env node
/**
 * packages/tooling/audit-budgets.mjs
 *
 * What the platform costs, measured against what it is allowed to cost.
 *
 * WHY THIS EXISTS
 *
 * Performance was the only category on the v14.0 scorecard with no evidence at
 * all — it scored 1 out of 5 because nothing measured it, not because anything
 * was known to be slow. Every other property this platform cares about became
 * a record with a check behind it the second time it mattered. This is that
 * check.
 *
 * WHAT IT MEASURES
 *
 * Only what a production build determines, with no browser and no network:
 *
 *   shared root JavaScript   the floor every visitor pays before their page
 *   total JavaScript         the bound on what any route could cost
 *   shared CSS               the floor every visitor pays, in stylesheets
 *   route-delivered CSS      shared plus the heaviest route's own chunk
 *   total CSS                every chunk summed, reported and never blocking
 *   public directory weight  what is deployed and what optimisation draws from
 *   largest single image     and how many are over half a megabyte
 *
 * CSS IS THREE NUMBERS BECAUSE THE BUILD EMITS MORE THAN ONE STYLESHEET
 *
 * It used to be one, and that was right while one stylesheet was emitted: the
 * sum and the payload were the same file. They have come apart. Route-scoped
 * CSS means several chunks that no single visitor receives together, so the sum
 * describes nobody and must not be the number that fails a build. The two that
 * do fail a build are the ones a person actually downloads — see the reasoning
 * recorded against the budgets themselves in packages/config/budgets.ts.
 *
 * Core Web Vitals are deliberately absent. LCP, INP and CLS need a browser,
 * and a lab measurement of them on whatever machine happens to run the build
 * is not a number to fail a merge on. `audit:lighthouse` measures those
 * against a production server and records them in the baseline.
 *
 * IT RUNS AFTER THE BUILD, AND SAYS SO WHEN IT HAS NOT
 *
 * There is no build output to measure before `next build` has run. A check
 * that quietly reports clean because it found nothing to look at is the
 * failure this repository has now found nine times in its own tooling
 * (ADR-0004), so a missing build is an error rather than a pass.
 *
 *   node packages/tooling/audit-budgets.mjs
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = process.cwd()
const KB = 1024
const MB = 1024 * 1024

const budgetsPath = join(ROOT, 'packages', 'config', 'budgets.ts')
if (!existsSync(budgetsPath)) {
  console.error('budgets: no registry at packages/config/budgets.ts')
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}
const { BUDGETS } = await import(pathToFileURL(budgetsPath).href)

if (!Array.isArray(BUDGETS) || BUDGETS.length === 0) {
  console.error('budgets: the registry is empty.')
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

const APPS = existsSync(join(ROOT, 'apps')) ? readdirSync(join(ROOT, 'apps')) : []
if (APPS.length === 0) {
  console.error('budgets: no applications under apps/')
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

// ── Measurement ─────────────────────────────────────────────────────────────

function walkFiles(dir) {
  const out = []
  if (!existsSync(dir)) return out
  const visit = (d) => {
    for (const f of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, f.name)
      if (f.isDirectory()) visit(p)
      else out.push([p, statSync(p).size])
    }
  }
  visit(dir)
  return out
}

/**
 * The JavaScript every page loads before anything of its own.
 *
 * Read from `build-manifest.json` rather than guessed from filenames: the
 * manifest is what the framework itself uses to decide what to put in the
 * document, so it cannot disagree with what a browser receives.
 */
function sharedRootJs(appDir) {
  const manifest = join(appDir, '.next', 'build-manifest.json')
  if (!existsSync(manifest)) return null
  const m = JSON.parse(readFileSync(manifest, 'utf8'))
  const files = [...(m.rootMainFiles ?? []), ...(m.polyfillFiles ?? [])]
  if (files.length === 0) return null
  let bytes = 0
  for (const f of files) {
    const p = join(appDir, '.next', f)
    if (existsSync(p)) bytes += statSync(p).size
  }
  return { bytes, count: files.length }
}

/**
 * CSS split into what everyone loads and what one route adds.
 *
 * WHY THE SHARED CHUNK IS FOUND BY PROVENANCE AND NOT BY NAME
 *
 * Nothing in the build output maps a route to its stylesheets: `build-manifest`
 * carries no CSS at all, and the emitted filenames are content hashes that say
 * nothing about where a rule came from. Guessing from a filename, or assuming
 * the biggest chunk is the shared one, would be a naming convention pretending
 * to be a measurement — which is exactly the class of check this repository has
 * had to delete before (ADR-0004).
 *
 * So the chunk is identified by what is inside it. The root layout imports one
 * stylesheet and every page in the application is rendered inside that layout,
 * which makes its chunk the shared one by definition. We read the class names
 * out of that source file and find the emitted chunk that carries them. The
 * remaining chunks are route-scoped by elimination, and the worst case for a
 * visitor is the shared chunk plus the largest of them.
 *
 * Returns null when the layout, its stylesheet, or a confident match is
 * missing, so an unmeasurable split reports as unmeasured rather than as clean.
 */
function cssSplit(appDir) {
  const layouts = ['layout.tsx', 'layout.jsx', 'layout.ts', 'layout.js']
    .map((f) => join(appDir, 'app', f))
    .filter((p) => existsSync(p))
  if (layouts.length === 0) return null

  // The stylesheet the root layout imports, resolved relative to the layout.
  const src = readFileSync(layouts[0], 'utf8')
  const imported = [...src.matchAll(/import\s+['"](\.[^'"]+\.css)['"]/g)].map((m) => m[1])
  if (imported.length === 0) return null
  const globalCss = join(appDir, 'app', imported[0].replace(/^\.\//, ''))
  if (!existsSync(globalCss)) return null

  // Class names written in that stylesheet. Enough of them, and distinctive
  // enough, that the chunk carrying it cannot be confused with another.
  const declared = new Set(
    [...readFileSync(globalCss, 'utf8').matchAll(/\.([a-z][a-z0-9-]{4,})/gi)].map((m) => m[1]),
  )
  if (declared.size < 20) return null

  const chunks = walkFiles(join(appDir, '.next', 'static'))
    .filter(([p]) => p.endsWith('.css'))
  if (chunks.length === 0) return null

  // Score each chunk by how much of the root stylesheet it contains.
  const scored = chunks.map(([p, size]) => {
    const text = readFileSync(p, 'utf8')
    let hits = 0
    for (const c of declared) if (text.includes(`.${c}`)) hits++
    return { p, size, share: hits / declared.size }
  })
  scored.sort((a, b) => b.share - a.share)

  // The winner has to look like the root stylesheet, and has to be the only
  // one that does. A near-tie means the attribution is guesswork.
  const [best, next] = scored
  if (best.share < 0.5) return null
  if (next && next.share > best.share * 0.6) return null

  const route = scored.slice(1)
  return {
    shared: best.size,
    heaviestRoute: route.length ? Math.max(...route.map((c) => c.size)) : 0,
    chunks: scored.length,
  }
}

const measurements = new Map()
const unbuilt = []

for (const app of APPS) {
  const appDir = join(ROOT, 'apps', app)
  const nextDir = join(appDir, '.next')

  if (!existsSync(join(nextDir, 'BUILD_ID'))) { unbuilt.push(app); continue }

  const shared = sharedRootJs(appDir)
  if (!shared) { unbuilt.push(`${app} (no build manifest)`); continue }
  measurements.set(`${app}.shared-js`, shared.bytes / KB)

  const staticFiles = walkFiles(join(nextDir, 'static'))
  measurements.set(`${app}.total-js`,
    staticFiles.filter(([p]) => p.endsWith('.js')).reduce((a, [, s]) => a + s, 0) / KB)
  measurements.set(`${app}.total-css`,
    staticFiles.filter(([p]) => p.endsWith('.css')).reduce((a, [, s]) => a + s, 0) / KB)

  const css = cssSplit(appDir)
  if (css) {
    measurements.set(`${app}.shared-css`, css.shared / KB)
    measurements.set(`${app}.route-css`, (css.shared + css.heaviestRoute) / KB)
  }

  const publicFiles = walkFiles(join(appDir, 'public'))
  measurements.set(`${app}.public-weight`, publicFiles.reduce((a, [, s]) => a + s, 0) / MB)
  const IMAGE = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.svg'])
  const images = publicFiles.filter(([p]) => IMAGE.has(extname(p).toLowerCase()))
  measurements.set(`${app}.largest-image`,
    images.length ? Math.max(...images.map(([, s]) => s)) / KB : 0)
  measurements.set(`${app}.images-over-500kb`,
    images.filter(([, s]) => s > 500 * KB).length)
}

if (unbuilt.length === APPS.length) {
  console.error(`budgets: no application has been built (${unbuilt.join(', ')}).`)
  console.error('Run `npm run build` first. Refusing to report clean without a build to measure.')
  process.exit(1)
}

// ── Comparison ──────────────────────────────────────────────────────────────

const findings = []
const rows = []
let checked = 0

for (const b of BUDGETS) {
  const value = measurements.get(b.id)
  if (value === undefined) {
    // A budget whose subject was not measured is a budget enforcing nothing.
    findings.push({
      what: `${b.id} has no measurement`,
      why: `Nothing produced a value for "${b.what}". Either the build output moved or the budget names a scope that no longer exists — either way this budget is not protecting anything.`,
    })
    continue
  }
  checked++

  // An informational budget is still measured, still printed, and still shows
  // its drift. It simply does not fail the build, because the number does not
  // describe anything a person downloads.
  const over = value > b.limit && !b.informational
  const drift = b.measured === 0 ? 0 : ((value - b.measured) / b.measured) * 100
  rows.push({ b, value, over, drift })

  if (over) {
    findings.push({
      what: `${b.id} is ${fmt(value, b.unit)}, over its ${fmt(b.limit, b.unit)} budget`,
      why: `${b.why} It measured ${fmt(b.measured, b.unit)} when the budget was set.`,
    })
  }
}

if (checked === 0) {
  console.error('budgets: not one budget resolved to a measurement.')
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

function fmt(v, unit) {
  if (unit === 'count') return `${Math.round(v)}`
  if (unit === 'MB') return `${v.toFixed(1)} MB`
  if (unit === 'KB') return `${Math.round(v)} KB`
  return `${Math.round(v)} ${unit}`
}

function bar(value, limit) {
  const width = 18
  const filled = Math.min(width, Math.round((value / limit) * width))
  return '█'.repeat(filled) + '·'.repeat(Math.max(0, width - filled))
}

// ── Report ──────────────────────────────────────────────────────────────────

console.log('='.repeat(74))
console.log('PERFORMANCE BUDGETS')
console.log(`${checked} budget(s) measured against a production build` +
  (unbuilt.length ? ` · not built: ${unbuilt.join(', ')}` : ''))
console.log('')
console.log('  id                        measured    now      budget   since baseline')
for (const { b, value, over, drift } of rows) {
  const sign = drift > 0.5 ? '+' : ''
  const move = Math.abs(drift) < 0.5 ? 'unchanged' : `${sign}${drift.toFixed(0)}%`
  console.log(
    `  ${b.id.padEnd(24)} ${fmt(b.measured, b.unit).padStart(8)} ${fmt(value, b.unit).padStart(8)} ` +
    `${fmt(b.limit, b.unit).padStart(9)}   ${move.padStart(9)}` +
    `${over ? ' OVER' : ''}${b.informational ? '  (reported, not enforced)' : ''}`,
  )
  console.log(`    ${bar(value, b.limit)}`)
}

if (findings.length === 0) {
  console.log('\nBUDGETS: clean — everything measured is inside what it is allowed to cost')
} else {
  console.log(`\nBUDGETS: ${findings.length} finding(s)\n`)
  for (const f of findings) {
    console.log(`  ${f.what}`)
    console.log(`      ${f.why}`)
  }
  console.log('')
  console.log('Budgets are in packages/config/budgets.ts. Raising a limit is a decision')
  console.log('and belongs in the change log; the `measured` baseline is never edited to')
  console.log('make a check pass.')
  process.exitCode = 1
}
