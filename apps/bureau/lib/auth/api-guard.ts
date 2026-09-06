/**
 * lib/auth/api-guard.ts
 *
 * Route-handler auth guards for Auth-3.
 *
 * WHY separate from session.ts and tenancy.ts: those modules throw errors that
 * the caller catches. These guards return NextResponse directly, which is the
 * idiomatic pattern inside App Router route handlers. Keeps each route handler
 * minimal: call the guard at the top, check the return, proceed.
 *
 * Usage pattern in a protected route handler:
 *
 *   const authResult = await requireApiUser();
 *   if (!authResult.ok) return authResult.response;
 *   const { user } = authResult;
 *
 *   const bizResult = await requireApiBusinessId();
 *   if (!bizResult.ok) return bizResult.response;
 *   const businessId = bizResult.businessId;
 *
 * Server-only. Do not import in client components or Edge runtimes.
 */
import { NextResponse } from "next/server";
import { getCurrentUser, type AuthUser } from "@/lib/auth/session";
import { apiError } from "@/lib/api/response";

// ─── Response factories ───────────────────────────────────────────────────────

/**
 * unauthorizedResponse — 401 in the project API envelope.
 * Use when: no valid session, or session missing required fields.
 */
export function unauthorizedResponse(): NextResponse {
  return apiError("unauthorized", 401) as unknown as NextResponse;
}

/**
 * forbiddenResponse — 403 in the project API envelope.
 * Use when: valid session but businessId does not match requested resource.
 */
export function forbiddenResponse(): NextResponse {
  return apiError("forbidden", 403) as unknown as NextResponse;
}

// ─── Guard result types ────────────────────────────────────────────────────────

type UserGuardOk = { ok: true; user: AuthUser };
type UserGuardFail = { ok: false; response: NextResponse };
type UserGuardResult = UserGuardOk | UserGuardFail;

type BizGuardOk = { ok: true; user: AuthUser; businessId: string };
type BizGuardFail = { ok: false; response: NextResponse };
type BizGuardResult = BizGuardOk | BizGuardFail;

// ─── Guards ───────────────────────────────────────────────────────────────────

/**
 * requireApiUser — asserts an authenticated session.
 *
 * Returns { ok: true, user } on success.
 * Returns { ok: false, response: 401 } if no session.
 *
 * WHY return-instead-of-throw: route handlers can early-return the response
 * object directly. Throw-style errors require try/catch boilerplate in every
 * handler, which adds noise at 20+ call sites.
 */
export async function requireApiUser(): Promise<UserGuardResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, response: unauthorizedResponse() };
  }
  // Guard against a JWT that is somehow missing businessId (misconfigured session).
  if (!user.businessId) {
    console.error("[requireApiUser] session.user.businessId is missing — check auth callbacks");
    return { ok: false, response: unauthorizedResponse() };
  }
  return { ok: true, user };
}

/**
 * requireApiBusinessId — asserts authentication and returns the session businessId.
 *
 * Returns { ok: true, user, businessId } on success.
 * Returns { ok: false, response: 401 } if no session or missing businessId.
 *
 * WHY a separate function from requireApiUser: callers that only need businessId
 * avoid destructuring user. Named return keeps call sites self-documenting.
 */
export async function requireApiBusinessId(): Promise<BizGuardResult> {
  const result = await requireApiUser();
  if (!result.ok) return result;
  return { ok: true, user: result.user, businessId: result.user.businessId };
}

/**
 * assertBusinessAccess — verifies the authenticated user owns a specific resource businessId.
 *
 * Returns null on success (caller proceeds).
 * Returns a 401 or 403 NextResponse if the check fails — caller should return it immediately.
 *
 * WHY null-on-success: the caller does not need the user object; a missing return
 * value signals "proceed". Pair with:
 *
 *   const deny = await assertBusinessAccess(resourceBusinessId);
 *   if (deny) return deny;
 */
export async function assertBusinessAccess(
  resourceBusinessId: string,
): Promise<NextResponse | null> {
  const result = await requireApiUser();
  if (!result.ok) return result.response;

  if (result.user.businessId !== resourceBusinessId) {
    return forbiddenResponse();
  }
  return null;
}
