import { NextRequest, NextResponse } from 'next/server'

const SYSTEM = `You are an invoice assistant for MAXPROMO DIGITAL, a German AI agency.
Extract invoice data from raw notes and return ONLY valid JSON with no explanation, no markdown, no code blocks.

Return this exact structure:
{
  "clientName": "",
  "clientCompany": "",
  "clientEmail": "",
  "clientAddress": "",
  "clientCity": "",
  "lineItems": [
    {
      "description": "",
      "quantity": 1,
      "unit": "pauschal",
      "unitPrice": 0,
      "finalPrice": 0,
      "isFixedPrice": true
    }
  ],
  "anzahlung": 0,
  "anzahlungDate": "",
  "anzahlungMethod": "Überweisung",
  "notes": "",
  "dueDate": "",
  "type": "rechnung"
}

Rules:
- Extract all names, addresses, services, and prices from the raw text
- If a total price is mentioned without qty breakdown, set isFixedPrice: true and put the amount in finalPrice
- If hourly or per-unit pricing, set isFixedPrice: false and fill quantity + unitPrice; finalPrice = quantity * unitPrice
- If anzahlung/deposit/Anzahlung is mentioned, extract the amount to anzahlung
- If a date is mentioned for the deposit, put it in anzahlungDate as YYYY-MM-DD
- If the word "Angebot" appears, set type: "angebot", otherwise "rechnung"
- For dueDate, if not specified leave empty; if "14 Tage" use 14 days from today
- Return ONLY the JSON object. No other text.`

interface ExtractedLineItem {
  description: string
  quantity: number
  unit: string
  unitPrice: number
  finalPrice: number
  isFixedPrice: boolean
}

interface ExtractedInvoice {
  clientName: string
  clientCompany: string
  clientEmail: string
  clientAddress: string
  clientCity: string
  lineItems: ExtractedLineItem[]
  anzahlung: number
  anzahlungDate: string
  anzahlungMethod: string
  notes: string
  dueDate: string
  type: string
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

    const data = await res.json()
    const raw  = (data.content[0].text as string).trim()

    // Strip any accidental markdown fences
    const clean = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    const parsed = JSON.parse(clean) as ExtractedInvoice

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('[/api/os/ai/generate-invoice]', error)
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 })
  }
}
