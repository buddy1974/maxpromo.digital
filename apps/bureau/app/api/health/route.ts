import { NextResponse } from "next/server";
import { runHealth, healthStatus, type HealthCheck } from "@maxpromo/observability";
import { resolveDomain, BUSINESS } from "@maxpromo/config";

/**
 * app/api/health/route.ts — is Agent Bureau working?
 *
 * This application already had three status endpoints — `/api/ai/status`,
 * `/api/auth-status`, `/api/demo/status` — with three shapes, none of them a
 * health check and none of them answerable by a monitor. They stay; this is
 * the one that answers "is the surface up" in the platform's shared shape.
 *
 * Unauthenticated, so it reports whether each subsystem answers and nothing
 * about what it said. Never cached.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

const CHECKS: readonly HealthCheck[] = [
  {
    name: "identity",
    critical: true,
    probe: async () => {
      const d = resolveDomain("agents.maxpromo.digital");
      if (d.app !== "bureau") return { state: "down", note: "registry does not place this host here" };
      return { state: "ok", note: d.origin };
    },
  },
  {
    name: "legal-identity",
    critical: true,
    probe: async () => (BUSINESS.legalName && BUSINESS.steuernummer
      ? { state: "ok" }
      : { state: "down", note: "legal identity incomplete" }),
  },
  {
    name: "database",
    critical: true,
    timeoutMs: 2500,
    probe: async () => {
      const url = process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL;
      if (!url) return { state: "down", note: "no database URL is set" };
      const started = Date.now();
      const { neon } = await import("@neondatabase/serverless");
      await neon(url)`select 1`;
      const ms = Date.now() - started;
      return ms > 800 ? { state: "degraded", note: `answered in ${ms}ms` } : { state: "ok" };
    },
  },
  {
    name: "authentication",
    critical: true,
    probe: async () => {
      const ok = Boolean(process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET);
      return ok ? { state: "ok" } : { state: "down", note: "NextAuth secret is not set" };
    },
  },
  {
    // Not called: an agent run costs money and takes seconds, and a health
    // check that does either is a health check that gets switched off.
    name: "ai-provider",
    critical: false,
    probe: async () => {
      const configured = Boolean(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY);
      return configured
        ? { state: "ok", note: "configured; not called" }
        : { state: "degraded", note: "no provider key — the agents cannot run" };
    },
  },
];

export async function GET() {
  const report = await runHealth("bureau", CHECKS, {
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7),
    builtAt: process.env.BUILD_TIME,
  });
  return NextResponse.json(report, {
    status: healthStatus(report),
    headers: { "cache-control": "no-store, max-age=0" },
  });
}
