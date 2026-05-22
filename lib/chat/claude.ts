/**
 * lib/chat/claude.ts
 *
 * Wraps @anthropic-ai/sdk for Max turns. One exported function,
 * one system prompt builder, no state.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages'
import { env } from '@/lib/env'
import type { ChatSession, ChatMessage } from './types'

// Lazy singleton — instantiated on first call, not at import time.
let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    const key = env.ANTHROPIC_API_KEY
    if (!key) throw new Error('[claude] ANTHROPIC_API_KEY is not set')
    _client = new Anthropic({ apiKey: key })
  }
  return _client
}

const DEFAULT_MODEL = 'claude-sonnet-4-6'

function buildSystemPrompt(session: ChatSession): string {
  const isDE = session.locale === 'de'
  const productCtx = session.productSlug
    ? (isDE
        ? `Du antwortest im Kontext des Produkts "${session.productSlug}".`
        : `You are responding in the context of the "${session.productSlug}" product.`)
    : ''

  if (isDE) {
    return [
      'Du bist Max, ein direkter Business-Advisor für Maxpromo Digital.',
      'Du hilfst Betriebsinhabern zu verstehen, wie Automatisierung ihnen Zeit spart und Handarbeit reduziert.',
      'Dein Stil: kurze Sätze, direkte Antworten, keine Floskeln, kein "Ich bin Max" als Begrüßung.',
      'Du bist kein Chatbot — du bist ein Fachmann der zugehört und konkrete Antworten gibt.',
      'Wenn du Preise oder spezifische technische Details nicht kennst, sag es direkt.',
      productCtx,
      `Host: ${session.host}`,
    ].filter(Boolean).join('\n')
  }

  return [
    'You are Max, a direct business advisor for Maxpromo Digital.',
    'You help business operators understand how automation saves them time and reduces manual work.',
    'Style: short sentences, direct answers, no filler phrases, no "Hi I\'m Max" greeting.',
    'You are not a chatbot — you are a specialist who listens and gives concrete answers.',
    'When you do not know pricing or specific technical details, say so directly.',
    productCtx,
    `Host: ${session.host}`,
  ].filter(Boolean).join('\n')
}

/**
 * Runs one Max turn. Sends recent history + current user message to Claude.
 * Returns the assistant's text reply.
 */
export async function runMaxTurn({
  session,
  recentMessages,
  userMessage,
}: {
  session:        ChatSession
  recentMessages: ChatMessage[]
  userMessage:    string
}): Promise<string> {
  const client = getClient()
  const model  = env.ANTHROPIC_MODEL ?? DEFAULT_MODEL

  // Build alternating user/assistant history (Claude API requirement)
  const history: MessageParam[] = []
  let lastRole: 'user' | 'assistant' | null = null

  for (const msg of recentMessages) {
    if (msg.role !== 'user' && msg.role !== 'assistant') continue
    // Skip consecutive same-role entries (should not happen in practice)
    if (msg.role === lastRole) continue
    history.push({ role: msg.role, content: msg.content })
    lastRole = msg.role
  }

  // Append current user turn (the one we're about to reply to)
  history.push({ role: 'user', content: userMessage })

  const response = await client.messages.create({
    model,
    max_tokens: 800,
    system:     buildSystemPrompt(session),
    messages:   history,
  })

  const block = response.content[0]
  if (!block || block.type !== 'text') {
    throw new Error('[claude] Unexpected response content type')
  }
  return block.text
}
