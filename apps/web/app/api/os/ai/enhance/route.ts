import { NextRequest, NextResponse } from 'next/server'
import { ENHANCE_BASE, ENHANCE_CLIENT } from '@/lib/prompts'

/* ──────────────────────────────────────────────────────────────────────
   /api/os/ai/enhance
   ──────────────────────────────────────────────────────────────────────
   Single endpoint for raw-text → structured-data extraction across the
   OS. Replaces the brittle "return JSON" prompts in scan-client and
   generate-invoice with Anthropic tool-use (structured output is
   guaranteed by the schema, not by string parsing).

   POST body:
     {
       kind: 'angebot' | 'rechnung' | 'client'
       text?: string                 // raw paste
       image?: string                // base64
       mediaType?: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
     }

   text and image are mutually exclusive. At least one is required.
   ────────────────────────────────────────────────────────────────────── */

type Kind = 'angebot' | 'rechnung' | 'client'
type MediaType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

interface EnhanceBody {
  kind?: string
  text?: string
  image?: string
  mediaType?: string
}

const ALLOWED_KINDS: ReadonlyArray<Kind> = ['angebot', 'rechnung', 'client']
const ALLOWED_MIME: ReadonlyArray<MediaType> = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

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
          description:   { type: 'string', description: 'Polished German business description' },
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

const CLIENT_SCHEMA = {
  type: 'object',
  properties: {
    name:       { type: 'string' },
    company:    { type: 'string' },
    email:      { type: 'string' },
    phone:      { type: 'string' },
    address:    { type: 'string' },
    city:       { type: 'string' },
    postcode:   { type: 'string' },
    country:    { type: 'string' },
    website:    { type: 'string' },
    notes:      { type: 'string', description: 'Role/title or anything else useful' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
  },
  required: ['name', 'confidence'],
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
    case 'client':
      return {
        system: ENHANCE_CLIENT,
        tool: {
          name: 'extract_contact',
          description: 'Extract contact information from raw input',
          input_schema: CLIENT_SCHEMA,
        },
        userText: 'Extract the contact information.',
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
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 503 })
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

  const mime: MediaType = ALLOWED_MIME.includes(body.mediaType as MediaType)
    ? (body.mediaType as MediaType)
    : 'image/jpeg'

  type Block =
    | { type: 'text'; text: string }
    | { type: 'image'; source: { type: 'base64'; media_type: MediaType; data: string } }

  const userContent: Block[] = []
  if (hasImage) {
    userContent.push({
      type: 'image',
      source: { type: 'base64', media_type: mime, data: body.image! },
    })
  }
  if (hasText) {
    userContent.push({ type: 'text', text: body.text!.trim() })
  }
  userContent.push({ type: 'text', text: cfg.userText })

  let res: Response
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2400,
        system: cfg.system,
        tools: [cfg.tool],
        tool_choice: { type: 'tool', name: cfg.tool.name },
        messages: [{ role: 'user', content: userContent }],
      }),
    })
  } catch (err) {
    console.error('[/api/os/ai/enhance] network error:', err)
    return NextResponse.json({ error: 'Upstream AI request failed' }, { status: 502 })
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    console.error('[/api/os/ai/enhance] anthropic error', res.status, errText)
    return NextResponse.json(
      { error: 'AI extraction failed', detail: `Anthropic ${res.status}` },
      { status: 502 },
    )
  }

  type ToolUseBlock = { type: 'tool_use'; name: string; input: unknown }
  type AnthropicResp = { content: Array<ToolUseBlock | { type: 'text'; text: string }> }

  const data = (await res.json()) as AnthropicResp
  const toolBlock = data.content.find(
    (b): b is ToolUseBlock => b.type === 'tool_use' && b.name === cfg.tool.name,
  )

  if (!toolBlock) {
    console.error('[/api/os/ai/enhance] no tool_use block in response')
    return NextResponse.json({ error: 'AI returned no structured output' }, { status: 502 })
  }

  if (kind === 'client') {
    return NextResponse.json({ kind, extracted: toolBlock.input })
  }

  const reconciled = reconcile(toolBlock.input as DocResult)
  return NextResponse.json({ kind, extracted: reconciled })
}
