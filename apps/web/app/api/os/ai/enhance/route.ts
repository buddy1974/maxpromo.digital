import { completeJson, logAiFailure, resolveRoute, type Part } from '@maxpromo/ai'
import { NextRequest, NextResponse } from 'next/server'
import { ENHANCE_BASE } from '@/lib/prompts'
import { guardExtraction } from '@/lib/documents/extraction-guard'

/* ──────────────────────────────────────────────────────────────────────
   /api/os/ai/enhance
   ──────────────────────────────────────────────────────────────────────
   Single endpoint for raw-text → structured-data extraction across the
   OS. Replaces the brittle "return JSON" prompts in scan-client and
   generate-invoice with Anthropic tool-use (structured output is
   guaranteed by the schema, not by string parsing).

   POST body:
     {
       kind: 'angebot' | 'rechnung'
       text?: string                 // raw paste
       image?: string                // base64 of an image OR a PDF
       mediaType?: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' | 'application/pdf'
     }

   At least one of text and image is required. A PDF is read as a document; any other type is
   refused (it used to be relabelled image/jpeg, which no model can read). Contacts are extracted
   by /api/os/ai/scan-client (lib/clients/extract), one shape for every client input.
   ────────────────────────────────────────────────────────────────────── */

type Kind = 'angebot' | 'rechnung'
type MediaType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' | 'application/pdf'

interface EnhanceBody {
  kind?: string
  text?: string
  image?: string
  mediaType?: string
}

const ALLOWED_KINDS: ReadonlyArray<Kind> = ['angebot', 'rechnung']
const ALLOWED_MIME: ReadonlyArray<MediaType> = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']

/* ── Tool schemas ─────────────────────────────────────────────────────── */

const BUSINESS_DOC_SCHEMA = {
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['angebot', 'rechnung'] },
    clientName:     { type: 'string' },
    clientCompany:  { type: 'string' },
    clientEmail:    { type: 'string' },
    clientPhone:    { type: 'string' },
    clientAddress:  { type: 'string' },
    clientCity:     { type: 'string' },
    clientPostcode: { type: 'string' },
    clientCountry:  { type: 'string' },

    lineItems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          description:   { type: 'string', description: 'The source wording, normalised for spelling and capitalisation only. Never add scope, materials, standards or deliverables.' },
          quantity:      { type: 'number' },
          unit:          { type: 'string', description: 'pauschal, Stück, Stunden, Tage, Seiten, Monat, Lizenz' },
          unitPrice:     { type: 'number' },
          finalPrice:    { type: 'number', description: 'Total for this line in EUR' },
          isFixedPrice:  { type: 'boolean', description: 'true = pauschal, false = qty * unit_price' },
          category:      { type: 'string', description: 'Optional grouping like WEBSITE, DESIGN, PRINTING' },
          confidence:    { type: 'string', enum: ['high', 'medium', 'low'] },
        },
        required: ['description', 'quantity', 'unit', 'unitPrice', 'finalPrice', 'isFixedPrice', 'confidence'],
      },
    },

    includedItems: {
      type: 'array',
      description: 'Things the client gets for free / included in the package — NOT billable',
      items: { type: 'string' },
    },

    anzahlung:        { type: 'number', description: 'Deposit already paid in EUR (0 if none)' },
    anzahlungDate:    { type: 'string', description: 'YYYY-MM-DD or empty' },
    anzahlungMethod:  { type: 'string', description: 'Überweisung / Bar / PayPal / Andere' },

    paymentTerms:    { type: 'string', description: 'e.g. "Zahlung in 2 Raten möglich"' },
    notes:           { type: 'string' },
    dueDate:         { type: 'string', description: 'YYYY-MM-DD or empty' },
    validUntil:      { type: 'string', description: 'YYYY-MM-DD or empty (Angebote only)' },

    declaredTotal: {
      type: 'number',
      description: 'The total the source explicitly states, if any. Used for sum-reconciliation.',
    },

    overallConfidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    extractionNotes:   { type: 'string', description: 'Issues/gaps the user must check' },
  },
  required: ['type', 'lineItems', 'overallConfidence'],
}

/* ── Per-kind config ──────────────────────────────────────────────────── */

function configFor(kind: Kind) {
  switch (kind) {
    case 'angebot':
    case 'rechnung':
      return {
        system: ENHANCE_BASE,
        tool: {
          name: 'extract_business_document',
          description: 'Extract a structured Angebot or Rechnung from raw input',
          input_schema: BUSINESS_DOC_SCHEMA,
        },
        userText: kind === 'rechnung'
          ? 'Extract this as a Rechnung (invoice). Return the structured document.'
          : 'Extract this as an Angebot (quote). Return the structured document.',
      }
  }
}

/* ── Server-side reconciliation helpers ───────────────────────────────── */

interface DocResult {
  type: 'angebot' | 'rechnung'
  clientName?: string
  lineItems: Array<{
    description: string
    quantity: number
    unit: string
    unitPrice: number
    finalPrice: number
    isFixedPrice: boolean
    confidence: 'high' | 'medium' | 'low'
    category?: string
  }>
  includedItems?: string[]
  declaredTotal?: number
  overallConfidence: 'high' | 'medium' | 'low'
  extractionNotes?: string
  warnings?: string[]
  computedTotal?: number
  [k: string]: unknown
}

function reconcile(doc: DocResult): DocResult {
  const computed = doc.lineItems.reduce(
    (s, li) => s + (Number(li.finalPrice) || 0),
    0,
  )
  const warnings: string[] = []

  if (typeof doc.declaredTotal === 'number' && doc.declaredTotal > 0) {
    const diff = Math.abs(doc.declaredTotal - computed)
    if (diff > 0.5) {
      warnings.push(
        `Declared total €${doc.declaredTotal.toFixed(2)} doesn't match line-item sum €${computed.toFixed(2)} (Δ €${diff.toFixed(2)}). Using line-item sum — please verify.`,
      )
    }
  }

  const missingPrices = doc.lineItems.filter(li => !li.finalPrice || li.finalPrice <= 0)
  if (missingPrices.length > 0) {
    warnings.push(
      `${missingPrices.length} line item(s) have no price — please add manually before sending.`,
    )
  }

  if (!doc.clientName?.trim()) {
    warnings.push('Client name not detected — please fill before saving.')
  }

  return { ...doc, computedTotal: computed, warnings }
}

/* ── Handler ──────────────────────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  if (!resolveRoute()) {
    logAiFailure('/api/os/ai/enhance', {
      klass: 'CONFIGURATION', status: 503, logDetail: 'no provider credential configured',
    })
    return NextResponse.json({ error: 'AI not configured', klass: 'CONFIGURATION' }, { status: 503 })
  }

  let body: EnhanceBody
  try {
    body = (await request.json()) as EnhanceBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const kind = (body.kind ?? '').trim() as Kind
  if (!ALLOWED_KINDS.includes(kind)) {
    return NextResponse.json(
      { error: `kind must be one of: ${ALLOWED_KINDS.join(', ')}` },
      { status: 400 },
    )
  }

  const hasText = typeof body.text === 'string' && body.text.trim().length > 0
  const hasImage = typeof body.image === 'string' && body.image.length > 0
  if (!hasText && !hasImage) {
    return NextResponse.json({ error: 'text or image required' }, { status: 400 })
  }

  const cfg = configFor(kind)

  if (hasImage && !ALLOWED_MIME.includes(body.mediaType as MediaType)) {
    return NextResponse.json({ error: 'Only PDF, JPEG, PNG, WebP or GIF can be read.' }, { status: 415 })
  }
  const mime = body.mediaType as MediaType

  const userContent: Part[] = []
  if (hasImage) userContent.push(mime === 'application/pdf'
    ? { type: 'document', mediaType: 'application/pdf', data: body.image! }
    : { type: 'image', mediaType: mime, data: body.image! })
  if (hasText) userContent.push({ type: 'text', text: body.text!.trim() })
  userContent.push({ type: 'text', text: cfg.userText })

  /*
   * Through the gateway (ADR-0027): structured output is forced by the schema, not by string
   * parsing, and a failure is classified rather than collapsed. A governed browser run once saw
   * 502 twice where the provider had answered 400 "credit balance is too low" — an operator billing
   * problem. The class goes to the log and to the caller; the provider's own text only to the log.
   */
  const r = await completeJson({
    system: cfg.system,
    messages: [{ role: 'user', content: userContent }],
    schema: cfg.tool.input_schema,
    schemaName: cfg.tool.name,
    schemaDescription: cfg.tool.description,
    maxTokens: 2400,
  })
  if (!r.ok) {
    logAiFailure('/api/os/ai/enhance', r.failure)
    const error = r.failure.klass === 'RESPONSE' ? 'AI returned no structured output' : 'AI extraction failed'
    return NextResponse.json({ error, klass: r.failure.klass }, { status: r.failure.status })
  }

  /*
   * Provenance before reconciliation, so the totals are computed from what
   * survives. The prompt forbids enrichment; this is what enforces it. An
   * evidence run saved "inkl. Material und Montage" and "gemäß DGUV
   * Vorschrift 3" into a quotation whose source said neither.
   */
  const { doc: guarded, report } = guardExtraction(
    r.data as DocResult,
    hasText ? body.text!.trim() : null,
  )
  const reconciled = reconcile(guarded)
  return NextResponse.json({ kind, extracted: reconciled, provenance: report })
}
