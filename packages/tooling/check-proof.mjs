#!/usr/bin/env node
/**
 * packages/tooling/check-proof.mjs
 *
 * A proof package may not claim more than its evidence and its permissions
 * allow.
 *
 * WHAT THIS PROTECTS, AND WHAT IT DOES NOT
 *
 * It does not check that the statements are true. Nothing can. It checks the
 * failures that are mechanical, that have already happened here once, and that
 * a reviewer reading a long file will not reliably catch:
 *
 *   1. A quantity published without a measurement behind it. The rule the
 *      company adopted on 2026-09-20, applied at the source this time rather
 *      than at the page.
 *   2. A permission left unknown being treated as a yes. The whole point of
 *      the permission model, and worthless if nothing enforces it.
 *   3. A statement with a basis but no source. "Established by an artefact"
 *      with no artefact named is an assertion wearing evidence's clothes.
 *   4. Missing evidence recorded in one place and contradicted in another:
 *      a package that says the before state is unknown and also publishes a
 *      statement about the before state.
 *   5. A media requirement that claims public suitability while admitting it
 *      needs customer data.
 *   6. A media requirement recorded as satisfied by an artefact that is not
 *      in the repository. The only claim here a machine can settle outright,
 *      and the one most likely to rot as files move.
 *   7. A media requirement recorded as both satisfied and blocked. They say
 *      opposite things and one of them is stale.
 *   8. A public image made from evidence that is not the recorded derivative
 *      of an inspected capture, or a frame whose inspection saw the bank
 *      block published without a redaction.
 *
 * Every one of these is a rule the registry itself states. This file is the
 * part that makes the registry mean something.
 *
 *   node packages/tooling/check-proof.mjs
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'

const ROOT = process.cwd()

/* Every evidence ledger, keyed by artefact path; the current entry wins. */
const ledgers = new Map()
const evidenceRoot = join(ROOT, 'docs', 'evidence')
if (existsSync(evidenceRoot)) {
  for (const dir of readdirSync(evidenceRoot)) {
    const p = join(evidenceRoot, dir, 'LEDGER.json')
    if (!existsSync(p)) continue
    for (const e of JSON.parse(readFileSync(p, 'utf8'))) if (!e.supersededOn) ledgers.set(e.file, e)
  }
}
const ledgerFor = (artefact) => ledgers.get(artefact)
const hashOf = (artefact) => createHash('sha256').update(readFileSync(join(ROOT, artefact))).digest('hex')
const registry = join(ROOT, 'packages', 'config', 'proof.ts')
if (!existsSync(registry)) {
  console.error('proof: no registry at packages/config/proof.ts')
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}
const { PROOF_PACKAGES, mayPublish, NO_PERMISSIONS } =
  await import(pathToFileURL(registry).href)

if (!Array.isArray(PROOF_PACKAGES) || PROOF_PACKAGES.length === 0) {
  console.error('proof: the registry holds no packages.')
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

const findings = []
const say = (pkg, what, why) => findings.push({ pkg: pkg.id, what, why })

let statementsChecked = 0

for (const pkg of PROOF_PACKAGES) {
  /* A package for client work that forgot to set permissions would otherwise
     inherit whatever the author typed. Own systems use the not-applicable
     set, which is a different thing and is checked separately below. */
  if (pkg.ownership === 'client') {
    const unset = Object.entries(pkg.permissions)
      .filter(([, v]) => v === 'not-applicable')
    if (unset.length > 0) {
      say(pkg, 'client work marks permissions not-applicable',
        `There is a third party here, so every permission is applicable: ${unset.map(([k]) => k).join(', ')}`)
    }
  }
  if (pkg.ownership === 'maxpromo') {
    const asked = Object.entries(pkg.permissions).filter(([, v]) => v === 'granted')
    if (asked.length > 0) {
      say(pkg, 'an own system records granted permission',
        `Nobody granted it, because there is nobody to ask: ${asked.map(([k]) => k).join(', ')}. Use not-applicable.`)
    }
  }

  for (const s of pkg.statements) {
    statementsChecked++

    /* (3) A basis with nothing behind it. */
    if (s.basis !== 'unknown' && !s.source?.trim()) {
      say(pkg, `${s.id} names a basis but no source`,
        `basis is ${s.basis}; a source has to say where to look`)
    }
    if (s.basis === 'unknown' && s.source?.trim()) {
      say(pkg, `${s.id} is unknown but names a source`,
        'If there is a source, the basis is not unknown')
    }

    const verdict = mayPublish(s, pkg.permissions)

    /* (1) The rule, at the source. */
    if (s.kind === 'quantitative-outcome' && verdict.visibility === 'public' && s.basis !== 'measured') {
      say(pkg, `${s.id} would publish a quantity without a measurement`,
        `basis is ${s.basis}; only 'measured' supports a public quantity`)
    }

    /* (2) Unknown permission must never resolve to public. */
    const gate = {
      'customer-attribution': 'nameCompany',
      testimonial: 'useTestimonial',
      media: 'showMedia',
      'quantitative-outcome': 'showMetrics',
      'qualitative-outcome': 'describeProblem',
      'process-fact': 'showWorkflow',
    }[s.kind]
    if (gate && pkg.permissions[gate] === 'unknown' && verdict.visibility === 'public') {
      say(pkg, `${s.id} would publish on an unknown permission`,
        `${gate} is unknown, and unknown is never consent`)
    }

    /* (4) A package cannot both admit it does not know something and publish
           a statement resting on nothing. */
    if (verdict.visibility === 'public' && (s.basis === 'unknown' || s.basis === 'historical-claim')) {
      say(pkg, `${s.id} would be public on a ${s.basis} basis`,
        'Neither establishes anything; a package may not call missing evidence proved')
    }
  }

  /* (5) Media that wants to be public while admitting it needs real data. */
  for (const m of pkg.media) {
    if (m.suitability === 'public' && m.dataRisk === 'customer-data') {
      say(pkg, `media ${m.id} is marked public and carries customer data`,
        'A capture containing customer data is private-only at best')
    }
    if (!m.doesNotProve?.trim()) {
      say(pkg, `media ${m.id} does not say what it fails to prove`,
        'A screenshot always proves less than it looks like; that has to be written down')
    }

    /* (6) A satisfied requirement names an artefact that is really there.
       This is the one claim in the file a machine can check outright, and
       the one most likely to rot: files get renamed, and a package still
       saying the evidence exists is worse than one admitting it never did. */
    if (m.satisfiedBy && !existsSync(join(ROOT, m.satisfiedBy.artefact))) {
      say(pkg, `media ${m.id} names an artefact that is not in the repository`,
        `${m.satisfiedBy.artefact} does not exist. Either it moved, or the requirement is not satisfied`)
    }

    /* (6b) A captured artefact is the one that was ingested and inspected.
       Anything under docs/evidence/ arrives through ingest-evidence.mjs, which
       records its hash, and is satisfied only once an inspection naming the
       governed marker seen in it is recorded. A file swapped on disk, or
       copied in by hand, fails here — the rule that keeps a personal
       screenshot from becoming "evidence" because it had the right name. */
    if (m.satisfiedBy?.artefact?.startsWith('docs/evidence/') && existsSync(join(ROOT, m.satisfiedBy.artefact))) {
      const entry = ledgerFor(m.satisfiedBy.artefact)
      if (!entry) {
        say(pkg, `media ${m.id} names an evidence file with no ledger entry`,
          'Captures enter through npm run evidence:ingest, which records where they came from')
      } else if (entry.sha256 !== hashOf(m.satisfiedBy.artefact)) {
        say(pkg, `media ${m.id} names an evidence file that no longer matches its ledger hash`,
          'The file on disk is not the one that was ingested and inspected')
      } else if (!entry.inspection) {
        say(pkg, `media ${m.id} names an evidence file nobody has recorded inspecting`,
          'Ingesting is not inspecting. Record what was seen with --record-inspection')
      }
    }

    /* (7) Satisfied or blocked, never both. The two say opposite things
       about whether the evidence exists, and a record holding both leaves
       the reader to guess which one is current. */
    if (m.satisfiedBy && m.blockedBy) {
      say(pkg, `media ${m.id} is recorded as both satisfied and blocked`,
        'One of the two is stale. A requirement has one state')
    }
  }

  /* A package that records no missing evidence has almost certainly not
     looked. Not a failure, but worth saying out loud. */
  if (pkg.missing.length === 0) {
    say(pkg, 'records no missing evidence',
      'Possible, and unusual. Confirm nothing was overlooked.')
  }
}

/* (8) A public image made from evidence is the derivative that was recorded.
   ADR-0017: publication is a projection of the evidence, and the projection is
   declared in the package's DERIVATIVES.json by evidence:derive. Three ways it
   can go wrong, each mechanical:
     - the source drifted from its ledger entry, so the image no longer derives
       from what was inspected
     - the public file was swapped or edited after it was made
     - a file appears beside the derivatives with no record at all — the shape a
       hand-made, unredacted copy would take
   And one that is the reason this rule exists: a capture whose inspection
   recorded the bank block may not be published without a redaction. */
let derivativesChecked = 0
if (existsSync(evidenceRoot)) {
  for (const dir of readdirSync(evidenceRoot)) {
    const specPath = join(evidenceRoot, dir, 'DERIVATIVES.json')
    if (!existsSync(specPath)) continue
    const where = { id: `evidence/${dir}` }
    const spec = JSON.parse(readFileSync(specPath, 'utf8'))
    const outputs = new Set()
    for (const d of spec) {
      derivativesChecked++
      outputs.add(d.output)
      const entry = ledgerFor(d.source)
      if (!entry || !existsSync(join(ROOT, d.source)) || hashOf(d.source) !== entry.sha256 || d.sourceSha256 !== entry.sha256) {
        say(where, `derivative ${d.output} does not derive from the inspected evidence`,
          'Its source is missing from the ledger, or the source hash no longer matches. Re-run evidence:derive from the ingested file')
      }
      if (!existsSync(join(ROOT, d.output))) {
        say(where, `derivative ${d.output} is recorded but not on disk`, 'Run npm run evidence:derive')
      } else if (hashOf(d.output) !== d.outputSha256) {
        say(where, `derivative ${d.output} no longer matches its recorded hash`,
          'A public derivative is changed only by evidence:derive, so the change is recorded')
      }
      if (/BANK BLOCK IN FRAME/.test(entry?.inspection?.note ?? '')
        && (d.classification !== 'public-derivative-required' || !(d.redactions?.length > 0))) {
        say(where, `derivative ${d.output} would publish a frame recorded with the bank block`,
          'The inspection saw bank details; the public copy must redact them')
      }
    }
    for (const folder of new Set([...outputs].map((o) => o.slice(0, o.lastIndexOf('/'))))) {
      if (!existsSync(join(ROOT, folder))) continue
      for (const f of readdirSync(join(ROOT, folder))) {
        if (!outputs.has(`${folder}/${f}`)) {
          say(where, `${folder}/${f} sits beside the evidence derivatives with no record`,
            'Every image here must be made by evidence:derive from an inspected capture')
        }
      }
    }
  }
}

/* A rule that examines nothing looks identical to a rule that passes. ADR-0004. */
if (statementsChecked === 0) {
  console.error('proof: the registry holds packages but no statements.')
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

console.log('='.repeat(74))
console.log('PROOF PACKAGES')
console.log(`${PROOF_PACKAGES.length} package(s), ${statementsChecked} statement(s) checked, ${derivativesChecked} public derivative(s) verified`)

for (const pkg of PROOF_PACKAGES) {
  const pub = pkg.statements.filter((s) => mayPublish(s, pkg.permissions).visibility === 'public')
  const priv = pkg.statements.filter((s) => mayPublish(s, pkg.permissions).visibility === 'private-only')
  const held = pkg.statements.filter((s) => mayPublish(s, pkg.permissions).visibility === 'withheld')
  console.log('')
  console.log(`  ${pkg.id}`)
  console.log(`    ${pub.length} publishable · ${priv.length} private only · ${held.length} withheld`)
  const satisfied = pkg.media.filter((m) => m.satisfiedBy).length
  const blocked = pkg.media.filter((m) => m.blockedBy).length
  console.log(`    ${pkg.missing.length} open question(s) · ${pkg.media.length} media requirement(s) · demo: ${pkg.demo}`)
  /* Printed every run. A blocked artefact that nobody is reminded about is
     indistinguishable from one nobody ever wanted. */
  console.log(`    media: ${satisfied} satisfied · ${blocked} blocked · ${pkg.media.length - satisfied - blocked} outstanding`)
}

if (findings.length === 0) {
  console.log('\nPROOF: clean — every package claims only what its evidence and permissions allow')
} else {
  console.log(`\nPROOF: ${findings.length} finding(s)\n`)
  for (const f of findings) {
    console.log(`  ${f.pkg}: ${f.what}`)
    console.log(`      ${f.why}`)
    console.log('')
  }
  console.log('Evidence and permission are recorded in packages/config/proof.ts.')
  console.log('They are statements about the world and about what somebody agreed to,')
  console.log('never fields to edit so that a build goes green.')
  process.exitCode = 1
}
