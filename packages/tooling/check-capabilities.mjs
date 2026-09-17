#!/usr/bin/env node
/**
 * packages/tooling/check-capabilities.mjs
 *
 * The five capability families are the site's commercial doorway: the rail
 * under the home page hero, the anchors on /solutions, the context a contact
 * enquiry carries. One catalogue (apps/web/lib/capabilities.ts) and one set of
 * message keys per locale feed all of them.
 *
 * Which means there are three ways for it to go quietly wrong, and all three
 * fail as a rendering fault far away from the file that caused them:
 *
 *   1. A scene's icon list and its label list disagree in length. The scene
 *      renders short, or a step renders with no label. German and English
 *      carry separate label arrays, so this can be wrong in one locale only —
 *      which is exactly the kind of thing nobody sees before a customer does.
 *   2. A scene names an icon the set does not have. <Icon> renders nothing and
 *      the step loses its mark.
 *   3. A capability loses one of its five message keys. next-intl renders the
 *      key path as text on a public page.
 *
 * `humanAt` is checked too: it points at the step a person performs, and an
 * index past the end of the scene silently means "no human step", turning a
 * governed claim about human control into nothing at all.
 *
 *   node packages/tooling/check-capabilities.mjs
 */

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const CATALOGUE = join(ROOT, 'apps/web/lib/capabilities.ts')
const ICONS = join(ROOT, 'packages/ui/primitives/Icon.tsx')
const LOCALES = ['en', 'de']

/** Message keys every capability must carry, beyond its scene. */
const REQUIRED_SUFFIXES = ['Name', 'Short', 'Pain', 'Does']

const findings = []
const fail = (msg) => findings.push(msg)

// A checker that cannot find its inputs must not report success.
for (const p of [CATALOGUE, ICONS]) {
  if (!existsSync(p)) {
    console.error(`capabilities: required input missing — ${p}`)
    console.error('Refusing to report clean without having checked anything.')
    process.exit(1)
  }
}

/* ── The catalogue ───────────────────────────────────────────────────────── */

const src = readFileSync(CATALOGUE, 'utf8')
const arrayMatch = src.match(/export const CAPABILITIES[^=]*=\s*\[([\s\S]*?)\n\]/)
if (!arrayMatch) {
  console.error('capabilities: could not locate the CAPABILITIES array in ' + CATALOGUE)
  process.exit(1)
}

/* Each entry begins at its `id:`. Splitting there keeps this independent of
   how the objects happen to be wrapped across lines. */
const chunks = arrayMatch[1].split(/(?=\bid:\s*')/).filter((c) => /\bid:\s*'/.test(c))

const caps = chunks.map((chunk) => ({
  id: (chunk.match(/\bid:\s*'([^']+)'/) || [])[1],
  icon: (chunk.match(/\bicon:\s*'([^']+)'/) || [])[1],
  key: (chunk.match(/\bkey:\s*'([^']+)'/) || [])[1],
  scene: ((chunk.match(/\bscene:\s*\[([^\]]*)\]/) || [, ''])[1].match(/'[^']+'/g) || [])
    .map((s) => s.slice(1, -1)),
  humanAt: (() => {
    const m = chunk.match(/\bhumanAt:\s*(\d+)/)
    return m ? Number(m[1]) : undefined
  })(),
}))

if (caps.length === 0) {
  console.error('capabilities: the CAPABILITIES array parsed as empty.')
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

/* ── The icon set ────────────────────────────────────────────────────────── */

const iconSrc = readFileSync(ICONS, 'utf8')
const pathsBlock = iconSrc.match(/const PATHS = \{([\s\S]*?)\n\}/)
const iconNames = new Set(
  (pathsBlock ? pathsBlock[1] : '').match(/^\s{2}([A-Za-z][A-Za-z0-9]*):/gm)?.map((m) => m.trim().replace(':', '')) ?? [],
)
if (iconNames.size === 0) {
  console.error('capabilities: parsed no icon names out of ' + ICONS)
  process.exit(1)
}

/* ── The message catalogues ──────────────────────────────────────────────── */

const messages = {}
for (const loc of LOCALES) {
  const p = join(ROOT, `apps/web/messages/${loc}.json`)
  if (!existsSync(p)) {
    console.error(`capabilities: message catalogue missing — ${p}`)
    process.exit(1)
  }
  const ns = JSON.parse(readFileSync(p, 'utf8')).capabilities
  if (!ns) fail(`${loc}.json has no "capabilities" namespace`)
  messages[loc] = ns || {}
}

/* ── The checks ──────────────────────────────────────────────────────────── */

const seen = new Set()
for (const c of caps) {
  if (!c.id || !c.key) {
    fail(`a capability entry is missing its id or key: ${JSON.stringify(c)}`)
    continue
  }
  if (seen.has(c.id)) fail(`duplicate capability id: ${c.id}`)
  seen.add(c.id)

  if (!c.icon || !iconNames.has(c.icon)) {
    fail(`${c.id}: icon "${c.icon}" is not in the icon set`)
  }
  if (c.scene.length === 0) fail(`${c.id}: has no scene`)
  for (const name of c.scene) {
    if (!iconNames.has(name)) fail(`${c.id}: scene icon "${name}" is not in the icon set`)
  }
  if (c.humanAt !== undefined && c.humanAt >= c.scene.length) {
    fail(`${c.id}: humanAt is ${c.humanAt}, past the end of a ${c.scene.length}-step scene`)
  }

  for (const loc of LOCALES) {
    const ns = messages[loc]
    for (const suffix of REQUIRED_SUFFIXES) {
      const key = `${c.key}${suffix}`
      if (typeof ns[key] !== 'string' || ns[key].trim() === '') {
        fail(`${loc}.json: capabilities.${key} is missing or empty (${c.id})`)
      }
    }
    const labels = ns[`${c.key}Scene`]
    if (!Array.isArray(labels)) {
      fail(`${loc}.json: capabilities.${c.key}Scene is missing or not an array (${c.id})`)
    } else if (labels.length !== c.scene.length) {
      fail(
        `${loc}.json: capabilities.${c.key}Scene has ${labels.length} label(s) ` +
        `but ${c.id} has ${c.scene.length} scene icon(s)`,
      )
    }
  }
}

/* Shared keys the pages read directly. */
const SHARED = ['railLabel', 'bridgeEyebrow', 'bridgeTitle', 'bridgeLede', 'bridgeCentre',
  'bridgeCaption', 'bridgeA11y', 'toolsEyebrow', 'toolsTitle', 'toolsLede', 'toolsNote']
for (const loc of LOCALES) {
  for (const key of SHARED) {
    if (typeof messages[loc][key] !== 'string' || messages[loc][key].trim() === '') {
      fail(`${loc}.json: capabilities.${key} is missing or empty`)
    }
  }
}

/* ── Report ──────────────────────────────────────────────────────────────── */

console.log('='.repeat(74))
if (!findings.length) {
  const steps = caps.reduce((n, c) => n + c.scene.length, 0)
  console.log(
    `CAPABILITIES: clean — ${caps.length} capabilities, ${steps} scene steps, ` +
    `${LOCALES.length} locales checked`,
  )
} else {
  console.log(`CAPABILITIES: ${findings.length} finding(s)\n`)
  for (const f of findings) console.log(`  ${f}`)
  console.log('\nThe catalogue is apps/web/lib/capabilities.ts; the copy lives under')
  console.log('"capabilities" in apps/web/messages/{en,de}.json. A scene\'s icon list and')
  console.log('its label list are one thing in two files and must stay the same length.')
  process.exitCode = 1
}
