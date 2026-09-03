import { NextRequest, NextResponse } from 'next/server'

const SYSTEM = `You are an invoice extraction assistant for MAXPROMO DIGITAL, a German AI and web development agency.

The user has shared an image — this could be a photo of handwritten notes, a screenshot of a WhatsApp message, a printed invoice, an email, or any document with order information.

Read ALL text visible in the image. Extract ONLY the commercially relevant information.

IGNORE and discard:
- Greetings and pleasantries
- Email headers and signatures
- Legal disclaimers and footer text
- Unrelated conversation
- Timestamps and metadata

EXTRACT and structure:
- Client name and company
- Client contact details (email, phone, address)
- Each ordered item or service with description
- Quantities if visible
- Prices if visible
- Payment terms if visible
- Deposit/Anzahlung if visible

For line items — write clean, professional German business descriptions:
  Visible: "website 5 seiten 1500"
  Clean:   "Website-Entwicklung — 5 Seiten inkl. Kontaktformular und responsivem Design"

  Visible: "logo"
  Clean:   "Logodesign inkl. Entwürfe und Reinzeichnung"

If information is missing or unclear, leave the field empty. Do not invent data.

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
      "description": "clean professional German description",
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
- "high": clearly readable in the image
- "medium": partially visible or inferred
- "low": blurry, unclear, or guessed
- overallConfidence: "high" if name + items clear, "medium" if some gaps, "low" if image unclear
- extractionNotes: e.g. "Image partially blurry — prices may need verification"

Return ONLY the JSON. No other text.`

type MediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

export async function POST(request: NextRequest) {
  try {
    const { base64, mediaType } = await request.json() as {
      base64: string
      mediaType: string
    }

    if (!base64) {
      return NextResponse.json({ error: 'Image data required' }, { status: 400 })
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 503 })
    }

    const allowed: MediaType[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const mime: MediaType = allowed.includes(mediaType as MediaType)
      ? (mediaType as MediaType)
      : 'image/jpeg'

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
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mime, data: base64 } },
            { type: 'text', text: 'Extract all invoice data from this image and return JSON.' },
          ],
        }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Anthropic error ${res.status}: ${err}`)
    }

    const data  = await res.json()
    const raw   = (data.content[0].text as string).trim()
    const clean = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    const parsed = JSON.parse(clean)

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('[/api/os/ai/scan-invoice]', error)
    return NextResponse.json({ error: 'Scan extraction failed' }, { status: 500 })
  }
}
