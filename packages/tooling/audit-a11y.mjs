#!/usr/bin/env node
/**
 * packages/tooling/audit-a11y.mjs
 *
 * Accessibility and structure audit against rendered HTML, for every public
 * route in both applications.
 *
 * Static analysis of source cannot answer these questions — a landmark that
 * exists in a layout but never wraps the page looks fine in the source and is
 * missing in the output. So this fetches the real thing.
 *
 *   node packages/tooling/audit-a11y.mjs
 */

const TARGETS = [
  ['web', 'http://localhost:3020', [
    '/en', '/de',
    '/en/solutions', '/en/solutions/customer-inquiries', '/en/solutions/workflow-automation',
    '/en/solutions/ai-agents', '/en/solutions/websites-platforms', '/en/solutions/reviews',
    '/en/solutions/social-media',
    '/en/industries', '/en/industries/healthcare', '/en/industries/construction',
    '/en/industries/property', '/en/industries/hospitality', '/en/industries/publishing',
    '/en/industries/professional-services',
    '/en/resources', '/en/about', '/en/pricing', '/en/contact', '/en/case-studies',
    '/en/agent-bureau', '/en/blog', '/en/impressum', '/en/privacy', '/en/agb',
    '/en/automation-lab', '/en/ai-websites', '/en/data-deletion',
    '/de/solutions', '/de/industries/healthcare', '/de/about', '/de/pricing', '/de/contact',
  ]],
  ['bureau', 'http://localhost:3021', ['/', '/impressum', '/datenschutz', '/login']],
]

const findings = []
const rows = []

function analyse(app, path, html) {
  const f = []
  const headings = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => +m[1])
  const h1 = headings.filter((n) => n === 1).length

  if (h1 === 0) f.push('no h1')
  if (h1 > 1) f.push(`${h1} h1 elements`)

  const skips = []
  for (let i = 1; i < headings.length; i++) {
    if (headings[i] - headings[i - 1] > 1) skips.push(`h${headings[i - 1]}->h${headings[i]}`)
  }
  if (skips.length) f.push(`heading skip: ${skips.join(', ')}`)

  if (!/<main[\s>]/.test(html)) f.push('no <main> landmark')
  if (!/<html[^>]*\slang=/.test(html)) f.push('no lang attribute')

  const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0])
  const noAlt = imgs.filter((i) => !/\balt=/.test(i)).length
  if (noAlt) f.push(`${noAlt} img without alt`)

  // Buttons and links with no accessible name.
  const namelessBtn = [...html.matchAll(/<button\b[^>]*>(.*?)<\/button>/gs)]
    .filter(([full, inner]) => !/aria-label=|aria-labelledby=/.test(full) && !inner.replace(/<[^>]*>/g, '').trim()).length
  if (namelessBtn) f.push(`${namelessBtn} button without accessible name`)

  const namelessLink = [...html.matchAll(/<a\b[^>]*>(.*?)<\/a>/gs)]
    .filter(([full, inner]) => !/aria-label=|aria-labelledby=/.test(full) && !inner.replace(/<[^>]*>/g, '').trim()).length
  if (namelessLink) f.push(`${namelessLink} link without accessible name`)

  // Form controls: a label with `for`, a wrapping label, or aria-label.
  const controls = [...html.matchAll(/<(input|textarea|select)\b[^>]*>/g)].map((m) => m[0])
  const labelledIds = [...html.matchAll(/<label[^>]*\bfor="([^"]+)"/g)].map((m) => m[1])
  const wrapping = (html.match(/<label\b[^>]*>(?:(?!<\/label>).)*<(?:input|textarea|select)\b/gs) || []).length
  const needing = controls.filter((c) => !/type="(hidden|submit|button|image)"/.test(c) && !/aria-label/.test(c))
  const byId = needing.filter((c) => {
    const id = (c.match(/\bid="([^"]+)"/) || [])[1]
    return id && labelledIds.includes(id)
  }).length
  const unlabelled = needing.length - byId - wrapping
  if (unlabelled > 0) f.push(`${unlabelled} form control without a label`)

  // A title is not optional, and must not repeat the brand.
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || ''
  if (!title) f.push('no <title>')
  if ((title.match(/Maxpromo Digital/g) || []).length > 1) f.push('brand repeated in <title>')
  if (!/<meta name="description"/.test(html)) f.push('no meta description')

  // Viewport meta, or mobile zoom is broken.
  if (!/<meta name="viewport"/.test(html)) f.push('no viewport meta')

  // WCAG 4.1.3 Status Messages. A page that can show an error or a success
  // state must be able to announce it. Checked structurally: if the markup
  // carries a form, it needs somewhere for a status to land.
  const hasForm = /<form[ >]/.test(html)
  const hasLiveRegion = /role="(alert|status)"|aria-live=/.test(html)
  if (hasForm && !hasLiveRegion) f.push('form with no live region for status messages')

  // A focusable control that is only identifiable by colour.
  if (/<button[^>]*style="[^"]*color:[^"]*"[^>]*>\s*<\/button>/.test(html)) {
    f.push('button conveying state by colour alone')
  }

  rows.push({ app, path, h1, headings: headings.length, findings: f.length })
  f.forEach((x) => findings.push({ app, path, issue: x }))
}

for (const [app, origin, paths] of TARGETS) {
  for (const p of paths) {
    let res
    try {
      res = await fetch(origin + p, { redirect: 'follow' })
    } catch (e) {
      findings.push({ app, path: p, issue: 'FETCH FAILED: ' + String(e).slice(0, 50) })
      continue
    }
    if (!res.ok) {
      findings.push({ app, path: p, issue: `HTTP ${res.status}` })
      continue
    }
    analyse(app, p, await res.text())
  }
}

const pad = (s, n) => String(s).padEnd(n)
console.log(pad('app', 8) + pad('route', 40) + pad('h1', 4) + pad('headings', 10) + 'findings')
for (const r of rows) {
  console.log(pad(r.app, 8) + pad(r.path, 40) + pad(r.h1, 4) + pad(r.headings, 10) + (r.findings || '-'))
}

console.log('\n' + '='.repeat(70))
if (!findings.length) {
  console.log(`ACCESSIBILITY: clean across ${rows.length} routes`)
} else {
  console.log(`ACCESSIBILITY: ${findings.length} finding(s) across ${rows.length} routes\n`)
  for (const f of findings) console.log(`  ${pad(f.app, 8)} ${pad(f.path, 40)} ${f.issue}`)
  process.exitCode = 1
}
