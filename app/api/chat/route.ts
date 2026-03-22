import { NextRequest, NextResponse } from 'next/server'
import { callAI, AIMessage } from '@/lib/ai'
import { CHAT_SYSTEM_PROMPT } from '@/lib/prompts'

interface ChatBody {
  messages: AIMessage[]
}

const MAX_MESSAGES = 20 // Prevent context abuse

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatBody
    const { messages } = body

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required.' }, { status: 400 })
    }

    // Limit history to prevent token abuse
    const trimmed = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-MAX_MESSAGES)

    const response = await callAI(trimmed, CHAT_SYSTEM_PROMPT, {
      maxTokens: 400,
      model: 'claude-haiku-4-5-20251001',
    })

    return NextResponse.json({ message: response.content, model: response.model })
  } catch (error) {
    console.error('[/api/chat]', error)
    return NextResponse.json(
      { error: 'Failed to get a response. Please try again.' },
      { status: 500 }
    )
  }
}
