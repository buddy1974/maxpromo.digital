/**
 * @maxpromo/observability
 *
 * How the platform says what is happening to it: one logging standard, one
 * error contract, one health contract.
 *
 * It is deliberately dependency-free and emits to stdout. Choosing a
 * destination — Sentry, Axiom, anything that stores this off-platform — is a
 * decision with a cost and a data-processing agreement behind it, and it is
 * Marcel's to make. What this package guarantees is that when it is made, the
 * platform already speaks one language and nothing has to be rewritten to be
 * shipped somewhere.
 *
 * See `docs/architecture/observability.md`.
 */

export { log, redact, newTrace, TRACE_HEADER } from './logger.ts'
export type { LogLevel, Surface, LogContext, LogLine } from './logger.ts'

export { runHealth, healthStatus } from './health.ts'
export type { HealthState, HealthResult, HealthReport, HealthCheck } from './health.ts'
