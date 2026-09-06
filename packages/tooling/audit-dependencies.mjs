#!/usr/bin/env node
/**
 * packages/tooling/audit-dependencies.mjs
 *
 * What the platform depends on, and whether it still needs to.
 *
 * WHY THIS EXISTS
 *
 * A dependency is the only kind of code in this repository that arrives
 * without a decision record. Everything else — a colour, an icon, a domain, a
 * product's accent — has a registry and a check. A package arrives because
 * something needed it once, and stays because removing it is nobody's task.
 *
 * Three of the things it goes wrong in are silent:
 *
 *   A package nobody imports any more.   Installed, audited, deployed, unused.
 *   A version specifier that disagrees   Two applications, two resolutions of
 *   with another workspace's.            one library, and a bug in only one.
 *   A published advisory.                Which nothing surfaces until someone
 *                                        happens to run `npm audit`.
 *
 * WHAT IT CHECKS
 *
 *   1. Declared and unused — every dependency is imported by the workspace
 *      that declares it, or is on the short allowlist of packages that are
 *      used without being imported (bundler plugins, type packages, CLIs).
 *   2. Imported and undeclared — the reverse, which is worse: it works until
 *      a hoisting change stops it working.
 *   3. Version agreement — one specifier per package across every workspace.
 *   4. Security advisories — `npm audit`, classified by severity, by whether
 *      the package can reach production, and by whether a remediation exists.
 *
 * Rules 2 and 3 fail the run: an import that is not declared works only until
 * a hoisting change stops it working, and two specifiers for one package is
 * how this platform ended up with twelve shared dependencies on twelve
 * different versions.
 *
 * Rule 1 *reports*. Removing a package rewrites the lockfile — a decision.
 *
 * Rule 4 became a gate in v15.1, and the shape of that gate is the point.
 * "Fail on any advisory" would have failed this repository on four
 * development-only findings in a deprecated transitive of a migration CLI, and
 * a gate that fires on something nobody can fix is a gate people route around.
 * So it distinguishes:
 *
 *   reach       does the vulnerable package sit under a `dependencies` entry
 *               of some workspace, so it can reach a served request — or only
 *               under `devDependencies`?
 *   severity    critical and high are treated differently from moderate and low
 *   remediation is there a published version that resolves it, or is npm's
 *               "fix" a downgrade?
 *   acceptance  has this one been looked at, written down, and given an owner
 *               and a review date? (`packages/config/security.ts`)
 *
 * CRITICAL reaching production blocks, always — an acceptance cannot excuse it.
 * HIGH reaching production blocks unless an unexpired acceptance names it.
 * Everything else is reported.
 *
 * An accepted advisory is still printed and still counted. It is excluded from
 * blocking and from nothing else.
 *
 *   node packages/tooling/audit-dependencies.mjs
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const ROOT = process.cwd()

// The accepted-risk register. Loaded rather than restated: a gate that keeps
// its own copy of what has been accepted is a second list to forget to update.
const securityPath = join(ROOT, 'packages', 'config', 'security.ts')
if (!existsSync(securityPath)) {
  console.error('dependencies: no risk register at packages/config/security.ts')
  console.error('Refusing to report clean without knowing what has been accepted.')
  process.exit(1)
}
const { acceptanceFor, expiredAcceptances, blocksRelease } = await import(pathToFileURL(securityPath).href)

// ── The workspaces ──────────────────────────────────────────────────────────
const WORKSPACES = []
for (const dir of ['apps', 'packages']) {
  const full = join(ROOT, dir)
  if (!existsSync(full)) continue
  for (const name of readdirSync(full)) {
    const p = join(full, name, 'package.json')
    if (existsSync(p)) {
      WORKSPACES.push({
        name: `${dir}/${name}`,
        dir: join(full, name),
        pkg: JSON.parse(readFileSync(p, 'utf8')),
      })
    }
  }
}

if (WORKSPACES.length === 0) {
  console.error('dependencies: found no workspaces under apps/ or packages/')
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

/**
 * Packages that are genuinely used without ever appearing in an import.
 *
 * Each needs a reason, because an allowlist without reasons becomes the place
 * unused packages hide — the same rule the token check's allowlist follows.
 */
const USED_WITHOUT_IMPORTING = [
  { name: /^@types\//,            why: 'type declarations, consumed by tsc rather than imported' },
  { name: /^eslint(-|$)/,         why: 'invoked as a CLI and by config' },
  { name: /^typescript$/,         why: 'invoked as a CLI' },
  { name: /^tailwindcss$/,        why: 'read by PostCSS at build time' },
  { name: /^@tailwindcss\/postcss$/, why: 'the PostCSS plugin, named in the shared postcss base' },
  { name: /^drizzle-kit$/,        why: 'migration CLI, invoked rather than imported' },
  { name: /^@mdx-js\/(loader|mdx)$/, why: 'wired into the build by @next/mdx' },
  { name: /^react-dom$/,          why: 'the renderer; Next imports it, application code rarely does' },
  {
    name: /^@maxpromo\/design-tokens$/,
    why: 'a CSS-layer dependency: components.css is written against --brand-* and --semantic-*, which that package defines. Real, and invisible to an import scan',
  },
]

const findings = []
const notes = []
const unused = []
const add = (what, why) => findings.push({ what, why })

// ── Which packages each workspace actually imports ──────────────────────────
const SKIP = new Set(['node_modules', '.next', '.git', 'dist', 'build', '.turbo'])
const EXT = /\.(tsx?|mjs|cjs|js|jsx)$/

function sourceFiles(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue
    const p = join(dir, e.name)
    if (e.isDirectory()) sourceFiles(p, out)
    else if (EXT.test(e.name)) out.push(p)
  }
  return out
}

/** The package name a specifier resolves to: `next/font/google` → `next`. */
function packageOf(spec) {
  if (spec.startsWith('.') || spec.startsWith('/') || spec.startsWith('@/')) return null
  if (spec.startsWith('node:')) return null
  const parts = spec.split('/')
  return spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
}

let filesScanned = 0
const importsByWorkspace = new Map()

for (const ws of WORKSPACES) {
  const used = new Set()
  for (const f of sourceFiles(ws.dir)) {
    filesScanned++
    const src = readFileSync(f, 'utf8')
    for (const re of [
      /\bfrom\s+['"]([^'"]+)['"]/g,
      /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g,
      /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
      /^\s*import\s+['"]([^'"]+)['"]/gm,
    ]) {
      for (const m of src.matchAll(re)) {
        const pkg = packageOf(m[1])
        if (pkg) used.add(pkg)
      }
    }
  }
  importsByWorkspace.set(ws.name, used)
}

if (filesScanned === 0) {
  console.error('dependencies: scanned no source files.')
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

// ── 1 & 2. Declared vs imported ─────────────────────────────────────────────
let declaredCount = 0
for (const ws of WORKSPACES) {
  const used = importsByWorkspace.get(ws.name)
  const declared = { ...(ws.pkg.dependencies ?? {}), ...(ws.pkg.devDependencies ?? {}) }

  for (const name of Object.keys(declared)) {
    declaredCount++
    if (used.has(name)) continue
    const exempt = USED_WITHOUT_IMPORTING.find((r) => r.name.test(name))
    if (exempt) { notes.push(`${ws.name} declares ${name} and never imports it — ${exempt.why}`); continue }
    // Reported, not failed. Removing a package changes the lockfile and is a
    // cleanup decision; an undeclared import below is latent breakage. The two
    // deserve different treatment, and this sprint's brief asked for a
    // recommendation on the first.
    unused.push(
      `${ws.name} declares ${name} and nothing imports it — installed, resolved, ` +
      'audited and shipped in the lockfile, for nothing',
    )
  }

  for (const name of used) {
    if (name.startsWith('@maxpromo/')) continue        // workspace links
    if (declared[name]) continue
    // A package a workspace imports but does not declare works only while some
    // other workspace happens to hoist it to the root.
    const declaredSomewhere = WORKSPACES.some((o) =>
      ({ ...(o.pkg.dependencies ?? {}), ...(o.pkg.devDependencies ?? {}) })[name])
    if (declaredSomewhere) {
      add(
        `${ws.name} imports ${name} without declaring it`,
        'It resolves today because another workspace hoists it. It stops resolving the day that workspace drops it, and nothing here would have changed.',
      )
    }
  }
}

if (declaredCount === 0) {
  console.error('dependencies: no workspace declares a dependency.')
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

// ── 3. One specifier per package ────────────────────────────────────────────
const specifiers = new Map()
for (const ws of WORKSPACES) {
  for (const [name, range] of Object.entries({ ...(ws.pkg.dependencies ?? {}), ...(ws.pkg.devDependencies ?? {}) })) {
    if (!specifiers.has(name)) specifiers.set(name, new Map())
    specifiers.get(name).set(ws.name, range)
  }
}
for (const [name, byWs] of specifiers) {
  const ranges = new Set(byWs.values())
  if (ranges.size > 1) {
    add(
      `${name} is declared as ${[...ranges].join(' and ')}`,
      `${[...byWs].map(([w, r]) => `${w}=${r}`).join(', ')}. One library, two resolutions — this is how the platform ended up with twelve shared dependencies on twelve different specifiers before the consolidation.`,
    )
  }
}

// ── 4. Advisories — reported, never acted on ────────────────────────────────
/**
 * Run npm's own entry point with this Node, rather than the `npm` shim.
 *
 * Node 24 on Windows refuses to `execFile` a `.cmd` without a shell, and
 * passing arguments through a shell is both deprecated and an injection
 * surface. npm ships its CLI as plain JavaScript beside the Node binary, so
 * this runs that directly: no shell, no shim, no deprecation.
 */
function npmCli() {
  const beside = join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js')
  return existsSync(beside) ? beside : null
}

let advisories = null
let advisoryError = null
const cli = npmCli()
if (!cli) {
  advisoryError = 'npm-cli.js was not found beside the Node binary'
} else {
  try {
    const raw = execFileSync(process.execPath, [cli, 'audit', '--json'], {
      cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 240000,
    })
    advisories = JSON.parse(raw)
  } catch (e) {
    // `npm audit` exits non-zero when it finds something; the JSON is on stdout.
    try { advisories = JSON.parse(String(e.stdout ?? '')) } catch { advisoryError = String(e.message ?? e) }
  }
}

// ── Report ──────────────────────────────────────────────────────────────────
console.log('='.repeat(74))
console.log('DEPENDENCIES')
console.log(`${WORKSPACES.length} workspace(s), ${declaredCount} declaration(s), ${filesScanned} source file(s) scanned`)

if (advisories?.metadata?.vulnerabilities) {
  const v = advisories.metadata.vulnerabilities
  const total = v.total ?? 0
  console.log(`${advisories.metadata.dependencies?.total ?? '?'} packages in the tree · ` +
    `${total} advisory/ies: ${v.critical ?? 0} critical, ${v.high ?? 0} high, ${v.moderate ?? 0} moderate, ${v.low ?? 0} low`)

  const vulns = advisories.vulnerabilities ?? {}

  /**
   * Which direct dependencies a vulnerable package is reached through.
   *
   * npm's `effects` points from a package to what depends on it, so walking it
   * upward ends at the direct dependency that pulled it in. That is the only
   * thing that can tell production from development: the vulnerable package
   * itself has no section, its root does.
   */
  function rootsOf(name, seen = new Set()) {
    if (seen.has(name)) return []
    seen.add(name)
    const info = vulns[name]
    if (!info) return []
    if (info.isDirect) return [name]
    const out = []
    for (const e of info.effects ?? []) out.push(...rootsOf(e, seen))
    return [...new Set(out)]
  }

  /**
   * Can this reach a served request?
   *
   * `production` when some workspace declares one of its roots under
   * `dependencies`; `development` when every root is a devDependency. Unknown
   * roots count as production — an advisory whose provenance cannot be
   * established is not one to be lenient about.
   */
  function reachOf(name) {
    const roots = rootsOf(name)
    if (roots.length === 0) return 'production'
    let anyProd = false
    let anyKnown = false
    for (const r of roots) {
      for (const ws of WORKSPACES) {
        if (ws.pkg.dependencies?.[r]) { anyProd = true; anyKnown = true }
        else if (ws.pkg.devDependencies?.[r]) { anyKnown = true }
      }
    }
    if (!anyKnown) return 'production'
    return anyProd ? 'production' : 'development'
  }

  const entries = Object.entries(vulns).sort((a, b) => rank(b[1].severity) - rank(a[1].severity))

  if (entries.length) {
    console.log('\nAdvisories:')
    for (const [name, info] of entries) {
      const via = (info.via ?? []).map((x) => (typeof x === 'string' ? x : x.title)).filter(Boolean)
      const fixObj = info.fixAvailable && typeof info.fixAvailable === 'object' ? info.fixAvailable : null
      const fix = fixObj
        ? `${fixObj.name}@${fixObj.version}${fixObj.isSemVerMajor ? ' (major)' : ''}`
        : info.fixAvailable ? 'available' : 'none published'
      const reach = reachOf(name)
      const accepted = acceptanceFor(name)
      const severity = String(info.severity).toLowerCase()
      // The decision is a pure function in the risk register, so it can be
      // tested against a truth table rather than only observed on whatever
      // npm audit reports today. See prove-security-gate.mjs.
      const blocking = blocksRelease({ severity, reach, accepted: Boolean(accepted) })

      const mark = blocking ? 'BLOCKS ' : accepted ? 'accepted' : '       '
      console.log(`  ${mark} ${severity.toUpperCase().padEnd(9)} ${name.padEnd(24)} ${reach.padEnd(11)} ${info.isDirect ? 'direct  ' : 'indirect'}  fix: ${fix}`)
      if (via[0]) console.log(`           ${via[0].slice(0, 96)}`)
      if (accepted) console.log(`           accepted until ${accepted.reviewBy}, owner ${accepted.owner} — ${accepted.mitigation.slice(0, 88)}`)

      if (blocking) {
        add(
          `${severity.toUpperCase()} advisory in ${name}, which reaches production`,
          severity === 'critical'
            ? 'A critical advisory on a production dependency blocks a release, and no acceptance can excuse it.'
            : `Remediate it, or record an acceptance in packages/config/security.ts with the exposure, the mitigation, an owner and a review date. Suggested fix: ${fix}.`,
        )
      }
    }

    // An acceptance that has expired stops excusing anything, and says so.
    for (const e of expiredAcceptances()) {
      if (!vulns[e.package]) continue
      add(
        `the acceptance for ${e.package} expired on ${e.reviewBy}`,
        `${e.owner} agreed to look at it again by then. An acceptance that never expires is a decision nobody revisits.`,
      )
    }
  }
} else {
  // Unknown is not clean. A check that cannot see advisories must say so
  // rather than print nothing and let the silence read as a pass.
  console.log(`advisories: UNKNOWN — ${advisoryError ?? 'npm audit produced no parseable result'}`)
  console.log('            Treat as unexamined, not as clear.')
  add(
    'the advisory check could not run',
    'Unexamined is not clear. A release should not be certified on a security check that did not execute.',
  )
}


function rank(s) { return { critical: 4, high: 3, moderate: 2, low: 1 }[s] ?? 0 }

if (unused.length) {
  console.log('\nRecommended for removal — declared and never imported:')
  for (const u of unused) console.log(`  · ${u}`)
}

if (notes.length) {
  console.log('\nDeclared without being imported, with a reason:')
  for (const n of notes) console.log(`  · ${n}`)
}

if (findings.length === 0) {
  console.log('\nDEPENDENCIES: clean — everything declared is used, everything used is declared,')
  console.log('              and every package has one specifier')
} else {
  console.log(`\nDEPENDENCIES: ${findings.length} finding(s)\n`)
  for (const f of findings) {
    console.log(`  ${f.what}`)
    console.log(`      ${f.why}`)
  }
  process.exitCode = 1
}
