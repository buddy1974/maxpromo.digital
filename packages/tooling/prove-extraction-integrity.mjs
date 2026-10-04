#!/usr/bin/env node
/**
 * packages/tooling/prove-extraction-integrity.mjs
 *
 * An AI extraction may not put scope into a quotation that the source did not
 * state, and may not attach a quotation to a client it merely resembles.
 *
 * WHAT HAPPENED
 *
 * The first genuine provider-backed evidence run, 2026-10-04. The governed
 * source had three lines. The saved draft ANG-2026-015 said, among other
 * things, "inkl. Material und Montage", "gemäß DGUV Vorschrift 3" and "inkl.
 * Prüfberichte und Abnahmedokumentation" — none of it in the source, all of it
 * a commitment. The prompt had asked for that enrichment by name.
 *
 * The same run extracted "Beckmann Elektrotechnik GmbH" while that exact
 * client already existed, and saved the quotation unlinked: the form never
 * consulted the client list.
 *
 * THE FIXTURES ARE THE EVIDENCE
 *
 * The source is read from lib/evidence/dataset.ts, the governed text Chrome
 * pasted. The AI output is the line items and text actually saved as
 * ANG-2026-015, verbatim. No provider is called: this gate proves what the
 * application does with a given extraction, which is the part the application
 * owns, and it costs nothing to run.
 *
 *   node packages/tooling/prove-extraction-integrity.mjs
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { stripComments } from './strip-comments.mjs'

const ROOT = process.cwd()
const results = []
const check = (name, ok, detail = '') => {
  results.push(ok)
  console.log(`  ${ok ? 'pass' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)
}
const read = (...p) => readFileSync(join(ROOT, ...p), 'utf8')
const load = (...p) => import(pathToFileURL(join(ROOT, ...p)).href)

const { guardExtraction, isHeld } = await load('apps', 'web', 'lib', 'documents', 'extraction-guard.ts')
const { matchExistingClient } = await load('apps', 'web', 'lib', 'documents', 'client-match.ts')

/* The governed source, from the file that defines it. */
const dataset = read('apps', 'web', 'lib', 'evidence', 'dataset.ts')
const SOURCE = dataset.match(/EVIDENCE_SOURCE_NOTE = `([\s\S]*?)`/)?.[1] ?? ''

/* What the provider returned and the form saved as ANG-2026-015. */
const CHROME_RUN = {
  type: 'angebot',
  clientName: 'Katrin Beckmann',
  clientCompany: 'Beckmann Elektrotechnik GmbH',
  overallConfidence: 'high',
  lineItems: [
    { description: 'Schaltschrank-Umbau Halle 2 – Pauschalleistung inkl. Material und Montage',
      quantity: 1, unit: 'pauschal', unitPrice: 2400, finalPrice: 2400, isFixedPrice: true, confidence: 'high' },
    { description: 'Prüfung ortsveränderlicher elektrischer Geräte gemäß DGUV Vorschrift 3',
      quantity: 48, unit: 'Stück', unitPrice: 12.5, finalPrice: 600, isFixedPrice: false, confidence: 'high' },
    { description: 'Dokumentation und Übergabeprotokoll – Pauschalleistung inkl. Prüfberichte und Abnahmedokumentation',
      quantity: 1, unit: 'pauschal', unitPrice: 380, finalPrice: 380, isFixedPrice: true, confidence: 'high' },
  ],
  paymentTerms: 'Zahlung wie gewohnt an die Buchhaltung – genaue Zahlungsbedingungen bitte vorab klären',
  notes: 'Angebot auf Basis der schriftlichen Anfrage von Frau Katrin Beckmann. Rechnung laut Kundenwunsch an die Buchhaltung der Beckmann Elektrotechnik GmbH zu richten.',
}

console.log('='.repeat(74))
console.log('EXTRACTION INTEGRITY')

/* ── The fixture is the real one ─────────────────────────────────────────── */
console.log('')
console.log('The fixture is the governed source')
check('the evidence source note was found in dataset.ts', SOURCE.includes('Schaltschrank-Umbau Halle 2, pauschal 2.400,00'))

/* ── Defect 1: unsupported scope ─────────────────────────────────────────── */
console.log('')
console.log('Scope the source did not state does not reach the quotation')
{
  const { doc, report } = guardExtraction(CHROME_RUN, SOURCE)
  const descs = doc.lineItems.map((l) => l.description)
  const invented = ['Material', 'Montage', 'DGUV', 'Vorschrift', 'Prüfberichte', 'Abnahmedokumentation', 'Pauschalleistung']
  const surviving = invented.filter((w) => descs.some((d) => d.includes(w)))
  check('none of the Chrome-run inventions survive in a line item', surviving.length === 0,
    surviving.length ? `still present: ${surviving.join(', ')}` : '')
  check('line 1 is reduced to the source wording', descs[0] === 'Schaltschrank-Umbau Halle 2', descs[0])
  check('line 3 is reduced to the source wording', descs[2] === 'Dokumentation und Übergabeprotokoll', descs[2])
  check('line 2 is held for the one word left that the source lacks',
    isHeld(doc.lineItems[1]) && doc.lineItems[1].unsupportedTerms.includes('elektrischer')
      && doc.lineItems[1].confidence === 'low',
    `${descs[1]} / ${JSON.stringify(doc.lineItems[1].unsupportedTerms)}`)
  check('the invented payment condition is withheld', doc.paymentTerms === undefined)
  check('the composed notes are withheld', doc.notes === undefined)
  check('every removal and withholding is reported to the person',
    report.removed.length === 5 && report.withheld.length === 2
      && doc.warnings.some((w) => w.includes('inkl. Material und Montage')))
  const total = doc.lineItems.reduce((s, l) => s + l.finalPrice, 0)
  check('the arithmetic is untouched', total === 3380, `€${total}`)
  check('a held extraction is never reported as high confidence', doc.overallConfidence === 'low')
}

console.log('')
console.log('A faithful extraction passes through unchanged')
{
  const faithful = {
    lineItems: [
      { description: 'Schaltschrank-Umbau Halle 2', quantity: 1, unitPrice: 2400, finalPrice: 2400, isFixedPrice: true, confidence: 'high' },
      { description: 'Prüfung ortsveränderlicher Geräte', quantity: 48, unitPrice: 12.5, finalPrice: 600, isFixedPrice: false, confidence: 'high' },
      { description: 'Dokumentation und Übergabeprotokoll', quantity: 1, unitPrice: 380, finalPrice: 380, isFixedPrice: true, confidence: 'high' },
    ],
    overallConfidence: 'high',
  }
  const { doc, report } = guardExtraction(faithful, SOURCE)
  check('nothing removed, held or withheld', report.removed.length === 0 && report.held === 0 && report.withheld.length === 0,
    JSON.stringify(report))
  check('confidence is not downgraded', doc.overallConfidence === 'high')
  const reworded = guardExtraction({
    lineItems: [{ description: 'Umbau des Schaltschranks, Halle 2', quantity: 1, unitPrice: 2400, finalPrice: 2400, isFixedPrice: true }],
  }, SOURCE)
  check('inflection and word order are normalisation, not invention',
    reworded.report.held === 0 && reworded.report.removed.length === 0,
    JSON.stringify(reworded.doc.lineItems[0]))
}

console.log('')
console.log('Scope the source DID state is kept')
{
  const src = 'Bitte Angebot: Wallbox-Montage inkl. Material, pauschal 900,00. Zahlung 14 Tage netto. Gültig bis 31.10.2026'
  const { doc, report } = guardExtraction({
    lineItems: [{ description: 'Wallbox-Montage inkl. Material', quantity: 1, unitPrice: 900, finalPrice: 900, isFixedPrice: true }],
    paymentTerms: 'Zahlung 14 Tage netto',
    validUntil: '2026-10-31',
  }, src)
  check('a stated "inkl. Material" is not removed', doc.lineItems[0].description === 'Wallbox-Montage inkl. Material' && report.removed.length === 0,
    doc.lineItems[0].description)
  check('stated payment terms are adopted', doc.paymentTerms === 'Zahlung 14 Tage netto')
  check('a stated date is adopted', doc.validUntil === '2026-10-31')
}

console.log('')
console.log('Figures, dates and free text must come from the source')
{
  const { doc } = guardExtraction({
    lineItems: [
      { description: 'Prüfung ortsveränderlicher Geräte', quantity: 48, unitPrice: 13.5, finalPrice: 648, isFixedPrice: false },
      /* 3, because "Halle 2" puts a 2 in the source: figure support is by
         presence, not position, and the fixture should not pretend otherwise. */
      { description: 'Schaltschrank-Umbau Halle 2', quantity: 3, unitPrice: 2400, finalPrice: 7200, isFixedPrice: false },
    ],
    validUntil: '2026-11-30',
    includedItems: ['Anfahrt', 'Halle 2'],
    anzahlung: 500,
  }, SOURCE)
  check('an invented unit price holds the line', isHeld(doc.lineItems[0])
    && doc.lineItems[0].unsupportedTerms.some((t) => t.startsWith('Einzelpreis')), JSON.stringify(doc.lineItems[0].unsupportedTerms))
  check('an invented quantity holds the line', isHeld(doc.lineItems[1])
    && doc.lineItems[1].unsupportedTerms.some((t) => t.startsWith('Menge')), JSON.stringify(doc.lineItems[1].unsupportedTerms))
  check('an invented deadline is withheld', doc.validUntil === undefined)
  check('an invented included item is withheld, a supported one kept',
    JSON.stringify(doc.includedItems) === JSON.stringify(['Halle 2']), JSON.stringify(doc.includedItems))
  check('an invented deposit is withheld', doc.anzahlung === 0)
}

console.log('')
console.log('A hold is released only by a person')
{
  const held = { description: 'Prüfung ortsveränderlicher elektrischer Geräte', unsupportedTerms: ['elektrischer'] }
  check('a held word holds while it is in the description', isHeld(held))
  check('editing the word out releases the hold', !isHeld({ ...held, description: 'Prüfung ortsveränderlicher Geräte' }))
  check('a held figure holds until confirmed, whatever the wording',
    isHeld({ description: 'X', unsupportedTerms: ['Einzelpreis 13.5'] }))
  check('confirming (clearing the terms) releases it', !isHeld({ description: 'X', unsupportedTerms: undefined }))
}

console.log('')
console.log('An image source is never treated as verified')
{
  const { doc, report } = guardExtraction(CHROME_RUN, null)
  check('scope-introducing clauses are removed', !doc.lineItems.some((l) => /inkl\.|gemäß/.test(l.description)),
    doc.lineItems.map((l) => l.description).join(' | '))
  check('AI free text is withheld', doc.paymentTerms === undefined && doc.notes === undefined)
  check('confidence is low and the person is told why', report.mode === 'image' && doc.overallConfidence === 'low'
    && doc.warnings.some((w) => w.startsWith('Image source')))
}

/* ── Defect 3: client linking ────────────────────────────────────────────── */
console.log('')
console.log('An extracted customer links only on one exact match')
{
  const beckmann = { id: 'c-beckmann', name: 'Katrin Beckmann', company: 'Beckmann Elektrotechnik GmbH', email: 'buchhaltung@beckmann-elektro.example' }
  const other = { id: 'c-other', name: 'Jonas Weber', company: 'Weber Haustechnik GmbH', email: 'info@weber.example' }
  const clients = [beckmann, other]

  const m1 = matchExistingClient(CHROME_RUN, clients)
  check('the Chrome-run extraction links to the existing Beckmann client',
    m1.kind === 'linked' && m1.client.id === 'c-beckmann' && m1.basis === 'company', JSON.stringify(m1.kind === 'linked' ? m1.basis : m1))

  const m2 = matchExistingClient({ clientCompany: 'BECKMANN ELEKTROTECHNIK  GMBH.' }, clients)
  check('case, spacing and punctuation do not matter', m2.kind === 'linked' && m2.client.id === 'c-beckmann')

  const m3 = matchExistingClient({ clientName: 'Katrin Beckmann', clientCompany: 'Beckmann Elektrotechnik' }, clients)
  check('a different legal form does not link', m3.kind !== 'linked', m3.kind)

  const m4 = matchExistingClient({ clientName: 'Katrin Beckmann' }, clients)
  check('a person\'s name alone never links', m4.kind === 'ambiguous' && m4.reason === 'name-only', m4.kind)

  const m5 = matchExistingClient({ clientEmail: ' Info@Weber.example ' }, clients)
  check('a unique email links', m5.kind === 'linked' && m5.client.id === 'c-other' && m5.basis === 'email')

  const m6 = matchExistingClient({ clientCompany: 'Beckmann Elektrotechnik GmbH', clientEmail: 'info@weber.example' }, clients)
  check('email pointing at one client and company at another is a conflict, not a link',
    m6.kind === 'ambiguous' && m6.reason === 'conflict', m6.kind)

  const dup = { ...beckmann, id: 'c-beckmann-2', email: 'einkauf@beckmann-elektro.example' }
  const m7 = matchExistingClient({ clientCompany: 'Beckmann Elektrotechnik GmbH' }, [...clients, dup])
  check('two clients with the same company require a person to choose',
    m7.kind === 'ambiguous' && m7.candidates.length === 2, m7.kind)

  const m8 = matchExistingClient({ clientCompany: 'Beckmann Elektrotechnik GmbH', clientEmail: 'einkauf@beckmann-elektro.example' }, [...clients, dup])
  check('email narrows a duplicated company to one client', m8.kind === 'linked' && m8.client.id === 'c-beckmann-2')

  check('no match and no data leave the form as it was',
    matchExistingClient({ clientCompany: 'Neue Firma GmbH' }, clients).kind === 'none'
      && matchExistingClient({}, clients).kind === 'none')
}

/* ── Wiring: the guard and the matcher are actually in the path ──────────── */
console.log('')
console.log('The application uses them')
{
  const route = stripComments(read('apps', 'web', 'app', 'api', 'os', 'ai', 'enhance', 'route.ts'))
  check('the enhance route guards every document extraction against the pasted text',
    /guardExtraction\(\s*toolBlock\.input/.test(route) && /hasText \? body\.text!\.trim\(\) : null/.test(route))

  const prompt = read('apps', 'web', 'lib', 'prompts.ts')
  check('the prompt no longer instructs enrichment',
    !/ENHANCE descriptions/.test(prompt) && /NEVER add anything the source does not/.test(prompt))

  const form = stripComments(read('apps', 'web', 'app', 'os', '(protected)', 'angebote', 'new', 'page.tsx'))
  check('the form matches extracted customers against existing clients',
    /matchExistingClient\(d, clientsRef\.current\)/.test(form))
  check('the form will not save a held line', /heldCount > 0\) return/.test(form) && /disabled=\{saving \|\| !clientName\.trim\(\) \|\| heldCount > 0\}/.test(form))
  const apply = form.slice(form.indexOf('function applyExtracted'), form.indexOf('const triggerImageExtract'))
  check('payment terms are not copied into the notes as well (rendered twice)',
    apply.length > 0 && !/Zahlungsbedingungen/.test(apply))
}

console.log('')
const bad = results.filter((r) => !r).length
console.log('='.repeat(74))
if (bad === 0) {
  console.log(`EXTRACTION INTEGRITY: clean — ${results.length} propert(ies) proved`)
} else {
  console.log(`EXTRACTION INTEGRITY: ${bad} of ${results.length} FAILED\n`)
  console.log('A quotation states what the source says. An extraction may normalise the')
  console.log('wording; it may not add work, material, standards, terms or figures, and it')
  console.log('may not file a document under a client it only resembles.')
  process.exitCode = 1
}
