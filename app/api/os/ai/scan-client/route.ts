import { NextRequest, NextResponse } from 'next/server'

const SYSTEM = `You are a contact extraction assistant for MAXPROMO DIGITAL, a German AI agency.

Extract contact and business information from the provided image or text.
This could be a business card, handwritten note, email signature, WhatsApp message, or any text containing contact details.

Return ONLY valid JSON — no explanation, no markdown, no code blocks, just raw JSON:
{
  "name": "full name",
  "company": "company name or empty string",
  "email": "email address or empty string",
  "phone": "phone number or empty string",
  "address": "street and house number or empty string",
  "city": "city name or empty string",
  "postcode": "postcode or empty string",
  "country": "country name, default Germany if unclear",
  "website": "website URL or empty string",
  "notes": "any other relevant info found on the card, like role/title/notes, or empty string",
  "confidence": "high"
}

Rules:
- confidence is "high" if name + at least 2 other fields are clear
- confidence is "medium" if name is clear but other fields are uncertain
- confidence is "low" if even the name is unclear or image is blurry/unreadable
- For German addresses: separate street from city correctly (e.g. "Körnerstr. 8" is address, "Essen" is city)
- Phone numbers: keep as found, preserve country code if visible
- If multiple people on one document, extract the primary/most prominent person
- Remove any trailing dots or formatting artifacts from extracted values
- Return ONLY the JSON object. No other text whatsoever.`

type MediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

interface ScanClientBody {
  image?: string
  mediaType?: string
  text?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ScanClientBody

    if (!body.image && !body.text) {
      return NextResponse.json({ error: 'image or text required' }, { status: 400 })
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 503 })
    }

    const allowed: MediaType[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const mime: MediaType = allowed.includes(body.mediaType as MediaType)
      ? (body.mediaType as MediaType)
      : 'image/jpeg'

    const userContent = body.image
      ? [
          {
            type: 'image',
            source: { type: 'base64', media_type: mime, data: body.image },
          },
          {
            type: 'text',
            text: 'Extract all contact information from this business card or document and return as JSON.',
          },
        ]
      : `Extract contact information from this text and return as JSON:\n\n${body.text}`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: SYSTEM,
        messages: [{ role: 'user', content: userContent }],
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
    console.error('[/api/os/ai/scan-client]', error)
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 })
  }
}
