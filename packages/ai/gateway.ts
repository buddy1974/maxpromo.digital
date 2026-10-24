/**
 * The Maxpromo model gateway (ADR-0027). Every model call in the platform goes through here:
 *
 *   caller → complete() / completeJson() → route → anthropic | openai | openrouter
 *
 * WHAT IT DECIDES
 *
 * - **Which route.** `AI_GATEWAY` names it explicitly (anthropic · openai · openrouter). Unset, the
 *   behaviour is the one the platform had before the gateway: Anthropic when its key exists, else
 *   OpenAI, else nothing (the caller decides what "not configured" means). OpenRouter is never
 *   chosen implicitly: it forwards prompts to third-party model providers, and that is an owner
 *   decision recorded in the ADR, not a side effect of a key being present.
 * - **Which model.** Callers ask for a tier — fast, standard, deep — not a model. The tier maps to a
 *   model per route; `AI_MODEL_FAST|STANDARD|DEEP` override it. No automatic router: a person picks
 *   the tier where the call is written.
 * - **What OpenRouter may do with the data.** Always `data_collection: deny` (no provider that
 *   stores or trains on prompts), zero-data-retention endpoints unless `OPENROUTER_ZDR=0`, and the
 *   EU in-region endpoint when `OPENROUTER_REGION=eu` (an OpenRouter Business feature).
 *
 * WHAT IT NEVER DOES
 *
 * Execute anything. A model answer is text or a JSON value; actions stay behind the capability
 * engine and its approvals. No credential is ever logged, returned or put in an error.
 */
import { classifyProviderError, type AiFailure } from './failure.ts'

export type Tier = 'fast' | 'standard' | 'deep'
export type RouteName = 'anthropic' | 'openai' | 'openrouter'
export type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

export type Part =
  | { type: 'text'; text: string }
  | { type: 'image'; mediaType: ImageMediaType; data: string /* base64 */ }

export interface Message {
  role: 'user' | 'assistant'
  content: string | Part[]
}

export interface CompletionRequest {
  system?: string
  messages: Message[]
  tier?: Tier
  /** An exact model id for the active route. Prefer a tier; this exists for owner overrides. */
  model?: string
  maxTokens?: number
  temperature?: number
  /** A caller answering a person in real time cannot wait for ever. */
  timeoutMs?: number
}

export interface JsonRequest extends CompletionRequest {
  /** JSON Schema of the object the answer must be. The caller still validates it. */
  schema: Record<string, unknown>
  /** Tool / schema name the provider sees. */
  schemaName?: string
  schemaDescription?: string
}

export type Failure = { ok: false; failure: AiFailure }
export type TextResult = { ok: true; text: string; model: string; route: RouteName } | Failure
export type JsonResult = { ok: true; data: unknown; model: string; route: RouteName } | Failure

export interface Route {
  name: RouteName
  url: string
  key: string
  /** OpenRouter only. */
  zdr?: boolean
}

type Env = Record<string, string | undefined>
type Fetch = typeof fetch
export interface GatewayDeps { env?: Env; fetch?: Fetch }

const OPENROUTER = { global: 'https://openrouter.ai/api/v1', eu: 'https://eu.openrouter.ai/api/v1' } as const

/**
 * The models behind each tier. Anthropic and OpenAI keep exactly the models the platform used
 * before the gateway, so switching to the gateway changes no answer. OpenRouter carries one
 * fallback per tier from a second model family, sent as `models` so OpenRouter retries on outage.
 */
export const TIER_MODELS: Record<RouteName, Record<Tier, readonly string[]>> = {
  anthropic: { fast: ['claude-sonnet-4-6'], standard: ['claude-sonnet-4-6'], deep: ['claude-sonnet-4-6'] },
  openai: { fast: ['gpt-4o-mini'], standard: ['gpt-4o-mini'], deep: ['gpt-4o-mini'] },
  openrouter: {
    fast: ['anthropic/claude-haiku-5.5', 'openai/gpt-5.4-mini'],
    standard: ['anthropic/claude-sonnet-5.5', 'openai/gpt-5.5'],
    deep: ['anthropic/claude-opus-5.5', 'anthropic/claude-sonnet-5.5'],
  },
}

const present = (v: string | undefined) => Boolean(v?.trim())

/** The active route, or null when no provider is configured. Reads the environment on every call. */
export function resolveRoute(env: Env = process.env): Route | null {
  const named = env.AI_GATEWAY?.trim().toLowerCase()
  const anthropic = (): Route | null => present(env.ANTHROPIC_API_KEY) ? { name: 'anthropic', url: 'https://api.anthropic.com/v1/messages', key: env.ANTHROPIC_API_KEY!.trim() } : null
  const openai = (): Route | null => present(env.OPENAI_API_KEY) ? { name: 'openai', url: 'https://api.openai.com/v1/chat/completions', key: env.OPENAI_API_KEY!.trim() } : null
  const openrouter = (): Route | null => present(env.OPENROUTER_API_KEY)
    ? { name: 'openrouter', url: `${env.OPENROUTER_REGION?.trim().toLowerCase() === 'eu' ? OPENROUTER.eu : OPENROUTER.global}/chat/completions`, key: env.OPENROUTER_API_KEY!.trim(), zdr: env.OPENROUTER_ZDR?.trim() !== '0' }
    : null
  if (named === 'openrouter') return openrouter()
  if (named === 'anthropic') return anthropic()
  if (named === 'openai') return openai()
  /* An unknown name is a misconfiguration, not a reason to pick something else silently. */
  if (named) return null
  return anthropic() ?? openai()
}

/** Primary model first, then fallbacks. An explicit model or an AI_MODEL_<TIER> override wins. */
export function modelsFor(route: RouteName, tier: Tier = 'standard', explicit?: string, env: Env = process.env): string[] {
  const override = explicit?.trim() || env[`AI_MODEL_${tier.toUpperCase()}`]?.trim()
  const defaults = TIER_MODELS[route][tier]
  return override ? [override, ...defaults.filter(m => m !== override)].slice(0, route === 'openrouter' ? 3 : 1) : [...defaults].slice(0, route === 'openrouter' ? 3 : 1)
}

/* ── wire formats ───────────────────────────────────────────────────── */

const parts = (c: string | Part[]): Part[] => typeof c === 'string' ? [{ type: 'text', text: c }] : c

function anthropicMessages(messages: Message[]) {
  return messages.map(m => ({
    role: m.role,
    content: typeof m.content === 'string' ? m.content : m.content.map(p => p.type === 'text'
      ? { type: 'text', text: p.text }
      : { type: 'image', source: { type: 'base64', media_type: p.mediaType, data: p.data } }),
  }))
}

function chatMessages(system: string | undefined, messages: Message[]) {
  const out: unknown[] = system ? [{ role: 'system', content: system }] : []
  for (const m of messages) {
    out.push({
      role: m.role,
      content: typeof m.content === 'string' ? m.content : parts(m.content).map(p => p.type === 'text'
        ? { type: 'text', text: p.text }
        : { type: 'image_url', image_url: { url: `data:${p.mediaType};base64,${p.data}` } }),
    })
  }
  return out
}

function headers(route: Route): Record<string, string> {
  if (route.name === 'anthropic') return { 'x-api-key': route.key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }
  const h: Record<string, string> = { Authorization: `Bearer ${route.key}`, 'Content-Type': 'application/json' }
  if (route.name === 'openrouter') { h['HTTP-Referer'] = 'https://maxpromo.digital'; h['X-Title'] = 'Maxpromo' }
  return h
}

/** The request body for one call. Exported for the proof; nothing else should need it. */
export function buildBody(route: Route, req: CompletionRequest, json?: Pick<JsonRequest, 'schema' | 'schemaName' | 'schemaDescription'>, env: Env = process.env): Record<string, unknown> {
  const models = modelsFor(route.name, req.tier, req.model, env)
  const maxTokens = req.maxTokens ?? 1024
  const name = json?.schemaName ?? 'respond'
  if (route.name === 'anthropic') {
    const body: Record<string, unknown> = { model: models[0], max_tokens: maxTokens, messages: anthropicMessages(req.messages) }
    if (req.system) body.system = req.system
    if (req.temperature !== undefined) body.temperature = req.temperature
    if (json) {
      /* Forced tool use: the API, not the model's punctuation, guarantees valid JSON (a German „…"
         closed with an ASCII quote broke free-text JSON in production, 2026-10-09). */
      body.tools = [{ name, description: json.schemaDescription ?? 'Return the answer.', input_schema: json.schema }]
      body.tool_choice = { type: 'tool', name }
    }
    return body
  }
  const body: Record<string, unknown> = { model: models[0], max_tokens: maxTokens, messages: chatMessages(req.system, req.messages) }
  if (req.temperature !== undefined) body.temperature = req.temperature
  if (route.name === 'openai') {
    if (json) body.response_format = { type: 'json_object' }
    return body
  }
  if (models.length > 1) body.models = models
  body.provider = {
    data_collection: 'deny',
    ...(route.zdr ? { zdr: true } : {}),
    /* Only providers that honour every parameter — above all the response format. */
    require_parameters: true,
  }
  if (json) body.response_format = { type: 'json_schema', json_schema: { name, strict: false, schema: json.schema } }
  return body
}

/* ── the call ───────────────────────────────────────────────────────── */

const notConfigured = (env: Env): Failure => ({ ok: false, failure: { klass: 'CONFIGURATION', status: 503,
  logDetail: env.AI_GATEWAY?.trim() ? `AI_GATEWAY=${env.AI_GATEWAY.trim()} has no usable credential` : 'no provider credential configured' } })

async function send(route: Route, body: Record<string, unknown>, req: CompletionRequest, f: Fetch): Promise<{ ok: true; json: Record<string, unknown> } | Failure> {
  let res: Response
  try {
    res = await f(route.url, { method: 'POST', headers: headers(route), body: JSON.stringify(body), signal: req.timeoutMs ? AbortSignal.timeout(req.timeoutMs) : undefined })
  } catch (error) {
    /* The message only: an error object from fetch can carry the request, and the request the key. */
    const timeout = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')
    return { ok: false, failure: { klass: 'PROVIDER', status: timeout ? 504 : 502, logDetail: `${route.name} ${timeout ? 'timeout' : `network: ${error instanceof Error ? error.message : 'unknown'}`}` } }
  }
  if (!res.ok) {
    const failure = classifyProviderError(res.status, await res.text().catch(() => ''))
    return { ok: false, failure: { ...failure, logDetail: `${route.name} ${failure.logDetail}` } }
  }
  try { return { ok: true, json: await res.json() as Record<string, unknown> } } catch {
    return { ok: false, failure: { klass: 'RESPONSE', status: 502, logDetail: `${route.name} answered with a body that is not JSON` } }
  }
}

const badShape = (route: Route, what: string): Failure => ({ ok: false, failure: { klass: 'RESPONSE', status: 502, logDetail: `${route.name} ${what}` } })

function chatText(json: Record<string, unknown>): string | null {
  const choice = (json.choices as { message?: { content?: unknown } }[] | undefined)?.[0]
  return typeof choice?.message?.content === 'string' ? choice.message.content : null
}

/** A text answer. */
export async function complete(req: CompletionRequest, deps: GatewayDeps = {}): Promise<TextResult> {
  const env = deps.env ?? process.env
  const route = resolveRoute(env)
  if (!route) return notConfigured(env)
  const sent = await send(route, buildBody(route, req, undefined, env), req, deps.fetch ?? fetch)
  if (!sent.ok) return sent
  const model = String(sent.json.model ?? '')
  if (route.name === 'anthropic') {
    const block = (sent.json.content as { type: string; text?: string }[] | undefined)?.find(b => b.type === 'text' && typeof b.text === 'string')
    return block?.text ? { ok: true, text: block.text, model, route: route.name } : badShape(route, 'answered without a text block')
  }
  const text = chatText(sent.json)
  return text ? { ok: true, text, model, route: route.name } : badShape(route, 'answered without message content')
}

/** An answer that must be a JSON object. Valid JSON is not a valid answer: the caller checks the shape. */
export async function completeJson(req: JsonRequest, deps: GatewayDeps = {}): Promise<JsonResult> {
  const env = deps.env ?? process.env
  const route = resolveRoute(env)
  if (!route) return notConfigured(env)
  const sent = await send(route, buildBody(route, req, req, env), req, deps.fetch ?? fetch)
  if (!sent.ok) return sent
  const model = String(sent.json.model ?? '')
  if (route.name === 'anthropic') {
    const block = (sent.json.content as { type: string; input?: unknown }[] | undefined)?.find(b => b.type === 'tool_use')
    return block && block.input !== undefined ? { ok: true, data: block.input, model, route: route.name } : badShape(route, 'answered without a tool_use block')
  }
  const text = chatText(sent.json)
  if (!text) return badShape(route, 'answered without message content')
  try { return { ok: true, data: JSON.parse(text.trim().replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')), model, route: route.name } } catch {
    return badShape(route, 'answered with text that is not JSON')
  }
}
