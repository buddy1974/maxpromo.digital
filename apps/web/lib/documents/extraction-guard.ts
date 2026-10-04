/**
 * lib/documents/extraction-guard.ts
 *
 * What an AI extraction may put into a commercial document, decided by
 * comparing it with the source rather than by trusting it.
 *
 * WHAT HAPPENED
 *
 * The first genuine provider-backed evidence run pasted an enquiry with three
 * lines in it — "Schaltschrank-Umbau Halle 2, pauschal 2.400,00" and two more —
 * and the draft that was saved said "inkl. Material und Montage", "gemäß DGUV
 * Vorschrift 3" and "inkl. Prüfberichte und Abnahmedokumentation". None of that
 * was in the source. Each phrase is a promise: material the customer now
 * believes is included, a regulation the work is now claimed to satisfy,
 * reports now owed at handover. The arithmetic was right and the scope was not,
 * which is the more expensive way round.
 *
 * The prompt asked for it. Rule 3 told the model to turn "logo design" into
 * "Logodesign inkl. Entwürfe und Reinzeichnung" — enrichment, by instruction.
 * The prompt is fixed, but a prompt is a request, and the boundary between
 * "normalised the wording" and "added a deliverable" is too important to rest
 * on a request. So this module enforces it after the fact, deterministically,
 * from the source text.
 *
 * THE LAW
 *
 * Extraction may normalise spelling, capitalisation and structure. It may not
 * add work, materials, labour, standards, warranties, deliverables, acceptance
 * steps, documentation duties, quantities, prices, payment conditions,
 * deadlines or any other commitment the source does not state.
 *
 * HOW IT IS ENFORCED, FOR TEXT SOURCES
 *
 *   A word is SUPPORTED when its normalised form (case, umlauts, hyphens and
 *   spacing folded away) occurs in the normalised source, allowing up to three
 *   trailing letters of inflection. "Geräte" is supported by "Geräte",
 *   "Schaltschrank-Umbau" by "Schaltschrank-Umbau", "Schaltschranks" by
 *   "Schaltschrank". "Montage" is not supported by a source that never says it.
 *
 *   Line items are split into a head and trailing clauses — at commas, dashes,
 *   semicolons, brackets, and at words that introduce scope ("inkl.", "gemäß",
 *   "zzgl.", "einschließlich", …). A trailing clause containing any unsupported
 *   word is REMOVED, and the removal is reported. The head is never removed:
 *   it is the item. Unsupported words left in the head HOLD the item — it is
 *   marked low confidence, carries the words, and the form will not save it
 *   until a person confirms or edits them.
 *
 *   Quantities and prices must appear in the source, or follow from ones that
 *   do (48 × 12,50 = 600). An unsupported number holds the item.
 *
 *   The AI's free text — payment terms, notes, included items — is either fully
 *   supported or WITHHELD. Withheld text does not enter the document; it is
 *   listed in the warnings so a person can type it in deliberately if it is
 *   true. Dates must appear in the source or are withheld.
 *
 * FOR IMAGE SOURCES
 *
 * There is no source text to compare with, and a model's own transcription of
 * the image would be the model vouching for itself. So the scope-introducing
 * clauses are removed unconditionally, the AI's free text is withheld, and the
 * remaining lines carry a warning that nothing in them could be verified.
 *
 * WHAT THIS IS NOT
 *
 * It is not a judgement of whether a phrase is reasonable. "inkl. Material" may
 * well be true. The question is only whether the source said it, because a
 * quotation states what was agreed, not what was plausible.
 *
 * Pure and dependency-free, so the gate that proves it can import it directly.
 */

export type Confidence = 'high' | 'medium' | 'low'

export interface GuardLineItem {
  description: string
  quantity: number
  unit?: string
  unitPrice: number
  finalPrice: number
  isFixedPrice: boolean
  confidence?: Confidence
  category?: string
  /** Words in the description the source does not support. Set by the guard. */
  unsupportedTerms?: string[]
}

export interface GuardDoc {
  lineItems: GuardLineItem[]
  includedItems?: string[]
  paymentTerms?: string
  notes?: string
  dueDate?: string
  validUntil?: string
  anzahlung?: number
  anzahlungDate?: string
  overallConfidence?: Confidence
  warnings?: string[]
  [k: string]: unknown
}

export interface GuardReport {
  mode: 'text' | 'image'
  /** Clauses removed from line items, verbatim. */
  removed: string[]
  /** Number of line items held for confirmation. */
  held: number
  /** AI free-text fields that did not enter the document, verbatim. */
  withheld: string[]
}

/* ── Normalisation ────────────────────────────────────────────────────────── */

function fold(s: string): string {
  return s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** The source as one run of letters and digits, so compounds and hyphenation match. */
function compact(s: string): string {
  return fold(s).replace(/[^a-z0-9]/g, '')
}

/**
 * Words that carry no scope of their own. Deliberately short: anything that
 * could name work, material, a standard or a condition stays OUT of this list,
 * including "inkl", "gemaess", "nach" and "laut".
 */
const FUNCTION_WORDS = new Set([
  'und', 'oder', 'sowie', 'der', 'die', 'das', 'des', 'dem', 'den', 'ein', 'eine',
  'einer', 'eines', 'einem', 'einen', 'mit', 'fuer', 'von', 'vom', 'zur', 'zum',
  'auf', 'aus', 'bei', 'im', 'in', 'am', 'an', 'zu', 'je', 'pro', 'a', 'the',
  'and', 'or', 'of', 'for', 'per', 'to',
])

/** Words that open a clause adding scope, conditions or references. */
const SCOPE_MARKERS = [
  'inkl', 'inklusive', 'incl', 'including', 'einschl', 'einschliesslich',
  'zzgl', 'zuzueglich', 'gem', 'gemaess', 'entsprechend', 'laut', 'lt',
  'nach', 'according',
]

function words(s: string): string[] {
  return fold(s).split(/[^a-z0-9]+/).filter(Boolean)
}

function supportedWord(word: string, source: string): boolean {
  if (FUNCTION_WORDS.has(word)) return true
  if (source.includes(word)) return true
  if (/^\d+$/.test(word)) return false
  for (let cut = 1; cut <= 3 && word.length - cut >= 4; cut++) {
    if (source.includes(word.slice(0, word.length - cut))) return true
  }
  return false
}

/** Unsupported words in a piece of AI text, in their original spelling. */
export function unsupportedWords(text: string, sourceText: string): string[] {
  const source = compact(sourceText)
  const original = text.split(/[^\p{L}\p{N}]+/u).filter(Boolean)
  const out: string[] = []
  for (const w of original) {
    const parts = words(w)
    if (parts.some((p) => !supportedWord(p, source))) {
      if (!out.includes(w)) out.push(w)
    }
  }
  return out
}

/* ── Numbers ──────────────────────────────────────────────────────────────── */

/** Every value a number in the source could mean, in German or English notation. */
function sourceNumbers(sourceText: string): number[] {
  const out = new Set<number>()
  for (const m of sourceText.matchAll(/\d[\d.,]*\d|\d/g)) {
    const raw = m[0]
    const de = Number(raw.replace(/\./g, '').replace(',', '.'))
    const en = Number(raw.replace(/,/g, ''))
    if (Number.isFinite(de)) out.add(de)
    if (Number.isFinite(en)) out.add(en)
  }
  return [...out]
}

const same = (a: number, b: number) => Math.abs(a - b) < 0.005

/* ── Clauses ──────────────────────────────────────────────────────────────── */

/**
 * Splits a description into its head and the clauses after it.
 *
 * Separators: comma, semicolon, dash between spaces, brackets, line breaks,
 * and any scope marker as a whole word. The marker stays with its clause, so a
 * removed clause is reported the way it was written.
 */
export function splitClauses(description: string): { head: string; clauses: string[] } {
  const markers = SCOPE_MARKERS
    .map((m) => m.replace(/ae/g, '(?:ae|ä)').replace(/oe/g, '(?:oe|ö)').replace(/ue/g, '(?:ue|ü)').replace(/ss/g, '(?:ss|ß)'))
  const markerRe = new RegExp(`\\s(?=(?:${markers.join('|')})\\.?(?=\\s|$))`, 'giu')
  const pieces = description
    .split(/\s*(?:[,;\n()]|\s[–—-]\s)\s*/u)
    .flatMap((p) => p.split(markerRe))
    .map((p) => p.trim())
    .filter(Boolean)
  return { head: pieces[0] ?? '', clauses: pieces.slice(1) }
}

function startsWithMarker(clause: string): boolean {
  const first = words(clause)[0] ?? ''
  return SCOPE_MARKERS.includes(first)
}

/* ── The guard ────────────────────────────────────────────────────────────── */

/**
 * Applies the law to an extraction. Returns a new document and a report; the
 * input is not mutated.
 *
 * `sourceText` is the text the person pasted. Pass null for an image source.
 */
export function guardExtraction<T extends GuardDoc>(
  doc: T,
  sourceText: string | null,
): { doc: T; report: GuardReport } {
  const mode: GuardReport['mode'] = sourceText && sourceText.trim() ? 'text' : 'image'
  const src = sourceText ?? ''
  const numbers = mode === 'text' ? sourceNumbers(src) : []
  const inSource = (n: number) => numbers.some((v) => same(v, n))

  const report: GuardReport = { mode, removed: [], held: 0, withheld: [] }
  const warnings = [...(doc.warnings ?? [])]

  const lineItems = (doc.lineItems ?? []).map((li) => {
    const { head, clauses } = splitClauses(String(li.description ?? ''))
    const kept: string[] = []
    for (const c of clauses) {
      const remove = mode === 'image'
        ? startsWithMarker(c)
        : unsupportedWords(c, src).length > 0
      if (remove) report.removed.push(c)
      else kept.push(c)
    }
    /* Untouched unless something was removed: rejoining clauses would change
       punctuation the source chose. */
    const description = kept.length === clauses.length
      ? String(li.description ?? '').trim()
      : [head, ...kept].join(', ')

    const terms = mode === 'text' ? unsupportedWords(description, src) : []

    if (mode === 'text') {
      const qty = Number(li.quantity)
      const unit = Number(li.unitPrice)
      const total = Number(li.finalPrice)
      const qtyOk = (li.isFixedPrice && same(qty, 1)) || inSource(qty)
      const unitOk = inSource(unit) || (li.isFixedPrice && same(unit, total) && inSource(total))
      const totalOk = inSource(total) || (unitOk && qtyOk && same(qty * unit, total))
      if (!qtyOk) terms.push(`Menge ${qty}`)
      if (!unitOk) terms.push(`Einzelpreis ${unit}`)
      if (!totalOk) terms.push(`Betrag ${total}`)
    }

    if (terms.length > 0) {
      report.held++
      return { ...li, description, confidence: 'low' as Confidence, unsupportedTerms: terms }
    }
    const { unsupportedTerms: _drop, ...rest } = li
    void _drop
    return { ...rest, description }
  })

  /* Free text: fully supported, or it does not enter the document. */
  const admit = (label: string, text: string | undefined): string | undefined => {
    const t = (text ?? '').trim()
    if (!t) return undefined
    if (mode === 'text' && unsupportedWords(t, src).length === 0) return t
    report.withheld.push(`${label}: ${t}`)
    return undefined
  }

  const includedItems = (doc.includedItems ?? [])
    .map((it) => admit('Inklusive', it))
    .filter((it): it is string => Boolean(it))
  const paymentTerms = admit('Zahlungsbedingungen', doc.paymentTerms)
  const notes = admit('Notizen', doc.notes)

  /* Dates and deposits: deadlines and money, so the source must state them. */
  const dateInSource = (iso: string | undefined): boolean => {
    const m = (iso ?? '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (!m || mode !== 'text') return false
    const [, y, mo, d] = m
    const forms = [
      `${y}-${mo}-${d}`, `${d}.${mo}.${y}`, `${Number(d)}.${Number(mo)}.${y}`,
      `${d}.${mo}.${y.slice(2)}`, `${Number(d)}.${Number(mo)}.${y.slice(2)}`,
    ]
    return forms.some((f) => src.includes(f))
  }
  const date = (label: string, v: string | undefined) => {
    if (!v) return undefined
    if (dateInSource(v)) return v
    report.withheld.push(`${label}: ${v}`)
    return undefined
  }
  const validUntil = date('Gültig bis', doc.validUntil)
  const dueDate = date('Fällig', doc.dueDate)
  const anzahlungDate = date('Anzahlung am', doc.anzahlungDate)
  let anzahlung = doc.anzahlung
  if (typeof anzahlung === 'number' && anzahlung > 0 && !(mode === 'text' && inSource(anzahlung))) {
    report.withheld.push(`Anzahlung: ${anzahlung}`)
    anzahlung = 0
  }

  if (report.removed.length) {
    warnings.push(
      `Removed wording the source does not contain: ${report.removed.map((r) => `"${r}"`).join(', ')}.`,
    )
  }
  if (report.held) {
    warnings.push(
      `${report.held} line item(s) contain wording or figures the source does not support — confirm or edit before saving.`,
    )
  }
  if (report.withheld.length) {
    warnings.push(
      `Not adopted, because the source does not state it: ${report.withheld.map((w) => `"${w}"`).join(', ')}.`,
    )
  }
  if (mode === 'image') {
    warnings.push('Image source: no text to verify against. Every line, quantity and price must be checked by hand.')
  }

  const overallConfidence: Confidence | undefined =
    report.held > 0 || mode === 'image' ? 'low' : doc.overallConfidence

  return {
    doc: {
      ...doc,
      lineItems,
      includedItems,
      paymentTerms,
      notes,
      validUntil,
      dueDate,
      anzahlungDate,
      anzahlung,
      overallConfidence,
      warnings,
    } as T,
    report,
  }
}

/** Held figures are named this way, so a held word and a held number can be told apart. */
const FIGURE_TERM = /^(Menge|Einzelpreis|Betrag) /

/**
 * True while a line item still contains something the guard held.
 *
 * A held word stops holding once a person has edited it out of the
 * description. A held figure holds until a person confirms it, because there is
 * no edit that makes an unsupported price supported. Confirmation clears
 * `unsupportedTerms` entirely; that is the form's job, not this function's.
 */
export function isHeld(item: { description: string; unsupportedTerms?: string[] }): boolean {
  const desc = ` ${words(item.description ?? '').join(' ')} `
  return (item.unsupportedTerms ?? []).some((t) =>
    FIGURE_TERM.test(t) || desc.includes(` ${words(t).join(' ')} `),
  )
}
