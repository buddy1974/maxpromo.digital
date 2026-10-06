#!/usr/bin/env node
/**
 * packages/tooling/derive-evidence.mjs
 *
 * The one way a governed capture becomes a public image.
 *
 * WHY A TOOL
 *
 * ADR-0017: evidence is recorded once and publication is a projection of it.
 * The captures under docs/evidence/ are the record — ingested byte for byte,
 * hashed, inspected — and they are never edited. What the website shows is a
 * derivative, and a derivative made by hand in an image editor carries no
 * account of what was changed. Frame 3 of the Maxpromo OS package shows the
 * company's bank details; the public copy must not, and the difference between
 * the two has to be written down somewhere a machine can check.
 *
 * So every derivative is declared in the package's DERIVATIVES.json: its
 * source, a crop, and each redaction with what it removes. This tool:
 *
 *   - refuses a source that has no current ledger entry, no recorded
 *     inspection, or a hash that no longer matches the ledger — a derivative
 *     of an unverified file is not a derivative of the evidence
 *   - applies the crop and paints each redaction as a solid block, visibly.
 *     Nothing is blurred, inpainted or replaced: a covered line looks covered
 *   - writes the output under apps/web/public and records its hash, size and
 *     dimensions back into DERIVATIVES.json
 *
 * It never writes inside docs/evidence/<package>/ except to that JSON file,
 * and never touches an original. `check:proof` then refuses a public
 * derivative whose source or output has drifted from the record.
 *
 *   npm run evidence:derive -- --package maxpromo-os
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'

const ROOT = process.cwd()
/* sharp is a dependency of the web application, which is where it is
   installed; resolved from there rather than added to the root. */
const sharp = createRequire(join(ROOT, 'apps', 'web', 'package.json'))('sharp')

const arg = (name) => {
  const i = process.argv.indexOf(name)
  return i === -1 ? undefined : process.argv[i + 1]
}
const fail = (msg) => { console.error(`evidence:derive: ${msg}`); process.exit(1) }
const sha256 = (p) => createHash('sha256').update(readFileSync(p)).digest('hex')

const pkg = arg('--package')
if (!pkg || !/^[a-z0-9-]+$/.test(pkg)) fail('need --package <name>, e.g. --package maxpromo-os')
const DIR = join(ROOT, 'docs', 'evidence', pkg)
const SPEC = join(DIR, 'DERIVATIVES.json')
const LEDGER = join(DIR, 'LEDGER.json')
if (!existsSync(SPEC)) fail(`no ${SPEC}`)
if (!existsSync(LEDGER)) fail(`no ${LEDGER}`)

const ledger = JSON.parse(readFileSync(LEDGER, 'utf8')).filter((e) => !e.supersededOn)
const spec = JSON.parse(readFileSync(SPEC, 'utf8'))
const REDACTION = { r: 17, g: 17, b: 17 } // Maxpromo Black, --brand-* #111111

for (const d of spec) {
  const entry = ledger.find((e) => e.file === d.source)
  if (!entry) fail(`${d.source} has no current ledger entry`)
  if (!entry.inspection) fail(`${d.source} has never been inspected`)
  const src = join(ROOT, d.source)
  if (sha256(src) !== entry.sha256) fail(`${d.source} no longer matches its ledger hash`)
  if (!d.output.startsWith('apps/web/public/')) fail(`${d.output} is not a public path`)
  if (!['public-as-is', 'public-derivative-required'].includes(d.classification)) {
    fail(`${d.requirement}: only public classifications produce a derivative`)
  }

  const { left, top, width, height } = d.crop
  const overlays = d.redactions.map((r) => {
    if (r.left < left || r.top < top || r.left + r.width > left + width || r.top + r.height > top + height) {
      fail(`${d.requirement}: a redaction falls outside the crop`)
    }
    return {
      input: { create: { width: r.width, height: r.height, channels: 3, background: REDACTION } },
      left: r.left - left,
      top: r.top - top,
    }
  })

  const out = join(ROOT, d.output)
  mkdirSync(dirname(out), { recursive: true })
  await sharp(src)
    .extract({ left, top, width, height })
    .composite(overlays)
    .png({ compressionLevel: 9 })
    .toFile(out)

  d.sourceSha256 = entry.sha256
  d.outputSha256 = sha256(out)
  d.bytes = readFileSync(out).length
  d.width = width
  d.height = height
  d.madeOn = new Date().toISOString().slice(0, 10)
  console.log(`evidence:derive: ${d.requirement} -> ${d.output} (${width}×${height}, ${d.redactions.length} redaction(s), sha256 ${d.outputSha256.slice(0, 12)}…)`)
}

writeFileSync(SPEC, JSON.stringify(spec, null, 2) + '\n')
console.log('Look at every output before it is used. A redaction is checked by eye, not by this tool.')
