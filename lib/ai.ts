export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AIResponse {
  content: string
  model: string
}

/**
 * Unified AI caller. Prefers Anthropic Claude if ANTHROPIC_API_KEY is set,
 * falls back to OpenAI if OPENAI_API_KEY is set, then returns mock data.
 */
export async function callAI(
  messages: AIMessage[],
  systemPrompt?: string,
  options?: { maxTokens?: number }
): Promise<AIResponse> {
  if (process.env.ANTHROPIC_API_KEY) {
    return callClaude(messages, systemPrompt, options?.maxTokens)
  }
  if (process.env.OPENAI_API_KEY) {
    return callOpenAI(messages, systemPrompt, options?.maxTokens)
  }
  return { content: getMockResponse(messages), model: 'mock' }
}

async function callClaude(
  messages: AIMessage[],
  systemPrompt?: string,
  maxTokens = 1024
): Promise<AIResponse> {
  const body: Record<string, unknown> = {
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    messages: messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content })),
  }
  if (systemPrompt) body.system = systemPrompt

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Anthropic API error ${res.status}: ${error}`)
  }

  const data = await res.json()
  return {
    content: data.content[0].text as string,
    model: data.model as string,
  }
}

async function callOpenAI(
  messages: AIMessage[],
  systemPrompt?: string,
  maxTokens = 1024
): Promise<AIResponse> {
  const allMessages: AIMessage[] = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: maxTokens,
      messages: allMessages,
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`OpenAI API error ${res.status}: ${error}`)
  }

  const data = await res.json()
  return {
    content: data.choices[0].message.content as string,
    model: data.model as string,
  }
}

function getMockResponse(messages: AIMessage[]): string {
  const last = messages[messages.length - 1]?.content?.toLowerCase() ?? ''

  if (last.includes('automat') || last.includes('workflow') || last.includes('agent')) {
    return "MaxPromo Digital specialises in AI agents and automation systems that save organisations 10–30 hours per week. Common automations include lead qualification agents, document processing AI, and customer support bots. Would you like a free audit to see what we can automate for you?"
  }
  if (last.includes('price') || last.includes('cost') || last.includes('how much')) {
    return "Our pricing depends on the complexity and scope of the automation. The best starting point is our free Automation Audit — it identifies your top opportunities and gives you a clear picture of what's possible. Shall I point you there?"
  }
  if (last.includes('website') || last.includes('ai website')) {
    return "We build AI-enhanced websites with built-in chat assistants, automated lead capture, knowledge bots, and smart search. These go far beyond static brochure sites — they actively engage visitors and qualify leads automatically."
  }
  return "MaxPromo Digital builds AI agents and automation systems for businesses, NGOs, and government organisations. I can tell you more about our services, or you can run our free Automation Audit to get personalised recommendations. What would you like to know?"
}
