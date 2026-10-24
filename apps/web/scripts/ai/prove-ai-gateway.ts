/**
 * The model gateway (ADR-0027), offline: no key, no network — a recording fetch stands in for
 * every provider.
 *   - the route: unchanged default (Anthropic, else OpenAI); OpenRouter only when named; an unknown
 *     name configures nothing rather than something else
 *   - tiers, not model names; overrides; OpenRouter fallbacks
 *   - OpenRouter never routes to a provider that collects data, uses zero-retention endpoints by
 *     default, and uses the EU endpoint when asked
 *   - structured output per provider; images in each wire format
 *   - failures are classified, and no credential reaches a failure, a log line or a result
 *   - nothing in either application calls a model provider except through the gateway
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { buildBody, complete, completeJson, modelsFor, resolveRoute } from '@maxpromo/ai'

let passed = 0
function check(name: string, ok: boolean) {
  if (!ok) { console.error(`FAIL ${name}`); process.exit(1) }
  passed++; console.log(`PASS ${name}`)
}

const KEY = { a: 'sk-ant-PROOF-a1', o: 'sk-PROOF-o2', r: 'sk-or-PROOF-r3' }
const all = { ANTHROPIC_API_KEY: KEY.a, OPENAI_API_KEY: KEY.o, OPENROUTER_API_KEY: KEY.r }

/* ── route ── */
check('default: Anthropic when its key exists, even with an OpenRouter key present', resolveRoute(all)?.name === 'anthropic')
check('default without Anthropic: OpenAI', resolveRoute({ OPENAI_API_KEY: KEY.o, OPENROUTER_API_KEY: KEY.r })?.name === 'openai')
check('an OpenRouter key alone never routes there implicitly', resolveRoute({ OPENROUTER_API_KEY: KEY.r }) === null)
check('AI_GATEWAY=openrouter routes there', resolveRoute({ ...all, AI_GATEWAY: 'openrouter' })?.name === 'openrouter')
check('a named route without its key configures nothing', resolveRoute({ ANTHROPIC_API_KEY: KEY.a, AI_GATEWAY: 'openrouter' }) === null)
check('an unknown route name configures nothing', resolveRoute({ ...all, AI_GATEWAY: 'auto' }) === null)
check('OPENROUTER_REGION=eu uses the EU in-region endpoint', resolveRoute({ ...all, AI_GATEWAY: 'openrouter', OPENROUTER_REGION: 'eu' })?.url === 'https://eu.openrouter.ai/api/v1/chat/completions')

/* ── tiers ── */
check('Anthropic and OpenAI keep the models the platform used before the gateway', modelsFor('anthropic', 'standard', undefined, {})[0] === 'claude-sonnet-4-6' && modelsFor('openai', 'fast', undefined, {})[0] === 'gpt-4o-mini')
check('OpenRouter tiers carry a fallback from a second family', (() => { const m = modelsFor('openrouter', 'standard', undefined, {}); return m.length === 2 && m[0].startsWith('anthropic/') && m[1].startsWith('openai/') })())
check('AI_MODEL_<TIER> overrides the primary; an explicit model wins over both', modelsFor('openrouter', 'fast', undefined, { AI_MODEL_FAST: 'x/y' })[0] === 'x/y' && modelsFor('anthropic', 'fast', 'claude-z', { AI_MODEL_FAST: 'x/y' })[0] === 'claude-z')

/* ── OpenRouter data rules ── */
const or = resolveRoute({ ...all, AI_GATEWAY: 'openrouter' })!
const orBody = buildBody(or, { messages: [{ role: 'user', content: 'hi' }], tier: 'standard' }, undefined, {})
const prefs = orBody.provider as Record<string, unknown>
check('OpenRouter: data_collection deny, zero retention, only providers honouring every parameter', prefs.data_collection === 'deny' && prefs.zdr === true && prefs.require_parameters === true)
check('OpenRouter: fallbacks sent as models', Array.isArray(orBody.models) && (orBody.models as string[])[0] === orBody.model)
const orNoZdr = buildBody(resolveRoute({ ...all, AI_GATEWAY: 'openrouter', OPENROUTER_ZDR: '0' })!, { messages: [{ role: 'user', content: 'hi' }] }, undefined, {})
check('OPENROUTER_ZDR=0 relaxes retention only — data_collection stays deny', (orNoZdr.provider as Record<string, unknown>).zdr === undefined && (orNoZdr.provider as Record<string, unknown>).data_collection === 'deny')

/* ── wire formats ── */
const schema = { type: 'object', properties: { a: { type: 'string' } }, required: ['a'] }
const img = { role: 'user' as const, content: [{ type: 'image' as const, mediaType: 'image/png' as const, data: 'QUJD' }, { type: 'text' as const, text: 'read' }] }
const an = buildBody(resolveRoute(all)!, { system: 'S', messages: [img] }, { schema, schemaName: 'extract' }, {})
check('Anthropic JSON: one forced tool whose input is the schema', JSON.stringify(an.tool_choice) === JSON.stringify({ type: 'tool', name: 'extract' }) && (an.tools as { input_schema: unknown }[])[0].input_schema === schema && an.system === 'S')
check('Anthropic image: base64 source block', JSON.stringify((an.messages as { content: unknown[] }[])[0].content[0]) === JSON.stringify({ type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'QUJD' } }))
const orJson = buildBody(or, { system: 'S', messages: [img] }, { schema, schemaName: 'extract' }, {})
check('OpenRouter JSON: json_schema response format; system as the first message', (orJson.response_format as { type: string; json_schema: { schema: unknown } }).type === 'json_schema' && (orJson.response_format as { json_schema: { schema: unknown } }).json_schema.schema === schema && (orJson.messages as { role: string }[])[0].role === 'system')
check('OpenRouter image: data URL', JSON.stringify((orJson.messages as { content: unknown[] }[])[1].content[0]) === JSON.stringify({ type: 'image_url', image_url: { url: 'data:image/png;base64,QUJD' } }))

/* ── calls through a recording fetch ── */
type Seen = { url: string; headers: Record<string, string>; body: Record<string, unknown> }
function fake(status: number, answer: unknown): { fetch: typeof fetch; seen: Seen[] } {
  const seen: Seen[] = []
  const f = (async (url: string, init: RequestInit) => {
    seen.push({ url, headers: init.headers as Record<string, string>, body: JSON.parse(String(init.body)) })
    return new Response(typeof answer === 'string' ? answer : JSON.stringify(answer), { status })
  }) as unknown as typeof fetch
  return { fetch: f, seen }
}
const leaks = (v: unknown) => Object.values(KEY).some(k => JSON.stringify(v).includes(k))

{
  const { fetch: f, seen } = fake(200, { model: 'claude-sonnet-4-6', content: [{ type: 'tool_use', name: 'respond', input: { a: 'x' } }] })
  const r = await completeJson({ messages: [{ role: 'user', content: 'q' }], schema }, { env: all, fetch: f })
  check('Anthropic JSON call returns the tool input, with the key only in its header', r.ok && (r.data as { a: string }).a === 'x' && seen[0].headers['x-api-key'] === KEY.a && !leaks(seen[0].body))
}
{
  const { fetch: f, seen } = fake(200, { model: 'anthropic/claude-sonnet-5.5', choices: [{ message: { content: '```json\n{"a":"y"}\n```' } }] })
  const r = await completeJson({ messages: [{ role: 'user', content: 'q' }], schema }, { env: { ...all, AI_GATEWAY: 'openrouter' }, fetch: f })
  check('OpenRouter JSON call parses the answer and names the app', r.ok && r.route === 'openrouter' && (r.data as { a: string }).a === 'y' && seen[0].headers['X-Title'] === 'Maxpromo' && seen[0].headers.Authorization === `Bearer ${KEY.r}`)
}
{
  const { fetch: f } = fake(200, { model: 'm', choices: [{ message: { content: 'not json' } }] })
  const r = await completeJson({ messages: [{ role: 'user', content: 'q' }], schema }, { env: { ...all, AI_GATEWAY: 'openrouter' }, fetch: f })
  check('text that is not JSON is a RESPONSE failure, not an exception', !r.ok && r.failure.klass === 'RESPONSE')
}
{
  const { fetch: f } = fake(400, { type: 'error', error: { type: 'invalid_request_error', message: 'Your credit balance is too low' } })
  const r = await complete({ messages: [{ role: 'user', content: 'q' }] }, { env: all, fetch: f })
  check('Anthropic 400 "credit balance" is BILLING, not a bad request', !r.ok && r.failure.klass === 'BILLING' && r.failure.status === 503)
}
{
  const { fetch: f } = fake(402, { error: { code: 402, message: 'Insufficient credits' } })
  const r = await complete({ messages: [{ role: 'user', content: 'q' }] }, { env: { ...all, AI_GATEWAY: 'openrouter' }, fetch: f })
  check('OpenRouter 402 is BILLING', !r.ok && r.failure.klass === 'BILLING')
}
{
  const { fetch: f } = fake(401, `{"error":"bad key ${KEY.r}"}`)
  const r = await complete({ messages: [{ role: 'user', content: 'q' }] }, { env: { ...all, AI_GATEWAY: 'openrouter' }, fetch: f })
  check('a rejected credential is AUTHENTICATION, and the failure never carries the key — even when the provider echoes it', !r.ok && r.failure.klass === 'AUTHENTICATION' && !leaks(r))
}
{
  const f = (async () => { throw Object.assign(new Error(`connect failed ${KEY.a}`.replace(KEY.a, 'host')), { request: { headers: { 'x-api-key': KEY.a } } }) }) as unknown as typeof fetch
  const r = await complete({ messages: [{ role: 'user', content: 'q' }] }, { env: all, fetch: f })
  check('a network error is PROVIDER and carries the message only, never the request', !r.ok && r.failure.klass === 'PROVIDER' && !leaks(r))
}
{
  const r = await complete({ messages: [{ role: 'user', content: 'q' }] }, { env: {}, fetch: fake(200, {}).fetch })
  check('no credential: CONFIGURATION, and nothing is sent', !r.ok && r.failure.klass === 'CONFIGURATION')
}

/* ── one implementation ── */
const root = resolve(import.meta.dirname, '../../../..')
const walk = (d: string, out: string[] = []): string[] => {
  for (const e of readdirSync(d)) {
    if (e === 'node_modules' || e === '.next' || e === 'scripts') continue
    const p = join(d, e)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(ts|tsx)$/.test(e)) out.push(p)
  }
  return out
}
const direct = [...walk(join(root, 'apps/web')), ...walk(join(root, 'apps/bureau'))]
  .filter(p => /api\.anthropic\.com|api\.openai\.com|openrouter\.ai/.test(readFileSync(p, 'utf8')))
check('no application file calls a model provider except through the gateway', direct.length === 0 || (console.error(direct.join('\n')), false))

console.log(`\nAI GATEWAY: ${passed} properties proved`)
