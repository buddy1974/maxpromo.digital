import { complete, completeJson, resolveRoute, type Tier } from '@maxpromo/ai'

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AIResponse {
  content: string
  model: string
}

/**
 * The web application's model calls, through the one gateway (@maxpromo/ai, ADR-0027). The route is
 * chosen there — AI_GATEWAY, else Anthropic, else OpenAI — and the model by tier. What stays here is
 * what only this application means: the public assistant's mock answers when no model is configured,
 * and the throw-on-failure contract its callers were written against.
 */
export async function callAI(
  messages: AIMessage[],
  systemPrompt?: string,
  options?: { maxTokens?: number; model?: string; tier?: Tier }
): Promise<AIResponse> {
  if (!resolveRoute()) return { content: getMockResponse(messages), model: 'mock' }
  const r = await complete({ system: systemPrompt, messages: turns(messages), maxTokens: options?.maxTokens, model: options?.model, tier: options?.tier })
  if (!r.ok) throw new Error(`AI ${r.failure.klass}: ${r.failure.logDetail}`)
  return { content: r.text, model: r.model }
}

/**
 * The same route as `callAI`, for an answer that must be a JSON object. The gateway forces it
 * through the provider's structured output (Anthropic: one tool whose input is the object), so the
 * API — not the model's punctuation — guarantees valid JSON. The caller still validates the shape:
 * valid JSON is not a valid answer. `data` is null when no model is configured.
 */
export async function callAIJson(
  messages: AIMessage[],
  systemPrompt: string,
  schema: Record<string, unknown>,
  options?: { maxTokens?: number; model?: string; timeoutMs?: number; tier?: Tier }
): Promise<{ data: unknown; model: string }> {
  if (!resolveRoute()) return { data: null, model: 'mock' }
  const r = await completeJson({ system: systemPrompt, messages: turns(messages), schema, maxTokens: options?.maxTokens, model: options?.model, timeoutMs: options?.timeoutMs, tier: options?.tier })
  if (!r.ok) throw new Error(`AI ${r.failure.klass}: ${r.failure.logDetail}`)
  return { data: r.data, model: r.model }
}

/* A system turn in the list joins the system prompt's place: the gateway takes one system prompt. */
function turns(messages: AIMessage[]) {
  return messages.filter((m) => m.role !== 'system').map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
}

function getMockResponse(messages: AIMessage[]): string {
  const last = messages[messages.length - 1]?.content?.toLowerCase() ?? ''

  if (last.includes('automat') || last.includes('workflow') || last.includes('agent')) {
    return "Maxpromo Digital specialises in AI agents and automation systems that save organisations 10–30 hours per week. Common automations include lead qualification agents, document processing AI, and customer support bots. Would you like to contact us about what we can automate for you?"
  }
  if (last.includes('price') || last.includes('cost') || last.includes('how much') || last.includes('pricing')) {
    // No figures. This fallback runs when the model is unavailable, which is
    // exactly when a hardcoded price is most likely to be wrong and least
    // likely to be noticed. It quoted pounds sterling until v9.6.
    return "We do not publish prices, because what a system costs depends on what it has to do. That is what the business check is for — thirty minutes, free, no commitment, and a fixed quote afterwards. Shall I point you to the contact page?"
  }
  if (last.includes('website') || last.includes('ai website')) {
    return "We build AI-enhanced websites with built-in chat assistants, automated lead capture, knowledge bots, and smart search — built with Next.js and deployed on Vercel. These go far beyond static brochure sites."
  }
  return "Maxpromo Digital builds AI agents and automation systems for businesses, NGOs, and government organisations. I can tell you about our services and pricing, or help you contact us. What would you like to know?"
}
