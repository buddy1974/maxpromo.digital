/**
 * lib/auth/tenancy.ts
 *
 * Tenant boundary helpers.
 *
 * WHY separate from session.ts: tenancy is about the business boundary, not
 * the user identity. Keeping them separate makes the Auth-3 ownership-check
 * wiring explicit and auditable.
 *
 * These are server-only. Do not import in client components.
 */
import { getCurrentUser, requireUser, AuthRequiredError } from "@/lib/auth/session";

/**
 * BusinessAccessError — thrown when the authenticated user does not belong to
 * the requested business. Returns a 403 from route handlers.
 */
export class BusinessAccessError extends Error {
  readonly status = 403;
  constructor() {
    super("Zugriff verweigert");
    this.name = "BusinessAccessError";
  }
}

/**
 * getCurrentBusinessId — returns the businessId from the current session,
 * or null if unauthenticated.
 */
export async function getCurrentBusinessId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.businessId ?? null;
}

/**
 * requireBusinessAccess — verifies the authenticated user belongs to the
 * given businessId.
 *
 * Call this at the top of any route handler that receives a businessId in
 * path params or body before performing any DB operation.
 *
 * WHY not just check session.businessId === requestedId: future multi-business
 * access (admin roles, sub-tenants) will route through this function.
 * Centralising the check here means one place to update.
 */
export async function requireBusinessAccess(requestedBusinessId: string): Promise<void> {
  const user = await requireUser(); // throws AuthRequiredError if no session

  if (user.businessId !== requestedBusinessId) {
    throw new BusinessAccessError();
  }
}

/**
 * requireCurrentBusiness — asserts authentication and returns the session
 * businessId. Use this in route handlers that derive businessId from the
 * session rather than from a path param.
 *
 * WHY not always use path-param version: most Auth-3 routes will pull
 * businessId from the session directly (not the URL) to prevent IDOR.
 */
export async function requireCurrentBusiness(): Promise<string> {
  const user = await requireUser();
  return user.businessId;
}
