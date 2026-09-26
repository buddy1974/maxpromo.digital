/**
 * lib/ai-failure.ts — telling AI failures apart.
 *
 * WHY THIS EXISTS
 *
 * A governed browser run tried the quotation extraction twice. Both attempts
 * returned 502 and the interface said `Extraktion fehlgeschlagen` both times.
 * That message is true and useless: the route collapsed every possible cause —
 * no key, rejected key, unknown model, malformed request, unparseable response
 * — into one status and one sentence, so the only way to find out what had
 * actually happened was to reproduce the upstream call by hand.
 *
 * The cause turned out to be none of the things a 502 suggests. The provider
 * answered **HTTP 400, `invalid_request_error`, "Your credit balance is too
 * low"**. An account with no credit is a configuration problem belonging to the
 * operator, and reporting it as a bad gateway sends whoever reads the log
 * looking for a network fault that was never there.
 *
 * WHAT THIS CLASSIFIES, AND WHERE IT GOES
 *
 * The class and the provider's own message go to the **server log**, where an
 * operator can act on them. The browser receives the class name and nothing
 * else: an end user has no use for a provider's internal error text, and a
 * public surface is the wrong place to learn what a company's upstream
 * dependencies are doing.
 *
 * No key, token or credential is read, logged or returned by anything here.
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
  /** The HTTP status this surface should answer with. */
  readonly status: number
  /** For the server log. May contain the provider's message, never a credential. */
  readonly logDetail: string
}

/**
 * Classify a non-OK provider response.
 *
 * `body` is the provider's raw response text. It is matched against, and it is
 * returned in `logDetail` for the server log — never to the browser.
 */
export function classifyProviderError(status: number, body: string): AiFailure {
  const text = body.toLowerCase()

  /*
   * Billing before authentication, and both before the generic 400 bucket.
   * Anthropic reports an exhausted balance as `invalid_request_error` with a
   * 400, which reads like a malformed request and is not one — that is exactly
   * the confusion this function exists to remove.
   */
  if (/credit balance|billing|payment|quota|insufficient funds|spend limit/.test(text)) {
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
 * One line, one shape, greppable.
 *
 * Deliberately not `console.error(err)` with an object: an error object from a
 * fetch can carry request headers, and request headers carry the key.
 */
export function logAiFailure(route: string, failure: AiFailure): void {
  console.error(`[${route}] AI_FAILURE class=${failure.klass} status=${failure.status} ${failure.logDetail}`)
}
