/**
 * packages/config/evidence.ts
 *
 * The evidence environment: what it is, how it is switched on, and what it is
 * structurally incapable of doing.
 *
 * WHY AN EXPLICIT MODE RATHER THAN CLEVER CONDITIONS
 *
 * The purpose is to photograph Maxpromo OS doing real work without a real
 * client appearing in the picture and without anything leaving the building.
 * That could be approached by sanitising production records, or by branching on
 * whether a row "looks like" test data. Both are the same mistake in different
 * clothes: they put the safety property inside a judgement that has to be made
 * correctly every time, by every future contributor, in every code path.
 *
 * So the boundary is a mode, and the mode is off unless two separate things are
 * true at once. A single forgotten flag cannot open it, and neither can a
 * single wrong database URL.
 *
 * THE TWO CONDITIONS
 *
 *   MAXPROMO_EVIDENCE_MODE=1     deliberate, per-process, never set in Vercel
 *   EVIDENCE_DATABASE_URL        a database that is not the production one
 *
 * The seed refuses to run unless both hold and the evidence URL differs from
 * every production URL the application knows about. It writes only to the
 * evidence database, and it has no code path that reads a production row: the
 * dataset is generated from constants in this repository rather than copied
 * from anywhere.
 *
 * WHAT THE MODE FORBIDS
 *
 * Every outbound path that could reach a person. The web application talks to
 * exactly four hosts, established by reading the source rather than by memory:
 *
 *   api.resend.com      customer email          BLOCKED in evidence mode
 *   api.telegram.org    internal notification   BLOCKED in evidence mode
 *   api.anthropic.com   model inference         allowed
 *   api.openai.com      model inference         allowed
 *
 * The two model hosts stay open because the extraction is the thing being
 * demonstrated; a screenshot of a disabled feature proves nothing. They carry
 * synthetic text to a model and return structure. They do not reach a customer,
 * which is the property this boundary is about.
 *
 * Blocking is enforced inside the transport functions themselves, not at the
 * call sites and not in the interface. A disabled button is a suggestion.
 */

/** Set to exactly '1' to arm the evidence environment. Never set in production. */
export const EVIDENCE_MODE_ENV = 'MAXPROMO_EVIDENCE_MODE'

/** The evidence database. Must differ from every production database URL. */
export const EVIDENCE_DB_ENV = 'EVIDENCE_DATABASE_URL'

/** Production database variables, in the order `lib/db.ts` prefers them. */
export const PRODUCTION_DB_ENVS = ['NEON_DATABASE_URL', 'DATABASE_URL'] as const

/**
 * Every synthetic record carries this, in a field a person can see.
 *
 * The point is not machine detection, which the separate database already
 * gives. It is that anyone looking at a screenshot, a database row or a log
 * line can tell within a second that nothing here is a real customer. A
 * screenshot that needs a caption explaining it is fake is a screenshot that
 * will eventually be used without the caption.
 */
export const EVIDENCE_MARKER = 'EVD'

/** Document numbers in the evidence environment. Unmistakable, and ordered. */
export const EVIDENCE_DOC_PREFIX = `${EVIDENCE_MARKER}-2026-`

/** Outbound hosts the evidence environment must never reach. */
export const BLOCKED_OUTBOUND_HOSTS = ['api.resend.com', 'api.telegram.org'] as const

/** Outbound hosts that stay open, because they carry no customer contact. */
export const ALLOWED_OUTBOUND_HOSTS = ['api.anthropic.com', 'api.openai.com'] as const

/**
 * True when the evidence environment is armed.
 *
 * Reads the environment on every call rather than caching, so a test can arm
 * and disarm it in one process. Cheap, and the alternative is a module-load
 * snapshot that lies after the first import.
 */
export function isEvidenceMode(env: NodeJS.ProcessEnv = process.env): boolean {
  return env[EVIDENCE_MODE_ENV] === '1'
}

/**
 * Why the evidence database may not be used, or null when it may.
 *
 * Returns a reason rather than throwing so the seed can print something a
 * person can act on, and so this is testable without catching.
 */
export function evidenceDbProblem(env: NodeJS.ProcessEnv = process.env): string | null {
  if (!isEvidenceMode(env)) {
    return `${EVIDENCE_MODE_ENV} is not set to 1. The evidence environment is off.`
  }
  const target = env[EVIDENCE_DB_ENV]
  if (!target) {
    return `${EVIDENCE_DB_ENV} is not set. Refusing to guess a database.`
  }
  for (const name of PRODUCTION_DB_ENVS) {
    const production = env[name]
    if (production && production === target) {
      return `${EVIDENCE_DB_ENV} is the same value as ${name}. ` +
        'The evidence environment must never point at production.'
    }
  }
  return null
}
