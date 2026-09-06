/**
 * auth.ts — NextAuth v4 configuration (Auth.js)
 *
 * Strategy: JWT sessions (no DB adapter). Token carries userId, businessId,
 * role so every server component / route handler gets tenant context from
 * getServerSession() without a DB round-trip.
 *
 * Provider: Credentials only — email + argon2id-hashed password.
 * WHY no public signup: accounts are provisioned by Maxpromo during client
 * onboarding. This keeps costs controlled and tenant boundaries auditable.
 *
 * Import pattern elsewhere:
 *   import { authOptions } from "@/auth";
 *   import { getServerSession } from "next-auth";
 *   const session = await getServerSession(authOptions);
 */
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { checkRateLimit, LOGIN_LIMIT } from "@/lib/security/rate-limit";

export const authOptions: NextAuthOptions = {
  // ── Session ────────────────────────────────────────────────────────────────
  session: {
    strategy: "jwt",
    // 8-hour session: short enough to limit exposure of a stolen token
    maxAge: 8 * 60 * 60,
  },

  // ── Secret ─────────────────────────────────────────────────────────────────
  // WHY not a getter: NextAuth reads this once at cold start; it never changes
  // between requests. Must be a non-empty string in all environments.
  secret: process.env.AUTH_SECRET,

  // ── Custom pages ───────────────────────────────────────────────────────────
  pages: {
    signIn: "/login",
    error: "/login",
  },

  // ── Providers ──────────────────────────────────────────────────────────────
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" },
      },

      /**
       * authorize — called by NextAuth on POST /api/auth/callback/credentials.
       * Returns a User object on success, null on failure.
       * Null causes NextAuth to redirect to /login?error=CredentialsSignin.
       */
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Auth-4: rate-limit login attempts by email. 10 per 15 min.
        // WHY email-keyed (not IP): credential stuffing targets accounts, not IPs.
        // Fail-open on Redis error (checkRateLimit handles this internally).
        const rl = await checkRateLimit(
          `login:${credentials.email.toLowerCase().trim()}`,
          LOGIN_LIMIT,
        );
        if (!rl.ok) return null; // NextAuth maps null → CredentialsSignin error → /login?error=

        const db = getDb();
        const rows = await db
          .select()
          .from(schema.appUsers)
          .where(eq(schema.appUsers.email, credentials.email.toLowerCase().trim()))
          .limit(1);

        const user = rows[0];

        // No user found or account not yet provisioned (no password hash)
        if (!user || !user.passwordHash) return null;

        const valid = await verifyPassword(user.passwordHash, credentials.password);
        if (!valid) return null;

        // Update last_login_at (fire-and-forget — do not block auth on this)
        db.update(schema.appUsers)
          .set({ lastLoginAt: new Date() })
          .where(eq(schema.appUsers.id, user.id))
          .catch(() => {
            // Non-fatal: audit timestamp failure must not break login
          });

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          businessId: user.businessId,
          role: user.role,
        };
      },
    }),
  ],

  // ── Callbacks ──────────────────────────────────────────────────────────────
  callbacks: {
    /**
     * jwt — runs when a JWT is created (sign-in) or read (request).
     * We persist the three custom fields on the token so the session callback
     * can copy them into session.user without another DB call.
     */
    async jwt({ token, user }) {
      if (user) {
        // First call: user object is populated from authorize()
        token.userId = user.id;
        token.businessId = (user as { businessId: string }).businessId;
        token.role = (user as { role: string }).role;
      }
      return token;
    },

    /**
     * session — transforms the JWT into the session shape seen by client code.
     * Only called when session is accessed; token is already validated.
     */
    async session({ session, token }) {
      session.user.id = token.userId;
      session.user.businessId = token.businessId;
      session.user.role = token.role;
      return session;
    },
  },
};
