#!/usr/bin/env node
/**
 * packages/tooling/audit-lighthouse.mjs
 *
 * What every public domain actually scores, measured rather than assumed.
 *
 * NOT A MERGE GATE, deliberately. A Lighthouse run needs a production server
 * and a browser, and its performance score moves with whatever else the
 * machine was doing. Failing a merge on a number that depends on the laptop
 * would teach everyone to ignore the gate. This is run on purpose — before a
 * release, or on a fixed CI runner — and it exits non-zero so it can be.
 *
 *   npm run build
 *   npm run start:web            # a production server, not `next dev`
 *   npm run audit:lighthouse
 *   npm run audit:lighthouse -- --update    # rewrite the baseline
 *
 * HOW IT REACHES TEN DOMAINS FROM ONE SERVER
 *
 * The platform routes on the Host header, so measuring restaurant-os.de means
 * Chrome has to *send* that Host. It cannot be faked with an extra header —
 * Host is forbidden to script — so Chrome is launched with
 * `--host-resolver-rules`, which maps every registry host to 127.0.0.1 at the
 * resolver. Chrome then sends the real Host and connects to the local server.
 *
 * Chrome is spawned with an argument array rather than through Lighthouse's
 * `--chrome-flags`, because that option is split on spaces and every one of
 * these rules contains two.
 *
 * WHY IT MEASURES A PRODUCTION BUILD
 *
 * A Lighthouse performance score against `next dev` is meaningless — the
 * bundles are unminified and the dev server compiles on demand. Measuring it
 * anyway and writing the number down would be worse than not measuring, so
 * this refuses to run against a server that looks like a development one.
 */

import { spawn, execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = process.cwd()
const args = process.argv.slice(2)
const UPDATE = args.includes('--update')
const arg = (name, fallback) => {
  const i = args.indexOf(name)
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback
}
const PORT = arg('--port', '3100')
const BASELINE = join(ROOT, 'docs', 'governance', 'performance-baseline.json')

// ── The registries ──────────────────────────────────────────────────────────
const domainsPath = join(ROOT, 'packages', 'config', 'domains.ts')
const budgetsPath = join(ROOT, 'packages', 'config', 'budgets.ts')
for (const p of [domainsPath, budgetsPath]) {
  if (!existsSync(p)) {
    console.error(`lighthouse: cannot find ${p}`)
    console.error('Refusing to report clean without having checked anything.')
    process.exit(1)
  }
}
const { DOMAIN_REGISTRY } = await import(pathToFileURL(domainsPath).href)
const { LIGHTHOUSE_MINIMUMS, WEB_VITALS } = await import(pathToFileURL(budgetsPath).href)

const TARGETS = DOMAIN_REGISTRY.filter((d) => d.app === 'web')
if (TARGETS.length === 0) {
  console.error('lighthouse: no web domains in the registry.')
  process.exit(1)
}

// ── Chrome ──────────────────────────────────────────────────────────────────
const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
]
const CHROME = process.env.CHROME_PATH ?? CHROME_CANDIDATES.find((p) => existsSync(p))
if (!CHROME) {
  console.error('lighthouse: no Chrome found. Set CHROME_PATH.')
  console.error('This audit measures rather than estimates, so without a browser it does not run.')
  process.exit(1)
}

const DEBUG_PORT = 9222
const profile = mkdtempSync(join(tmpdir(), 'mp-lh-'))
const rules = TARGETS.map((d) => `MAP ${d.host} 127.0.0.1`).join(',')

console.log('='.repeat(74))
console.log('LIGHTHOUSE')
console.log(`${TARGETS.length} domain(s) × desktop and mobile, against http://localhost:${PORT}`)

// The server must be a production one, and this checks rather than trusts.
try {
  const probe = execFileSync(process.execPath, ['-e', `
    const http = require('node:http')
    const req = http.request({ host: '127.0.0.1', port: ${PORT}, path: '/de', method: 'GET',
      headers: { Host: 'maxpromo.digital' } }, (res) => {
      let b = ''; res.on('data', (c) => b += c)
      res.on('end', () => { process.stdout.write(String(res.statusCode) + '|' + (b.includes('__next_devtools') || b.includes('/_next/static/chunks/_app-pages-browser') ? 'dev' : 'prod')) })
    })
    req.on('error', () => { process.stdout.write('0|none') })
    req.end()
  `], { encoding: 'utf8', timeout: 30000 })
  const [status, kind] = probe.trim().split('|')
  if (status === '0') {
    console.error(`\nlighthouse: nothing is answering on port ${PORT}.`)
    console.error('Run `npm run build` then `npm run start:web` first.')
    rmSync(profile, { recursive: true, force: true })
    process.exit(1)
  }
  if (kind === 'dev') {
    console.error('\nlighthouse: that is a development server.')
    console.error('A performance score against `next dev` measures the compiler, not the site.')
    console.error('Build first, then `npm run start:web`.')
    rmSync(profile, { recursive: true, force: true })
    process.exit(1)
  }
} catch {
  console.error(`\nlighthouse: could not reach port ${PORT}.`)
  rmSync(profile, { recursive: true, force: true })
  process.exit(1)
}

const chrome = spawn(CHROME, [
  '--headless=new',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  '--disable-background-networking',
  `--user-data-dir=${profile}`,
  `--remote-debugging-port=${DEBUG_PORT}`,
  `--host-resolver-rules=${rules}`,
  'about:blank',
], { stdio: 'ignore' })

await new Promise((r) => setTimeout(r, 3000))

// ── Run ─────────────────────────────────────────────────────────────────────
const lhCli = (() => {
  // npx resolves lighthouse from the cache; run its bin with this Node so no
  // shell is involved and no `.cmd` shim has to be executed.
  const local = join(ROOT, 'node_modules', 'lighthouse', 'cli', 'index.js')
  return existsSync(local) ? local : null
})()

function runLighthouse(url, formFactor, out) {
  const common = [
    url, '--quiet', '--output=json', `--output-path=${out}`,
    `--port=${DEBUG_PORT}`, '--only-categories=performance,accessibility,best-practices,seo',
  ]
  const withPreset = formFactor === 'desktop' ? [...common, '--preset=desktop'] : common
  if (lhCli) {
    execFileSync(process.execPath, [lhCli, ...withPreset], { stdio: 'pipe', timeout: 240000 })
  } else {
    const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
    execFileSync(npx, ['--no-install', 'lighthouse', ...withPreset],
      { stdio: 'pipe', timeout: 240000, shell: process.platform === 'win32' })
  }
  return JSON.parse(readFileSync(out, 'utf8'))
}

const results = []
const findings = []
let runs = 0

try {
  for (const d of TARGETS) {
    for (const formFactor of ['desktop', 'mobile']) {
      const url = `http://${d.host}:${PORT}${d.useLocalePrefix ? '/' + d.primaryLanguage : '/'}`
      const out = join(profile, `${d.host}-${formFactor}.json`)
      let report
      try {
        report = runLighthouse(url, formFactor, out)
      } catch (e) {
        findings.push({
          what: `${d.host} (${formFactor}) could not be measured`,
          why: String(e.message ?? e).slice(0, 200),
        })
        continue
      }
      runs++

      const scores = Object.fromEntries(
        Object.entries(report.categories).map(([k, v]) => [k, Math.round((v.score ?? 0) * 100)]),
      )
      const metric = (id) => report.audits[id]?.numericValue ?? null
      const row = {
        host: d.host,
        formFactor,
        scores,
        vitals: {
          lcp:  metric('largest-contentful-paint'),
          cls:  metric('cumulative-layout-shift'),
          tbt:  metric('total-blocking-time'),
          ttfb: metric('server-response-time'),
          si:   metric('speed-index'),
        },
        bytes: {
          total:  report.audits['total-byte-weight']?.numericValue ?? null,
          script: report.audits['resource-summary']?.details?.items?.find((i) => i.resourceType === 'script')?.transferSize ?? null,
          image:  report.audits['resource-summary']?.details?.items?.find((i) => i.resourceType === 'image')?.transferSize ?? null,
        },
      }
      results.push(row)

      for (const [category, floor] of Object.entries(LIGHTHOUSE_MINIMUMS)) {
        const got = scores[category]
        if (got === undefined) continue
        if (got < floor) {
          findings.push({
            what: `${d.host} (${formFactor}) scored ${got} for ${category}, below the ${floor} floor`,
            why: 'The floors are in packages/config/budgets.ts. Lowering one is a decision that belongs in the change log.',
          })
        }
      }

      const line = Object.entries(LIGHTHOUSE_MINIMUMS)
        .map(([c]) => `${c.slice(0, 4)} ${String(scores[c] ?? '-').padStart(3)}`).join('  ')
      console.log(`  ${d.host.padEnd(24)} ${formFactor.padEnd(8)} ${line}   LCP ${fmtMs(row.vitals.lcp)}  CLS ${row.vitals.cls?.toFixed(3) ?? '-'}  TBT ${fmtMs(row.vitals.tbt)}`)
    }
  }
} finally {
  chrome.kill()
}

function fmtMs(v) { return v === null ? '   -' : `${Math.round(v)}ms`.padStart(6) }

if (runs === 0) {
  console.error('\nlighthouse: not one run completed.')
  console.error('Refusing to report clean without having measured anything.')
  rmSync(profile, { recursive: true, force: true })
  process.exit(1)
}

// ── Vitals against the thresholds ───────────────────────────────────────────
for (const r of results) {
  for (const [key, t] of Object.entries(WEB_VITALS)) {
    const v = r.vitals[key]
    if (v === null || v === undefined) continue
    if (v > t.poor) {
      findings.push({
        what: `${r.host} (${r.formFactor}) ${key.toUpperCase()} is ${key === 'cls' ? v.toFixed(3) : Math.round(v) + 'ms'}`,
        why: `Above the "poor" threshold of ${t.good === undefined ? '?' : t.poor}${t.unit}. Google's own boundary, unmodified.`,
      })
    }
  }
}

// ── Baseline ────────────────────────────────────────────────────────────────
const baseline = {
  measuredAt: new Date().toISOString(),
  note: 'Lab measurements from Lighthouse against a local production build. Not field data — see governance/known-risks.md.',
  minimums: LIGHTHOUSE_MINIMUMS,
  results,
}

if (UPDATE) {
  writeFileSync(BASELINE, JSON.stringify(baseline, null, 2) + '\n')
  console.log(`\nbaseline written to ${BASELINE.replace(ROOT, '.')}`)
} else if (existsSync(BASELINE)) {
  const previous = JSON.parse(readFileSync(BASELINE, 'utf8'))
  console.log(`\ncompared against the baseline of ${previous.measuredAt}`)
  for (const r of results) {
    const was = previous.results?.find((p) => p.host === r.host && p.formFactor === r.formFactor)
    if (!was) continue
    for (const [c, now] of Object.entries(r.scores)) {
      const then = was.scores?.[c]
      // Three points of Lighthouse noise is normal between runs; ten is a change.
      if (then !== undefined && now <= then - 10) {
        findings.push({
          what: `${r.host} (${r.formFactor}) ${c} fell from ${then} to ${now}`,
          why: 'A ten-point drop is larger than run-to-run noise. Something changed.',
        })
      }
    }
  }
} else {
  console.log('\nno baseline yet — run with --update to write one')
}

// Best effort: Chrome does not always release its profile directory before it
// exits, and failing the audit over a temp directory would throw away a run
// that has already produced its answer.
try { rmSync(profile, { recursive: true, force: true }) } catch { /* left for the OS */ }

if (findings.length === 0) {
  console.log('\nLIGHTHOUSE: clean — every domain clears every floor')
} else {
  console.log(`\nLIGHTHOUSE: ${findings.length} finding(s)\n`)
  for (const f of findings) {
    console.log(`  ${f.what}`)
    console.log(`      ${f.why}`)
  }
  process.exitCode = 1
}
