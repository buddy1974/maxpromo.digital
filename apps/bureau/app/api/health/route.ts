import { NextResponse } from "next/server";
import { runHealth, healthStatus, type HealthCheck } from "@maxpromo/observability";
import { resolveDomain, BUSINESS } from "@maxpromo/config";
import { workDoorSecret } from "@maxpromo/config/agent-contract";

/**
 * app/api/health/route.ts — is Agent Bureau working?
 *
 * The one that answers "is the surface up" in the platform's shared shape.
 * (`/api/auth-status` remains for login diagnostics; the AI and demo status
 * endpoints were removed with the AI Lab and the sample data, ADR-0030.)
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
    // ADR-0030: the Bureau holds no model key. A model step is a registered task
    // the OS gateway runs on an agent's request, so the dependency is the signed
    // OS connection. Not called here: a health check that spends model money gets
    // switched off.
    name: "model-gateway",
    critical: false,
    probe: async () => ((process.env.OS_BUREAU_AGENT_SECRET?.length ?? 0) >= 32
      // `unvalidated`, not `ok` — a configured credential is not the dependency working.
      ? { state: "unvalidated", note: "model steps run through the Maxpromo OS gateway; not called here" }
      : { state: "degraded", note: "not connected to Maxpromo OS — the Research Agent cannot run" }),
  },
  {
    name: "work-door",
    critical: false,
    probe: async () => (workDoorSecret(process.env) && Boolean(process.env.BUREAU_OS_BUSINESS_ID)
      ? { state: "unvalidated", note: "Maxpromo OS can delegate work; not called here" }
      : { state: "degraded", note: "the work door is not configured — Maxpromo OS cannot delegate work" }),
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
