import { NextRequest, NextResponse } from 'next/server'

const SYSTEM = `You are an invoice assistant for MAXPROMO DIGITAL, a German AI agency.
The user has uploaded a photo of handwritten notes, a whiteboard, printed document, or receipt.
Read ALL text visible in the image. Extract invoice data and return ONLY valid JSON with no explanation, no markdown, no code blocks.

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
- Extract everything visible in the image: names, addresses, prices, services, dates
- If a total price is shown without per-unit breakdown, set isFixedPrice: true
- If hourly or per-item pricing visible, set isFixedPrice: false and fill quantity + unitPrice
- If deposit/Anzahlung amount visible, extract to anzahlung
- Return ONLY the JSON. No other text.`

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

    // Validate/normalise media type
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
            {
              type: 'image',
              source: { type: 'base64', media_type: mime, data: base64 },
            },
            {
              type: 'text',
              text: 'Extract all invoice data from this image and return JSON.',
            },
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
