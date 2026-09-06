import { NextResponse } from 'next/server'
import { runHealth, healthStatus, type HealthCheck } from '@maxpromo/observability'
import { DOMAIN_REGISTRY, BRAND_REGISTRY, BUSINESS } from '@maxpromo/config'
import { getDb } from '@/lib/db'

/**
 * app/api/health/route.ts — is this surface working?
 *
 * The application that serves ten public domains had no answer to that
 * question that did not involve opening a browser. Agent Bureau had three
 * status endpoints of three different shapes; this application had none.
 *
 * Unauthenticated by design, and therefore says only *whether* each subsystem
 * answers — never what it said, never a connection string, never a count of
 * anything a competitor would find interesting. `robots.txt` disallows
 * `/api/`, so it is reachable and not indexed.
 *
 * Never cached: a cached health report is a report about the past.
 */
export const dynamic = 'force-dynamic'
export const revalidate = 0

const CHECKS: readonly HealthCheck[] = [
  {
    // The two registries are the platform's spine — every request resolves
    // against them before anything else happens. If they were not bundled into
    // the deployment, every domain would fall back to the hub and nothing else
    // would report it.
    name: 'registries',
    critical: true,
    probe: async () => {
      const domains = DOMAIN_REGISTRY.length
      const brands = BRAND_REGISTRY.length
      if (domains === 0 || brands === 0) return { state: 'down', note: 'a registry is empty' }
      return { state: 'ok', note: `${domains} domains, ${brands} brands` }
    },
  },
  {
    name: 'legal-identity',
    critical: true,
    probe: async () => {
      // The §19 UStG clause is required on every commercial surface. A
      // deployment that lost it would still render invoices, silently missing
      // a legally required line.
      const ok = Boolean(BUSINESS.legalName && BUSINESS.steuernummer)
      return ok ? { state: 'ok' } : { state: 'down', note: 'legal identity incomplete' }
    },
  },
  {
    name: 'database',
    critical: true,
    timeoutMs: 2500,
    probe: async () => {
      // Both names, because `lib/db.ts` accepts both. A probe that checks a
      // narrower condition than the code it is probing reports `down` on a
      // deployment that works, which is the fastest way to teach everyone to
      // ignore a health endpoint.
      if (!(process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL)) {
        return { state: 'down', note: 'no database URL is set' }
      }
      const started = Date.now()
      const sql = getDb()
      await sql`select 1`
      const ms = Date.now() - started
      // Answering slowly is not the same as being down, and calling it `ok`
      // is how an outage becomes a surprise.
      return ms > 800 ? { state: 'degraded', note: `answered in ${ms}ms` } : { state: 'ok' }
    },
  },
  {
    // Not called — a probe that costs money per health check is a probe that
    // gets switched off. Configuration presence is what can be verified for
    // free, and its absence is the failure that actually happens.
    name: 'ai-provider',
    critical: false,
    probe: async () => {
      const configured = Boolean(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY)
      return configured
        ? { state: 'ok', note: 'configured; not called' }
        : { state: 'degraded', note: 'no provider key — assistant surfaces fall back' }
    },
  },
  {
    name: 'email',
    critical: false,
    probe: async () => {
      const configured = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL)
      return configured
        ? { state: 'ok', note: 'configured; not called' }
        : { state: 'degraded', note: 'not configured — enquiries and documents cannot be sent' }
    },
  },
  {
    name: 'documents',
    critical: false,
    probe: async () => {
      // The document engine is pure rendering; what it needs at runtime is the
      // bank and legal configuration it prints. Importing it here would pull a
      // page component into a route handler, so the check is on the data.
      const ok = Boolean(BUSINESS.website && BUSINESS.email)
      return ok ? { state: 'ok' } : { state: 'degraded', note: 'document identity incomplete' }
    },
  },
  {
    name: 'authentication',
    critical: true,
    probe: async () => {
      const ok = Boolean(process.env.OS_SESSION_SECRET && process.env.OS_PASSWORD)
      return ok ? { state: 'ok' } : { state: 'down', note: 'OS session secret or password not set' }
    },
  },
]

export async function GET() {
  const report = await runHealth('web', CHECKS, {
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7),
    builtAt: process.env.BUILD_TIME,
  })
  return NextResponse.json(report, {
    status: healthStatus(report),
    headers: { 'cache-control': 'no-store, max-age=0' },
  })
}
