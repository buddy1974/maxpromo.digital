#!/usr/bin/env node
/**
 * packages/tooling/audit-consistency.mjs
 *
 * Cross-application visual consistency, checked against rendered output.
 *
 * The question this answers is the one the whole platform programme exists for:
 * does a visitor moving between maxpromo.digital, agents.maxpromo.digital and
 * the internal OS see one company, or three projects?
 *
 * Screenshots answer that impressionistically. This answers it by reading what
 * the browser actually resolves: the emitted CSS custom properties, the type
 * scale, the component class definitions, and the colours present in the
 * markup. Two applications agree, or they do not.
 *
 *   node packages/tooling/audit-consistency.mjs
 */

const APPS = [
  { name: 'web', url: 'http://localhost:3020/en' },
  { name: 'bureau', url: 'http://localhost:3021/' },
]

/** Tokens that must resolve identically everywhere. */
const MUST_MATCH = [
  '--brand-primary', '--brand-primary-hover', '--brand-primary-dark',
  '--brand-primary-text', '--brand-primary-edge', '--brand-on-primary',
  '--brand-background', '--brand-surface', '--brand-surface-subtle',
  '--brand-surface-inverted', '--brand-border', '--brand-border-control',
  '--brand-text', '--brand-text-secondary', '--brand-text-muted',
  '--semantic-success', '--semantic-warning', '--semantic-danger', '--semantic-info',
  '--text-h1', '--text-h2', '--text-h3', '--text-body', '--text-small', '--text-micro',
  '--weight-heading', '--weight-subhead', '--leading-body',
  '--space-4', '--space-6', '--section-y', '--radius-md', '--radius-lg',
]

/** The retired palette. Any occurrence in emitted CSS is a regression. */
const RETIRED = [/#f97316/i, /#ea580c/i, /#fb8b3d/i, /249,\s*115,\s*22/, /#ff6a1a/i]

async function collect(app) {
  const html = await fetch(app.url).then((r) => r.text())

  // Every stylesheet the page pulls in.
  const hrefs = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map((m) => m[1])
  const origin = new URL(app.url).origin
  let css = ''
  for (const h of hrefs) {
    try { css += await fetch(h.startsWith('http') ? h : origin + h).then((r) => r.text()) } catch { /* ignore */ }
  }
  css += [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n')

  const tokens = {}
  for (const name of MUST_MATCH) {
    // Last definition wins, as it would in the cascade.
    const all = [...css.matchAll(new RegExp(`${name}\\s*:\\s*([^;}]+)`, 'g'))]
    tokens[name] = all.length ? all[all.length - 1][1].trim() : null
  }

  const classDef = (sel) => {
    const m = css.match(new RegExp(`\\${sel}[^{]*\\{([^}]*)\\}`))
    return m ? m[1].replace(/\s+/g, ' ').trim() : null
  }

  return {
    app: app.name,
    tokens,
    fontFamily: (css.match(/--brand-font-sans\s*:\s*([^;}]+)/) || [])[1]?.trim() ?? null,
    btnPrimary: classDef('.btn-primary'),
    card: classDef('.card'),
    sectionLabel: classDef('.section-label'),
    retired: RETIRED.filter((r) => r.test(css)).map(String),
    cssBytes: css.length,
  }
}

const results = []
for (const app of APPS) {
  try { results.push(await collect(app)) }
  catch (e) { console.error(`FAILED to reach ${app.name} at ${app.url}: ${e}`); process.exitCode = 1 }
}
if (results.length < 2) {
  console.error('Both applications must be running. Start them with npm run dev:web and dev:bureau.')
  process.exit(1)
}

const [a, b] = results
const mismatches = []

for (const name of MUST_MATCH) {
  const va = a.tokens[name]
  const vb = b.tokens[name]
  if (va === null && vb === null) { mismatches.push({ token: name, web: 'ABSENT', bureau: 'ABSENT' }); continue }
  if (va !== vb) mismatches.push({ token: name, web: va, bureau: vb })
}

const pad = (s, n) => String(s ?? '—').padEnd(n)
console.log('CROSS-APPLICATION CONSISTENCY\n')
console.log(pad('property', 26) + pad('web', 24) + 'bureau')
console.log('-'.repeat(74))
for (const name of ['--brand-primary', '--brand-on-primary', '--brand-primary-edge',
                    '--brand-text', '--text-h1', '--text-body', '--semantic-success']) {
  console.log(pad(name, 26) + pad(a.tokens[name], 24) + (b.tokens[name] ?? '—'))
}
console.log(pad('font family', 26) + pad((a.fontFamily || '').slice(0, 22), 24) + (b.fontFamily || '').slice(0, 22))
console.log(pad('.btn-primary', 26) + pad(a.btnPrimary === b.btnPrimary ? 'identical' : 'DIFFERENT', 24) + (a.btnPrimary === b.btnPrimary ? 'identical' : 'DIFFERENT'))
console.log(pad('.card', 26) + pad(a.card === b.card ? 'identical' : 'DIFFERENT', 24) + (a.card === b.card ? 'identical' : 'DIFFERENT'))
console.log(pad('.section-label', 26) + pad(a.sectionLabel === b.sectionLabel ? 'identical' : 'DIFFERENT', 24) + (a.sectionLabel === b.sectionLabel ? 'identical' : 'DIFFERENT'))

const componentMismatches = []
if (a.btnPrimary !== b.btnPrimary) componentMismatches.push('.btn-primary')
if (a.card !== b.card) componentMismatches.push('.card')
if (a.sectionLabel !== b.sectionLabel) componentMismatches.push('.section-label')

const retired = [...new Set([...a.retired, ...b.retired])]

console.log('\n' + '='.repeat(74))
if (!mismatches.length && !componentMismatches.length && !retired.length) {
  console.log(`CONSISTENCY: clean — ${MUST_MATCH.length} tokens and 3 component classes resolve identically`)
  console.log('             in both applications; no retired palette in emitted CSS.')
} else {
  if (mismatches.length) {
    console.log(`\nTOKEN MISMATCHES (${mismatches.length}):`)
    for (const m of mismatches) console.log(`  ${pad(m.token, 26)} web=${pad(m.web, 20)} bureau=${m.bureau}`)
  }
  if (componentMismatches.length) console.log(`\nCOMPONENT CLASSES DIFFER: ${componentMismatches.join(', ')}`)
  if (retired.length) console.log(`\nRETIRED PALETTE PRESENT IN EMITTED CSS: ${retired.join(', ')}`)
  process.exitCode = 1
}
