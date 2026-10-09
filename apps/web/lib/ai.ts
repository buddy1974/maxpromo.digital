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
  options?: { maxTokens?: number; model?: string }
): Promise<AIResponse> {
  if (process.env.ANTHROPIC_API_KEY) {
    return callClaude(messages, systemPrompt, options?.maxTokens, options?.model)
  }
  if (process.env.OPENAI_API_KEY) {
    return callOpenAI(messages, systemPrompt, options?.maxTokens)
  }
  return { content: getMockResponse(messages), model: 'mock' }
}

/**
 * The same provider choice as `callAI`, for an answer that must be a JSON
 * object. Claude is forced to answer through one tool whose input is the
 * object, so the API — not the model's punctuation — guarantees valid JSON
 * (a German „…" closed with an ASCII quote broke free-text JSON in
 * production, 2026-10-09). OpenAI uses JSON mode. The caller still validates
 * the shape: valid JSON is not a valid answer. `data` is null under mock.
 */
export async function callAIJson(
  messages: AIMessage[],
  systemPrompt: string,
  schema: Record<string, unknown>,
  options?: { maxTokens?: number; model?: string }
): Promise<{ data: unknown; model: string }> {
  if (process.env.ANTHROPIC_API_KEY) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: options?.model ?? 'claude-sonnet-4-6',
        max_tokens: options?.maxTokens ?? 1024,
        system: systemPrompt,
        messages: messages.filter((m) => m.role !== 'system').map((m) => ({ role: m.role, content: m.content })),
        tools: [{ name: 'respond', description: 'Return the answer.', input_schema: schema }],
        tool_choice: { type: 'tool', name: 'respond' },
      }),
    })
    if (!res.ok) throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`)
    const data = await res.json()
    const block = (data.content as { type: string; input?: unknown }[]).find((b) => b.type === 'tool_use')
    return { data: block?.input ?? null, model: data.model as string }
  }
  if (process.env.OPENAI_API_KEY) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: options?.maxTokens ?? 1024,
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: systemPrompt }, ...messages.filter((m) => m.role !== 'system')],
      }),
    })
    if (!res.ok) throw new Error(`OpenAI API error ${res.status}: ${await res.text()}`)
    const data = await res.json()
    return { data: JSON.parse(data.choices[0].message.content as string), model: data.model as string }
  }
  return { data: null, model: 'mock' }
}

async function callClaude(
  messages: AIMessage[],
  systemPrompt?: string,
  maxTokens = 1024,
  model = 'claude-sonnet-4-6'
): Promise<AIResponse> {
  const body: Record<string, unknown> = {
    model,
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
