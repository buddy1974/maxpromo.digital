/**
 * Telling model failures apart (moved here from apps/web/lib/ai-failure.ts, ADR-0027).
 *
 * WHY THIS EXISTS
 *
 * A governed browser run tried the quotation extraction twice. Both attempts
 * returned 502 and the interface said `Extraktion fehlgeschlagen` both times.
 * The provider had actually answered **HTTP 400, `invalid_request_error`,
 * "Your credit balance is too low"** — an operator billing problem, not a
 * gateway fault. Collapsing every cause into one status sends whoever reads the
 * log looking for a network fault that was never there.
 *
 * The class and the provider's own message go to the **server log**. A browser
 * receives the class name and nothing else. No key, token or credential is
 * read, logged or returned by anything here.
 */

export type AiFailureClass =
  /** No credential configured at all. Nothing was attempted. */
  | 'CONFIGURATION'
  /** A credential exists and the provider refused it. */
  | 'AUTHENTICATION'
  /** The account cannot be charged — no credit, expired card, spend cap. */
  | 'BILLING'
  /** The model identifier was rejected. */
  | 'MODEL'
  /** Rate limited. Retrying later is the correct response. */
  | 'RATE_LIMIT'
  /** The request was malformed: schema, size, or an unsupported field. */
  | 'REQUEST'
  /** The provider failed on its own side, or the network did. */
  | 'PROVIDER'
  /** It answered, and the answer was not the shape we asked for. */
  | 'RESPONSE'

export interface AiFailure {
  readonly klass: AiFailureClass
  /** The HTTP status a surface should answer with. */
  readonly status: number
  /** For the server log. May contain the provider's message, never a credential. */
  readonly logDetail: string
}

/**
 * Classify a non-OK provider response. `body` is the provider's raw response
 * text: matched against, and returned in `logDetail` for the log only.
 */
export function classifyProviderError(status: number, body: string): AiFailure {
  const text = body.toLowerCase()

  /*
   * Billing before authentication, and both before the generic 400 bucket.
   * Anthropic reports an exhausted balance as `invalid_request_error` with a
   * 400; OpenRouter answers 402. Neither is a malformed request.
   */
  if (status === 402 || /credit balance|billing|payment|quota|insufficient (funds|credits)|spend limit/.test(text)) {
    return { klass: 'BILLING', status: 503, logDetail: `provider ${status}: ${body.slice(0, 300)}` }
  }
  if (status === 401 || status === 403 || /authentication_error|invalid x-api-key|permission/.test(text)) {
    return { klass: 'AUTHENTICATION', status: 503, logDetail: `provider ${status}: credential rejected` }
  }
  if (/model|not_found_error/.test(text) && status === 404) {
    return { klass: 'MODEL', status: 503, logDetail: `provider ${status}: ${body.slice(0, 300)}` }
  }
  if (status === 429 || /rate_limit/.test(text)) {
    return { klass: 'RATE_LIMIT', status: 429, logDetail: `provider ${status}: rate limited` }
  }
  if (status >= 400 && status < 500) {
    return { klass: 'REQUEST', status: 502, logDetail: `provider ${status}: ${body.slice(0, 300)}` }
  }
  return { klass: 'PROVIDER', status: 502, logDetail: `provider ${status}: ${body.slice(0, 300)}` }
}

/**
 * One line, one shape, greppable. Deliberately not `console.error(err)` with an
 * object: an error from a fetch can carry request headers, and they carry the key.
 */
export function logAiFailure(route: string, failure: AiFailure): void {
  console.error(`[${route}] AI_FAILURE class=${failure.klass} status=${failure.status} ${failure.logDetail}`)
}
