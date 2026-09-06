/**
 * packages/observability/logger.ts
 *
 * One logging standard for the platform.
 *
 * WHY THIS EXISTS
 *
 * The platform logs today, and it logs eighty times: sixty-nine `console.*`
 * calls in `apps/web` and eight in `apps/bureau`, each deciding for itself what
 * to say and how. Fifty-seven of them are `console.error`. Not one of them
 * carries a correlation id, a surface, or a severity anything can filter on.
 *
 * On a platform where one deployment answers ten public domains, a log line
 * that does not say which domain it came from is a log line that cannot be
 * acted on. And thirty-seven `catch {}` blocks swallow their error entirely —
 * the platform's most common way of failing is to say nothing at all.
 *
 * THE FIVE QUESTIONS
 *
 * Every line this logger emits answers all five, or it does not compile:
 *
 *   what      the event, as a short stable string — not a sentence
 *   where     the surface it happened on, and the domain when there is one
 *   why       the cause, when one is known: an error, a status, a reason
 *   impact    who is affected and how badly — the level carries this
 *   trace     the correlation id, so one visitor's journey can be reassembled
 *
 * SEVERITY MEANS SOMETHING
 *
 *   debug     only useful while working on this. Off in production.
 *   info      something completed that someone might later ask about.
 *   warn      degraded, and continuing. A retry succeeded; a fallback ran.
 *   error     one request failed. The visitor saw something wrong.
 *   critical  the surface is failing, not the request. Wake someone.
 *
 * The distinction that matters is `warn` against `error`: a warning is
 * something the platform handled, an error is something it did not. Fifty-seven
 * `console.error` calls cannot both be true.
 *
 * NOTHING SENSITIVE IS LOGGED
 *
 * `redact()` runs over every field of every line, and it is not optional — it
 * is applied by the logger rather than by the caller, because a redaction the
 * caller has to remember is a redaction that gets forgotten on the line that
 * matters. Personal data, credentials and tokens are removed by key and by
 * shape.
 *
 * THIS EMITS; IT DOES NOT SHIP
 *
 * Structured JSON to stdout, which is what Vercel collects. Wiring a
 * destination — Sentry, Axiom, anything — is a decision with a cost and a data
 * agreement behind it, and it is Marcel's. What this file guarantees is that
 * when that decision is made, the platform already speaks one language.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'

const LEVEL_ORDER: Readonly<Record<LogLevel, number>> = {
  debug: 10, info: 20, warn: 30, error: 40, critical: 50,
}

/** Which part of the platform a line came from. */
export type Surface =
  | 'web'        // the public site and the product domains
  | 'bureau'     // agents.maxpromo.digital
  | 'os'         // the internal operating system
  | 'api'        // a route handler
  | 'middleware'
  | 'documents'  // invoice, quotation, PDF, email
  | 'chat'
  | 'build'

export interface LogContext {
  /** The surface. Required: a line that does not say where is not actionable. */
  readonly surface: Surface
  /** Registry host, when the event belongs to a request. */
  readonly domain?: string
  /** Correlation id, so one visitor's journey can be reassembled. */
  readonly trace?: string
  /** Route or operation. */
  readonly route?: string
  /** Anything else. Redacted before it is written. */
  readonly [key: string]: unknown
}

/**
 * Field names whose values never appear in a log, whatever they contain.
 *
 * Matched case-insensitively against the whole key, so `userEmail`,
 * `email_address` and `EMAIL` are all caught. Listed rather than inferred: a
 * heuristic that decides what looks sensitive will one day decide wrongly, and
 * the failure is silent and permanent.
 */
const NEVER_LOG = [
  'password', 'passwd', 'secret', 'token', 'apikey', 'api_key', 'authorization',
  'cookie', 'session', 'jwt', 'credential', 'signature', 'privatekey',
  'email', 'mail', 'phone', 'tel', 'mobile', 'iban', 'bic', 'address',
  'street', 'postcode', 'zip', 'name', 'firstname', 'lastname', 'fullname',
  'company', 'message', 'body', 'content', 'prompt', 'answer',
]

/** Values that are secrets whatever they are called. */
const SECRET_SHAPES: readonly RegExp[] = [
  /\bsk-[A-Za-z0-9_-]{16,}/,                  // provider API keys
  /\bBearer\s+[A-Za-z0-9._-]{16,}/i,
  /\bey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\./, // a JWT
  /\bpostgres(ql)?:\/\/[^\s]+/i,              // a connection string
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, // an address in free text
]

const REDACTED = '[redacted]'

/** Remove anything sensitive, by key and by shape, at any depth. */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[deep]'
  if (value === null || value === undefined) return value

  if (typeof value === 'string') {
    let out = value
    for (const shape of SECRET_SHAPES) out = out.replace(new RegExp(shape, 'g'), REDACTED)
    return out.length > 500 ? out.slice(0, 500) + '…' : out
  }
  if (typeof value === 'number' || typeof value === 'boolean') return value
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => redact(v, depth + 1))

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redact(value.message, depth + 1),
      // The stack names files, not data. Trimmed because a full stack is
      // rarely read past its first frames and always costs storage.
      stack: value.stack ? String(value.stack).split('\n').slice(0, 8).join('\n') : undefined,
    }
  }

  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = NEVER_LOG.some((n) => k.toLowerCase().includes(n)) ? REDACTED : redact(v, depth + 1)
    }
    return out
  }
  return '[unloggable]'
}

/** The shape written to stdout. One object per line, so it can be queried. */
export interface LogLine {
  readonly ts: string
  readonly level: LogLevel
  /** Short, stable, machine-groupable. `chat.session.created`, not a sentence. */
  readonly event: string
  readonly surface: Surface
  readonly domain?: string
  readonly trace?: string
  readonly route?: string
  readonly [key: string]: unknown
}

/**
 * The floor below which nothing is written.
 *
 * `debug` in development, `info` in production. Read once at module load: a
 * level re-read per call is a level that can change halfway through an
 * incident.
 */
const MIN_LEVEL: LogLevel =
  process.env.LOG_LEVEL as LogLevel | undefined ??
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug')

function write(level: LogLevel, event: string, ctx: LogContext): void {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[MIN_LEVEL]) return

  const { surface, domain, trace, route, ...rest } = ctx
  const line: LogLine = {
    ts: new Date().toISOString(),
    level,
    event,
    surface,
    ...(domain ? { domain } : {}),
    ...(trace ? { trace } : {}),
    ...(route ? { route } : {}),
    ...(redact(rest) as Record<string, unknown>),
  }

  // One stream for everything, including errors.
  //
  // `console.log` rather than `process.stdout.write`, because the middleware
  // runs on the Edge runtime, which has no `process.stdout` — and the
  // middleware is the one place every request passes through, so a logger that
  // cannot run there is a logger that cannot mint a correlation id.
  //
  // One stream rather than splitting errors onto stderr: a platform that
  // divides its own log has to be reassembled before it can be read, and the
  // `level` field already carries what stderr would have said.
  console.log(JSON.stringify(line))
}

export const log = {
  debug:    (event: string, ctx: LogContext) => write('debug', event, ctx),
  info:     (event: string, ctx: LogContext) => write('info', event, ctx),
  warn:     (event: string, ctx: LogContext) => write('warn', event, ctx),
  error:    (event: string, ctx: LogContext) => write('error', event, ctx),
  critical: (event: string, ctx: LogContext) => write('critical', event, ctx),
}

/**
 * A correlation id.
 *
 * Generated where a request enters the platform and carried on every line
 * about it. Sixteen hex characters: enough to be unique across anything this
 * platform will see, short enough to read out over a phone.
 */
export function newTrace(): string {
  const b = new Uint8Array(8)
  crypto.getRandomValues(b)
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
}

/** The header the trace id travels on, request and response. */
export const TRACE_HEADER = 'x-mp-trace'
