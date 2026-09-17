#!/usr/bin/env node
/**
 * packages/tooling/audit-responsive.mjs
 *
 * Static responsive audit across every application.
 *
 * Checks the failure modes that actually ship: a multi-column grid with no
 * single-column state, a fixed width wider than a phone viewport, and a
 * section padding invented at the call site. The first two are invisible on a
 * desktop and obvious on a phone, which is why they survive review.
 *
 * The third is invisible everywhere except side by side. The design system
 * defines exactly three section rhythms and says a section not using one fails
 * review; the rule was written in three documents and checked in none, and the
 * public site shipped five ad-hoc clamps and used a token in one place. Two of
 * them sat next to each other on the homepage — 140px of padding above a
 * section and 112px below it — which no single screenshot shows.
 *
 *   node packages/tooling/audit-responsive.mjs
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const ROOT = process.cwd()
const SKIP = new Set(['node_modules', '.next', '.git', 'out', 'dist'])
/**
 * The narrowest viewport we support: 320px, down from 380px.
 *
 * 380 was above the smallest phone anybody actually uses, so the audit could
 * not see the widths that break on one. The mobile pass measured every public
 * route and every Agent Bureau route at 320 and found two real overflows the
 * old threshold had no opinion about, so the threshold now matches the
 * narrowest column of the QA matrix rather than sitting just above it.
 */
const NARROWEST = 320

/**
 * The hub's internal back office is not a phone surface.
 *
 * `apps/web/app/os` is Marcel's own admin tool: one operator, on a desktop,
 * behind a login, with invoice and quotation tables that are wide because the
 * documents are. It carries three inline widths between 320 and 380 that the
 * tightened threshold now sees. Widening the audit to catch phone bugs on the
 * public site should not turn into a rebuild of the back office, and squeezing
 * a quotation editor into 320px would be work nobody asked for and nobody
 * would use — so this surface is named here rather than quietly fixed or the
 * threshold quietly left loose. If /os ever becomes something used on a phone,
 * deleting this line is the first step.
 */
const NOT_A_PHONE_SURFACE = /^apps\/web\/app\/os\//

function walk(dir, out = []) {
  let entries
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return out }
  for (const e of entries) {
    if (SKIP.has(e.name)) continue
    const p = join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

const rel = (p) => relative(ROOT, p).split(sep).join('/')
const apps = existsSync(join(ROOT, 'apps')) ? readdirSync(join(ROOT, 'apps')) : []
const scanRoots = [...apps.map((a) => join(ROOT, 'apps', a)), join(ROOT, 'packages')]
const files = scanRoots.flatMap((r) => walk(r))

// ADR-0004: a check that resolved nothing must not report clean.
if (files.length === 0) {
  console.error('responsive: no files found under ' + ROOT)
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

const findings = []
let gridsChecked = 0
let queriesFound = 0

// ── CSS: every multi-column grid needs a single-column state somewhere ──────
for (const f of files.filter((f) => f.endsWith('.css'))) {
  const css = readFileSync(f, 'utf8')
  queriesFound += (css.match(/@media/g) || []).length

  const decls = [...css.matchAll(/([.#][\w-]+)[^{}]*\{([^}]*)\}/g)]
  const multi = new Set()
  const single = new Set()
  for (const [, sel, body] of decls) {
    const m = body.match(/grid-template-columns:\s*([^;]+);/)
    if (!m) continue
    const v = m[1].trim()
    /**
     * A single-column state, in the three forms this platform writes it.
     *
     * `minmax(0, 1fr)` was not recognised, and it is the form that is actually
     * safe. A bare `1fr` is `minmax(auto, 1fr)`, and that automatic minimum is
     * the largest child's MIN-CONTENT width — for a German compound, the width
     * of the whole unbroken word. The homepage shipped `grid-template-columns:
     * 1fr` on the architecture map, "Prozessautomatisierung" measured 255px,
     * and the single column sized itself to 255px inside a 173px grid: a
     * one-column grid, declared correctly by this audit's rule, pushing the
     * page sideways at 320px. The English label breaks at a space and fits,
     * which is why it survived review in one of the two published languages.
     *
     * So both are accepted — the declaration is still a single column either
     * way, and this audit is about column count — but `minmax(0, 1fr)` is the
     * one to write. The failure above is recorded in known-risks.
     */
    if (/auto-fit|auto-fill/.test(v)) single.add(sel)
    else if (/^1fr\s*(?:!important)?$/.test(v)) single.add(sel)
    else if (/^minmax\(\s*0(?:px)?\s*,\s*1fr\s*\)\s*(?:!important)?$/.test(v)) single.add(sel)
    else if (/repeat\(\s*[2-9]|1fr\s+1fr|minmax[^)]*\)[\s,]+minmax/.test(v)) multi.add(sel)
  }
  gridsChecked += multi.size
  for (const sel of multi) {
    if (!single.has(sel)) findings.push({ file: rel(f), issue: `grid ${sel} has no single-column state` })
  }

  for (const m of css.matchAll(/\n\s*(?:min-)?width:\s*(\d{3,})px/g)) {
    if (Number(m[1]) >= NARROWEST) {
      findings.push({ file: rel(f), issue: `fixed width ${m[1]}px cannot fit a ${NARROWEST}px viewport` })
    }
  }
}

// ── Source: inline fixed widths ─────────────────────────────────────────────
for (const f of files.filter((f) => /\.tsx?$/.test(f))) {
  const src = readFileSync(f, 'utf8')
  const phoneSurface = !NOT_A_PHONE_SURFACE.test(rel(f))
  for (const m of src.matchAll(/(?:minWidth|width):\s*'(\d{3,})px'/g)) {
    if (phoneSurface && Number(m[1]) >= NARROWEST) {
      findings.push({ file: rel(f), issue: `inline fixed width ${m[1]}px` })
    }
  }
  // A Tailwind arbitrary width beyond the narrowest viewport.
  //
  // Exempt when the element sits inside a horizontally scrolling container: a
  // wide diagram or data table that scrolls is correct, and squashing it to fit
  // would be worse than the scroll. The container must actually be present —
  // this looks for it in the preceding markup rather than taking intent on
  // trust.
  for (const m of src.matchAll(/\b(?:min-)?w-\[(\d{3,})px\]/g)) {
    if (Number(m[1]) < NARROWEST) continue
    const before = src.slice(Math.max(0, m.index - 400), m.index)
    if (/overflow-x-auto|overflow-auto|overflow-x-scroll/.test(before)) continue
    findings.push({ file: rel(f), issue: `Tailwind fixed width ${m[0]} with no scrolling container` })
  }
  // A grid that only ever declares multiple columns in class names.
  for (const m of src.matchAll(/className="[^"]*\bgrid-cols-([2-9])\b[^"]*"/g)) {
    const cls = m[0]
    if (!/\bgrid-cols-1\b/.test(cls) && !/\b(sm|md|lg|xl):grid-cols-/.test(cls)) {
      findings.push({ file: rel(f), issue: `grid-cols-${m[1]} with no responsive variant or base` })
    }
  }
}

// ── Section rhythm: three, and no fourth ────────────────────────────────────
// A section padding is a clamp whose upper bound reaches the section scale.
// Anything smaller is a card or a panel and is none of this rule's business.
const SECTION_SCALE_REM = 4
const upperRem = (value) => {
  const rems = [...value.matchAll(/(\d+(?:\.\d+)?)rem/g)].map((m) => parseFloat(m[1]))
  return rems.length ? Math.max(...rems) : 0
}
const offRhythm = (value) =>
  value.includes('clamp(') && !value.includes('var(--section-y') && upperRem(value) >= SECTION_SCALE_REM

const PAD_PROP = /padding(?:Block|Top|Bottom|-block|-top|-bottom)?\s*:\s*'([^']+)'/g
const PAD_CONST = /\b[A-Za-z_]*PADDING[A-Za-z_]*\s*=\s*'([^']+)'/g
const PAD_CSS = /padding(?:-block|-top|-bottom)?\s*:\s*([^;{}]*clamp\([^;{}]*)/g
let rhythmsChecked = 0

for (const f of files) {
  const r = rel(f)
  if (r.startsWith('packages/design-tokens/')) continue
  if (/\.(tsx?|css)$/.test(r) === false) continue
  const src = readFileSync(f, 'utf8')
  const res = r.endsWith('.css') ? [PAD_CSS] : [PAD_PROP, PAD_CONST]
  for (const re of res) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(src)) !== null) {
      const value = m[1].trim()
      if (!value.includes('clamp(')) continue
      rhythmsChecked++
      if (offRhythm(value)) {
        findings.push({
          file: r,
          issue: `section padding "${value}" is not one of the three rhythms (--section-y, --section-y-compact, --section-y-feature)`,
        })
      }
    }
  }
}

console.log(`multi-column grids checked : ${gridsChecked}`)
console.log(`section paddings checked   : ${rhythmsChecked}`)
console.log(`media queries found        : ${queriesFound}`)
console.log(`narrowest supported viewport: ${NARROWEST}px\n`)

if (!findings.length) {
  console.log('RESPONSIVE: clean — every grid collapses, no fixed width exceeds the narrowest viewport')
} else {
  console.log(`RESPONSIVE: ${findings.length} finding(s)\n`)
  for (const f of findings) console.log(`  ${f.file}\n      ${f.issue}`)
  process.exitCode = 1
}
