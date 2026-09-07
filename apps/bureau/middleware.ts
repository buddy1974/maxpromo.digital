/**
 * middleware.ts — Auth-2 dashboard protection, and the platform trace contract
 *
 * Two jobs, deliberately kept separate inside one file because Next runs one
 * middleware per application:
 *
 *   1. Every response leaves with `x-mp-trace`, minted here or inherited from
 *      the caller. Platform contract, shared implementation.
 *   2. `/dashboard/**` requires a valid NextAuth JWT session. Unchanged.
 *
 * WHY THE MATCHER IS WIDER THAN IT WAS
 *
 * It used to be `["/dashboard/:path*"]`, which meant this middleware never ran
 * for the landing page, the legal pages, or a 404 — so `agents.maxpromo.digital`
 * carried no correlation id on any response a visitor could actually reach.
 * Production verification on 2026-09-07 measured exactly that: the platform's
 * correlation-id contract held on `apps/web` and on neither half of this one.
 *
 * WHY WIDENING IT DOES NOT WIDEN AUTHENTICATION
 *
 * The previous version passed the matcher straight to `withAuth`, so every
 * matched path was an authenticated path. Widening *that* would have put the
 * landing page, `/login` and the two legally required pages behind a session —
 * a redirect loop on `/login`, and a German legal requirement made
 * unreachable.
 *
 * So `withAuth` is no longer the exported middleware. It is constructed once
 * and invoked **only** for `/dashboard/**`. Every other matched path is stamped
 * and passed through without ever reaching it. The set of authenticated paths
 * is therefore decided by the `startsWith` below, not by the matcher, and it is
 * the same set as before.
 *
 * SCOPE — authenticated:
 *   /dashboard/*
 *
 * NOT authenticated (unchanged — deferred to Auth-3):
 *   /api/**            — still outside the matcher entirely
 *   /api/ai/generate   — still an open cost surface until Auth-3/Auth-4
 *   /api/approvals/[id]
 *
 * NOT authenticated (must remain public forever):
 *   /                  — landing page
 *   /login             — auth entry point
 *   /impressum         — German legal requirement
 *   /datenschutz       — German legal requirement
 *   /api/auth/**       — NextAuth's own endpoints
 *   /api/leads         — public lead capture
 *   /api/auth-status   — health check endpoint
 */
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";
import { newTrace, TRACE_HEADER } from "@maxpromo/observability";

/** The one prefix this application authenticates. */
const PROTECTED_PREFIX = "/dashboard";

/**
 * The Auth-2 middleware, unchanged in behaviour — same `pages.signIn`, same
 * `authorized` callback. It is now called by hand instead of being exported,
 * which is the only difference.
 */
const requireSession = withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    /**
     * authorized — called with the decoded JWT for a /dashboard request.
     * true  → through to the page.
     * false → redirect to /login?callbackUrl=<original path>.
     *
     * Auth-2 only asks "is there a valid session". Role and businessId checks
     * are Auth-3 concerns applied per route at the API layer.
     */
    authorized: ({ token }) => !!token,
  },
});

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  // Inherit an upstream id where there is one, so a request crossing from the
  // hub to the bureau keeps a single trace rather than starting a second.
  const trace = req.headers.get(TRACE_HEADER) ?? newTrace();

  /**
   * Stamped through one helper rather than at each return. In `apps/web` the
   * first version of this set the header only on the paths that happened to be
   * tested, and the most-served route on the platform left without one.
   */
  const traced = (res: NextResponse) => {
    res.headers.set(TRACE_HEADER, trace);
    return res;
  };

  if (req.nextUrl.pathname.startsWith(PROTECTED_PREFIX)) {
    // withAuth returns a redirect for an unauthenticated caller, and otherwise
    // whatever it decided the request should continue as. It can return null
    // to mean "carry on", which NextResponse.next() expresses.
    const result = await requireSession(
      req as Parameters<typeof requireSession>[0],
      event,
    );
    const res = result instanceof NextResponse ? result : NextResponse.next();
    return traced(res);
  }

  return traced(NextResponse.next());
}

/**
 * Matcher — every path a visitor can reach, so the trace contract holds on a
 * served page and on a 404 alike.
 *
 * Excluded, and each for a reason:
 *   api           — API protection is Auth-3; adding it here would break
 *                   /api/leads, /api/auth/* and /api/auth-status. `apps/web`
 *                   excludes its own /api the same way, and the resulting gap
 *                   on /api/health is recorded in governance/known-risks.md.
 *   _next/*       — framework internals and build output
 *   _vercel       — platform instrumentation
 *   *.<ext>       — static files served from public/
 *
 * Everything else matches, including paths that resolve to nothing, which is
 * how a 404 comes to carry a correlation id.
 */
export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\.).*)"],
};
