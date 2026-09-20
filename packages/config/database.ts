/**
 * packages/config/database.ts
 *
 * Which database this process is allowed to talk to. One answer, one place.
 *
 * WHY THIS FILE EXISTS
 *
 * Phase B3 tried to photograph Maxpromo OS working and could not, because the
 * evidence boundary had a hole in exactly the place that matters. Evidence mode
 * suppressed outbound mail and notifications, and left storage alone:
 * `apps/web/lib/db.ts` resolved `NEON_DATABASE_URL ?? DATABASE_URL` and had
 * never heard of the evidence database. Arming the mode therefore produced the
 * worst possible state, which is not "unprotected" but "protected in a way the
 * operator can see, while the part they cannot see still writes to production".
 *
 * So the rule moved here, above both applications, and became one function.
 *
 * THE RULE
 *
 *   evidence mode ON   the evidence database, or nothing. Never a fallback.
 *   evidence mode OFF  exactly the precedence production already used.
 *
 * The first half is the load-bearing one. `if evidence database exists use it,
 * else use production` would reproduce the original defect with more code: the
 * operator arms the mode, mistypes the variable name, sees no error, and
 * photographs production. Missing configuration in evidence mode is a failure,
 * not a hint.
 *
 * WHY IT RETURNS A RESULT RATHER THAN THROWING
 *
 * Two reasons, and the second is the real one.
 *
 * It can be tested without catching, which is how `evidenceDbProblem` next door
 * already works, so this reads like the file it sits beside.
 *
 * And it names the *variable* it chose rather than only handing back a string,
 * which lets the isolation proof assert that evidence mode selected
 * `EVIDENCE_DATABASE_URL` and refused `NEON_DATABASE_URL` without a connection
 * string ever entering a test, an assertion message or a failure log. A proof
 * about secrets should not need to hold one.
 */

import {
  EVIDENCE_DB_ENV,
  PRODUCTION_DB_ENVS,
  EVIDENCE_MODE_ENV,
  isEvidenceMode,
  evidenceDbProblem,
} from './evidence.ts'

/**
 * The name of the environment variable a selection came from.
 *
 * Deliberately the name and not the value. Everything downstream that wants to
 * report, log or assert on a selection uses this; the URL itself is read once,
 * by the code that opens the connection.
 */
export type DatabaseSource = typeof EVIDENCE_DB_ENV | (typeof PRODUCTION_DB_ENVS)[number]

export type DatabaseSelection =
  | { readonly ok: true; readonly source: DatabaseSource; readonly url: string }
  | { readonly ok: false; readonly source: null; readonly reason: string }

/**
 * Which database URL this process must use, and where it came from.
 *
 * In evidence mode the answer is the evidence database or a refusal. There is
 * no third branch, and adding one would undo the phase this was written for.
 *
 * Out of evidence mode the answer is whatever production already resolved to,
 * preserved exactly — see the note on `??` below.
 */
export function resolveDatabaseUrl(env: NodeJS.ProcessEnv = process.env): DatabaseSelection {
  if (isEvidenceMode(env)) {
    /* `evidenceDbProblem` already holds the arming rules, including that the
       evidence URL may not be the same string as a production URL. Repeating
       any of that here would create a second copy to disagree with. */
    const problem = evidenceDbProblem(env)
    if (problem) {
      return {
        ok: false,
        source: null,
        reason:
          `${EVIDENCE_MODE_ENV} is armed, so this process may only reach the evidence database. `
          + `${problem} `
          + 'Falling back to a production database was refused.',
      }
    }
    return { ok: true, source: EVIDENCE_DB_ENV, url: env[EVIDENCE_DB_ENV] as string }
  }

  /*
   * Production precedence, unchanged.
   *
   * `??` and not `||`, and no trim, because that is what `lib/db.ts` did and
   * this phase was not asked to change how production resolves. The difference
   * is visible: with `NEON_DATABASE_URL=""` set and `DATABASE_URL` populated,
   * `??` selects the empty string and the caller fails, where `||` would fall
   * through to `DATABASE_URL`.
   *
   * That is not hypothetical here. `vercel env pull` has written `DATABASE_URL=""`
   * for a sensitive variable in this repository before, which is the incident
   * `prove-provisioning-guards.mjs` exists about. Falling through might well be
   * the better behaviour — but changing how production picks its database, in
   * the commit whose subject is isolating evidence capture, is how an unrelated
   * outage gets attributed to the wrong change. Recorded for Marcel instead.
   */
  const [primary, secondary] = PRODUCTION_DB_ENVS
  const chosen = env[primary] !== undefined ? primary : secondary
  const url = env[chosen]
  if (!url) {
    return {
      ok: false,
      source: null,
      reason: `Neither ${primary} nor ${secondary} is set to a usable value.`,
    }
  }
  return { ok: true, source: chosen, url }
}

/**
 * The same decision, reduced to the one thing a report may safely print.
 *
 * Returns the variable name that would be used, or null if the process has no
 * database it is allowed to open. Nothing here can leak a connection string,
 * so it is safe in a log line, a health response or an error.
 */
export function databaseSource(env: NodeJS.ProcessEnv = process.env): DatabaseSource | null {
  const selection = resolveDatabaseUrl(env)
  return selection.ok ? selection.source : null
}
