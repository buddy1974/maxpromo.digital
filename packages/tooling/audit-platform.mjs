#!/usr/bin/env node
/**
 * packages/tooling/audit-platform.mjs
 *
 * Platform-wide audit. Reports what the token check cannot: dead code, unused
 * assets, unused dependencies, unused translation keys, circular imports and
 * duplicated logic across the workspace.
 *
 * Reporting only — it never edits. Run it, read it, then decide. A tool that
 * deletes what it thinks is unused will eventually be wrong about something
 * that matters.
 *
 *   node packages/tooling/audit-platform.mjs           full report
 *   node packages/tooling/audit-platform.mjs --json    machine readable
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, extname, basename, sep } from 'node:path'

const ROOT = process.cwd()
const JSON_OUT = process.argv.includes('--json')
const SKIP = new Set(['node_modules', '.next', '.git', '.vercel', 'out', 'dist'])

const apps = existsSync(join(ROOT, 'apps')) ? readdirSync(join(ROOT, 'apps')) : []
const pkgs = existsSync(join(ROOT, 'packages')) ? readdirSync(join(ROOT, 'packages')) : []

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
const CODE = /\.(tsx?|mts|mjs|jsx?)$/
const allFiles = walk(ROOT)
const codeFiles = allFiles.filter((f) => CODE.test(f))
const sources = new Map(codeFiles.map((f) => [f, readFileSync(f, 'utf8')]))
const allText = [...sources.values()].join('\n')

const report = {}

// ── 1. Unused static assets ─────────────────────────────────────────────────
{
  const assets = allFiles.filter((f) => /\/public\//.test(rel(f)) && /\.(png|jpe?g|webp|avif|svg|gif|ico|woff2?|mp4)$/i.test(f))
  const textPool = allText + '\n' + allFiles
    .filter((f) => /\.(json|mdx?|css)$/.test(f))
    .map((f) => { try { return readFileSync(f, 'utf8') } catch { return '' } })
    .join('\n')
  const unused = assets.filter((a) => {
    const name = basename(a)
    const noExt = name.replace(extname(name), '')
    // Referenced by full name, by path fragment, or by stem (registry-built paths).
    return !textPool.includes(name) && !textPool.includes(noExt)
  })
  report.unusedAssets = unused.map((f) => ({ file: rel(f), bytes: statSync(f).size }))
    .sort((a, b) => b.bytes - a.bytes)
}

// ── 2. Unused dependencies ──────────────────────────────────────────────────
{
  const out = []
  for (const dir of [...apps.map((a) => `apps/${a}`), ...pkgs.map((p) => `packages/${p}`)]) {
    const pj = join(ROOT, dir, 'package.json')
    if (!existsSync(pj)) continue
    const manifest = JSON.parse(readFileSync(pj, 'utf8'))
    const deps = Object.keys({ ...manifest.dependencies, ...manifest.devDependencies })
    const scope = codeFiles.filter((f) => rel(f).startsWith(dir + '/'))
    const text = scope.map((f) => sources.get(f)).join('\n') +
      Object.values(manifest.scripts ?? {}).join(' ')
    const cfgText = allFiles
      .filter((f) => rel(f).startsWith(dir + '/') && /\.(css|json|mjs)$/.test(f))
      .map((f) => { try { return readFileSync(f, 'utf8') } catch { return '' } }).join('\n')
    const unused = deps.filter((d) => {
      if (d.startsWith('@types/')) return false          // type-only, used implicitly
      if (['typescript', 'eslint', 'tailwindcss', '@tailwindcss/postcss',
           'eslint-config-next', 'postcss', 'autoprefixer'].includes(d)) return false
      const hit = new RegExp(`['"\`]${d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(/|['"\`])`)
      return !hit.test(text) && !hit.test(cfgText) && !text.includes(d)
    })
    if (unused.length) out.push({ workspace: dir, unused })
  }
  report.unusedDependencies = out
}

// ── 3. Unused exports from shared packages ──────────────────────────────────
{
  const out = []
  for (const p of pkgs) {
    const files = codeFiles.filter((f) => rel(f).startsWith(`packages/${p}/`))
    const consumers = codeFiles.filter((f) => rel(f).startsWith('apps/'))
    const consumerText = consumers.map((f) => sources.get(f)).join('\n') +
      files.map((f) => sources.get(f)).join('\n')
    for (const f of files) {
      const src = sources.get(f)
      for (const m of src.matchAll(/export (?:const|function|class|type|interface) (\w+)/g)) {
        const name = m[1]
        const uses = (consumerText.match(new RegExp(`\\b${name}\\b`, 'g')) || []).length
        // 1 = its own declaration; 2 = declaration + barrel re-export.
        if (uses <= 2) out.push({ package: p, file: rel(f), export: name, references: uses })
      }
    }
  }
  report.unusedPackageExports = out
}

// ── 4. Unused translation keys ──────────────────────────────────────────────
{
  const out = []
  for (const app of apps) {
    const dir = join(ROOT, 'apps', app, 'messages')
    if (!existsSync(dir)) continue
    const appText = codeFiles.filter((f) => rel(f).startsWith(`apps/${app}/`))
      .map((f) => sources.get(f)).join('\n')
    const file = join(dir, 'en.json')
    if (!existsSync(file)) continue
    const data = JSON.parse(readFileSync(file, 'utf8'))
    const unusedNs = []
    for (const ns of Object.keys(data)) {
      if (!new RegExp(`['"\`]${ns}[.'"\`]`).test(appText)) unusedNs.push(ns)
    }
    if (unusedNs.length) out.push({ app, unusedNamespaces: unusedNs })
  }
  report.unusedTranslationNamespaces = out
}

// ── 5. Unreferenced modules ─────────────────────────────────────────────────
{
  const out = []
  for (const f of codeFiles) {
    const r = rel(f)
    if (!/^apps\/[^/]+\/(components|lib|hooks)\//.test(r)) continue
    const stem = basename(f).replace(/\.tsx?$/, '')
    if (stem === 'index') continue
    const pattern = new RegExp(`(from|import)\\s+['"\`][^'"\`]*/${stem}['"\`]|['"\`][^'"\`]*/${stem}['"\`]`)
    const referenced = codeFiles.some((o) => o !== f && pattern.test(sources.get(o)))
    if (!referenced) out.push(r)
  }
  report.unreferencedModules = out
}

// ── 6. Circular imports between workspaces ──────────────────────────────────
{
  const violations = []
  for (const f of codeFiles) {
    const r = rel(f)
    if (!r.startsWith('packages/')) continue
    const src = sources.get(f)
    for (const m of src.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      const spec = m[1]
      if (spec.startsWith('@/') || spec.includes('apps/')) {
        violations.push({ file: r, imports: spec, why: 'a package must not depend on an application' })
      }
    }
  }
  report.dependencyDirectionViolations = violations
}

// ── 7. Duplicated exported symbols across workspaces ────────────────────────
{
  const seen = new Map()
  for (const f of codeFiles) {
    const r = rel(f)
    if (!/^(apps|packages)\//.test(r)) continue
    for (const m of sources.get(f).matchAll(/export (?:const|function) (\w+)/g)) {
      const key = m[1]
      if (key.length < 5) continue
      if (!seen.has(key)) seen.set(key, [])
      seen.get(key).push(r)
    }
  }
  report.duplicatedSymbols = [...seen.entries()]
    .filter(([, files]) => new Set(files.map((f) => f.split('/').slice(0, 2).join('/'))).size > 1)
    .map(([symbol, files]) => ({ symbol, files }))
}

// ── 8. API routes with no caller ────────────────────────────────────────────
{
  const routes = codeFiles.filter((f) => /\/app\/api\/.*route\.ts$/.test(rel(f)))
  const out = []
  for (const f of routes) {
    const r = rel(f)
    const path = '/' + r.split('/app/')[1].replace(/\/route\.ts$/, '')
    const referenced = allText.includes(`'${path}'`) || allText.includes(`"${path}"`) ||
      allText.includes(`\`${path}`) || allText.includes(path + "'") || allText.includes(path + '"')
    if (!referenced) out.push({ route: path, file: r })
  }
  report.uncalledApiRoutes = out
}

if (JSON_OUT) {
  console.log(JSON.stringify(report, null, 2))
} else {
  const title = (t) => console.log('\n=== ' + t + ' ' + '='.repeat(Math.max(0, 60 - t.length)))
  title('UNUSED ASSETS')
  const kb = report.unusedAssets.reduce((n, a) => n + a.bytes, 0) / 1024
  console.log(`${report.unusedAssets.length} file(s), ${kb.toFixed(0)} KB`)
  report.unusedAssets.slice(0, 20).forEach((a) => console.log(`  ${(a.bytes / 1024).toFixed(0).padStart(6)} KB  ${a.file}`))

  title('UNUSED DEPENDENCIES')
  report.unusedDependencies.forEach((w) => console.log(`  ${w.workspace}: ${w.unused.join(', ')}`))
  if (!report.unusedDependencies.length) console.log('  none')

  title('UNUSED PACKAGE EXPORTS')
  report.unusedPackageExports.forEach((e) => console.log(`  ${e.package}: ${e.export}  (${e.file})`))
  if (!report.unusedPackageExports.length) console.log('  none')

  title('UNUSED TRANSLATION NAMESPACES')
  report.unusedTranslationNamespaces.forEach((t) => console.log(`  ${t.app}: ${t.unusedNamespaces.join(', ')}`))
  if (!report.unusedTranslationNamespaces.length) console.log('  none')

  title('UNREFERENCED MODULES')
  report.unreferencedModules.forEach((m) => console.log('  ' + m))
  if (!report.unreferencedModules.length) console.log('  none')

  title('DEPENDENCY DIRECTION')
  report.dependencyDirectionViolations.forEach((v) => console.log(`  ${v.file} -> ${v.imports}`))
  if (!report.dependencyDirectionViolations.length) console.log('  clean — no package depends on an application')

  title('DUPLICATED SYMBOLS ACROSS WORKSPACES')
  report.duplicatedSymbols.forEach((d) => console.log(`  ${d.symbol}: ${d.files.join(' | ')}`))
  if (!report.duplicatedSymbols.length) console.log('  none')

  title('API ROUTES WITH NO CALLER')
  report.uncalledApiRoutes.forEach((r) => console.log(`  ${r.route}`))
  if (!report.uncalledApiRoutes.length) console.log('  none')
  console.log('')
}
