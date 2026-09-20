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
 *
 * Every one of these is a rule the registry itself states. This file is the
 * part that makes the registry mean something.
 *
 *   node packages/tooling/check-proof.mjs
 */

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = process.cwd()
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
  }

  /* A package that records no missing evidence has almost certainly not
     looked. Not a failure, but worth saying out loud. */
  if (pkg.missing.length === 0) {
    say(pkg, 'records no missing evidence',
      'Possible, and unusual. Confirm nothing was overlooked.')
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
console.log(`${PROOF_PACKAGES.length} package(s), ${statementsChecked} statement(s) checked`)

for (const pkg of PROOF_PACKAGES) {
  const pub = pkg.statements.filter((s) => mayPublish(s, pkg.permissions).visibility === 'public')
  const priv = pkg.statements.filter((s) => mayPublish(s, pkg.permissions).visibility === 'private-only')
  const held = pkg.statements.filter((s) => mayPublish(s, pkg.permissions).visibility === 'withheld')
  console.log('')
  console.log(`  ${pkg.id}`)
  console.log(`    ${pub.length} publishable · ${priv.length} private only · ${held.length} withheld`)
  console.log(`    ${pkg.missing.length} open question(s) · ${pkg.media.length} media requirement(s) · demo: ${pkg.demo}`)
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
