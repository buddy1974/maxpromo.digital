import { NextRequest, NextResponse } from 'next/server'
import { guardExtraction } from '@/lib/documents/extraction-guard'

/*
 * Legacy, not called by the interface since enhance replaced it, and kept as
 * the documented rollback path (docs/deployment/deploy-verify.md). Because it
 * can still produce a commercial document, it carries the same provenance
 * guard as enhance: a rollback must not be a way round the boundary.
 */

const SYSTEM = `You are an invoice extraction assistant for MAXPROMO DIGITAL, a German AI and web development agency.

Your job is to extract ONLY the commercially relevant information from raw input — whether typed notes, pasted text, or screenshots.

IGNORE and discard:
- Greetings and pleasantries (Hallo, Guten Tag, Dear, Hi etc)
- Email headers and signatures
- Phone numbers in email footers
- Legal disclaimers
- Unrelated conversation
- Timestamps and message metadata
- Social media handles
- Anything not related to the business transaction

EXTRACT and structure:
- Client name and company
- Client contact details (email, phone, address)
- Each ordered item or service with description
- Quantities if mentioned
- Prices if mentioned
- Payment terms if mentioned
- Deposit/Anzahlung if mentioned
- Due dates if mentioned
- Any special instructions relevant to the order

For line items — normalise spelling and capitalisation only. A quotation or
invoice states what was agreed; never add scope, materials, standards,
deliverables or conditions the input does not contain. Examples:
  Raw: "website 5 seiten 1500"
  Clean: "Website, 5 Seiten"

  Raw: "logo design"
  Clean: "Logodesign"

  Raw: "flyer a5 500 stück"
  Clean: "Flyer A5, 500 Stück"

If information is missing or unclear, leave the field empty — do not invent data.

Return ONLY valid JSON with no explanation, no markdown, no code blocks:
{
  "clientName": "",
  "clientCompany": "",
  "clientEmail": "",
  "clientPhone": "",
  "clientAddress": "",
  "clientCity": "",
  "clientPostcode": "",
  "lineItems": [
    {
      "description": "the input's wording, normalised",
      "quantity": 1,
      "unit": "pauschal",
      "unitPrice": 0,
      "finalPrice": 0,
      "isFixedPrice": true,
      "confidence": "high"
    }
  ],
  "anzahlung": 0,
  "anzahlungDate": "",
  "anzahlungMethod": "Überweisung",
  "notes": "",
  "dueDate": "",
  "validUntil": "",
  "type": "rechnung",
  "overallConfidence": "high",
  "extractionNotes": ""
}

Confidence rules:
- "high": value clearly stated in input
- "medium": inferred or partially mentioned
- "low": guessed or very uncertain
- overallConfidence: "high" if name + 2 items clear, "medium" if some gaps, "low" if mostly guessing
- If the word "Angebot" appears, set type: "angebot", otherwise "rechnung"
- extractionNotes: brief note if anything was unclear — e.g. "Price not mentioned — please add manually"

Return ONLY the JSON. No other text.`

interface ExtractedLineItem {
  description: string
  quantity: number
  unit: string
  unitPrice: number
  finalPrice: number
  isFixedPrice: boolean
  confidence?: 'high' | 'medium' | 'low'
}

interface ExtractedInvoice {
  clientName: string
  clientCompany: string
  clientEmail: string
  clientPhone?: string
  clientAddress: string
  clientCity: string
  clientPostcode?: string
  lineItems: ExtractedLineItem[]
  anzahlung: number
  anzahlungDate: string
  anzahlungMethod: string
  notes: string
  dueDate: string
  validUntil?: string
  type: string
  overallConfidence?: 'high' | 'medium' | 'low'
  extractionNotes?: string
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json() as { text: string }
    if (!text?.trim()) {
      return NextResponse.json({ error: 'Text required' }, { status: 400 })
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 503 })
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: SYSTEM,
        messages: [{ role: 'user', content: text }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Anthropic error ${res.status}: ${err}`)
    }

    const data  = await res.json()
    const raw   = (data.content[0].text as string).trim()
    const clean = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    const parsed = JSON.parse(clean) as ExtractedInvoice

    return NextResponse.json(guardExtraction(parsed, text).doc)
  } catch (error) {
    console.error('[/api/os/ai/generate-invoice]', error)
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 })
  }
}
