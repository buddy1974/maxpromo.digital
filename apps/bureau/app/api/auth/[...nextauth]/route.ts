/**
 * app/api/auth/[...nextauth]/route.ts
 *
 * NextAuth v4 App Router handler.
 * All auth endpoints (/api/auth/signin, /api/auth/signout, /api/auth/session,
 * /api/auth/callback/credentials, etc.) are handled here.
 *
 * WHY runtime nodejs: argon2 requires native Node.js bindings — incompatible
 * with the Edge runtime. This also applies to the authorize() callback in
 * auth.ts which imports argon2 transitively.
 */
export const runtime = "nodejs";

import NextAuth from "next-auth";
import { authOptions } from "@/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
