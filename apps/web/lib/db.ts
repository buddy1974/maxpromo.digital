import { neon } from '@neondatabase/serverless'
import { resolveDatabaseUrl } from '@maxpromo/config'

/**
 * The application's only database connection.
 *
 * Which database that is belongs to `@maxpromo/config`, not here: in evidence
 * mode it is the evidence database or nothing, and otherwise it is the
 * production precedence this file used to carry on its own. Routes do not get
 * to choose, and this function is the place that makes sure they cannot.
 *
 * Resolved on every call and never cached. A client captured at module load
 * would keep whatever mode was armed when the module was first imported, which
 * is precisely the kind of quiet staleness the evidence boundary cannot afford.
 * `neon()` is an HTTP wrapper over a tagged template, so there is no connection
 * to pool and nothing is saved by holding one.
 */
export function getDb() {
  const selection = resolveDatabaseUrl()
  if (!selection.ok) {
    /* `reason` names variables, never values. Safe to surface. */
    throw new Error(`[db] ${selection.reason}`)
  }
  return neon(selection.url)
}

/**
 * Whether a database is configured, without opening one.
 *
 * For the routes that answer "not configured" with a 503 before doing any work.
 * They used to re-read the environment themselves, which meant three copies of
 * the resolution rule, one of which would have reported "configured" while
 * evidence mode was refusing to hand them a connection.
 */
export function isDatabaseConfigured(): boolean {
  return resolveDatabaseUrl().ok
}
