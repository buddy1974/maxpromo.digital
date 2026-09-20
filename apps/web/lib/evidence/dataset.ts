import { EVIDENCE_DOC_PREFIX, EVIDENCE_MARKER } from '@maxpromo/config'

/**
 * lib/evidence/dataset.ts
 *
 * One fictional German business, and the paperwork of a single week.
 *
 * GENERATED FROM ZERO, NEVER COPIED
 *
 * Nothing here is derived from a production record. There is no sanitising
 * step, no anonymisation pass and no code path that reads the production
 * database, because the safest way to avoid leaking a real customer is to
 * never have read one. Every name, address, amount and line item below was
 * written for this file.
 *
 * DETERMINISTIC
 *
 * No randomness, no `Date.now()`, no incrementing counters. Running the seed
 * twice produces byte-identical rows, which is what makes it idempotent and
 * what makes a screenshot reproducible six months from now when the figures in
 * it need to match the ones in an article.
 *
 * OBVIOUSLY FICTIONAL, PROFESSIONALLY REALISTIC
 *
 * Both halves matter. The business has to look like a real German SME or the
 * screenshot demonstrates nothing: plausible legal form, a real-looking
 * address format, VAT-free invoicing under §19 as Maxpromo itself invoices.
 * And it has to be unmistakable to a human: every document number starts with
 * EVD, the company is in the fictional town of Musterhausen, and the domain is
 * `.example`, a reserved TLD that cannot resolve.
 *
 * The one rule that matters more than realism: no real person's data, no real
 * company, no real address. "Musterhausen" and `.example` are not decoration.
 */

/** The fictional customer. One business, so the scenario stays a story. */
export const EVIDENCE_CLIENT = {
  name:     'Katrin Beckmann',
  company:  'Beckmann Elektrotechnik GmbH',
  email:    'buchhaltung@beckmann-elektro.example',
  phone:    '+49 201 5550142',
  address:  'Industriestraße 14',
  postcode: '45899',
  city:     'Musterhausen',
  country:  'Deutschland',
  website:  'https://beckmann-elektro.example',
  notes:    `${EVIDENCE_MARKER}: synthetic record. Not a real customer.`,
} as const

/**
 * The source material the scenario starts from.
 *
 * This is the text a person would paste or photograph: a real enquiry as they
 * actually arrive, with a greeting, a signature and a stray sentence that is
 * not part of the order. The extraction endpoint's own prompt says it discards
 * exactly those, so the sample has to contain them or it proves nothing.
 */
export const EVIDENCE_SOURCE_NOTE = `Hallo Herr Akwe,

wie besprochen hier die Punkte für das Angebot. Der Termin nächste Woche passt
bei uns übrigens gut.

- Schaltschrank-Umbau Halle 2, pauschal 2.400,00
- Prüfung ortsveränderlicher Geräte, 48 Stück à 12,50
- Dokumentation und Übergabeprotokoll, pauschal 380,00

Rechnung bitte wie immer an die Buchhaltung.

Viele Grüße
Katrin Beckmann
Beckmann Elektrotechnik GmbH
Tel. +49 201 5550142`

/** What the extraction should produce from the note above. */
export const EVIDENCE_LINE_ITEMS = [
  { description: 'Schaltschrank-Umbau Halle 2', qty: 1,  unit_price: 2400.00, total: 2400.00 },
  { description: 'Prüfung ortsveränderlicher Geräte', qty: 48, unit_price: 12.50, total: 600.00 },
  { description: 'Dokumentation und Übergabeprotokoll', qty: 1, unit_price: 380.00, total: 380.00 },
] as const

export const EVIDENCE_TOTAL = 3380.00

/**
 * The quotation, sitting in draft.
 *
 * Draft on purpose: the screenshot this supports is the moment before a person
 * decides, which is the claim the Workflow Automation page makes and the one
 * step a marketing diagram always leaves out.
 */
export const EVIDENCE_ANGEBOT = {
  angebot_number: `${EVIDENCE_DOC_PREFIX}0007`,
  status:         'draft',
  date:           '2026-09-14',
  valid_until:    '2026-10-12',
  currency:       'EUR',
  language:       'de',
  subtotal:       EVIDENCE_TOTAL,
  total:          EVIDENCE_TOTAL,
} as const

/**
 * The invoice, already sent, so a list view shows a lifecycle rather than one
 * row. Its number is earlier than the quotation's: this is the week's second
 * piece of paperwork for the same customer, not a duplicate of the first.
 */
export const EVIDENCE_INVOICE = {
  invoice_number: `${EVIDENCE_DOC_PREFIX}0004`,
  status:         'sent',
  date:           '2026-09-02',
  due_date:       '2026-09-16',
  currency:       'EUR',
  language:       'de',
  subtotal:       1180.00,
  total:          1180.00,
  line_items: [
    { description: 'Wartung Schaltanlage, Quartal III', qty: 1, unit_price: 940.00, total: 940.00 },
    { description: 'Anfahrt und Einsatzpauschale',      qty: 2, unit_price: 120.00, total: 240.00 },
  ],
} as const

/** A third document, paid, so the list shows three states and not two. */
export const EVIDENCE_INVOICE_PAID = {
  invoice_number: `${EVIDENCE_DOC_PREFIX}0001`,
  status:         'paid',
  date:           '2026-08-05',
  due_date:       '2026-08-19',
  currency:       'EUR',
  language:       'de',
  subtotal:       620.00,
  total:          620.00,
  line_items: [
    { description: 'Störungsbeseitigung Hallenbeleuchtung', qty: 1, unit_price: 620.00, total: 620.00 },
  ],
} as const
