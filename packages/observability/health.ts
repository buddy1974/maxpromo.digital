/**
 * packages/observability/health.ts
 *
 * What "healthy" means, and how a subsystem says so.
 *
 * WHY THIS EXISTS
 *
 * The platform had three status endpoints before this — `/api/ai/status`,
 * `/api/auth-status` and `/api/demo/status`, all in `apps/bureau`, each with a
 * different shape and none of them reachable from the application that serves
 * ten public domains. There was no answer to "is the platform up" that did not
 * involve opening a browser.
 *
 * THE CONTRACT
 *
 * A check answers one question about one subsystem, and it answers it in
 * bounded time. Three states, and the middle one is the one that matters:
 *
 *   ok        working
 *   degraded  working, but not as intended — a fallback is carrying it
 *   down      not working
 *
 * `degraded` exists because most real failures are not binary. A database
 * that answers in four seconds is not down, and reporting it as `ok` is how an
 * outage becomes a surprise.
 *
 * A subsystem that is not configured is `ok` with a note, never `down`. The
 * Agent Bureau has no Telegram token in development, and a health endpoint that
 * goes red on every developer's machine is a health endpoint everyone learns to
 * ignore.
 *
 * WHAT A CHECK MUST NOT DO
 *
 * Write anything. Cost money. Take longer than its timeout. Return anything a
 * caller could not already see — a health endpoint is unauthenticated by
 * design, so it reports *whether* a subsystem answers, never *what* it said.
 */

export type HealthState = 'ok' | 'degraded' | 'down'

export interface HealthResult {
  /** Subsystem name. Stable — it is what an alert will be named after. */
  readonly name: string
  readonly state: HealthState
  /** How long the check took. The number that turns `ok` into `degraded`. */
  readonly ms: number
  /**
   * One short sentence, for a human reading the JSON at three in the morning.
   * Never contains data from the subsystem, only a fact about it.
   */
  readonly note?: string
  /** Whether the platform still functions when this subsystem is down. */
  readonly critical: boolean
}

export interface HealthReport {
  readonly state: HealthState
  readonly surface: string
  readonly ts: string
  /** Build identity, so a report can be tied to what was deployed. */
  readonly release: { readonly commit?: string; readonly builtAt?: string }
  readonly checks: readonly HealthResult[]
  readonly ms: number
}

export interface HealthCheck {
  readonly name: string
  /** Does the platform still work without it? */
  readonly critical: boolean
  /** Milliseconds after which the check is abandoned and called `down`. */
  readonly timeoutMs?: number
  /**
   * The probe. Returns a state and an optional note; throwing is `down`.
   * It must not write, and must not return subsystem data.
   */
  readonly probe: () => Promise<{ state: HealthState; note?: string }>
}

const DEFAULT_TIMEOUT = 3000

/**
 * A probe that never hangs.
 *
 * A health endpoint whose own timeout is the client's is a health endpoint
 * that makes an outage worse — every checker holds a connection open for as
 * long as the broken subsystem does.
 */
async function withTimeout(check: HealthCheck): Promise<HealthResult> {
  const limit = check.timeoutMs ?? DEFAULT_TIMEOUT
  const started = Date.now()
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const result = await Promise.race([
      check.probe(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`no answer in ${limit}ms`)), limit)
      }),
    ])
    return { name: check.name, state: result.state, ms: Date.now() - started, note: result.note, critical: check.critical }
  } catch (e) {
    return {
      name: check.name,
      state: 'down',
      ms: Date.now() - started,
      // The message, not the error: a probe failure can carry a connection
      // string, and this endpoint is unauthenticated.
      note: e instanceof Error ? e.message.slice(0, 120) : 'probe failed',
      critical: check.critical,
    }
  } finally {
    if (timer) clearTimeout(timer)
  }
}

/**
 * Run every check and fold the results into one state.
 *
 * A non-critical subsystem being down degrades the surface rather than
 * downing it — the public site does not stop working because an outbound
 * notification channel is unreachable, and saying otherwise would train
 * whoever reads this to distrust it.
 */
export async function runHealth(
  surface: string,
  checks: readonly HealthCheck[],
  release: HealthReport['release'] = {},
): Promise<HealthReport> {
  const started = Date.now()
  const results = await Promise.all(checks.map(withTimeout))

  let state: HealthState = 'ok'
  for (const r of results) {
    if (r.state === 'down') state = r.critical ? 'down' : (state === 'down' ? 'down' : 'degraded')
    else if (r.state === 'degraded' && state === 'ok') state = 'degraded'
  }

  return { state, surface, ts: new Date().toISOString(), release, checks: results, ms: Date.now() - started }
}

/** The HTTP status a report should be served with. */
export function healthStatus(report: HealthReport): number {
  // 200 for degraded, deliberately: a load balancer should not remove a surface
  // that is serving because a non-critical dependency is slow.
  return report.state === 'down' ? 503 : 200
}
