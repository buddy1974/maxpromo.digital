/**
 * app/api/auth-status/route.ts
 *
 * GET /api/auth-status
 *
 * Returns the current authentication state. Useful for:
 *   - Client-side session polling
 *   - External health checks (confirm auth system is wired)
 *   - Debugging session state during Auth-2/3 implementation
 *
 * Response shape:
 *   { ok: true, data: { authenticated: false } }
 *   { ok: true, data: { authenticated: true, user: { id, email, name, role, businessId } } }
 *
 * WHY not just use /api/auth/session: that endpoint returns the raw NextAuth
 * session object. This wrapper normalises it to the project's API envelope and
 * strips any NextAuth internals we don't want to expose.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { apiOk } from "@/lib/api/response";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return apiOk({ authenticated: false });
  }

  return apiOk({
    authenticated: true,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      businessId: session.user.businessId,
    },
  });
}
