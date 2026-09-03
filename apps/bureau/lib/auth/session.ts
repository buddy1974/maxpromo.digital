/**
 * lib/auth/session.ts
 *
 * Session read helpers for server components and route handlers.
 *
 * WHY separate from auth.ts: auth.ts is the config/provider definition.
 * Session helpers are call-site utilities — imported wherever you need the
 * current user without importing the full auth config.
 *
 * These are server-only. Do not import in client components.
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import type { Session } from "next-auth";

export type AuthUser = Session["user"];

/**
 * getCurrentUser — returns the session user or null if unauthenticated.
 * Use in server components and GET route handlers where a missing session
 * should return a graceful empty state rather than an error.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

/**
 * requireUser — returns the session user or throws a 401-shaped error.
 * Use in route handlers and server actions where unauthenticated access must
 * be rejected. Pair with try/catch in the route handler.
 *
 * WHY an Error rather than NextResponse: this keeps session logic decoupled
 * from HTTP response construction. The caller decides the response shape.
 */
export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthRequiredError();
  }
  return user;
}

/**
 * Typed error thrown by requireUser when no session exists.
 * Callers can instanceof-check this to return a clean 401.
 */
export class AuthRequiredError extends Error {
  readonly status = 401;
  constructor() {
    super("Authentifizierung erforderlich");
    this.name = "AuthRequiredError";
  }
}
