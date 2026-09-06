/**
 * middleware.ts — Auth-2: Dashboard route protection
 *
 * Protects all /dashboard/** pages behind a valid NextAuth JWT session.
 * Unauthenticated requests are redirected to /login?callbackUrl=<original path>.
 *
 * WHY withAuth (not a manual getToken check):
 *   withAuth is the NextAuth v4 recommended middleware helper. It reads the
 *   session cookie, verifies the JWT, and handles the redirect automatically.
 *   It reads AUTH_SECRET (with NEXTAUTH_SECRET fallback) so no extra config
 *   is needed beyond what authOptions already declares.
 *
 * SCOPE — this middleware ONLY covers:
 *   /dashboard/*
 *
 * NOT covered (intentional — deferred to Auth-3):
 *   /api/** routes remain unprotected
 *   /api/ai/generate remains an open cost surface until Auth-3/Auth-4
 *   /api/approvals/[id] remains writable without auth until Auth-3
 *
 * NOT covered (must remain public forever):
 *   /                  — landing page
 *   /login             — auth entry point
 *   /impressum         — German legal requirement
 *   /datenschutz       — German legal requirement
 *   /api/auth/**       — NextAuth own endpoints (callbacks, session, signout)
 *   /api/leads         — public lead capture (rate-limited in Auth-4)
 *   /api/auth-status   — health check endpoint
 *   /_next/**          — Next.js static assets
 *   /favicon.ico       — static asset
 */
import { withAuth } from "next-auth/middleware";

export default withAuth({
  // Match signIn page to /login so unauthenticated redirects land there.
  // callbackUrl is appended automatically by withAuth.
  pages: {
    signIn: "/login",
  },

  callbacks: {
    /**
     * authorized — called with the decoded JWT on every matched request.
     * Returns true  → request passes through to the page.
     * Returns false → redirect to pages.signIn + ?callbackUrl=<original path>.
     *
     * WHY simple !!token: Auth-2 only cares about authentication (is there a
     * valid session?). Role/businessId checks are Auth-3 concerns applied
     * individually at the API layer, not at the page middleware level.
     */
    authorized: ({ token }) => !!token,
  },
});

/**
 * Matcher — the ONLY paths this middleware intercepts.
 * Everything not listed here bypasses this middleware entirely.
 *
 * /dashboard/:path* covers:
 *   /dashboard
 *   /dashboard/briefing
 *   /dashboard/tasks
 *   /dashboard/agents
 *   ... all nested dashboard routes
 *
 * WHY no /api/** in matcher: API protection is Auth-3. Adding it here
 * prematurely would break /api/leads (public), /api/auth/* (NextAuth),
 * and /api/auth-status before we've wired session checks into each route.
 */
export const config = {
  matcher: ["/dashboard/:path*"],
};
