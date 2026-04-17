import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai'
import type { AIMessage } from '@/lib/ai'

const SYSTEM_PROMPT = `You are Marcel's AI business assistant inside MaxPromo Digital OS. You help with:
- Drafting invoice descriptions and line items
- Writing Angebot (quote) text
- Summarising lead information
- Drafting client emails and follow-ups
- Business decisions and pricing advice

You know Marcel's business:
- AI automation agency based in Essen, Germany
- Kleinunternehmer §19 UStG (no VAT charged)
- Services: AI agents, workflow automation, n8n, web development
- Pricing range: €799–€6,000+
- Contact: info@maxpromo.digital
- Legal address: Körnerstr. 8, 45143 Essen
- IBAN: DE03 1001 0178 3648 4449 24, BIC: REVODEB2

Keep responses concise, professional, and in German or English as appropriate.`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { messages: AIMessage[] }

    if (!body.messages?.length) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 })
    }

    const response = await callAI(body.messages, SYSTEM_PROMPT, {
      maxTokens: 1200,
      model: 'claude-sonnet-4-6',
    })

    return NextResponse.json({ content: response.content, model: response.model })
  } catch (error) {
    console.error('[/api/os/ai]', error)
    return NextResponse.json({ error: 'AI request failed' }, { status: 500 })
  }
}
